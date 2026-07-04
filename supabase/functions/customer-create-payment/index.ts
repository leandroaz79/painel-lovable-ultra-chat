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
    if (!MERCADOPAGO_ACCESS_TOKEN) {
      console.error('[FATAL] MERCADOPAGO_ACCESS_TOKEN não configurado nas environment variables do Supabase')
      throw new Error('Sistema de pagamento não configurado. Contate o administrador.')
    }

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

    const cleanedCpf = buyer_cpf.replace(/\D/g, '')
    if (cleanedCpf.length !== 11) {
      throw new Error('CPF deve ter 11 dígitos')
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
      payer.phone = { number: userPhone.replace(/\D/g, '') }
    }

    payer.identification = { type: 'CPF', number: cleanedCpf }

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
        buyer_cpf: cleanedCpf,
      },
    }

    if (isCreditCard) {
      paymentPayload.token = card_token
      paymentPayload.installments = 1
      // payment_method_id NÃO é enviado — MercadoPago detecta a bandeira pelo token
    } else {
      paymentPayload.payment_method_id = 'pix'
    }

    console.log('[MP] Enviando pagamento:', {
      amount: paymentPayload.transaction_amount,
      method: isCreditCard ? 'credit_card' : 'pix',
      has_token: !!paymentPayload.token,
    })

    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentPayload),
    })

    const mpResult = await mpResponse.json()

    console.log('[MP] Resposta:', JSON.stringify({
      http_status: mpResponse.status,
      id: mpResult.id,
      status: mpResult.status,
      status_detail: mpResult.status_detail,
    }))

    if (mpResponse.status !== 201) {
      console.error('Erro Mercado Pago:', JSON.stringify(mpResult))
      const mpMessage = mpResult.message || mpResult.error || 'Erro ao gerar pagamento'
      throw new Error(mpMessage)
    }

    // Calcular expiração
    const expiresAt = product.is_lifetime ? null : (() => {
      const d = new Date()
      d.setDate(d.getDate() + product.days)
      return d.toISOString()
    })()

    const paymentData = {
      transaction_amount: product.price_cents / 100,
      description: `${product.name} - Lovable Ultra Chat`,
      payer_email: payer.email,
      buyer_name: userName,
      buyer_email: buyer_email || user.email,
      buyer_whatsapp: userPhone,
      buyer_cpf: cleanedCpf,
      payment_method: isCreditCard ? 'credit_card' : 'pix',
      mp_status: mpResult.status,
      mp_status_detail: mpResult.status_detail,
    }

    const insertPayload: Record<string, unknown> = {
      user_id: user.id,
      product_id: product.id,
      payment_id: mpResult.id.toString(),
      payment_status: mpResult.status === 'approved' ? 'approved' : 'pending',
      payment_data: paymentData,
      expires_at: expiresAt,
    }

    // PIX: salvar qr_code com null check
    if (!isCreditCard) {
      const txData = mpResult.point_of_interaction?.transaction_data
      if (txData) {
        insertPayload.pix_qr_code = txData.qr_code
        insertPayload.pix_qr_code_base64 = txData.qr_code_base64
      }
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
      const { error: lockError } = await supabaseClient
        .from('customer_purchases')
        .update({ payment_status: 'approved' })
        .eq('payment_id', mpResult.id.toString())
        .eq('payment_status', 'pending')

      if (lockError) {
        console.log('Pagamento já processado por webhook:', mpResult.id)
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
      payment_status: mpResult.status,
      status_detail: mpResult.status_detail,
      license_key: licenseKey,
      product: {
        name: product.name,
        days: product.days,
        devices: product.devices,
        has_priority_support: product.has_priority_support,
      },
    }

    if (!isCreditCard) {
      const txData = mpResult.point_of_interaction?.transaction_data
      if (txData) {
        responsePayload.pix = {
          qr_code: txData.qr_code,
          qr_code_base64: txData.qr_code_base64,
          ticket_url: txData.ticket_url,
        }
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
