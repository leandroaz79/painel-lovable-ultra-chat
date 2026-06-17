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
      throw new Error(`Conta com status: ${reseller.status}`);
    }

    // Listar apenas licenças criadas pelo revendedor
    const { data: licenses, error: licensesError } = await adminClient
      .from("ts_licenses")
      .select("*")
      .eq("reseller_id", reseller.id)
      .order("created_at", { ascending: false });

    if (licensesError) throw licensesError;

    return new Response(
      JSON.stringify({ 
        success: true,
        licenses: licenses || [],
        total: licenses?.length || 0
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
