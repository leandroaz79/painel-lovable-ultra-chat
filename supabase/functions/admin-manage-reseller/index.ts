import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: user, error: userError } = await adminClient.auth.getUser(token);
    if (userError || !user) throw new Error("Unauthorized");

    // Verificar se é admin
    const { data: roles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.user.id)
      .single();

    if (!roles || roles.role !== "admin") {
      throw new Error("Forbidden: Admin access required");
    }

    const { reseller_id, action, credits } = await req.json();

    if (!reseller_id || !action) {
      throw new Error("reseller_id e action são obrigatórios");
    }

    if (!["approve", "suspend", "add_credits"].includes(action)) {
      throw new Error("Action inválida. Use: approve, suspend, add_credits");
    }

    // Buscar revendedor
    const { data: reseller, error: resellerError } = await adminClient
      .from("resellers")
      .select("*")
      .eq("id", reseller_id)
      .single();

    if (resellerError || !reseller) {
      throw new Error("Revendedor não encontrado");
    }

    let result;

    if (action === "approve") {
      // Aprovar revendedor (ativa conta)
      const { data, error } = await adminClient
        .from("resellers")
        .update({ 
          status: "active",
          activation_fee_paid: true,
          activation_paid_at: new Date().toISOString()
        })
        .eq("id", reseller_id)
        .select()
        .single();

      if (error) throw error;
      result = data;

      // Log de auditoria
      await adminClient.from("admin_audit_logs").insert({
        admin_user_id: user.user.id,
        action: "approve_reseller",
        target_table: "resellers",
        target_id: reseller_id,
        metadata: { previous_status: reseller.status }
      });

    } else if (action === "suspend") {
      // Suspender revendedor
      const { data, error } = await adminClient
        .from("resellers")
        .update({ status: "suspended" })
        .eq("id", reseller_id)
        .select()
        .single();

      if (error) throw error;
      result = data;

      // Log de auditoria
      await adminClient.from("admin_audit_logs").insert({
        admin_user_id: user.user.id,
        action: "suspend_reseller",
        target_table: "resellers",
        target_id: reseller_id,
        metadata: { previous_status: reseller.status }
      });

    } else if (action === "add_credits") {
      // Adicionar créditos manualmente (bônus)
      if (!credits || credits < 1) {
        throw new Error("Quantidade de créditos inválida");
      }

      const { data, error } = await adminClient
        .from("resellers")
        .update({ 
          credits: reseller.credits + credits,
          total_credits_purchased: reseller.total_credits_purchased + credits
        })
        .eq("id", reseller_id)
        .select()
        .single();

      if (error) throw error;
      result = data;

      // Registrar transação de bônus
      await adminClient
        .from("reseller_credit_transactions")
        .insert({
          reseller_id,
          type: "bonus",
          amount: credits,
          price_per_unit: null,
          total_paid: null,
          payment_method: "manual",
          payment_status: "paid",
          metadata: { added_by_admin: user.user.id }
        });

      // Log de auditoria
      await adminClient.from("admin_audit_logs").insert({
        admin_user_id: user.user.id,
        action: "add_credits_manual",
        target_table: "resellers",
        target_id: reseller_id,
        metadata: { credits_added: credits, previous_balance: reseller.credits }
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        reseller: result,
        message: `Ação '${action}' executada com sucesso`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
