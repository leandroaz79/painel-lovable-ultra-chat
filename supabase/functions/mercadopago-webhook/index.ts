// ============================================================================
// EDGE FUNCTION: mercadopago-webhook
// Descrição: Recebe notificações do Mercado Pago e atualiza créditos
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

    console.log('[WEBHOOK-RESELLER] Recebido:', { topic, id })

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
      console.error('[WEBHOOK-RESELLER] Erro ao buscar pagamento:', mpResponse.status)
      return new Response('OK', { headers: corsHeaders, status: 200 })
    }

    console.log('[WEBHOOK-RESELLER] Status:', payment.status, payment.status_detail)

    if (payment.status === 'approved') {
      const userId = payment.metadata?.user_id
      const quantity = payment.metadata?.quantity

      if (!userId || !quantity) {
        console.error('[WEBHOOK-RESELLER] Metadata incompleta:', payment.metadata)
        return new Response('OK', { headers: corsHeaders, status: 200 })
      }

      const quantityNum = parseInt(quantity, 10)
      if (isNaN(quantityNum) || quantityNum <= 0) {
        console.error('[WEBHOOK-RESELLER] Quantity inválida:', quantity)
        return new Response('OK', { headers: corsHeaders, status: 200 })
      }

      // Lock atômico
      const { data: purchase, error: lockError } = await supabaseAdmin
        .from('credit_purchases')
        .update({ status: 'approved' })
        .eq('payment_id', paymentId)
        .eq('status', 'pending')
        .select('*')
        .single()

      if (lockError || !purchase) {
        console.log('[WEBHOOK-RESELLER] Já processado:', paymentId)
        return new Response('Already processed', { status: 200 })
      }

      await supabaseAdmin
        .from('credit_purchases')
        .update({ approved_at: new Date().toISOString() })
        .eq('payment_id', paymentId)

      // Optimistic locking para créditos
      const { data: reseller, error: resellerError } = await supabaseAdmin
        .from('resellers')
        .select('credits, total_credits_purchased')
        .eq('user_id', userId)
        .single()

      if (resellerError || !reseller) {
        console.error('[WEBHOOK-RESELLER] Revendedor não encontrado:', userId)
        return new Response('OK', { headers: corsHeaders, status: 200 })
      }

      const { error: updateError } = await supabaseAdmin
        .from('resellers')
        .update({
          credits: reseller.credits + quantityNum,
          total_credits_purchased: reseller.total_credits_purchased + quantityNum,
        })
        .eq('user_id', userId)
        .eq('credits', reseller.credits)

      if (updateError) {
        console.error('[WEBHOOK-RESELLER] Erro ao adicionar créditos:', updateError)
        return new Response('OK', { headers: corsHeaders, status: 200 })
      }

      console.log(`[WEBHOOK-RESELLER] ✅ ${quantityNum} créditos adicionados ao revendedor ${userId}`)
      return new Response('OK - Credits added', { headers: corsHeaders, status: 200 })
    }

    // Para outros status: mapear apenas status válidos
    if (payment.status && VALID_STATUSES.has(payment.status)) {
      await supabaseAdmin
        .from('credit_purchases')
        .update({ status: payment.status })
        .eq('payment_id', paymentId)
        .eq('status', 'pending')
    }

    return new Response('OK', { headers: corsHeaders, status: 200 })
  } catch (error) {
    console.error('[WEBHOOK-RESELLER] Erro:', error)
    return new Response('OK', { headers: corsHeaders, status: 200 })
  }
})
