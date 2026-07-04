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

    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");

    let query = supabase.from("site_settings").select("key, value");

    if (key) {
      query = query.eq("key", key);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // Convert array to object for easy consumption
    const settings: Record<string, unknown> = {};
    if (data) {
      for (const row of data) {
        settings[row.key] = row.value;
      }
    }

    return new Response(JSON.stringify(settings), {
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
