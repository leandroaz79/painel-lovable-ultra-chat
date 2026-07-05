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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { license_key } = await req.json();
    if (!license_key) throw new Error("Chave de licença obrigatória");

    // Normalizar chave
    const normalizedKey = license_key.trim().toUpperCase();

    // Buscar licença
    const { data: license, error: findError } = await supabase
      .from("ts_licenses")
      .select("id, license_key, user_id, device_id, status")
      .eq("license_key", normalizedKey)
      .maybeSingle();

    if (findError) throw findError;
    if (!license) throw new Error("Licença não encontrada. Verifique a chave e tente novamente.");
    if (license.status === "expired" || license.status === "suspended") {
      throw new Error("Esta licença está inativa e não pode ser resetada.");
    }

    // Verificar se já está desvinculada (sem device_id)
    if (!license.device_id) {
      return new Response(
        JSON.stringify({ success: true, message: "Esta licença já está disponível para ativação em um novo dispositivo." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Resetar HWID
    const { error: updateError } = await supabase
      .from("ts_licenses")
      .update({ device_id: null, session_id: null })
      .eq("license_key", normalizedKey);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ success: true, message: "HWID resetado com sucesso! Agora você pode ativar a extensão em um novo computador." }),
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
