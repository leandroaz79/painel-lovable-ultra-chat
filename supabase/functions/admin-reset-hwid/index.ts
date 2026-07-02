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

    const { license_key } = await req.json();
    if (!license_key) throw new Error("license_key obrigatório");

    // Buscar licença
    const { data: license } = await adminClient
      .from("ts_licenses")
      .select("user_id, reseller_id")
      .eq("license_key", license_key)
      .maybeSingle();

    if (!license) throw new Error("Licença não encontrada");

    let resetBy = "owner"

    // Verificar se é o dono da licença (usuário final)
    if (license.user_id !== user.user.id) {
      resetBy = "admin"

      // Verificar se é revendedor
      const { data: reseller } = await adminClient
        .from("resellers")
        .select("id, status")
        .eq("user_id", user.user.id)
        .maybeSingle();

      if (reseller && reseller.status === "active") {
        if (!license.reseller_id || license.reseller_id !== reseller.id) {
          throw new Error("Você só pode resetar HWID de licenças criadas por você");
        }
        resetBy = "reseller"
      } else {
        // Verificar se é admin
        const { data: roles } = await adminClient
          .from("user_roles")
          .select("role")
          .eq("user_id", user.user.id)
          .maybeSingle();

        if (!roles || roles.role !== "admin") {
          throw new Error("Acesso negado. Requer permissão de Admin, Reseller ou ser o dono da licença.");
        }
      }
    }

    // Resetar HWID
    const { error } = await adminClient
      .from("ts_licenses")
      .update({ device_id: null })
      .eq("license_key", license_key);

    if (error) throw error;

    // Log de auditoria
    await adminClient.from("admin_audit_logs").insert({
      admin_user_id: user.user.id,
      action: "reset_hwid",
      target_table: "ts_licenses",
      license_key,
      metadata: { reset_by: resetBy }
    });

    return new Response(
      JSON.stringify({ success: true, message: "HWID resetado com sucesso" }),
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