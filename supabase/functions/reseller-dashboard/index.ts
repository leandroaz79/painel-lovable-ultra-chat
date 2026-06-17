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

    if (resellerError || !reseller) {
      throw new Error("Revendedor não encontrado");
    }

    if (reseller.status !== "active") {
      throw new Error(`Revendedor com status: ${reseller.status}. Apenas revendedores ativos podem acessar o dashboard.`);
    }

    // Buscar estatísticas de licenças criadas pelo revendedor
    const { data: licenses, error: licensesError } = await adminClient
      .from("ts_licenses")
      .select("status, license_type, created_at")
      .eq("reseller_id", reseller.id);

    if (licensesError) throw licensesError;

    const stats = {
      active: licenses?.filter(l => l.status === "active").length || 0,
      suspended: licenses?.filter(l => l.status === "suspended").length || 0,
      trials: licenses?.filter(l => l.license_type === "trial").length || 0,
      paid: licenses?.filter(l => l.license_type === "paid").length || 0,
      lifetime: licenses?.filter(l => l.license_type === "lifetime").length || 0,
      total: licenses?.length || 0
    };

    // Buscar últimas transações de créditos
    const { data: transactions, error: transactionsError } = await adminClient
      .from("reseller_credit_transactions")
      .select("*")
      .eq("reseller_id", reseller.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (transactionsError) throw transactionsError;

    return new Response(
      JSON.stringify({ 
        success: true,
        reseller: {
          id: reseller.id,
          status: reseller.status,
          credits: reseller.credits,
          total_licenses_created: reseller.total_licenses_created,
          total_credits_purchased: reseller.total_credits_purchased,
          activation_paid_at: reseller.activation_paid_at,
          created_at: reseller.created_at
        },
        stats,
        recent_transactions: transactions || []
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
