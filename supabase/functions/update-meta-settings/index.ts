import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } },
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Sem permissão de admin" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { pixel_id, access_token, test_event_code, dataset_id, enabled } = body;

    const updateData: Record<string, unknown> = {
      pixel_id: pixel_id ?? "",
      test_event_code: test_event_code ?? "",
      dataset_id: dataset_id ?? "",
      enabled: enabled ?? false,
      updated_at: new Date().toISOString(),
    };

    if (access_token && access_token.trim().length > 0) {
      updateData.access_token = access_token.trim();
    }

    const { data: existing } = await supabase
      .from("meta_settings")
      .select("id")
      .limit(1)
      .maybeSingle();

    let result;

    if (existing) {
      const { data, error } = await supabase
        .from("meta_settings")
        .update(updateData)
        .eq("id", existing.id)
        .select("id, pixel_id, test_event_code, dataset_id, enabled, updated_at")
        .single();

      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase
        .from("meta_settings")
        .insert(updateData)
        .select("id, pixel_id, test_event_code, dataset_id, enabled, updated_at")
        .single();

      if (error) throw error;
      result = data;
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
