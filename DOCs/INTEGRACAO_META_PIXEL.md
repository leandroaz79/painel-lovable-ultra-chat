# Documentação Técnica — Integração Meta Pixel + Conversions API

> **Versão:** 1.0  
> **Data:** Julho 2026

---

## Visão Geral

Módulo de integração completa com o ecossistema Meta (Facebook) para rastreamento de eventos via **Meta Pixel** (browser) e **Conversions API** (servidor), com deduplicação automática.

---

## Arquivos Criados/Modificados

### Novos Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `supabase/migrations/018_create_meta_settings.sql` | Tabela `meta_settings` + RLS |
| `supabase/functions/get-meta-settings/index.ts` | Edge Function: busca configurações |
| `supabase/functions/update-meta-settings/index.ts` | Edge Function: salva configurações (admin) |
| `supabase/functions/meta-capi-event/index.ts` | Edge Function: envia eventos Conversions API |
| `src/utils/metaPixel.ts` | Serviço frontend: Pixel + CAPI |
| `src/hooks/useMetaPixel.ts` | Hook para inicializar Pixel globalmente |
| `src/pages/admin/MetaIntegration.tsx` | Página admin de configuração |

### Arquivos Modificados

| Arquivo | Alteração |
|---------|-----------|
| `src/App.tsx` | Rota `/admin/meta` + `useMetaPixel()` |
| `src/lib/supabase.ts` | Constantes das novas Edge Functions |
| `src/components/AdminSidebar.tsx` | Seção "Integrações" com link Meta Pixel |
| `src/pages/Landing.tsx` | `initMetaPixel()` + PageView |
| `src/components/landing/Hero.tsx` | Evento `Lead` nos CTAs |
| `src/components/landing/FinalCTA.tsx` | Evento `Lead` nos CTAs |
| `src/components/landing/Pricing.tsx` | Evento `InitiateCheckout` ao selecionar plano |
| `src/components/landing/CheckoutModal.tsx` | Eventos `ViewContent`, `InitiateCheckout`, `Purchase` |
| `src/pages/Checkout.tsx` | Eventos `ViewContent`, `InitiateCheckout`, `Purchase` |

---

## Banco de Dados

### Tabela `meta_settings`

```sql
CREATE TABLE public.meta_settings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pixel_id        TEXT NOT NULL DEFAULT '',
    access_token    TEXT NOT NULL DEFAULT '',
    test_event_code TEXT NOT NULL DEFAULT '',
    dataset_id      TEXT NOT NULL DEFAULT '',
    enabled         BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

- **RLS**: Admin (ALL), Autenticado (SELECT), Anônimo (SELECT)
- **Seed**: Um registro padrão com `enabled = false`
- **Segurança**: `access_token` nunca retornado ao frontend (apenas `pixel_id`, `test_event_code`, `dataset_id`, `enabled`)

---

## Arquitetura

```
┌─────────────────────────────────────────────────────┐
│                    Frontend                          │
│                                                     │
│  src/utils/metaPixel.ts                             │
│  ├── fetchMetaSettings()    → Busca config do DB    │
│  ├── initMetaPixel()        → Carrega script Pixel  │
│  ├── trackPixelEvent()      → fbq('track', ...)    │
│  └── sendCAPIEvent()        → Chama Edge Function   │
│                                                     │
│  src/hooks/useMetaPixel.ts                          │
│  └── initMetaPixel() on app mount                   │
│                                                     │
│  Eventos rastreados:                                │
│  ├── PageView (auto via Pixel script)               │
│  ├── Lead (Hero CTA, FinalCTA CTA)                  │
│  ├── ViewContent (Checkout/Modal product load)      │
│  ├── InitiateCheckout (payment start)               │
│  └── Purchase (payment approved)                    │
└──────────────────────┬──────────────────────────────┘
                       │ fetch()
                       ▼
┌─────────────────────────────────────────────────────┐
│              Supabase Edge Functions                 │
│                                                     │
│  get-meta-settings    → Lê meta_settings (anon)     │
│  update-meta-settings → Salva meta_settings (admin) │
│  meta-capi-event      → Envia para Graph API        │
│    ├── SHA-256 hash dos dados PII                   │
│    ├── Retry (3 tentativas, backoff)                │
│    ├── Timeout (10s)                                │
│    └── Logs estruturados (sem access_token)         │
└──────────────────────┬──────────────────────────────┘
                       │ POST
                       ▼
