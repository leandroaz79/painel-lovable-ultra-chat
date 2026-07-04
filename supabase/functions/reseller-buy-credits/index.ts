// Edge Function: reseller-buy-credits
// Gera pagamento Pix via Mercado Pago

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN') ?? ''

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      throw new Error('Não autenticado')
    }

    // Verificar se é revendedor
    const { data: roleData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (roleData?.role !== 'reseller') {
      throw new Error('Acesso negado. Apenas revendedores.')
    }

    const { quantity, buyer_name, buyer_cpf, buyer_phone, buyer_email, total_amount } = await req.json()

    // Criar pagamento no Mercado Pago
    const paymentPayload = {
      transaction_amount: total_amount,
      description: `Compra de ${quantity} chaves vitalícias - Ultra Chat`,
      payment_method_id: 'pix',
      payer: {
        email: buyer_email || user.email,
        first_name: buyer_name.split(' ')[0],
        last_name: buyer_name.split(' ').slice(1).join(' ') || 'Cliente',
        identification: {
          type: 'CPF',
          number: buyer_cpf.replace(/\D/g, ''),
        },
      },
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/mercadopago-webhook`,
      metadata: {
        user_id: user.id,
        quantity: quantity,
        buyer_phone: buyer_phone,
      },
    }

    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentPayload),
    })

    const mpResult = await mpResponse.json()

    if (mpResponse.status !== 201) {
      console.error('Erro Mercado Pago:', mpResult)
      throw new Error(mpResult.message || 'Erro ao gerar pagamento Pix')
    }

    // Salvar transação no banco
    await supabaseClient.from('credit_purchases').insert({
      reseller_id: user.id,
      payment_id: mpResult.id.toString(),
      quantity: quantity,
      amount: total_amount,
      status: 'pending',
      buyer_name: buyer_name,
      buyer_cpf: buyer_cpf,
      buyer_phone: buyer_phone,
      buyer_email: buyer_email || user.email,
      pix_qr_code: mpResult.point_of_interaction.transaction_data.qr_code,
      pix_qr_code_base64: mpResult.point_of_interaction.transaction_data.qr_code_base64,
    })

    return new Response(
      JSON.stringify({
        success: true,
        payment_id: mpResult.id.toString(),
        qr_code: mpResult.point_of_interaction.transaction_data.qr_code,
        qr_code_base64: mpResult.point_of_interaction.transaction_data.qr_code_base64,
        ticket_url: mpResult.point_of_interaction.transaction_data.ticket_url,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Erro:', error)
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
