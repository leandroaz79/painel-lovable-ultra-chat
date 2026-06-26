// Edge Function: customer-check-payment
// Verifica status do pagamento no banco (usado pelo polling no frontend)

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

    const { payment_id } = await req.json()

    if (!payment_id) {
      throw new Error('payment_id é obrigatório')
    }

    // Buscar compra do usuário
    const { data: purchase } = await supabaseClient
      .from('customer_purchases')
      .select('payment_status, license_key, pix_qr_code, pix_qr_code_base64')
      .eq('payment_id', payment_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!purchase) {
      throw new Error('Compra não encontrada')
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: purchase.payment_status,
        license_key: purchase.license_key || null,
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
