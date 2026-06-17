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

    // Validar usuário autenticado
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: user, error: userError } = await adminClient.auth.getUser(token);
    if (userError || !user) throw new Error("Unauthorized");

    // Verificar se é revendedor ativo
    const { data: reseller, error: resellerError } = await adminClient
      .from("resellers")
      .select("*")
      .eq("user_id", user.user.id)
      .single();

    if (resellerError || !reseller) throw new Error("Revendedor não encontrado");
    if (reseller.status !== "active") throw new Error(`Conta com status: ${reseller.status}`);

    const { license_key } = await req.json();
    if (!license_key) throw new Error("license_key é obrigatório");

    // Verificar se a licença pertence ao revendedor
    const { data: license, error: licenseError } = await adminClient
      .from("ts_licenses")
      .select("id, reseller_id")
      .eq("license_key", license_key)
      .maybeSingle();

    if (licenseError || !license) throw new Error("Licença não encontrada");
    if (license.reseller_id !== reseller.id) throw new Error("Você não tem permissão para excluir esta licença");

    // Verificar se a licença é paga/lifetime para devolver crédito
    const { data: licenseData, error: licenseDataError } = await adminClient
      .from("ts_licenses")
      .select("license_type")
      .eq("license_key", license_key)
      .single();

    if (licenseDataError) throw licenseDataError;

    // Excluir a licença
    const { error: deleteError } = await adminClient
      .from("ts_licenses")
      .delete()
      .eq("license_key", license_key);

    if (deleteError) throw deleteError;

    // Se a licença não for trial, devolver crédito e atualizar contadores
    if (licenseData.license_type !== "trial") {
      // Devolver 1 crédito ao revendedor e atualizar contadores
      const { error: creditError } = await adminClient.rpc("increment_reseller_credits", {
        reseller_user_id: user.user.id,
        amount: 1,
      });

      if (creditError) console.error("Erro ao devolver crédito:", creditError);

      // Diminuir o contador de licenças criadas
      const { error: counterError } = await adminClient
        .from("resellers")
        .update({ total_licenses_created: reseller.total_licenses_created - 1 })
        .eq("id", reseller.id);

      if (counterError) console.error("Erro ao atualizar contador:", counterError);
    }

    // Log de auditoria
    await adminClient.from("admin_audit_logs").insert({
      admin_user_id: user.user.id,
      action: "delete_license",
      target_table: "ts_licenses",
      license_key,
      metadata: { 
        deleted_by: "reseller",
        license_type: licenseData.license_type 
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Licença excluída e crédito devolvido",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
