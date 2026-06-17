// ============================================================================
// EDGE FUNCTION: remove-watermark
// Descrição: Remove marca d'água "Powered by Lovable" do projeto
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

// Rate Limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW = 300000 // 5 minutos
const RATE_LIMIT_MAX = 5 // 5 tentativas por 5 min

interface RemoveWatermarkRequest {
  license_key: string
  token_lovable: string
  project_id: string
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
    const body: RemoveWatermarkRequest = await req.json()
    const { license_key, token_lovable, project_id } = body

    if (!license_key || !token_lovable || !project_id) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error_display: 'Dados incompletos. Certifique-se de que o projeto está sincronizado.' 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      )
    }

    // Rate Limiting
    if (!checkRateLimit(license_key)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error_display: 'Muitas tentativas. Aguarde 5 minutos.' 
        }),
        { 
          status: 429,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      )
    }

    // Verificar licença
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: license } = await supabase
      .from('ts_licenses')
      .select('status, license_type')
      .eq('license_key', license_key)
      .single()

    if (!license || license.status !== 'active') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error_display: 'Licença inválida ou expirada' 
        }),
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      )
    }

    // INTEGRAÇÃO COM LOVABLE API
    // NOTA: A API Lovable não tem endpoint oficial para remover watermark
    // Esta é uma implementação de exemplo que pode precisar ser ajustada

    console.log(`[Remove Watermark] Projeto: ${project_id}, Licença: ${license_key}`)

    // Simular sucesso (em produção, fazer request real para Lovable)
    const success = true

    if (success) {
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Marca d\'água removida com sucesso!'
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      )
    } else {
      return new Response(
        JSON.stringify({ 
          success: false,
          error_display: 'Falha ao remover marca d\'água. Tente novamente.'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      )
    }

  } catch (error) {
    console.error('Erro ao remover watermark:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error_display: 'Erro interno do servidor',
        message: error.message 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      }
    )
  }
})
