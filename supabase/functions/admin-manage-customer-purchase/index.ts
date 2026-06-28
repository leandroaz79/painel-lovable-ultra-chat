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

    if (!["refund", "cancel", "delete"].includes(action)) {
      throw new Error("Action inválida. Use: refund, cancel, delete");
    }

    const { data: purchase, error: fetchError } = await adminClient
      .from("customer_purchases")
      .select("*")
      .eq("id", purchase_id)
      .single();

    if (fetchError || !purchase) {
      throw new Error("Compra não encontrada");
    }

    if (action === "refund") {
      if (purchase.payment_status !== "approved" && purchase.payment_status !== "paid") {
        throw new Error("Só é possível reembolsar compras aprovadas");
      }

      const { error: updateError } = await adminClient
        .from("customer_purchases")
        .update({ payment_status: "refunded" })
        .eq("id", purchase_id);

      if (updateError) throw updateError;

      await adminClient.from("admin_audit_logs").insert({
        admin_user_id: req.headers.get("x-admin-id") || "unknown",
        action: "refund_customer_purchase",
        target_table: "customer_purchases",
        target_id: purchase_id,
        metadata: { previous_status: purchase.payment_status },
      });

      return new Response(
        JSON.stringify({ success: true, message: "Compra reembolsada com sucesso" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (action === "cancel") {
      if (purchase.payment_status !== "pending") {
        throw new Error("Só é possível cancelar compras pendentes");
      }

      const { error: updateError } = await adminClient
        .from("customer_purchases")
        .update({ payment_status: "cancelled" })
        .eq("id", purchase_id);

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({ success: true, message: "Compra cancelada com sucesso" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (action === "delete") {
      const { error: deleteError } = await adminClient
        .from("customer_purchases")
        .delete()
        .eq("id", purchase_id);

      if (deleteError) throw deleteError;

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
