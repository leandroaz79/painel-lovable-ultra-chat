import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GRAPH_API_VERSION = "v21.0";
const GRAPH_API_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const REQUEST_TIMEOUT_MS = 10000;

interface CAPIPayload {
  event_name: string;
  event_time: number;
  event_id?: string;
  action_source: string;
  event_source_url?: string;
  user_data: Record<string, unknown>;
  custom_data?: Record<string, unknown>;
}

interface EventRequest {
  events: CAPIPayload[];
  test_event_code?: string;
}

function sha256Hex(value: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(value.trim().toLowerCase());
  const hashBuffer = crypto.subtle.digestSync("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function extractUserData(body: Record<string, unknown>): Record<string, unknown> {
  const userData: Record<string, unknown> = {};

  const email = body.email as string | undefined;
  if (email) userData.em = sha256Hex(email);

  const phone = body.phone as string | undefined;
  if (phone) {
    const digits = phone.replace(/\D/g, "");
    userData.ph = sha256Hex(digits);
  }

  const firstName = body.first_name as string | undefined;
  if (firstName) userData.fn = sha256Hex(firstName);

  const lastName = body.last_name as string | undefined;
  if (lastName) userData.ln = sha256Hex(lastName);

  const city = body.city as string | undefined;
  if (city) userData.ct = sha256Hex(city);

  const state = body.state as string | undefined;
  if (state) userData.st = sha256Hex(state);

  const zip = body.zip as string | undefined;
  if (zip) userData.zp = sha256Hex(zip);

  const country = body.country as string | undefined;
  if (country) userData.country = sha256Hex(country);

  const clientIp = body.client_ip_address as string | undefined;
  if (clientIp) userData.client_ip_address = clientIp;

  const clientUserAgent = body.client_user_agent as string | undefined;
  if (clientUserAgent) userData.client_user_agent = clientUserAgent;

  const fbp = body.fbp as string | undefined;
  if (fbp) userData.fbp = fbp;

  const fbc = body.fbc as string | undefined;
  if (fbc) userData.fbc = fbc;

  const externalId = body.external_id as string | undefined;
  if (externalId) userData.external_id = sha256Hex(externalId);

  return userData;
}

async function sendWithRetry(
  url: string,
  payload: EventRequest,
  retries: number = MAX_RETRIES,
): Promise<{ success: boolean; status: number; body: string; attempts: number }> {
  let lastError = "";

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseText = await response.text();

      if (response.ok) {
        return { success: true, status: response.status, body: responseText, attempts: attempt };
      }

      lastError = `HTTP ${response.status}: ${responseText}`;

      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        return { success: false, status: response.status, body: responseText, attempts: attempt };
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }

    if (attempt < retries) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt));
    }
  }

  return { success: false, status: 0, body: lastError, attempts: retries };
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );

    const { data: settings, error: settingsError } = await supabase
      .from("meta_settings")
      .select("pixel_id, access_token, test_event_code, dataset_id, enabled")
      .limit(1)
      .maybeSingle();

    if (settingsError) {
      console.error("[Meta CAPI] Erro ao buscar settings:", settingsError.message);
      throw new Error("Erro ao configurar integração Meta");
    }

    if (!settings || !settings.enabled || !settings.pixel_id || !settings.access_token) {
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: "Integração Meta desabilitada ou não configurada" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json();
    const { event_name, event_id, event_source_url, custom_data, action_source } = body;

    if (!event_name) {
      return new Response(
        JSON.stringify({ error: "event_name é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const userData = extractUserData(body);

    const capiPayload: CAPIPayload = {
      event_name,
      event_time: Math.floor(Date.now() / 1000),
      action_source: action_source || "website",
      user_data: userData,
    };

    if (event_id) capiPayload.event_id = event_id;
    if (event_source_url) capiPayload.event_source_url = event_source_url;
    if (custom_data && Object.keys(custom_data).length > 0) {
      capiPayload.custom_data = custom_data;
    }

    const payload: EventRequest = {
      events: [capiPayload],
    };

    if (settings.test_event_code) {
      payload.test_event_code = settings.test_event_code;
    }

    const url = `${GRAPH_API_URL}/${settings.pixel_id}/events?access_token=${settings.access_token}`;

    const result = await sendWithRetry(url, payload);
    const elapsed = Date.now() - startTime;

    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      event: event_name,
      event_id: event_id || "none",
      status: result.status,
      success: result.success,
      attempts: result.attempts,
      elapsed_ms: elapsed,
    }));

    if (!result.success) {
      console.error(JSON.stringify({
        timestamp: new Date().toISOString(),
        event: event_name,
        error: result.body,
        status: result.status,
        elapsed_ms: elapsed,
      }));
    }

    return new Response(
      JSON.stringify({
        success: result.success,
        event_name,
        event_id: event_id || null,
        meta_status: result.status,
        attempts: result.attempts,
        elapsed_ms: elapsed,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: result.success ? 200 : 502,
      },
    );
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      event: "error",
      error: error.message,
      elapsed_ms: elapsed,
    }));

    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
