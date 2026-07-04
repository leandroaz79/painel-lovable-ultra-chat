// ============================================================================
// EDGE FUNCTION: customer-webhook-mp
// Descrição: Recebe notificações do Mercado Pago para compras de cliente final
//            Quando pagamento é aprovado, gera a licença automaticamente
// IMPORTANTE: verify_jwt = FALSE (não requer autenticação JWT)
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN') ?? ''
const MERCADOPAGO_WEBHOOK_SECRET = Deno.env.get('MERCADOPAGO_WEBHOOK_SECRET') ?? ''

async function verifyWebhookSignature(
  xSignature: string | null,
  xRequestId: string | null,
  dataId: string | null,
  secret: string
): Promise<boolean> {
  if (!xSignature || !xRequestId || !dataId || !secret) return false

  try {
    const parts = xSignature.split(',')
    let ts = ''
    let v1 = ''
    for (const part of parts) {
      if (part.startsWith('ts=')) ts = part.slice(3)
      if (part.startsWith('v1=')) v1 = part.slice(3)
    }
    if (!ts || !v1) return false

    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(manifest))
    const computed = Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('')
    return computed === v1
  } catch {
    return false
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 })
  }

  try {
    // Verificar assinatura do webhook (se secret configurado)
    if (MERCADOPAGO_WEBHOOK_SECRET) {
      const dataId = new URL(req.url).searchParams.get('data.id')
      const xSignature = req.headers.get('x-signature')
      const xRequestId = req.headers.get('x-request-id')
      const isValid = await verifyWebhookSignature(xSignature, xRequestId, dataId, MERCADOPAGO_WEBHOOK_SECRET)
      if (!isValid) {
        console.error('[WEBHOOK-CUSTOMER] Assinatura inválida')
        return new Response('Unauthorized', { status: 401 })
      }
    } else {
      console.warn('[WEBHOOK-CUSTOMER] MERCADOPAGO_WEBHOOK_SECRET não configurado — assinatura não verificada')
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Mercado Pago pode enviar via query params OU body
    const url = new URL(req.url)
    let topic = url.searchParams.get('topic')
    let id = url.searchParams.get('id')

    if (!topic || !id) {
      try {
        const body = await req.json()
        topic = body.action || body.type
        id = body.data?.id || body.id
        console.log('Customer webhook via body:', { topic, id })
      } catch (e) {
        console.log('Customer webhook via query params')
      }
    }

    console.log('Customer webhook recebido:', { topic, id })

    if (!topic || (!topic.includes('payment') && topic !== 'merchant_order')) {
      console.log('Topic ignorado:', topic)
      return new Response('OK', { headers: corsHeaders, status: 200 })
    }

    const paymentId = id
    if (!paymentId) {
      console.log('Payment ID não encontrado')
      return new Response('OK', { headers: corsHeaders, status: 200 })
    }

    // Buscar informações do pagamento no Mercado Pago
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
      },
    })

    const payment = await mpResponse.json()
    console.log('Status do pagamento:', payment.status)

    if (payment.status === 'approved') {
      const userId = payment.metadata.user_id
      const productId = payment.metadata.product_id
      const productSlug = payment.metadata.product_slug

      // === GUARD ATÔMICO: só prossegue se o status ainda for 'pending' ===
      const { data: purchase, error: lockError } = await supabaseAdmin
        .from('customer_purchases')
        .update({ payment_status: 'approved' })
        .eq('payment_id', paymentId)
        .eq('payment_status', 'pending')
        .select('*')
        .single()

      if (lockError || !purchase) {
        console.log('Pagamento já processado por outra requisição:', paymentId)
        return new Response('Already processed', { status: 200 })
      }

      // Buscar produto para saber os dias
      const { data: product } = await supabaseAdmin
        .from('products_endcustomer')
        .select('*')
        .eq('id', productId)
        .single()

      if (!product) {
        console.error('Produto não encontrado:', productId)
        return new Response('Product not found', { status: 404 })
      }

      // Buscar dados do usuário
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId)
      const userName = authUser?.user?.user_metadata?.name || authUser?.user?.email?.split('@')[0] || 'Cliente'
      const userEmail = authUser?.user?.email
      const userPhone = authUser?.user?.user_metadata?.whatsapp || null

      // Gerar license_key única
      const prefix = productSlug === 'try-7' ? 'TRY7' : productSlug === 'ultra-15' ? 'ULTRA15' : 'ULTRA30'
      const randomHex = crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()
      const licenseKey = `${prefix}-${randomHex}`

      // Calcular expiração (NULL = vitalício)
      const expiresAt = product.is_lifetime ? null : (() => {
        const d = new Date()
        d.setDate(d.getDate() + product.days)
        return d.toISOString()
      })()

      // Inserir licença
      const { error: licenseError } = await supabaseAdmin
        .from('ts_licenses')
        .insert({
          license_key: licenseKey,
          user_id: userId,
          user_name: userName,
          email: userEmail,
          phone: userPhone,
          status: 'active',
          license_type: 'paid',
          expires_at: expiresAt,
          metadata: {
            product_id: productId,
            product_name: product.name,
            devices: product.devices,
            has_priority_support: product.has_priority_support,
            source: 'customer_purchase',
            payment_id: paymentId,
          },
        })

      if (licenseError) {
        console.error('Erro ao criar licença:', licenseError)
        throw licenseError
      }

      // Atualizar compra com license_key
      const { error: updateError } = await supabaseAdmin
        .from('customer_purchases')
        .update({
          license_key: licenseKey,
          approved_at: new Date().toISOString(),
          payment_data: { mp_status: payment.status, mp_status_detail: payment.status_detail },
        })
        .eq('payment_id', paymentId)

      if (updateError) {
        console.error('Erro ao atualizar compra:', updateError)
        throw updateError
      }

      console.log(`✅ Licença ${licenseKey} criada para usuário ${userId} (${product.name})`)
      return new Response('OK - License created', { headers: corsHeaders, status: 200 })
    }

    // Para outros status, atualizar na tabela
    if (payment.status) {
      const statusMap: Record<string, string> = {
        approved: 'approved',
        rejected: 'rejected',
        cancelled: 'cancelled',
        refunded: 'refunded',
      }
      const mappedStatus = statusMap[payment.status] || payment.status

      await supabaseAdmin
        .from('customer_purchases')
        .update({ payment_status: mappedStatus })
        .eq('payment_id', paymentId)
    }

    return new Response('OK', { headers: corsHeaders, status: 200 })
  } catch (error) {
    console.error('Erro no customer webhook:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200  // Retornar 200 para MP não retentar
    })
  }
})