┌─────────────────────────────────────────────────────┐
│         Meta Graph API v21.0                         │
│  POST /{pixel_id}/events?access_token=...           │
│  └── Conversions API (server-side events)           │
└─────────────────────────────────────────────────────┘
```

---

## Deduplicação

Todo evento enviado tanto pelo browser (Pixel) quanto pelo servidor (CAPI) utiliza o mesmo `event_id`:

1. `trackEvent()` gera um `event_id` único (`evt_{timestamp}_{random}`)
2. Envia via `fbq('track', eventName, { eventID: eventId, ... })`
3. Envia o mesmo `event_id` via Edge Function `meta-capi-event`
4. Meta detecta duplicatas pelo `event_id` e conta apenas uma vez

---

## Eventos Implementados

| Evento | Onde | Trigger |
|--------|------|---------|
| `PageView` | Landing + Checkout | Carregamento da página (via Pixel script) |
| `Lead` | Hero.tsx, FinalCTA.tsx | Clique nos CTAs "Liberar poder ilimitado" / "Teste grátis" |
| `ViewContent` | Checkout.tsx, CheckoutModal.tsx | Produto carregado com sucesso |
| `InitiateCheckout` | Checkout.tsx, CheckoutModal.tsx, Pricing.tsx | Início do pagamento |
| `Purchase` | Checkout.tsx, CheckoutModal.tsx | Pagamento aprovado (cartão síncrono ou Pix via polling) |

---

## Dados Enviados (Conversions API)

Cada evento CAPI inclui:

```json
{
  "event_name": "Purchase",
  "event_time": 1720435200,
  "event_id": "evt_1720435200_abc123",
  "action_source": "website",
  "event_source_url": "https://...",
  "user_data": {
    "em": "sha256_hash_email",
    "ph": "sha256_hash_phone",
    "fn": "sha256_hash_first_name",
    "ln": "sha256_hash_last_name",
    "ct": "sha256_hash_city",
    "st": "sha256_hash_state",
    "zp": "sha256_hash_zip",
    "country": "sha256_hash_country",
    "external_id": "sha256_hash_external_id",
    "client_ip_address": "...",
    "client_user_agent": "...",
    "fbp": "_fbp_cookie",
    "fbc": "_fbc_cookie"
  },
  "custom_data": {
    "value": 29.90,
    "currency": "BRL",
    "content_ids": ["uuid"],
    "content_type": "product",
    "content_name": "TRY 7"
  }
}
```

---

## Como Testar

### 1. Configurar no Admin

1. Acesse `/admin/meta`
2. Preencha o **Pixel ID** (obtido no Meta Events Manager)
3. Preencha o **Access Token** (obtido em Configurações → Conversions API)
4. Opcionalmente, preencha o **Test Event Code** (para validação no Events Manager)
5. Ative a integração e salve

### 2. Validar Pixel (Browser)

1. Instale a extensão **Meta Pixel Helper** no Chrome
2. Acesse a landing page — deve detectar `PageView`
3. Clique num CTA — deve detectar `Lead`
4. Acesse `/checkout/{slug}` — deve detectar `ViewContent`
5. Inicie o pagamento — deve detectar `InitiateCheckout`

### 3. Validar Conversions API (Servidor)

1. No **Meta Events Manager**, vá em "Test Events"
2. Insira o **Test Event Code** nas configurações
3. Execute as ações acima
4. Verifique que cada evento aparece tanto do **Browser** quanto do **Server**
5. Confirme que o `event_id` é idêntico em ambos (deduplicação)

### 4. Validar Deduplicação

- No Events Manager, cada evento deve aparecer com status "Deduplicated"
- Se aparecer "Multiple" sem deduplicação, verifique se o `event_id` é o mesmo

---

## Como Adicionar Novos Eventos

### 1. No Frontend

```typescript
import { trackEvent } from '../utils/metaPixel'

// Rastrear um evento
trackEvent('AddToCart', {
  content_name: 'Produto X',
  content_ids: ['id-123'],
  content_type: 'product',
  value: 49.90,
  currency: 'BRL',
})
```

A função `trackEvent()` automaticamente:
- Envia via `fbq('track', ...)` (browser)
- Envia via Conversions API (servidor)
- Usa o mesmo `event_id` para deduplicação

### 2. Eventos Customizados

```typescript
import { trackPixelCustomEvent } from '../utils/metaPixel'

trackPixelCustomEvent('MeuEventoCustom', {
  custom_param: 'valor',
})
```

---

## Segurança

- **Access Token**: Armazenado apenas no banco, retornado pela Edge Function `get-meta-settings` é **ignorado** (a resposta inclui apenas `pixel_id`, `test_event_code`, `dataset_id`, `enabled`)
- **CAPI Communication**: Ocorre exclusivamente no servidor (Edge Function), nunca no frontend
- **SHA-256**: Todos os dados PII (email, telefone, nome, etc.) são hasheados antes do envio
- **Logs**: Nunca registram access_token
- **RLS**: Apenas admin pode escrever; qualquer pessoa pode ler (para carregar o Pixel)

---

## Performance

- Configurações são cacheadas em memória no frontend (`cachedSettings`)
- Requisições ao banco são feitas apenas uma vez por sessão
- CAPI é enviado de forma assíncrona (fire-and-forget) — não bloqueia o checkout
- Retry com backoff exponencial (1s, 2s, 3s) em caso de falha
- Timeout de 10s por requisição à Meta

---

## Tratamento de Erros

- Se a Meta estiver indisponível, o checkout **não é interrompido**
- Erros de CAPI são logados no servidor mas não impactam o usuário
- Se as configurações não existirem, o Pixel não é carregado
- Se `enabled = false`, nenhum evento é rastreado
