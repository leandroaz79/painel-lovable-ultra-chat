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

    const body = await req.json().catch(() => ({}));
    const page = Math.max(1, Number(body.page) || 1);
    const pageSize = Math.min(100, Math.max(5, Number(body.pageSize) || 10));

    const [
      { data: authUsersData, error: usersError },
      { data: rolesData, error: rolesError },
      { data: licenseRows, error: licensesError },
      { data: trialRows, error: trialsError },
    ] = await Promise.all([
      adminClient.auth.admin.listUsers(),
      adminClient.from("user_roles").select("user_id, role"),
      adminClient
        .from("ts_licenses")
        .select("user_id, license_key, status, license_type, expires_at, created_at")
        .not("user_id", "is", null)
        .order("created_at", { ascending: false }),
      adminClient.from("user_trials").select("user_id, used_at, license_key"),
    ]);

    if (usersError) throw usersError;
    if (rolesError) throw rolesError;
    if (licensesError) throw licensesError;
    if (trialsError) throw trialsError;

    const excludedUserIds = new Set(
      (rolesData ?? [])
        .filter((entry) => entry.role === "admin" || entry.role === "reseller")
        .map((entry) => entry.user_id),
    );

    const trialsByUserId = new Map(
      (trialRows ?? []).map((trial) => [trial.user_id, trial]),
    );

    const licensesByUserId = new Map<string, Array<Record<string, unknown>>>();
    for (const license of licenseRows ?? []) {
      if (!license.user_id) continue;
      const current = licensesByUserId.get(license.user_id) ?? [];
      current.push(license);
      licensesByUserId.set(license.user_id, current);
    }

    const allCustomers = (authUsersData?.users ?? [])
      .filter((authUser) => !excludedUserIds.has(authUser.id))
      .map((authUser) => {
        const licenses = licensesByUserId.get(authUser.id) ?? [];
        const usedTrial = trialsByUserId.get(authUser.id) ?? null;
        const blockedUntil = authUser.banned_until ? new Date(authUser.banned_until) : null;
        const isBlocked = !!blockedUntil && blockedUntil.getTime() > Date.now();
        const metadata = authUser.user_metadata ?? {};

        return {
          id: authUser.id,
          name: typeof metadata.name === "string" ? metadata.name : "",
          email: authUser.email ?? "",
          created_at: authUser.created_at,
          last_sign_in_at: authUser.last_sign_in_at,
          account_status: isBlocked ? "blocked" : "active",
          has_used_trial: !!usedTrial,
          trial_used_at: usedTrial?.used_at ?? null,
          license_count: licenses.length,
          active_licenses: licenses.filter((license) => license.status === "active").length,
          trial_licenses: licenses.filter((license) => license.license_type === "trial").length,
          expired_licenses: licenses.filter((license) => license.status === "expired").length,
          suspended_licenses: licenses.filter((license) => license.status === "suspended").length,
          latest_license_at: licenses[0]?.created_at ?? null,
          licenses,
        };
      })
      .sort((a, b) => {
        const timeA = new Date(a.created_at ?? 0).getTime();
        const timeB = new Date(b.created_at ?? 0).getTime();
        return timeB - timeA;
      });

    const total = allCustomers.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    const customers = allCustomers.slice(start, start + pageSize);

    return new Response(
      JSON.stringify({
        success: true,
        customers,
        total,
        page: safePage,
        pageSize,
        totalPages,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
