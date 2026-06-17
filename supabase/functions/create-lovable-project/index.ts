// ============================================================================
// EDGE FUNCTION: create-lovable-project
// Descrição: Cria novo projeto no Lovable via proxy
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

// Rate Limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW = 300000 // 5 minutos
const RATE_LIMIT_MAX = 5

interface CreateProjectRequest {
  license_key: string
  token_lovable: string
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
    const body: CreateProjectRequest = await req.json()
    const { license_key, token_lovable } = body

    if (!license_key || !token_lovable) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error_display: 'Dados incompletos' 
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
      .select('status')
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

    // CRIAR PROJETO NA API LOVABLE
    const createResponse = await fetch('https://api.lovable.dev/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token_lovable}`
      },
      body: JSON.stringify({
        name: 'Novo Projeto Ultra Chat',
        template: 'blank'
      })
    })

    if (!createResponse.ok) {
      const errorData = await createResponse.json().catch(() => ({}))
      
      return new Response(
        JSON.stringify({ 
          success: false,
          error_display: errorData.message || 'Falha ao criar projeto no Lovable',
          status: createResponse.status
        }),
        {
          status: createResponse.status,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      )
    }

    const projectData = await createResponse.json()
    
    // Link do projeto criado
    const projectLink = projectData.url || 
                       projectData.project_url || 
                       `https://lovable.dev/projects/${projectData.id}`

    return new Response(
      JSON.stringify({ 
        success: true,
        link: projectLink,
        project_id: projectData.id,
        message: 'Projeto criado com sucesso!'
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      }
    )

  } catch (error) {
    console.error('Erro ao criar projeto:', error)
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
