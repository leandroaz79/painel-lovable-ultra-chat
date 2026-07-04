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
  // Responder OPTIONS para CORS
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
        console.error('[WEBHOOK-RESELLER] Assinatura inválida')
        return new Response('Unauthorized', { status: 401 })
      }
    } else {
      console.warn('[WEBHOOK-RESELLER] MERCADOPAGO_WEBHOOK_SECRET não configurado — assinatura não verificada')
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Mercado Pago pode enviar via query params OU body
    const url = new URL(req.url)
    let topic = url.searchParams.get('topic')
    let id = url.searchParams.get('id')

    // Se não vier por query, tentar ler do body
    if (!topic || !id) {
      try {
        const body = await req.json()
        topic = body.action || body.type
        id = body.data?.id || body.id
        console.log('Webhook via body:', { topic, id, body })
      } catch (e) {
        console.log('Webhook via query params')
      }
    }

    console.log('Webhook recebido:', { topic, id, method: req.method })

    // Aceitar payment.updated ou payment
    if (!topic || (!topic.includes('payment') && topic !== 'merchant_order')) {
      console.log('Topic ignorado:', topic)
      return new Response('OK', { headers: corsHeaders, status: 200 })
    }

    // Buscar informações do pagamento no Mercado Pago
    const paymentId = id
    
    if (!paymentId) {
      console.log('Payment ID não encontrado')
      return new Response('OK', { headers: corsHeaders, status: 200 })
    }

    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${MERCADOPAGO_ACCESS_TOKEN}`,
      },
    })

    const payment = await mpResponse.json()

    console.log('Status do pagamento:', payment.status)

    // Verificar se pagamento foi aprovado
    if (payment.status === 'approved') {
      const userId = payment.metadata.user_id
      const quantity = payment.metadata.quantity

      // Lock atômico: só prossegue se status ainda for 'pending'
      const { data: purchase, error: lockError } = await supabaseAdmin
        .from('credit_purchases')
        .update({ status: 'approved' })
        .eq('payment_id', paymentId)
        .eq('status', 'pending')
        .select('*')
        .single()

      if (lockError || !purchase) {
        console.log('Pagamento já processado:', paymentId)
        return new Response('Already processed', { status: 200 })
      }

      await supabaseAdmin
        .from('credit_purchases')
        .update({ approved_at: new Date().toISOString() })
        .eq('payment_id', paymentId)

      // Buscar dados atuais do revendedor
      const { data: reseller } = await supabaseAdmin
        .from('resellers')
        .select('credits, total_credits_purchased')
        .eq('user_id', userId)
        .single()

      if (!reseller) {
        console.error('Revendedor não encontrado:', userId)
        return new Response('Reseller not found', { status: 404 })
      }

      // Adicionar créditos ao revendedor
      const { error: updateError } = await supabaseAdmin
        .from('resellers')
        .update({
          credits: reseller.credits + quantity,
          total_credits_purchased: reseller.total_credits_purchased + quantity,
        })
        .eq('user_id', userId)

      if (updateError) {
        console.error('Erro ao adicionar créditos:', updateError)
        throw updateError
      }

      console.log(`✅ ${quantity} créditos adicionados ao revendedor ${userId}`)

      // Opcional: Enviar email de confirmação
      // await sendConfirmationEmail(userId, quantity)

      return new Response('OK - Credits added', { headers: corsHeaders, status: 200 })
    }

    // Para outros status (pending, rejected, etc), apenas atualizar status
    if (payment.status) {
      await supabaseAdmin
        .from('credit_purchases')
        .update({ status: payment.status })
        .eq('payment_id', paymentId)
    }

    return new Response('OK', { headers: corsHeaders, status: 200 })
  } catch (error) {
    console.error('Erro no webhook:', error)
    return new Response(JSON.stringify({ error: error.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200  // Retornar 200 para o MP não retentar
    })
  }
})
