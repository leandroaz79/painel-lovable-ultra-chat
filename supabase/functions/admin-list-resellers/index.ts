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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: user, error: userError } = await adminClient.auth.getUser(token);
    if (userError || !user) throw new Error("Unauthorized");

    // Verificar se é admin
    const { data: roles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.user.id)
      .single();

    if (!roles || roles.role !== "admin") {
      throw new Error("Forbidden: Admin access required");
    }

    // Listar todos os revendedores com estatísticas
    const { data: resellers, error: resellersError } = await adminClient
      .from("resellers")
      .select(`
        *,
        user_roles!inner(user_id)
      `)
      .order("created_at", { ascending: false });

    if (resellersError) throw resellersError;

    // Buscar emails dos usuários
    const resellersList = await Promise.all(
      (resellers || []).map(async (r) => {
        const { data: userData } = await adminClient.auth.admin.getUserById(r.user_id);
        return {
          ...r,
          email: userData?.user?.email || "N/A"
        };
      })
    );

    return new Response(
      JSON.stringify({ 
        success: true,
        resellers: resellersList,
        total: resellersList.length
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
