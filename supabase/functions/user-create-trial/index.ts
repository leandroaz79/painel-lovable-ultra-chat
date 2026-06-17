import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function generateLicenseKey(): string {
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  return `TS-${Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return json({ success: false, error: "Configuração do servidor incompleta" }, 500);
    }

    const client = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Validar autenticação
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ success: false, error: "Token de autenticação ausente" }, 401);
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await client.auth.getUser(token);

    if (userError) {
      console.error("Auth error:", userError.message);
      return json({ success: false, error: "Sessão inválida. Faça login novamente." }, 401);
    }

    if (!userData?.user) {
      return json({ success: false, error: "Usuário não encontrado" }, 401);
    }

    const userId = userData.user.id;

    // Verificar se o usuário já usou o trial (tabela user_trials)
    const { data: existingTrial, error: checkError } = await client
      .from("user_trials")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    // Se a tabela não existir, o erro será diferente
    if (checkError) {
      console.error("Erro ao verificar trial existente:", checkError.message, checkError.code);
      return json({
        success: false,
        error: "Erro ao verificar permissão de teste. A migration 010 pode não ter sido executada.",
      }, 500);
    }

    if (existingTrial) {
      return json({
        success: false,
        error: "Você já utilizou seu teste gratuito. Cada usuário tem direito a apenas 1 teste de 30 minutos.",
      });
    }

    // Criar licença trial de 30 minutos
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const licenseKey = generateLicenseKey();

    const { data: license, error: licenseError } = await client
      .from("ts_licenses")
      .insert({
        license_key: licenseKey,
        user_id: userId,
        license_type: "trial",
        status: "trial",
        lifetime: false,
        expires_at: expiresAt,
        activated_at: new Date().toISOString(),
        user_name: userData.user.user_metadata?.name || userData.user.email || "Usuário",
      })
      .select("*")
      .single();

    if (licenseError) {
      console.error("Erro ao criar licença:", licenseError.message, licenseError.code);
      return json({ success: false, error: `Erro ao criar licença: ${licenseError.message}` }, 500);
    }

    // Registrar que o usuário usou o trial
    const { error: trialError } = await client
      .from("user_trials")
      .insert({
        user_id: userId,
        license_key: licenseKey,
      });

    if (trialError) {
      console.error("Erro ao registrar trial:", trialError.message, trialError.code);
      // Licença já foi criada, não é crítico falhar aqui
    }

    return json({
      success: true,
      message: "Teste gratuito de 30 minutos criado com sucesso!",
      license,
    });
  } catch (error) {
    console.error("Erro não tratado:", error);
    return json({
      success: false,
      error: error instanceof Error ? error.message : "Erro interno do servidor",
    }, 500);
  }
});
