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
    );

    const { data, error } = await supabase
      .from("meta_settings")
      .select("id, pixel_id, test_event_code, dataset_id, enabled, access_token")
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      const { data: created, error: insertError } = await supabase
        .from("meta_settings")
        .insert({ pixel_id: "", access_token: "", enabled: false })
        .select("id, pixel_id, test_event_code, dataset_id, enabled, access_token")
        .single();

      if (insertError) throw insertError;

      return new Response(JSON.stringify({
        id: created.id,
        pixel_id: created.pixel_id,
        test_event_code: created.test_event_code,
        dataset_id: created.dataset_id,
        enabled: created.enabled,
        has_token: !!(created.access_token && created.access_token.length > 0),
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      id: data.id,
      pixel_id: data.pixel_id,
      test_event_code: data.test_event_code,
      dataset_id: data.dataset_id,
      enabled: data.enabled,
      has_token: !!(data.access_token && data.access_token.length > 0),
    }), {
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
