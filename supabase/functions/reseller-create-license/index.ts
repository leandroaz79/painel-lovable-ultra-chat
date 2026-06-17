import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generateLicenseKey(): string {
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  return `TS-${Array.from(bytes).map((byte) => byte.toString(16).padStart(2, "0")).join("").toUpperCase()}`;
}

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
      throw new Error(`Conta com status: ${reseller.status}. Apenas revendedores ativos podem criar licenças.`);
    }

    const { license_type, days, lifetime, user_name } = await req.json();

    // Validar tipo de licença
    if (!["trial", "paid", "lifetime"].includes(license_type)) {
      throw new Error("Tipo de licença inválido");
    }

    // Trial: não consome crédito, máximo 30 minutos
    if (license_type === "trial") {
      const minutes = Math.min(Number(days) || 30, 30);
      const expiresAt = new Date(Date.now() + minutes * 60 * 1000).toISOString();
      
      const licenseKey = generateLicenseKey();
      const { data, error } = await adminClient
        .from("ts_licenses")
        .insert({
          license_key: licenseKey,
          license_type: "trial",
          status: "active",
          lifetime: false,
          expires_at: expiresAt,
          user_name: user_name || null,
          reseller_id: reseller.id
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ 
          success: true,
          license: data,
          message: `Trial de ${minutes} minutos criada com sucesso (não consumiu créditos)`
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Paid/Lifetime: verifica créditos (trigger consume_reseller_credit faz a validação)
    if (reseller.credits < 1) {
      throw new Error(`Créditos insuficientes. Saldo atual: ${reseller.credits}. Compre mais créditos para continuar.`);
    }

    const isLifetime = lifetime === true || license_type === "lifetime";
    const expiresAt = isLifetime ? null : addDays(Number(days) || 30);
    const licenseKey = generateLicenseKey();

    const { data, error } = await adminClient
      .from("ts_licenses")
      .insert({
        license_key: licenseKey,
        license_type: isLifetime ? "lifetime" : "paid",
        status: "active",
        lifetime: isLifetime,
        expires_at: expiresAt,
        user_name: user_name || null,
        reseller_id: reseller.id
      })
      .select()
      .single();

    if (error) throw error;

    // Buscar saldo atualizado (trigger já consumiu 1 crédito)
    const { data: updatedReseller } = await adminClient
      .from("resellers")
      .select("credits")
      .eq("id", reseller.id)
      .single();

    return new Response(
      JSON.stringify({ 
        success: true,
        license: data,
        credits_remaining: updatedReseller?.credits || 0,
        message: `Licença ${isLifetime ? 'vitalícia' : 'paga'} criada com sucesso. 1 crédito consumido.`
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
