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
    const { data: role, error: roleError } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (roleError || !role) throw new Error("Acesso negado. Usuário não é admin.");

    const { license_key } = await req.json();
    if (!license_key) throw new Error("license_key é obrigatório");

    // Excluir a licença
    const { error: deleteError } = await adminClient
      .from("ts_licenses")
      .delete()
      .eq("license_key", license_key);

    if (deleteError) throw deleteError;

    // Log de auditoria
    await adminClient.from("admin_audit_logs").insert({
      admin_user_id: user.user.id,
      action: "delete_license",
      target_table: "ts_licenses",
      license_key,
      metadata: { deleted_by: "admin" }
    });

    return new Response(
      JSON.stringify({ success: true, message: "Licença excluída com sucesso" }),
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