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

    // Verificar role admin
    const { data: roles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.user.id)
      .single();

    if (!roles || roles.role !== "admin") {
      throw new Error("Forbidden: Admin access required");
    }

    // Deletar trials expiradas há mais de 3 minutos
    const { data: deleted, error: deleteError } = await adminClient
      .from("ts_licenses")
      .delete()
      .eq("license_type", "trial")
      .lt("expires_at", new Date(Date.now() - 3 * 60 * 1000).toISOString())
      .select();

    if (deleteError) throw deleteError;

    // Registrar log de auditoria
    if (deleted && deleted.length > 0) {
      await adminClient.from("admin_audit_logs").insert({
        admin_user_id: user.user.id,
        action: "cleanup_expired_trials",
        target_table: "ts_licenses",
        target_id: null,
        license_key: null,
        metadata: { deleted_count: deleted.length, trial_keys: deleted.map(d => d.license_key) }
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        deleted_count: deleted?.length || 0,
        message: `${deleted?.length || 0} trial(s) expirada(s) deletada(s) com sucesso.`
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
