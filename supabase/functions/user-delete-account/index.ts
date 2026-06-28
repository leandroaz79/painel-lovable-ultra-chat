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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ success: false, error: "Token de autenticação ausente" }, 401);
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await client.auth.getUser(token);

    if (userError) {
      return json({ success: false, error: "Sessão inválida. Faça login novamente." }, 401);
    }

    if (!userData?.user) {
      return json({ success: false, error: "Usuário não encontrado" }, 401);
    }

    const userId = userData.user.id;
    const userEmail = userData.user.email;

    await client.auth.admin.deleteUser(userId);

    await client.from("ts_licenses").delete().eq("user_id", userId);
    await client.from("customer_purchases").delete().eq("user_id", userId);
    await client.from("user_trials").delete().eq("user_id", userId);

    console.log(`Conta deletada: ${userId} (${userEmail})`);

    return json({
      success: true,
      message: "Conta deletada com sucesso.",
    });
  } catch (error) {
    console.error("Erro ao deletar conta:", error);
    return json({
      success: false,
      error: error instanceof Error ? error.message : "Erro interno do servidor",
    }, 500);
  }
});
