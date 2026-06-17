// ============================================================================
// EDGE FUNCTION: validate-license
// Descrição: Valida licenças e gerencia sessões com rate limiting
// IMPORTANTE: verify_jwt = FALSE (não requer autenticação JWT)
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

// Configuração de Rate Limiting simples (em memória)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW = 60000 // 1 minuto
const RATE_LIMIT_MAX = 20 // 20 requests por minuto por IP

interface ValidateLicenseRequest {
  license_key: string
  device_id?: string
  session_id?: string
  heartbeat?: boolean
}

interface ValidateLicenseResponse {
  valid: boolean
  message: string
  reason?: string
  session_id?: string
  user_name?: string
  expires_at?: string
  activated_at?: string
  status?: string
  license_type?: string
  lifetime?: boolean
  online_count?: number
}

// Rate Limiting
function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(ip)

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false
  }

  record.count++
  return true
}

// Limpar rate limit map periodicamente (executar a cada minuto)
setInterval(() => {
  const now = Date.now()
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetAt) {
      rateLimitMap.delete(ip)
    }
  }
}, 60000)

serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-license-key',
      },
    })
  }

  try {
    // Rate Limiting
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    
    if (!checkRateLimit(clientIP)) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          message: 'Rate limit exceeded. Tente novamente em 1 minuto.' 
        }),
        { 
          status: 429,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      )
    }

    // Parse request body
    const body: ValidateLicenseRequest = await req.json()
    const { license_key, device_id, session_id, heartbeat } = body

    if (!license_key) {
      return new Response(
        JSON.stringify({ valid: false, message: 'License key é obrigatória' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      )
    }

    // Criar cliente Supabase com service_role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Buscar licença
    const { data: license, error } = await supabase
      .from('ts_licenses')
      .select('*')
      .eq('license_key', license_key)
      .single()

    if (error || !license) {
      return new Response(
        JSON.stringify({ valid: false, message: 'Licença inválida' }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      )
    }

    // Verificar status
    if (license.status === 'suspended') {
      return new Response(
        JSON.stringify({ valid: false, message: 'Licença suspensa', reason: 'suspended' }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      )
    }

    // Verificar expiração
    if (license.expires_at && new Date(license.expires_at) < new Date()) {
      await supabase
        .from('ts_licenses')
        .update({ status: 'expired' })
        .eq('id', license.id)

      return new Response(
        JSON.stringify({ valid: false, message: 'Licença expirada', reason: 'expired' }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      )
    }

    // Verificar conflito de dispositivo
    if (device_id && license.device_id && license.device_id !== device_id) {
      return new Response(
        JSON.stringify({ 
          valid: false, 
          message: 'Esta licença já está ativa em outro dispositivo', 
          reason: 'device_conflict' 
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      )
    }

    // Se é heartbeat, apenas atualizar timestamp
    if (heartbeat && session_id) {
      await supabase
        .from('ts_licenses')
        .update({ 
          last_heartbeat: new Date().toISOString(),
          online_count: 1
        })
        .eq('id', license.id)

      const response: ValidateLicenseResponse = {
        valid: true,
        message: 'Heartbeat atualizado',
        user_name: license.user_name,
        expires_at: license.expires_at,
        activated_at: license.activated_at,
        status: license.status,
        license_type: license.license_type,
        lifetime: license.lifetime,
        online_count: 1
      }

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      })
    }

    // Ativação inicial ou renovação de sessão
    const newSessionId = crypto.randomUUID()
    const updateData: any = {
      session_id: newSessionId,
      last_heartbeat: new Date().toISOString(),
      online_count: 1
    }

    if (device_id && !license.device_id) {
      updateData.device_id = device_id
    }

    if (!license.activated_at) {
      updateData.activated_at = new Date().toISOString()
    }

    await supabase
      .from('ts_licenses')
      .update(updateData)
      .eq('id', license.id)

    const response: ValidateLicenseResponse = {
      valid: true,
      message: 'Licença válida',
      session_id: newSessionId,
      user_name: license.user_name,
      expires_at: license.expires_at,
      activated_at: license.activated_at || updateData.activated_at,
      status: license.status,
      license_type: license.license_type,
      lifetime: license.lifetime,
      online_count: 1
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })

  } catch (error) {
    console.error('Erro ao validar licença:', error)
    return new Response(
      JSON.stringify({ 
        valid: false, 
        message: 'Erro interno do servidor',
        error: error.message 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      }
    )
  }
})
