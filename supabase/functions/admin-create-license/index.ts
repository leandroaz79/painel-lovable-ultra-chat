import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
  const { data: role, error: roleError } = await adminClient.from("user_roles").select("role").eq("user_id", auth.user.id).eq("role", "admin").maybeSingle();
  if (roleError || !role) throw new Error("Acesso negado. Usuário não é admin.");
  return { adminClient, user: auth.user };
}

function generateLicenseKey() {
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  return `TS-${Array.from(bytes).map((byte) => byte.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

function addDays(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

function addMinutes(minutes: number) {
  const date = new Date();
  date.setUTCMinutes(date.getUTCMinutes() + minutes);
  return date.toISOString();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { adminClient, user } = await requireAdmin(req);
    const body = await req.json();
    const licenseType = body.license_type === "trial" ? "trial" : body.lifetime ? "lifetime" : "paid";
    const lifetime = licenseType === "lifetime";
    const expiresAt = lifetime ? null : licenseType === "trial" ? addMinutes(Math.min(Number(body.trial_minutes || 30), 30)) : addDays(Math.max(Number(body.days || 30), 1));

    // Buscar user_id pelo email, se informado
    let userId = null;
    const email = body.email ? String(body.email).trim().toLowerCase() : null;
    if (email) {
      const { data: usersList } = await adminClient.auth.admin.listUsers();
      const foundUser = usersList?.users.find((u) => u.email?.toLowerCase() === email);
      if (foundUser) {
        userId = foundUser.id;
      }
    }

    const payload = {
      license_key: generateLicenseKey(),
      user_id: userId,
      user_name: body.user_name || null,
      email: email,
      phone: body.phone || null,
      status: licenseType === "trial" ? "trial" : "active",
      license_type: licenseType,
      lifetime,
      activated_at: new Date().toISOString(),
      expires_at: expiresAt
    };
    const { data, error } = await adminClient.from("ts_licenses").insert(payload).select("*").single();
    if (error) throw error;
    await adminClient.from("admin_audit_logs").insert({
      admin_user_id: user.id,
      action: "create_license",
      target_table: "ts_licenses",
      target_id: data.id,
      license_key: data.license_key,
      metadata: { license_type: licenseType, lifetime, expires_at: expiresAt, user_name: body.user_name || null }
    });
    return json({ success: true, license: data, license_key: data.license_key });
  } catch (error) {
    return json({ success: false, error: error.message }, 400);
  }
});
