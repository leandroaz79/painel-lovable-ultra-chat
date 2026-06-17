// ============================================================================
// EDGE FUNCTION: upload-temp-image
// Descrição: Upload de imagens temporárias com compressão
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

// Rate Limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW = 60000 // 1 minuto
const RATE_LIMIT_MAX = 10 // 10 uploads por minuto por IP

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

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
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  try {
    const clientIP = req.headers.get('x-forwarded-for') || 'unknown'
    
    if (!checkRateLimit(clientIP)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Rate limit exceeded' }),
        { 
          status: 429,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      )
    }

    // Parse multipart form data
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return new Response(
        JSON.stringify({ success: false, error: 'Nenhum arquivo enviado' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      )
    }

    // Validar tipo
    if (!ALLOWED_TYPES.includes(file.type)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Tipo de arquivo não permitido. Use: JPEG, PNG, WebP ou GIF' 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      )
    }

    // Validar tamanho
    if (file.size > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Arquivo muito grande. Máximo 20MB' 
        }),
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

    // Gerar nome único do arquivo
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    const randomId = crypto.randomUUID()
    const ext = file.name.split('.').pop() || 'jpg'
    const fileName = `${today}/${randomId}.${ext}`

    // Converter File para ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()

    // Upload para storage
    const { data, error } = await supabase.storage
      .from('temp-images')
      .upload(fileName, arrayBuffer, {
        contentType: file.type,
        cacheControl: '86400', // 24 horas
        upsert: false
      })

    if (error) {
      console.error('Erro no upload:', error)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Falha no upload da imagem',
          details: error.message 
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      )
    }

    // Gerar URL pública
    const { data: urlData } = supabase.storage
      .from('temp-images')
      .getPublicUrl(fileName)

    return new Response(
      JSON.stringify({ 
        success: true, 
        url: urlData.publicUrl,
        file_path: fileName,
        expires_in: '24h'
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      }
    )

  } catch (error) {
    console.error('Erro ao processar upload:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
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
