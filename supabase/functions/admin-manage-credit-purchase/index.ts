import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function requireAdmin(req: Request) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const adminClient = createClient(supabaseUrl, supabaseServiceKey);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) throw new Error("Missing authorization header");

  const token = authHeader.replace("Bearer ", "");
  const { data: auth, error: authError } = await adminClient.auth.getUser(token);
  if (authError || !auth.user) throw new Error("Unauthorized");

  const { data: role, error: roleError } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", auth.user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (roleError || !role) {
    throw new Error("Forbidden: Admin access required");
  }

  return { adminClient, user: auth.user };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { adminClient } = await requireAdmin(req);
    const { purchase_id, action } = await req.json();

    if (!purchase_id || !action) {
      throw new Error("purchase_id e action são obrigatórios");
    }

    if (!["approve", "refund", "delete"].includes(action)) {
      throw new Error("Action inválida. Use: approve, refund, delete");
    }

    const { data: purchase, error: fetchError } = await adminClient
      .from("credit_purchases")
      .select("*")
      .eq("id", purchase_id)
      .single();

    if (fetchError || !purchase) {
      throw new Error("Compra não encontrada");
    }

    if (action === "approve") {
      if (purchase.status !== "pending") {
        throw new Error("Só é possível aprovar compras pendentes");
      }

      const { data: resellerData, error: resellerError } = await adminClient
        .from("resellers")
        .select("credits, total_credits_purchased")
        .eq("user_id", purchase.reseller_id)
        .single();

      if (resellerError || !resellerData) {
        throw new Error("Revendedor não encontrado");
      }

      await adminClient
        .from("resellers")
        .update({
          credits: resellerData.credits + purchase.quantity,
          total_credits_purchased: resellerData.total_credits_purchased + purchase.quantity,
        })
        .eq("user_id", purchase.reseller_id);

      await adminClient
        .from("credit_purchases")
        .update({
          status: "approved",
          approved_at: new Date().toISOString(),
        })
        .eq("id", purchase_id);

      return new Response(
        JSON.stringify({ success: true, message: `${purchase.quantity} créditos adicionados com sucesso` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (action === "refund") {
      if (purchase.status !== "approved") {
        throw new Error("Só é possível estornar compras aprovadas");
      }

      const { data: resellerData, error: resellerError } = await adminClient
        .from("resellers")
        .select("credits, total_credits_purchased")
        .eq("user_id", purchase.reseller_id)
        .single();

      if (resellerError || !resellerData) {
        throw new Error("Revendedor não encontrado");
      }

      await adminClient
        .from("resellers")
        .update({
          credits: Math.max(0, resellerData.credits - purchase.quantity),
          total_credits_purchased: Math.max(0, resellerData.total_credits_purchased - purchase.quantity),
        })
        .eq("user_id", purchase.reseller_id);

      await adminClient
        .from("credit_purchases")
        .update({ status: "refunded" })
        .eq("id", purchase_id);

      return new Response(
        JSON.stringify({ success: true, message: "Compra estornada e créditos removidos" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (action === "delete") {
      await adminClient
        .from("credit_purchases")
        .delete()
        .eq("id", purchase_id);

      return new Response(
        JSON.stringify({ success: true, message: "Compra excluída com sucesso" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: "Ação não reconhecida" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
