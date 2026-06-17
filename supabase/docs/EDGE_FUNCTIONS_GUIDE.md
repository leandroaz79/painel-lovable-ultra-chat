# 📚 GUIA DE USO DAS EDGE FUNCTIONS

## 🎯 VISÃO GERAL

Este documento explica como usar cada Edge Function do Ultra Chat.

**Base URL:** `https://[SEU-PROJETO].supabase.co/functions/v1/`

**Headers Comuns:**
```json
{
  "Content-Type": "application/json",
  "apikey": "sua-anon-key"
}
```

---

## 1. validate-license

### Descrição
Valida licenças e gerencia sessões de usuário.

### Endpoint
`POST /validate-license`

### Request Body
```json
{
  "license_key": "TS-XXXXXXXXXXXXXXXXXXXX",
  "device_id": "hardware-fingerprint-uuid",
  "session_id": "session-uuid-opcional",
  "heartbeat": false
}
```

### Response (Sucesso)
```json
{
  "valid": true,
  "message": "Licença válida",
  "session_id": "novo-session-uuid",
  "user_name": "Nome do Usuário",
  "expires_at": "2026-07-07T00:00:00Z",
  "activated_at": "2026-06-01T10:00:00Z",
  "status": "active",
  "license_type": "paid",
  "lifetime": false,
  "online_count": 1
}
```

### Response (Erro)
```json
{
  "valid": false,
  "message": "Licença inválida",
  "reason": "expired | suspended | device_conflict"
}
```

### Exemplo de Uso
```javascript
const response = await fetch('https://[projeto].supabase.co/functions/v1/validate-license', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': 'sua-anon-key'
  },
  body: JSON.stringify({
    license_key: 'TS-A1B2C3D4E5F6G7H8I9J0',
    device_id: 'abc-123-def-456',
    heartbeat: false
  })
})

const data = await response.json()
if (data.valid) {
  console.log('Licença válida!', data.session_id)
}
```

### Rate Limit
- 20 requests por minuto por IP
- Retorna HTTP 429 se excedido

---

## 2. optimize-prompt

### Descrição
Otimiza prompts usando IA para melhor qualidade.

### Endpoint
`POST /optimize-prompt`

### Headers Adicionais
```json
{
  "x-license-key": "TS-XXXXXXXXXXXXXXXXXXXX"
}
```

### Request Body
```json
{
  "prompt": "crie um botão azul"
}
```

### Response
```json
{
  "optimized_prompt": "Por favor, crie um botão azul. Seja detalhado e específico na resposta.\n\nRequisitos:\n- Forneça uma solução completa\n- Explique o raciocínio\n- Inclua exemplos práticos",
  "original_length": 19,
  "optimized_length": 156
}
```

### Exemplo de Uso
```javascript
const response = await fetch('https://[projeto].supabase.co/functions/v1/optimize-prompt', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': 'sua-anon-key',
    'x-license-key': 'TS-A1B2C3D4E5F6G7H8I9J0'
  },
  body: JSON.stringify({
    prompt: 'criar landing page moderna'
  })
})

const data = await response.json()
console.log('Prompt otimizado:', data.optimized_prompt)
```

### Rate Limit
- 10 requests por minuto por licença
- Requer licença ativa

---

## 3. process-extension-payment

### Descrição
Processa pagamentos M-Pesa/e-Mola e gera licenças.

### Endpoint
`POST /process-extension-payment`

### Request Body
```json
{
  "packageId": "uuid-do-pacote",
  "numero": "845551234",
  "metodo": "mpesa",
  "license_key": "TS-EXISTENTE-OPCIONAL"
}
```

**Validações:**
- `numero`: Deve ter 9 dígitos
- `metodo: "mpesa"` → prefixos 84 ou 85
- `metodo: "emola"` → prefixos 86 ou 87

### Response (Sucesso)
```json
{
  "status": "sucesso",
  "license_key": "TS-A1B2C3D4E5F6G7H8I9J0",
  "expires_at": "2026-07-07T00:00:00Z",
  "transaction_id": "TXN-ABC123"
}
```

### Response (Erro)
```json
{
  "status": "falha",
  "error": "Número de telefone inválido"
}
```

### Exemplo de Uso
```javascript
const response = await fetch('https://[projeto].supabase.co/functions/v1/process-extension-payment', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': 'sua-anon-key'
  },
  body: JSON.stringify({
    packageId: '550e8400-e29b-41d4-a716-446655440000',
    numero: '845551234',
    metodo: 'mpesa'
  })
})

const data = await response.json()
if (data.status === 'sucesso') {
  console.log('Licença gerada:', data.license_key)
}
```

