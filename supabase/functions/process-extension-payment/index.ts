// ============================================================================
// EDGE FUNCTION: process-extension-payment
// Descrição: Processa pagamentos M-Pesa/e-Mola e gera licenças
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

// Rate Limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW = 300000 // 5 minutos
const RATE_LIMIT_MAX = 3 // 3 tentativas de pagamento por 5 min

interface PaymentRequest {
  packageId: string
  numero: string
  metodo: 'mpesa' | 'emola'
  license_key?: string
}

interface PaymentResponse {
  status: 'sucesso' | 'falha'
  license_key?: string
  expires_at?: string
  error?: string
  transaction_id?: string
}

function checkRateLimit(key: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(key)

  if (!record || now > record.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false
  }

  record.count++
  return true
}

serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
      },
    })
  }

  try {
    const body: PaymentRequest = await req.json()
    const { packageId, numero, metodo, license_key } = body

    // Validações básicas
    if (!packageId || !numero || !metodo) {
      return new Response(
        JSON.stringify({ status: 'falha', error: 'Dados incompletos' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      )
    }

    // Validar número de telefone
    const phoneRegex = /^(84|85|86|87)\d{7}$/
    if (!phoneRegex.test(numero)) {
      return new Response(
        JSON.stringify({ status: 'falha', error: 'Número de telefone inválido' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      )
    }

    // Rate Limiting por telefone
    if (!checkRateLimit(numero)) {
      return new Response(
        JSON.stringify({ status: 'falha', error: 'Muitas tentativas. Aguarde 5 minutos.' }),
        { 
          status: 429,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      )
    }

    // Validar método vs prefixo
    const prefix = numero.substring(0, 2)
    if (metodo === 'mpesa' && !['84', '85'].includes(prefix)) {
      return new Response(
        JSON.stringify({ status: 'falha', error: 'M-Pesa aceita apenas números 84 ou 85' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      )
    }
    if (metodo === 'emola' && !['86', '87'].includes(prefix)) {
      return new Response(
        JSON.stringify({ status: 'falha', error: 'e-Mola aceita apenas números 86 ou 87' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Buscar pacote
    const { data: package_, error: packageError } = await supabase
      .from('packages')
      .select('*')
      .eq('id', packageId)
      .eq('is_active', true)
      .single()

    if (packageError || !package_) {
      return new Response(
        JSON.stringify({ status: 'falha', error: 'Pacote não encontrado' }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      )
    }

    // INTEGRAÇÃO COM GATEWAY DE PAGAMENTO
    // NOTA: Substitua pela integração real com M-Pesa/e-Mola
    const paymentResult = await processPayment(numero, metodo, package_.price)

    if (!paymentResult.success) {
      // Registrar transação falhada
      await supabase.from('payment_transactions').insert({
        package_id: packageId,
        phone: numero,
        payment_method: metodo,
        amount: package_.price,
        status: 'failed',
        provider_response: paymentResult
      })

      return new Response(
        JSON.stringify({ 
          status: 'falha', 
          error: paymentResult.message || 'Falha no processamento do pagamento' 
        }),
        { 
          status: 402,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      )
    }

    // Pagamento aprovado - gerar ou renovar licença
    let newLicenseKey = license_key
    let expiresAt: string | null = null

    if (package_.duration_days) {
      const now = new Date()
      now.setDate(now.getDate() + package_.duration_days)
      expiresAt = now.toISOString()
    }

    if (!newLicenseKey) {
      // Gerar nova licença
      const { data: generatedKey } = await supabase
        .rpc('generate_license_key')
      
      newLicenseKey = generatedKey

      await supabase.from('ts_licenses').insert({
        license_key: newLicenseKey,
        user_name: 'Usuário',
        phone: numero,
        status: 'active',
        license_type: package_.duration_days ? 'paid' : 'lifetime',
        lifetime: !package_.duration_days,
        expires_at: expiresAt,
        metadata: {
          package_id: packageId,
          package_name: package_.name,
          payment_method: metodo
        }
      })
    } else {
      // Renovar licença existente
      const updateData: any = {
        status: 'active',
        expires_at: expiresAt
      }

      await supabase
        .from('ts_licenses')
        .update(updateData)
        .eq('license_key', newLicenseKey)
    }

    // Registrar transação bem-sucedida
    await supabase.from('payment_transactions').insert({
      license_key: newLicenseKey,
      package_id: packageId,
      phone: numero,
      payment_method: metodo,
      amount: package_.price,
      status: 'success',
      transaction_id: paymentResult.transaction_id,
      provider_response: paymentResult
    })

    const response: PaymentResponse = {
      status: 'sucesso',
      license_key: newLicenseKey,
      expires_at: expiresAt || undefined,
      transaction_id: paymentResult.transaction_id
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })

  } catch (error) {
    console.error('Erro ao processar pagamento:', error)
    return new Response(
      JSON.stringify({ 
        status: 'falha', 
        error: 'Erro interno do servidor',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      }
    )
  }
})

// Função auxiliar para processar pagamento
async function processPayment(
  phone: string, 
  method: string, 
  amount: number
): Promise<{ success: boolean; message?: string; transaction_id?: string }> {
  
  // IMPORTANTE: SUBSTITUA PELA INTEGRAÇÃO REAL
  
  // Exemplo de integração M-Pesa (pseudocódigo):
  /*
  if (method === 'mpesa') {
    const mpesaAPI = Deno.env.get('MPESA_API_URL')
    const mpesaKey = Deno.env.get('MPESA_API_KEY')
    
    const response = await fetch(mpesaAPI, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mpesaKey}`
      },
      body: JSON.stringify({
        phone_number: `258${phone}`,
        amount: amount,
        reference: crypto.randomUUID()
      })
    })
    
    const data = await response.json()
    
    return {
      success: data.status === 'approved',
      message: data.message,
      transaction_id: data.transaction_id
    }
  }
  */

  // SIMULAÇÃO (remover em produção)
  console.log(`[SIMULAÇÃO] Processando ${method} para ${phone}: ${amount} MZN`)
  
  // Simular sucesso (70% de chance)
  const success = Math.random() > 0.3
  
  return {
    success,
    message: success ? 'Pagamento aprovado' : 'Pagamento rejeitado',
    transaction_id: success ? `TXN-${crypto.randomUUID().substring(0, 8)}` : undefined
  }
}
