// Edge Function: check-payment-status
// Verifica status de pagamento no Mercado Pago (usado pelo polling no frontend)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MERCADOPAGO_ACCESS_TOKEN = 'APP_USR-1956464108264660-110212-c09d3e0e1b63035e401c8ff9a4a28955-173764383'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { payment_id } = await req.json()

    if (!payment_id) {
      throw new Error('payment_id é obrigatório')
    }

    // Consultar status no Mercado Pago
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${payment_id}`, {
      headers: {
        'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
      },
    })

    const payment = await mpResponse.json()

    return new Response(
      JSON.stringify({
        success: true,
        status: payment.status,
        status_detail: payment.status_detail,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
