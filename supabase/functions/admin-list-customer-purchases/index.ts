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
    const searchTerm = String(body.searchTerm || "").trim();
    const statusFilter = String(body.statusFilter || "all").trim();

    // Fetch purchases with product join
    let query = adminClient
      .from("customer_purchases")
      .select(`
        *,
        products_endcustomer!inner(name, days, devices)
      `)
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("payment_status", statusFilter);
    }

    const { data: purchases, error: purchasesError } = await query;
    if (purchasesError) throw purchasesError;

    // Resolve user names/emails
    const { data: authUsers, error: usersError } = await adminClient.auth.admin.listUsers();
    if (usersError) throw usersError;

    const userMap = new Map(
      authUsers.users.map((u) => [
        u.id,
        {
          name: typeof u.user_metadata?.name === "string" ? u.user_metadata.name : "",
          email: u.email ?? "",
        },
      ])
    );

    // Find all license keys to look up user_names in ts_licenses
    const licenseKeys = (purchases ?? [])
      .map((p) => p.license_key)
      .filter(Boolean);

    const licenseUserMap = new Map<string, string>();
    if (licenseKeys.length > 0) {
      const { data: licenses } = await adminClient
        .from("ts_licenses")
        .select("license_key, user_name")
        .in("license_key", licenseKeys);

      for (const lic of licenses ?? []) {
        licenseUserMap.set(lic.license_key, lic.user_name ?? "");
      }
    }

    // Build enriched list
    const enriched = (purchases ?? []).map((p) => {
      const product = p.products_endcustomer as { name: string; days: number; devices: number } | null;
      const userInfo = userMap.get(p.user_id);
      const licenseUserName = p.license_key ? licenseUserMap.get(p.license_key) : null;
      const pd = p.payment_data as Record<string, unknown> | null;

      return {
        id: p.id,
        user_id: p.user_id,
        user_name: licenseUserName || userInfo?.name || "",
        user_email: userInfo?.email || "",
        user_cpf: (pd?.buyer_cpf as string) || "",
        user_whatsapp: (pd?.buyer_whatsapp as string) || "",
        product_name: product?.name ?? "",
        product_slug: (p as any).product_slug ?? "",
        amount: pd && typeof pd.transaction_amount === "number"
          ? Math.round((pd.transaction_amount as number) * 100)
          : 0,
        days: product?.days ?? 0,
        devices: product?.devices ?? 1,
        status: p.payment_status,
        payment_id: p.payment_id,
        paid_at: p.approved_at ?? p.created_at,
        created_at: p.created_at,
        expires_at: p.expires_at,
        license_key: p.license_key,
      };
    });

    // Client-side search filter
    const filtered = enriched.filter((p) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        p.product_name.toLowerCase().includes(term) ||
        p.user_name.toLowerCase().includes(term) ||
        p.user_email.toLowerCase().includes(term) ||
        (p.payment_id ?? "").toLowerCase().includes(term) ||
        (p.license_key ?? "").toLowerCase().includes(term)
      );
    });

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize);

    // Stats
    const paidStatuses = new Set(["paid", "approved"]);
    const paid = enriched.filter((p) => paidStatuses.has(p.status));
    const totalRevenue = paid.reduce((sum, p) => sum + p.amount, 0);

    // Status breakdown
    const stats = {
      total: enriched.length,
      paid: enriched.filter((p) => p.status === "paid" || p.status === "approved").length,
      pending: enriched.filter((p) => p.status === "pending").length,
      expired: enriched.filter((p) => p.status === "expired").length,
      refunded: enriched.filter((p) => p.status === "refunded").length,
      cancelled: enriched.filter((p) => p.status === "cancelled").length,
      totalRevenue,
    };

    return new Response(
      JSON.stringify({
        success: true,
        purchases: items,
        total,
        page: safePage,
        pageSize,
        totalPages,
        stats,
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
