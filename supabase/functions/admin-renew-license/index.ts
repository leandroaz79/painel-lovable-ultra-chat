import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function addDays(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

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

    const { license_key, days = 30 } = await req.json();
    if (!license_key) throw new Error("license_key obrigatório");

    // Verificar se licença pertence ao revendedor
    const { data: reseller } = await adminClient
      .from("resellers")
      .select("id, status")
      .eq("user_id", user.user.id)
      .single();

    if (reseller && reseller.status === "active") {
      // É revendedor: validar propriedade da licença
      const { data: license } = await adminClient
        .from("ts_licenses")
        .select("reseller_id, license_type")
        .eq("license_key", license_key)
        .single();

      if (!license || license.reseller_id !== reseller.id) {
        throw new Error("Você só pode renovar licenças criadas por você");
      }

      if (license.license_type === "trial") {
        throw new Error("Licenças trial não podem ser renovadas");
      }
    } else {
      // É admin: validar permissão e tipo de licença
      const { data: roles } = await adminClient
        .from("user_roles")
        .select("role")
        .eq("user_id", user.user.id)
        .single();

      if (!roles || roles.role !== "admin") {
        throw new Error("Forbidden: Admin ou Reseller access required");
      }

      const { data: license } = await adminClient
        .from("ts_licenses")
        .select("license_type")
        .eq("license_key", license_key)
        .single();

      if (license?.license_type === "trial") {
        throw new Error("Licenças trial não podem ser renovadas");
      }
    }

    // Renovar licença
    const { data, error } = await adminClient
      .from("ts_licenses")
      .update({ 
        status: "active", 
        license_type: "paid", 
        lifetime: false, 
        expires_at: addDays(Math.max(Number(days), 1)) 
      })
      .eq("license_key", license_key)
      .select("license_key,expires_at")
      .single();

    if (error) throw error;

    // Log de auditoria
    await adminClient.from("admin_audit_logs").insert({
      admin_user_id: user.user.id,
      action: "renew_license",
      target_table: "ts_licenses",
      license_key,
      metadata: { days, expires_at: data.expires_at, renewed_by: reseller ? "reseller" : "admin" }
    });

    return new Response(
      JSON.stringify({ success: true, data, message: "Licença renovada com sucesso" }),
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
