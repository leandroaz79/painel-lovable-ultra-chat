// ============================================================================
// EDGE FUNCTION: optimize-prompt
// Descrição: Otimiza prompts usando IA com rate limiting
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

// Rate Limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW = 60000 // 1 minuto
const RATE_LIMIT_MAX = 10 // 10 requests por minuto por licença

interface OptimizePromptRequest {
  prompt: string
  'x-license-key'?: string
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

// Limpar rate limit map
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetAt) {
      rateLimitMap.delete(key)
    }
  }
}, 60000)

serve(async (req) => {
  // CORS
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
    const licenseKey = req.headers.get('x-license-key') || ''
    
    if (!licenseKey) {
      return new Response(
        JSON.stringify({ error: 'License key é obrigatória no header x-license-key' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      )
    }

    // Rate Limiting por licença
    if (!checkRateLimit(licenseKey)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Aguarde 1 minuto.' }),
        { 
          status: 429,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      )
    }

    const body: OptimizePromptRequest = await req.json()
    const { prompt } = body

    if (!prompt || prompt.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: 'Prompt muito curto. Mínimo 10 caracteres.' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      )
    }

    // Verificar licença válida
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: license } = await supabase
      .from('ts_licenses')
      .select('status')
      .eq('license_key', licenseKey)
      .single()

    if (!license || license.status !== 'active') {
      return new Response(
        JSON.stringify({ error: 'Licença inválida ou expirada' }),
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      )
    }

    // Otimizar prompt usando IA
    // NOTA: Substitua pela sua API de IA preferida (OpenAI, Anthropic, etc)
    const optimizedPrompt = await optimizeWithAI(prompt)

    return new Response(
      JSON.stringify({ 
        optimized_prompt: optimizedPrompt,
        original_length: prompt.length,
        optimized_length: optimizedPrompt.length
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      }
    )

  } catch (error) {
    console.error('Erro ao otimizar prompt:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor', details: error.message }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      }
    )
  }
})

// Função auxiliar para otimizar com IA
async function optimizeWithAI(prompt: string): Promise<string> {
  // OPÇÃO 1: Usar OpenAI (requer API key)
  /*
  const openaiKey = Deno.env.get('OPENAI_API_KEY')
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'Você é um especialista em otimização de prompts. Reformule o prompt do usuário para ser mais claro, específico e eficaz, mantendo a intenção original.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    })
  })
  
  const data = await response.json()
  return data.choices[0].message.content
  */

  // OPÇÃO 2: Otimização simples baseada em regras (temporário)
  let optimized = prompt.trim()

  // Adicionar contexto se muito curto
  if (optimized.length < 50) {
    optimized = `Por favor, ${optimized}. Seja detalhado e específico na resposta.`
  }

  // Adicionar estrutura se não tiver
  if (!optimized.includes('?') && !optimized.includes(':')) {
    optimized = `Tarefa: ${optimized}\n\nRequisitos:\n- Forneça uma solução completa\n- Explique o raciocínio\n- Inclua exemplos práticos`
  }

  // Melhorar clareza
  optimized = optimized
    .replace(/\s+/g, ' ')
    .replace(/\.{2,}/g, '.')
    .trim()

  return optimized
}
