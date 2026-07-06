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
    const { payment_id } = await req.json()

    if (!payment_id) {
      throw new Error('payment_id é obrigatório')
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Primeiro verificar em credit_purchases (revendedor comprando créditos)
    const { data: creditPurchase } = await supabaseAdmin
      .from('credit_purchases')
      .select('status, quantity')
      .eq('payment_id', payment_id)
      .maybeSingle()

    if (creditPurchase) {
      return new Response(
        JSON.stringify({
          success: true,
          status: creditPurchase.status,
          type: 'credit_purchase',
          quantity: creditPurchase.quantity,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Se não achou em credit_purchases, verificar em customer_purchases (cliente final)
    const { data: purchase } = await supabaseAdmin
      .from('customer_purchases')
      .select('payment_status, license_key')
      .eq('payment_id', payment_id)
      .maybeSingle()

    if (purchase) {
      return new Response(
        JSON.stringify({
          success: true,
          status: purchase.payment_status,
          type: 'customer_purchase',
          license_key: purchase.license_key || null,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Nenhum registro encontrado
    return new Response(
      JSON.stringify({
        success: true,
        status: 'pending',
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
