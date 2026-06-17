import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

async function requireAdmin(req: Request) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const authHeader = req.headers.get("Authorization") || "";
  const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
  const adminClient = createClient(supabaseUrl, serviceKey);
  const { data: auth, error } = await userClient.auth.getUser();
  if (error || !auth.user) throw new Error("Sessão inválida.");

  const { data: role, error: roleError } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", auth.user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (roleError || !role) throw new Error("Acesso negado. Usuário não é admin.");
  return adminClient;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const adminClient = await requireAdmin(req);
    const body = await req.json().catch(() => ({}));
    const limit = Math.min(Number(body.limit || 200), 500);
    const { data: licenses, error } = await adminClient
      .from("ts_licenses")
      .select("id,license_key,user_name,email,phone,status,license_type,lifetime,expires_at,device_id,last_heartbeat,created_at,updated_at")
      .is("reseller_id", null)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;

    const stats = (licenses || []).reduce((acc, item) => {
      acc.total += 1;
      acc[item.status] = (acc[item.status] || 0) + 1;
      if (item.license_type === "trial") acc.trial += 1;
      if (item.lifetime) acc.lifetime += 1;
      return acc;
    }, { total: 0, active: 0, trial: 0, expired: 0, suspended: 0, lifetime: 0 });

    return json({ success: true, licenses, stats });
  } catch (error) {
    return json({ success: false, error: error.message }, 401);
  }
});
