import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()

    if (!user) {
      throw new Error('Não autenticado')
    }

    const { product_slug, buyer_name, buyer_email, buyer_whatsapp, buyer_cpf } = await req.json()

    if (!product_slug) {
      throw new Error('product_slug é obrigatório')
    }

    if (!buyer_name || !buyer_email || !buyer_cpf) {
      throw new Error('buyer_name, buyer_email e buyer_cpf são obrigatórios')
    }

    // Buscar produto
    const { data: product, error: productError } = await supabaseClient
      .from('products_endcustomer')
      .select('*')
      .eq('slug', product_slug)
      .eq('active', true)
      .single()

    if (productError || !product) {
      console.error('Erro ao buscar produto:', productError)
      throw new Error('Produto não encontrado ou inativo')
    }

    const userName = buyer_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Cliente'
    const userPhone = buyer_whatsapp || user.user_metadata?.whatsapp || ''

    const payer: Record<string, unknown> = {
      email: buyer_email || user.email,
      first_name: userName.split(' ')[0],
      last_name: userName.split(' ').slice(1).join(' ') || 'Cliente',
    }

    if (userPhone) {
      payer.phone = { number: userPhone }
    }

    if (buyer_cpf) {
      payer.identification = { type: 'CPF', number: buyer_cpf }
    }

    // Criar pagamento no Mercado Pago
    const paymentPayload = {
      transaction_amount: product.price_cents / 100,
      description: `${product.name} - Lovable Ultra Chat`,
      payment_method_id: 'pix',
      payer,
      notification_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/customer-webhook-mp`,
      metadata: {
        user_id: user.id,
        product_id: product.id,
        product_slug: product.slug,
        buyer_name: userName,
        buyer_email: buyer_email || user.email,
        buyer_whatsapp: userPhone,
        buyer_cpf: buyer_cpf || '',
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

    // Calcular expiração
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + product.days)

    // Salvar compra no banco com dados do comprador
    const { error: insertError } = await supabaseClient
      .from('customer_purchases')
      .insert({
        user_id: user.id,
        product_id: product.id,
        payment_id: mpResult.id.toString(),
        payment_status: 'pending',
        payment_data: {
          ...paymentPayload,
          buyer_name: userName,
          buyer_email: buyer_email || user.email,
          buyer_whatsapp: userPhone,
          buyer_cpf: buyer_cpf || '',
        },
        pix_qr_code: mpResult.point_of_interaction.transaction_data.qr_code,
        pix_qr_code_base64: mpResult.point_of_interaction.transaction_data.qr_code_base64,
        expires_at: expiresAt.toISOString(),
      })

    if (insertError) {
      console.error('Erro ao salvar compra:', insertError)
      throw new Error('Erro ao registrar compra')
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment_id: mpResult.id.toString(),
        product: {
          name: product.name,
          days: product.days,
          devices: product.devices,
          has_priority_support: product.has_priority_support,
        },
        pix: {
          qr_code: mpResult.point_of_interaction.transaction_data.qr_code,
          qr_code_base64: mpResult.point_of_interaction.transaction_data.qr_code_base64,
          ticket_url: mpResult.point_of_interaction.transaction_data.ticket_url,
        },
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
