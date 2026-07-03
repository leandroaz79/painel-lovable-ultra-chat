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

    const { data: { user } } = await supabaseClient.auth.getUser()

    if (!user) {
      throw new Error('Não autenticado')
    }

    const { product_slug, buyer_name, buyer_email, buyer_whatsapp, buyer_cpf, payment_method, card_token } = await req.json()

    if (!product_slug) {
      throw new Error('product_slug é obrigatório')
    }

    if (!buyer_name || !buyer_email || !buyer_cpf) {
      throw new Error('buyer_name, buyer_email e buyer_cpf são obrigatórios')
    }

    const isCreditCard = payment_method === 'credit_card'

    if (isCreditCard && !card_token) {
      throw new Error('card_token é obrigatório para pagamento com cartão')
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
    const paymentPayload: Record<string, unknown> = {
      transaction_amount: product.price_cents / 100,
      description: `${product.name} - Lovable Ultra Chat`,
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

    if (isCreditCard) {
      paymentPayload.token = card_token
      paymentPayload.installments = 1
      paymentPayload.payment_method_id = 'master'
    } else {
      paymentPayload.payment_method_id = 'pix'
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
      throw new Error(mpResult.message || 'Erro ao gerar pagamento')
    }

    // Calcular expiração
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + product.days)

    const paymentData = {
      ...paymentPayload,
      buyer_name: userName,
      buyer_email: buyer_email || user.email,
      buyer_whatsapp: userPhone,
      buyer_cpf: buyer_cpf || '',
      payment_method: isCreditCard ? 'credit_card' : 'pix',
    }

    const insertPayload: Record<string, unknown> = {
      user_id: user.id,
      product_id: product.id,
      payment_id: mpResult.id.toString(),
      payment_status: 'pending',
      payment_data: paymentData,
      expires_at: expiresAt.toISOString(),
    }

    if (!isCreditCard) {
      insertPayload.pix_qr_code = mpResult.point_of_interaction.transaction_data.qr_code
      insertPayload.pix_qr_code_base64 = mpResult.point_of_interaction.transaction_data.qr_code_base64
    }

    const { error: insertError } = await supabaseClient
      .from('customer_purchases')
      .insert(insertPayload)

    if (insertError) {
      console.error('Erro ao salvar compra:', insertError)
      throw new Error('Erro ao registrar compra')
    }

    // Cartão aprovado síncrono: criar licença imediatamente
    const isCardApproved = isCreditCard && mpResult.status === 'approved'
    let licenseKey: string | null = null
    if (isCardApproved) {
      // HIGH-003 FIX: Marcar como approved ANTES de inserir licença
      // Isso impede que o webhook crie licença duplicada
      const { error: lockError } = await supabaseClient
        .from('customer_purchases')
        .update({ payment_status: 'approved' })
        .eq('payment_id', mpResult.id.toString())
        .eq('payment_status', 'pending')

      if (lockError) {
        console.log('Pagamento já processado por webhook:', mpResult.id)
        // Webhook já processou — não criar licença duplicada
      } else {
        const prefix = product_slug === 'try-7' ? 'TRY7' : product_slug === 'ultra-15' ? 'ULTRA15' : 'ULTRA30'
        const randomHex = crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()
        licenseKey = `${prefix}-${randomHex}`

        const licExpiresAt = product.is_lifetime ? null : (() => {
          const d = new Date()
          d.setDate(d.getDate() + product.days)
          return d.toISOString()
        })()

        const { error: licError } = await supabaseClient
          .from('ts_licenses')
          .insert({
            license_key: licenseKey,
            user_id: user.id,
            user_name: userName,
            email: buyer_email || user.email,
            phone: userPhone,
            status: 'active',
            license_type: 'paid',
            expires_at: licExpiresAt,
            metadata: {
              product_id: product.id,
              product_name: product.name,
              devices: product.devices,
              has_priority_support: product.has_priority_support,
              source: 'customer_purchase',
              payment_id: mpResult.id.toString(),
            },
          })

        if (licError) {
          console.error('Erro ao criar licença (cartão):', licError)
        } else {
          await supabaseClient
            .from('customer_purchases')
            .update({
              license_key: licenseKey,
              approved_at: new Date().toISOString(),
            })
            .eq('payment_id', mpResult.id.toString())
        }
      }
    }

    const responsePayload: Record<string, unknown> = {
      success: true,
      payment_id: mpResult.id.toString(),
      payment_method: isCreditCard ? 'credit_card' : 'pix',
      license_key: licenseKey,
      product: {
        name: product.name,
        days: product.days,
        devices: product.devices,
        has_priority_support: product.has_priority_support,
      },
    }

    if (!isCreditCard) {
      responsePayload.pix = {
        qr_code: mpResult.point_of_interaction.transaction_data.qr_code,
        qr_code_base64: mpResult.point_of_interaction.transaction_data.qr_code_base64,
        ticket_url: mpResult.point_of_interaction.transaction_data.ticket_url,
      }
    }

    return new Response(
      JSON.stringify(responsePayload),
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
