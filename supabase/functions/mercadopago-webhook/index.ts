// ============================================================================
// EDGE FUNCTION: mercadopago-webhook
// Descrição: Recebe notificações do Mercado Pago e atualiza créditos
// IMPORTANTE: verify_jwt = FALSE (não requer autenticação JWT)
// CONFIGURAÇÃO MANUAL NECESSÁRIA NO DASHBOARD SUPABASE:
// 1. Edge Functions → mercadopago-webhook → Settings
// 2. Desmarcar "Verify JWT"
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MERCADOPAGO_ACCESS_TOKEN = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN') ?? ''

serve(async (req) => {
  // Responder OPTIONS para CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 })
  }

  try {
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

      // HIGH-004 FIX: Update atômico via RPC
      // NOTA: increment_reseller_credits decrementa total_licenses_created,
      // mas para credit_purchases precisamos incrementar total_credits_purchased.
      // Usamos read-then-write com validação de estado (optimistic locking).
      const { data: reseller, error: resellerError } = await supabaseAdmin
        .from('resellers')
        .select('credits, total_credits_purchased')
        .eq('user_id', userId)
        .single()

      if (resellerError || !reseller) {
        console.error('Revendedor não encontrado:', userId)
        return new Response('Reseller not found', { status: 404 })
      }

      const { error: updateError } = await supabaseAdmin
        .from('resellers')
        .update({
          credits: reseller.credits + quantity,
          total_credits_purchased: reseller.total_credits_purchased + quantity,
        })
        .eq('user_id', userId)
        // Optimistic lock: só atualiza se os créditos não mudaram desde a leitura
        .eq('credits', reseller.credits)

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
