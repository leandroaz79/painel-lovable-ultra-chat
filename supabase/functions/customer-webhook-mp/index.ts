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

const VALID_STATUSES = new Set([
  'approved', 'rejected', 'cancelled', 'refunded',
  'in_process', 'pending', 'authorized', 'in_mediation',
  'charged_back',
])

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 })
  }

  try {
    if (!MERCADOPAGO_ACCESS_TOKEN) {
      console.error('[FATAL] MERCADOPAGO_ACCESS_TOKEN não configurado')
      return new Response('OK', { headers: corsHeaders, status: 200 })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    let topic = url.searchParams.get('topic')
    let id = url.searchParams.get('id')

    if (!topic || !id) {
      try {
        const body = await req.json()
        topic = body.action || body.type
        id = body.data?.id || body.id
      } catch {
        // sem body
      }
    }

    console.log('[WEBHOOK-CUSTOMER] Recebido:', { topic, id })

    if (!topic || (!topic.includes('payment') && topic !== 'merchant_order')) {
      return new Response('OK', { headers: corsHeaders, status: 200 })
    }

    const paymentId = id
    if (!paymentId) {
      return new Response('OK', { headers: corsHeaders, status: 200 })
    }

    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { 'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}` },
    })

    const payment = await mpResponse.json()

    if (!mpResponse.ok || !payment.id) {
      console.error('[WEBHOOK-CUSTOMER] Erro ao buscar pagamento:', mpResponse.status)
      return new Response('OK', { headers: corsHeaders, status: 200 })
    }

    console.log('[WEBHOOK-CUSTOMER] Status:', payment.status, payment.status_detail)

    if (payment.status === 'approved') {
      const userId = payment.metadata?.user_id
      const productId = payment.metadata?.product_id
      const productSlug = payment.metadata?.product_slug

      if (!userId || !productId || !productSlug) {
        console.error('[WEBHOOK-CUSTOMER] Metadata incompleta:', payment.metadata)
        return new Response('OK', { headers: corsHeaders, status: 200 })
      }

      // GUARD ATÔMICO
      const { data: purchase, error: lockError } = await supabaseAdmin
        .from('customer_purchases')
        .update({ payment_status: 'approved' })
        .eq('payment_id', paymentId)
        .eq('payment_status', 'pending')
        .select('*')
        .single()

      if (lockError || !purchase) {
        console.log('[WEBHOOK-CUSTOMER] Já processado:', paymentId)
        return new Response('Already processed', { status: 200 })
      }

      const { data: product } = await supabaseAdmin
        .from('products_endcustomer')
        .select('*')
        .eq('id', productId)
        .single()

      if (!product) {
        console.error('[WEBHOOK-CUSTOMER] Produto não encontrado:', productId)
        return new Response('OK', { headers: corsHeaders, status: 200 })
      }

      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId)
      const userName = authUser?.user?.user_metadata?.name || authUser?.user?.email?.split('@')[0] || 'Cliente'
      const userEmail = authUser?.user?.email
      const userPhone = authUser?.user?.user_metadata?.whatsapp || null

      const prefix = productSlug === 'try-7' ? 'TRY7' : productSlug === 'ultra-15' ? 'ULTRA15' : 'ULTRA30'
      const randomHex = crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()
      const licenseKey = `${prefix}-${randomHex}`

      const expiresAt = product.is_lifetime ? null : (() => {
        const d = new Date()
        d.setDate(d.getDate() + product.days)
        return d.toISOString()
      })()

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
        console.error('[WEBHOOK-CUSTOMER] Erro ao criar licença:', licenseError)
        return new Response('OK', { headers: corsHeaders, status: 200 })
      }

      // FIX: Não sobrescrever payment_data inteiro — fazer merge
      const { error: updateError } = await supabaseAdmin
        .from('customer_purchases')
        .update({
          license_key: licenseKey,
          approved_at: new Date().toISOString(),
          payment_status: 'approved',
        })
        .eq('payment_id', paymentId)

      if (updateError) {
        console.error('[WEBHOOK-CUSTOMER] Erro ao atualizar compra:', updateError)
      }

      console.log(`[WEBHOOK-CUSTOMER] ✅ Licença ${licenseKey} criada para ${userId}`)
      return new Response('OK - License created', { headers: corsHeaders, status: 200 })
    }

    // Para outros status: mapear apenas status válidos para o CHECK constraint
    if (payment.status && VALID_STATUSES.has(payment.status)) {
      await supabaseAdmin
        .from('customer_purchases')
        .update({ payment_status: payment.status })
        .eq('payment_id', paymentId)
        .eq('payment_status', 'pending')
    }

    return new Response('OK', { headers: corsHeaders, status: 200 })
  } catch (error) {
    console.error('[WEBHOOK-CUSTOMER] Erro:', error)
    return new Response('OK', { headers: corsHeaders, status: 200 })
  }
})