### Rate Limit
- 3 tentativas por 5 minutos por telefone
- Previne abuso de pagamento

---

## 4. upload-temp-image

### Descrição
Upload de imagens temporárias (expiram em 24h).

### Endpoint
`POST /upload-temp-image`

### Request Body
`multipart/form-data` com campo `file`

### Tipos Permitidos
- image/jpeg
- image/png
- image/webp
- image/gif

### Tamanho Máximo
20MB

### Response
```json
{
  "success": true,
  "url": "https://[projeto].supabase.co/storage/v1/object/public/temp-images/2026-06-07/uuid.jpg",
  "file_path": "2026-06-07/uuid.jpg",
  "expires_in": "24h"
}
```

### Exemplo de Uso (JavaScript)
```javascript
const formData = new FormData()
formData.append('file', imageFile)

const response = await fetch('https://[projeto].supabase.co/functions/v1/upload-temp-image', {
  method: 'POST',
  body: formData
})

const data = await response.json()
if (data.success) {
  console.log('URL da imagem:', data.url)
}
```

### Rate Limit
- 10 uploads por minuto por IP

---

## 5. remove-watermark

### Descrição
Remove marca d'água "Powered by Lovable" do projeto.

### Endpoint
`POST /remove-watermark`

### Request Body
```json
{
  "license_key": "TS-XXXXXXXXXXXXXXXXXXXX",
  "token_lovable": "token-jwt-lovable",
  "project_id": "uuid-do-projeto"
}
```

### Response
```json
{
  "success": true,
  "message": "Marca d'água removida com sucesso!"
}
```

### Exemplo de Uso
```javascript
const response = await fetch('https://[projeto].supabase.co/functions/v1/remove-watermark', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': 'sua-anon-key'
  },
  body: JSON.stringify({
    license_key: 'TS-A1B2C3D4E5F6G7H8I9J0',
    token_lovable: 'eyJhbGci...',
    project_id: '550e8400-e29b-41d4-a716-446655440000'
  })
})

const data = await response.json()
```

### Rate Limit
- 5 tentativas por 5 minutos por licença
- Requer licença ativa

---

## 6. publish-project

### Descrição
Publica projeto Lovable e retorna URL pública.

### Endpoint
`POST /publish-project`

### Request Body
```json
{
  "license_key": "TS-XXXXXXXXXXXXXXXXXXXX",
  "token_lovable": "token-jwt-lovable",
  "project_id": "uuid-do-projeto"
}
```

### Response
```json
{
  "success": true,
  "url": "https://[project-id].lovable.app",
  "message": "Projeto publicado com sucesso!"
}
```

### Exemplo de Uso
```javascript
const response = await fetch('https://[projeto].supabase.co/functions/v1/publish-project', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': 'sua-anon-key'
  },
  body: JSON.stringify({
    license_key: 'TS-A1B2C3D4E5F6G7H8I9J0',
    token_lovable: 'eyJhbGci...',
    project_id: '550e8400-e29b-41d4-a716-446655440000'
  })
})

const data = await response.json()
if (data.success) {
  window.open(data.url, '_blank')
}
```

### Rate Limit
- 5 tentativas por 5 minutos por licença
- Requer licença ativa

---

## 🔒 SEGURANÇA

### Boas Práticas:

1. **Sempre use HTTPS**
2. **Nunca exponha service_role_key no client-side**
3. **Valide entrada no cliente antes de enviar**
4. **Trate erros apropriadamente**
5. **Respeite rate limits**

### Tratamento de Erros:

```javascript
try {
  const response = await fetch(endpoint, options)
  const data = await response.json()
  
  if (!response.ok) {
    if (response.status === 429) {
      console.error('Rate limit exceeded')
    } else if (response.status === 403) {
      console.error('Licença inválida')
    } else {
      console.error('Erro:', data.error)
    }
  }
  
  return data
} catch (error) {
  console.error('Erro de rede:', error)
}
```

---

## 📊 MONITORAMENTO

### Ver Logs das Functions:
1. Abrir Supabase Dashboard
2. Ir em Edge Functions
3. Selecionar function
4. Clicar em "Logs"

### Métricas Importantes:
- Taxa de erro (deve ser < 1%)
- Tempo de resposta (deve ser < 2s)
- Rate limit hits (monitorar abuso)

---

**Última atualização:** 2026-06-07
**Versão:** 1.0
