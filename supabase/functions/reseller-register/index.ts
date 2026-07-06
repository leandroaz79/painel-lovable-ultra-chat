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

    // Verificar se já é revendedor
    const { data: existingReseller } = await adminClient
      .from("resellers")
      .select("id, status")
      .eq("user_id", user.user.id)
      .single();

    if (existingReseller) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Usuário já é revendedor",
          reseller_status: existingReseller.status
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { name, email, phone, document } = await req.json();

    if (!name || !email) {
      throw new Error("Nome e email são obrigatórios");
    }

    // Criar revendedor com status pending
    const { data: reseller, error: resellerError } = await adminClient
      .from("resellers")
      .insert({
        user_id: user.user.id,
        name: name,
        whatsapp: phone || null,
        status: "pending",
        credits: 0
      })
      .select()
      .single();

    if (resellerError) throw resellerError;

    // Criar role de revendedor
    await adminClient
      .from("user_roles")
      .insert({
        user_id: user.user.id,
        role: "reseller"
      });

    // Criar registro de pagamento de ativação (R$ 300)
    const { data: payment, error: paymentError } = await adminClient
      .from("reseller_activation_payments")
      .insert({
        reseller_id: reseller.id,
        amount: 300.00,
        payment_method: "pix",
        payment_status: "pending",
        metadata: { name, email, phone, document }
      })
      .select()
      .single();

    if (paymentError) throw paymentError;

    // TODO: Integrar Mercado Pago aqui para gerar QR Code Pix
    // const pixData = await generateMercadoPagoPix(payment.id, 300.00, email);

    return new Response(
      JSON.stringify({ 
        success: true,
        reseller_id: reseller.id,
        payment_id: payment.id,
        status: "pending",
        message: "Cadastro realizado. Aguardando pagamento da taxa de ativação (R$ 300,00).",
        // pix_qr_code: pixData.qr_code,
        // pix_qr_code_base64: pixData.qr_code_base64
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
