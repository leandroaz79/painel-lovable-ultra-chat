# Ultra Chat — Documentação Completa do Backend

> **Propósito:** Documentar TODO o backend (banco de dados, edge functions, autenticação, integrações, frontend) como referência completa para reconstrução ou integração.

---

## Índice

1. [Stack Tecnológica](#1-stack-tecnológica)
2. [Arquitetura Geral](#2-arquitetura-geral)
3. [Banco de Dados — Esquema Completo](#3-banco-de-dados--esquema-completo)
4. [Edge Functions — Catálogo (32 funções)](#4-edge-functions--catálogo)
5. [Autenticação e Autorização](#5-autenticação-e-autorização)
6. [Pagamentos — Mercado Pago (PIX)](#6-pagamentos--mercado-pago-pix)
7. [Storage Buckets](#7-storage-buckets)
8. [Frontend — Telas e Fluxos](#8-frontend--telas-e-fluxos)
9. [Hooks e Utilitários](#9-hooks-e-utilitários)
10. [Variáveis de Ambiente](#10-variáveis-de-ambiente)
11. [RLS Policies Completas](#11-rls-policies)
12. [Perguntas Abertas / Pendências](#12-perguntas-abertas)

---

## 1. Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| **Frontend** | React 18 + TypeScript + Vite 6 + Tailwind CSS |
| **Roteamento** | react-router-dom v6 |
| **Database** | PostgreSQL 15 (via Supabase) |
| **Auth** | Supabase Auth (GoTrue) |
| **Backend Serverless** | Supabase Edge Functions (Deno runtime) |
| **Pagamentos** | Mercado Pago API (PIX) |
| **Storage** | Supabase Storage (S3-compatible) |
| **Ícones** | Lucide React |
| **UUID** | `uuid-ossp`, `pgcrypto` extensions |
| **Cron** | `pg_cron` (auto-cleanup de trials) |

---

## 2. Arquitetura Geral

```
┌──────────────────────────────────────────────────────────────┐
│                    Navegador (React + Vite)                    │
│  Landing │ Login │ Signup │ Checkout │ User │ Admin │ Reseller│
└─────────────┬──────────────────────────────────┬─────────────┘
              │                                  │
       ┌──────▼──────┐                   ┌───────▼──────────┐
       │ supabase-js │                   │  Edge Functions  │
       │ (client SDK)│─────────────┬─────▶│  (32 funções)   │
       └──────┬──────┘             │     └───────┬──────────┘
              │                    │             │
       ┌──────▼────────────────────▼─────────────▼──────────┐
       │                 Supabase Platform                    │
       │  ┌──────────────┐  ┌──────────────┐  ┌──────────┐   │
       │  │  PostgreSQL  │  │ Auth (GoTrue)│  │ Storage  │   │
       │  │  (15 tables) │  │ + RLS        │  │ (3 buck.)│   │
       │  └──────────────┘  └──────────────┘  └──────────┘   │
       └───────────────────────┬──────────────────────────────┘
                              │
                       ┌──────▼──────┐
                       │Mercado Pago │
                       │  (PIX API)  │
                       └─────────────┘
```

### Fluxo de Comunicação

1. **Frontend → Supabase Client SDK**: Login, signup, queries diretas (via RLS)
2. **Frontend → Edge Functions (HTTPS)**: Operações que exigem service_role (criar licença, pagamentos, admin, reseller)
3. **Edge Functions → PostgreSQL**: Via `createClient()` com `SUPABASE_SERVICE_ROLE_KEY`
4. **Edge Functions → Mercado Pago**: Criação/consulta de pagamentos PIX
5. **Mercado Pago → Webhooks**: Notificações de pagamento → Edge Functions
6. **pg_cron**: Cleanup automático de trials expiradas (a cada 5 min)

---

## 3. Banco de Dados — Esquema Completo

### 3.1 `ts_licenses` — Licenças do sistema

| Coluna | Tipo | Restrições | Descrição |
|--------|------|-----------|-----------|
| `id` | UUID | PK, DEFAULT `uuid_generate_v4()` | ID único |
| `license_key` | TEXT | UNIQUE, NOT NULL | Chave da licença (ex: `TS-XXXX...`) |
| `user_id` | UUID | FK → `auth.users(id)` ON DELETE CASCADE | Dono da licença |
| `reseller_id` | UUID | FK → `resellers(id)` ON DELETE SET NULL | Revendedor que criou |
| `user_name` | TEXT | | Nome do cliente |
| `email` | TEXT | | Email do cliente |
| `phone` | TEXT | | Telefone |
| `status` | TEXT | NOT NULL, DEFAULT 'active', CHECK IN (`active`,`expired`,`suspended`,`trial`) | Estado atual |
| `license_type` | TEXT | NOT NULL, DEFAULT 'paid', CHECK IN (`trial`,`paid`,`lifetime`) | Tipo |
| `lifetime` | BOOLEAN | DEFAULT FALSE | Vitalícia? |
| `activated_at` | TIMESTAMPTZ | | Data de ativação |
| `expires_at` | TIMESTAMPTZ | | Data de expiração |
| `device_id` | TEXT | | HWID do dispositivo ativado |
| `session_id` | TEXT | | Sessão atual |
| `last_heartbeat` | TIMESTAMPTZ | | Último heartbeat |
| `online_count` | INTEGER | DEFAULT 0 | Contador online |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Criação |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Última alteração |
| `metadata` | JSONB | DEFAULT '{}' | Metadados extras |
| `revoked_at` | TIMESTAMPTZ | | Data de revogação |
| `revoked_by` | TEXT | | Quem revogou |
| `reset_count` | INTEGER | DEFAULT 0 | Quantos resets de HWID |

**Índices:** `license_key`, `user_id`, `status`, `device_id`, `session_id`, `reseller_id`

### 3.2 `user_roles` — Papéis dos usuários

| Coluna | Tipo | Restrições |
|--------|------|-----------|
| `id` | UUID | PK, DEFAULT `uuid_generate_v4()` |
| `user_id` | UUID | FK → `auth.users(id)` ON DELETE CASCADE, NOT NULL |
| `role` | TEXT | NOT NULL, CHECK IN (`user`,`reseller`,`admin`) |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() |
| `metadata` | JSONB | DEFAULT '{}' |
| UNIQUE | | `(user_id, role)` |

### 3.3 `resellers` — Cadastro de revendedores

| Coluna | Tipo | Restrições |
|--------|------|-----------|
| `id` | UUID | PK, DEFAULT `uuid_generate_v4()` |
| `user_id` | UUID | FK → `auth.users` NOT NULL, UNIQUE |
| `name` | TEXT | (adicionado na migration 009) |
| `whatsapp` | TEXT | (adicionado na migration 009) |
| `status` | TEXT | DEFAULT 'pending', CHECK IN (`pending`,`active`,`suspended`) |
| `credits` | INTEGER | DEFAULT 0, CHECK (≥ 0) |
| `total_licenses_created` | INTEGER | DEFAULT 0 |
| `total_credits_purchased` | INTEGER | DEFAULT 0 |
| `activation_fee_paid` | BOOLEAN | DEFAULT FALSE |
| `activation_paid_at` | TIMESTAMPTZ | |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() |

### 3.4 `reseller_credit_transactions` — Transações de créditos

| Coluna | Tipo |
|--------|------|
| `id` | UUID PK |
| `reseller_id` | UUID FK → `resellers(id)` ON DELETE CASCADE |
| `type` | TEXT CHECK IN (`purchase`,`consume`,`refund`,`bonus`,`adjustment`) |
| `amount` | INTEGER (positivo=adiciona, negativo=consome) |
| `price_per_unit` | NUMERIC(10,2) |
| `total_paid` | NUMERIC(10,2) |
| `payment_method` | TEXT CHECK IN (`pix`,`credit_card`,`manual`, null) |
| `payment_status` | TEXT CHECK IN (`pending`,`paid`,`failed`,`refunded`, null) |
| `payment_id` | TEXT (ID do MP) |
| `license_key` | TEXT |
| `metadata` | JSONB |
| `created_at` | TIMESTAMPTZ |

### 3.5 `reseller_activation_payments` — Pagamentos de ativação (R$ 300)

| Coluna | Tipo |
|--------|------|
| `id` | UUID PK |
| `reseller_id` | UUID FK → `resellers(id)` |
| `amount` | NUMERIC(10,2) DEFAULT 300.00 |
| `payment_method` | TEXT DEFAULT 'pix' |
| `payment_status` | TEXT CHECK IN (`pending`,`paid`,`failed`,`refunded`) |
| `payment_id` | TEXT, UNIQUE |
| `paid_at` | TIMESTAMPTZ |
| `metadata` | JSONB |

### 3.6 `credit_purchases` — Compras de créditos

| Coluna | Tipo |
|--------|------|
| `id` | UUID PK |
| `reseller_id` | UUID FK → `auth.users(id)` |
| `payment_id` | TEXT, UNIQUE |
| `quantity` | INTEGER NOT NULL |
| `amount` | DECIMAL(10,2) NOT NULL |
| `status` | TEXT CHECK IN (`pending`,`approved`,`rejected`,`cancelled`,`refunded`) |
| `buyer_name` | TEXT |
| `buyer_cpf` | TEXT |
| `buyer_phone` | TEXT |
| `buyer_email` | TEXT |
| `pix_qr_code` | TEXT |
| `pix_qr_code_base64` | TEXT |
| `created_at` | TIMESTAMPTZ |
| `approved_at` | TIMESTAMPTZ |

### 3.7 `reseller_credits_log` — Log de alterações manuais de créditos

| Coluna | Tipo |
|--------|------|
| `id` | UUID PK |
| `reseller_id` | UUID FK → `auth.users(id)` |
| `admin_id` | UUID FK → `auth.users(id)` |
| `amount` | INTEGER (positivo=add, negativo=remove) |
| `reason` | TEXT |
| `created_at` | TIMESTAMPTZ |

### 3.8 `product_pricing` — Tabela de preços (faixas)

| Coluna | Tipo |
|--------|------|
| `id` | UUID PK |
| `min_quantity` | INTEGER NOT NULL |
| `max_quantity` | INTEGER (NULL = sem limite) |
| `unit_price` | NUMERIC(10,2) NOT NULL |
| `discount_percent` | INTEGER DEFAULT 0 |
| `is_active` | BOOLEAN DEFAULT TRUE |
| `created_at` | TIMESTAMPTZ |
| `updated_at` | TIMESTAMPTZ |
| `created_by` | UUID FK → `auth.users` |
| UNIQUE | `(min_quantity, max_quantity)` |

**Seed:**

| Faixa | Preço Unitário | Desconto |
|-------|---------------|----------|
| 1–9 | R$ 30,00 | 0% |
| 10–19 | R$ 25,00 | 17% |
| 20–29 | R$ 20,00 | 33% |
| 30+ | R$ 15,00 | 50% |

### 3.9 `product_pricing_history` — Histórico de alterações de preços

| Coluna | Tipo |
|--------|------|
| `id` | UUID PK |
| `pricing_id` | UUID FK → `product_pricing(id)` |
| `min_quantity`, `max_quantity` | INTEGER |
| `old_unit_price`, `new_unit_price` | NUMERIC(10,2) |
| `changed_by` | UUID FK → `auth.users` |
| `changed_at` | TIMESTAMPTZ |
| `change_reason` | TEXT |

### 3.10 `products_endcustomer` — Planos para cliente final

| Coluna | Tipo |
|--------|------|
| `id` | UUID PK |
| `name` | TEXT NOT NULL |
| `slug` | TEXT UNIQUE NOT NULL |
| `description` | TEXT |
| `days` | INTEGER NOT NULL |
| `price_cents` | INTEGER NOT NULL |
| `devices` | INTEGER DEFAULT 1 |
| `has_priority_support` | BOOLEAN DEFAULT FALSE |
| `active` | BOOLEAN DEFAULT TRUE |
| `sort_order` | INTEGER DEFAULT 0 |
| `created_at` | TIMESTAMPTZ |

**Seed:**

| Nome | Slug | Dias | Preço | Dispositivos | Suporte Prioritário |
|------|------|------|-------|-------------|-------------------|
| TRY 7 | try-7 | 7 | R$ 29,90 (2990 centavos) | 1 | Não |
| ULTRA 15 | ultra-15 | 15 | R$ 49,90 (4990 centavos) | 1 | Sim |
| ULTRA 30 | ultra-30 | 30 | R$ 79,90 (7990 centavos) | 1 | Sim |

### 3.11 `customer_purchases` — Compras de clientes finais

| Coluna | Tipo |
|--------|------|
| `id` | UUID PK |
| `user_id` | UUID FK → `auth.users(id)` |
| `product_id` | UUID FK → `products_endcustomer(id)` |
| `license_key` | TEXT FK → `ts_licenses(license_key)` |
| `payment_id` | TEXT |
| `payment_status` | TEXT CHECK IN (`pending`,`approved`,`rejected`,`cancelled`,`refunded`) |
| `payment_data` | JSONB |
| `pix_qr_code` | TEXT |
| `pix_qr_code_base64` | TEXT |
| `expires_at` | TIMESTAMPTZ |
| `created_at` | TIMESTAMPTZ |
| `approved_at` | TIMESTAMPTZ |

### 3.12 `admin_audit_logs` — Auditoria de ações administrativas

| Coluna | Tipo |
|--------|------|
| `id` | UUID PK |
| `admin_user_id` | UUID NOT NULL |
| `action` | TEXT NOT NULL |
| `target_table` | TEXT NOT NULL DEFAULT 'ts_licenses' |
| `target_id` | UUID |
| `license_key` | TEXT |
| `metadata` | JSONB |
| `created_at` | TIMESTAMPTZ |

### 3.13 `notifications` — Notificações do sistema

| Coluna | Tipo |
|--------|------|
| `id` | UUID PK |
| `title` | TEXT NOT NULL |
| `message` | TEXT NOT NULL |
| `link` | TEXT |
| `is_active` | BOOLEAN DEFAULT TRUE |
| `priority` | INTEGER DEFAULT 0 |
| `created_at` | TIMESTAMPTZ |
| `expires_at` | TIMESTAMPTZ |
| `metadata` | JSONB |

### 3.14 `packages` — Planos (legado, substituído por `products_endcustomer`)

| Coluna | Tipo |
|--------|------|
| `id` | UUID PK |
| `name` | TEXT NOT NULL |
| `description` | TEXT |
| `price` | DECIMAL(10,2) |
| `currency` | TEXT DEFAULT 'MZN' |
| `duration_days` | INTEGER |
| `is_active` | BOOLEAN |
| `is_popular` | BOOLEAN |
| `sort_order` | INTEGER |
| `features` | JSONB |
| `created_at` | TIMESTAMPTZ |
| `updated_at` | TIMESTAMPTZ |
| `metadata` | JSONB |

### 3.15 `user_trials` — Controle de trial por usuário

| Coluna | Tipo |
|--------|------|
| `id` | UUID PK |
| `user_id` | UUID FK → `auth.users(id)`, UNIQUE |
| `used_at` | TIMESTAMPTZ |
| `license_key` | TEXT FK → `ts_licenses(license_key)` |

### 3.16 `payment_transactions` — Transações (legado)

| Coluna | Tipo |
|--------|------|
| `id` | UUID PK |
| `license_key` | TEXT |
| `package_id` | UUID FK → `packages(id)` |
| `phone` | TEXT NOT NULL |
| `payment_method` | TEXT CHECK IN (`mpesa`,`emola`) |
| `amount` | DECIMAL(10,2) |
| `currency` | TEXT DEFAULT 'MZN' |
| `status` | TEXT CHECK IN (`pending`,`success`,`failed`,`cancelled`) |
| `transaction_id` | TEXT |
| `provider_response` | JSONB |
| `created_at` / `updated_at` | TIMESTAMPTZ |
| `metadata` | JSONB |

### 3.17 `extension_versions` — Versões da extensão

| Coluna | Tipo |
|--------|------|
| `id` | UUID PK |
| `version` | TEXT UNIQUE |
| `changelog` | TEXT |
| `file_path` | TEXT |
| `is_alert_active` | BOOLEAN |
| `is_mandatory` | BOOLEAN |
| `created_at` | TIMESTAMPTZ |
| `metadata` | JSONB |

### 3.18 Views

**`resellers_with_email`** — Junta `resellers` + `auth.users` para obter emails.

---

## 4. Edge Functions — Catálogo

Todas as funções usam **Deno** + Supabase Edge Runtime.
Total: **32 funções** (19 mapeadas no frontend + 13 adicionais).

### Convenções Gerais

- **CORS headers:** `Access-Control-Allow-Origin: *`
- **Autenticação:** Servem JWT no header `Authorization: Bearer <token>`
- **Respostas:** JSON com `{ success: boolean, ... }`
- **Erros:** HTTP 400 + `{ success: false, error: string }`
- **Clientes DB:** Usam `createClient()` com `SUPABASE_SERVICE_ROLE_KEY` para operações privilegiadas

---

### 4.1 Funções de Admin (13)

#### `admin-list-licenses` — Listar licenças
- **Auth:** Admin
- **Request:** `{ limit?: number }`
- **Response:** `{ success, licenses: [...], stats: { total, active, trial, expired, suspended, lifetime } }`
- **Lógica:** Busca `ts_licenses` onde `reseller_id IS NULL`, ordena por `created_at DESC`, retorna com estatísticas agregadas.

#### `admin-create-license` — Criar licença
- **Auth:** Admin
- **Request:** `{ user_name?, email?, phone?, license_type: "paid"|"lifetime"|"trial", days?: number, lifetime?: boolean, trial_minutes?: number }`
- **Response:** `{ success, license, license_key }`
- **Lógica:** Gera chave `TS-${hex}`, cria registro em `ts_licenses`, audita em `admin_audit_logs`.

#### `admin-delete-license` — Excluir licença
- **Auth:** Admin
- **Request:** `{ license_key }`
- **Response:** `{ success, message }`
- **Lógica:** Deleta de `ts_licenses` onde `license_key = ?`, audita.

#### `admin-renew-license` — Renovar licença
- **Auth:** Admin ou Reseller
- **Request:** `{ license_key, days?: number }` (default 30)
- **Response:** `{ success, data: { license_key, expires_at } }`
- **Lógica:** Atualiza `status = 'active'`, `expires_at = NOW() + days`. Resellers só renovam próprias licenças. Trials não podem ser renovadas.

#### `admin-reset-hwid` — Resetar device_id
- **Auth:** Admin ou Reseller
- **Request:** `{ license_key }`
- **Response:** `{ success, message }`
- **Lógica:** Seta `device_id = NULL`. Resellers só resetam próprias licenças.

#### `admin-revoke-license` — Revogar (suspender)
- **Auth:** Admin ou Reseller
- **Request:** `{ license_key }`
- **Response:** `{ success, data: { license_key, status } }`
- **Lógica:** Seta `status = 'suspended'`. Resellers só revogam próprias.

#### `admin-cleanup-expired-trials` — Limpar trials expiradas
- **Auth:** Admin
- **Request:** (vazio)
- **Response:** `{ success, deleted_count, message }`
- **Lógica:** Deleta trials expiradas há mais de 3 minutos.

#### `admin-list-customers` — Listar clientes finais
- **Auth:** Admin
- **Request:** `{ page: number, pageSize: number }`
- **Response:** `{ success, customers: [...], total, page, pageSize, totalPages }`
- **Lógica:** Busca `auth.users`, filtra admins/resellers, monta objeto com licenças, trials, status.

#### `admin-manage-customer` — Gerenciar cliente
- **Auth:** Admin
- **Request:** `{ user_id, action: "update_profile"|"delete", name?, email?, whatsapp? }`
- **Lógica:** `update_profile` altera `auth.users` + `ts_licenses` + audita. `delete` remove `auth.users`.

#### `admin-list-resellers` — Listar revendedores
- **Auth:** Admin
- **Response:** `{ success, resellers: [...], total }`
- **Lógica:** Busca `resellers` com join para email.

#### `admin-create-reseller` — Criar revendedor
- **Auth:** Admin
- **Request:** `{ name, email, whatsapp, password, initial_credits?, status? }`
- **Lógica:** Cria ou reusa usuário + insere em `resellers` + `user_roles`.

#### `admin-manage-reseller` — Gerenciar revendedor
- **Auth:** Admin
- **Request:** `{ reseller_id?|user_id?, action: "approve"|"suspend"|"add_credits"|"update_profile"|"delete", credits?, name?, email?, whatsapp?, status? }`
- **Ações:**
  - `approve`: status = 'active', activation_fee_paid = true
  - `suspend`: status = 'suspended'
  - `add_credits`: incrementa credits + registra transação
  - `update_profile`: altera nome, email, whatsapp, status
  - `delete`: remove de `resellers` + `user_roles`

#### `admin-get-users` — Buscar emails de usuários por IDs
- **Auth:** Admin
- **Request:** `{ user_ids: string[] }`
- **Response:** `{ success, users: [{ id, email }] }`

---

### 4.2 Funções de Revendedor (6)

#### `reseller-dashboard` — Dashboard do revendedor
- **Auth:** Reseller
- **Response:** `{ credits, credits_used, credits_purchased, credits_granted }`

#### `reseller-create-license` — Criar licença (revendedor)
- **Auth:** Reseller
- **Request:** `{ user_name, email, phone?, license_type, days, lifetime }`
- **Lógica:** Verifica créditos, decrementa, cria licença com `reseller_id`.

#### `reseller-list-licenses` — Listar licenças do revendedor
- **Auth:** Reseller

#### `reseller-delete-license` — Excluir licença (revendedor)
- **Auth:** Reseller

#### `reseller-buy-credits` — Comprar créditos
- **Auth:** Reseller
- **Request:** `{ quantity, buyer_name, buyer_cpf, buyer_phone, buyer_email }`
- **Lógica:** Busca preço em `product_pricing`, cria PIX no MP, salva em `credit_purchases`.

#### `reseller-register` — Auto-cadastro de revendedor
- **Auth:** Nenhuma (público?)
- **Request:** `{ name, email, password, whatsapp }`
- **Lógica:** Cria user + `resellers` com status 'pending'.

---

### 4.3 Funções de Cliente Final (4)

#### `customer-create-payment` — Gerar PIX para plano
- **Auth:** User (JWT)
- **Request:** `{ product_slug }`
- **Lógica:** Busca produto, cria `customer_purchases`, chama MP, retorna QR code.

#### `customer-check-payment` — Polling de status
- **Auth:** User (JWT)
- **Request:** `{ payment_id }`
- **Response:** `{ status: "paid"|"pending"|"failed", license_key?, product_slug? }`
- **Lógica:** Verifica no banco, se pago retorna license_key.

#### `customer-webhook-mp` — Webhook MP (público)
- **Auth:** Nenhuma (verify_jwt = FALSE)
- **Lógica:** Recebe notificação MP, se `approved` → atualiza `customer_purchases`, gera license_key, salva em `ts_licenses`, preenche `customer_purchases.license_key`.

#### `user-create-trial` — Criar trial
- **Auth:** User (JWT)
- **Response:** `{ success, license_key, expires_at }`
- **Lógica:** Verifica `user_trials` (máx 1), cria trial de 30 min em `ts_licenses`, registra em `user_trials`.

---

### 4.4 Funções de Pagamento (3)

#### `mercadopago-webhook` — Webhook PIX (público)
- **Auth:** Nenhuma (verify_jwt = FALSE)
- **Lógica:** Recebe `data.id` do MP, busca status, se `approved` → atualiza `credit_purchases`, adiciona créditos ao revendedor, registra transação.

#### `check-payment-status` — Verificar status no MP
- **Auth:** Público (verify_jwt = FALSE)
- **Request:** `{ payment_id }`
- **Response:** `{ status, status_detail }`
- **Lógica:** Chama MP API direto.

#### `process-extension-payment` — Processar pagamento extensão
- **Auth:** ?
- **Lógica:** Processa pagamento de extensão.

---

### 4.5 Funções de Lovable/Projeto (3)

#### `create-lovable-project` — Criar projeto Lovable
- **Auth:** JWT
- **Request:** `{ license_key, token_lovable }`
- **Lógica:** Cria projeto no Lovable via API proxy. Rate limit: 5 req / 5 min.

#### `publish-project` — Publicar projeto Lovable
- **Auth:** JWT

#### `optimize-prompt` — Otimizar prompt
- **Auth:** JWT

---

### 4.6 Funções Utilitárias (3)

#### `upload-temp-image` — Upload de imagem temporária
- **Auth:** JWT
- **Lógica:** Upload para bucket `temp-images` com data como prefixo.

#### `remove-watermark` — Remover marca d'água
- **Auth:** JWT

#### `validate-license` — Validar licença (pública)
- **Auth:** Nenhuma (verify_jwt = FALSE)
- **Rate limit:** 20 req/min por IP
- **Request:** `{ license_key, device_id?, session_id?, heartbeat?: boolean }`
- **Response (válida):** `{ valid: true, message, session_id, user_name, expires_at, activated_at, status, license_type, lifetime, online_count }`
- **Response (inválida):** `{ valid: false, message, reason? }`
- **Lógica:** Busca chave, verifica expiração, se `heartbeat` atualiza `last_heartbeat`, gera `session_id`.

---

### 4.7 Mapeamento Frontend × Backend

As chamadas do frontend usam `FUNCTIONS` em `src/lib/supabase.ts`:

```typescript
export const FUNCTIONS = {
  LIST_LICENSES: '/functions/v1/admin-list-licenses',
  CREATE_LICENSE: '/functions/v1/admin-create-license',
  RESET_HWID: '/functions/v1/admin-reset-hwid',
  RENEW_LICENSE: '/functions/v1/admin-renew-license',
  REVOKE_LICENSE: '/functions/v1/admin-revoke-license',
  DELETE_LICENSE: '/functions/v1/admin-delete-license',
  CLEANUP_EXPIRED_TRIALS: '/functions/v1/admin-cleanup-expired-trials',
  ADMIN_CREATE_RESELLER: '/functions/v1/admin-create-reseller',
  ADMIN_MANAGE_RESELLER: '/functions/v1/admin-manage-reseller',
  ADMIN_LIST_CUSTOMERS: '/functions/v1/admin-list-customers',
  ADMIN_MANAGE_CUSTOMER: '/functions/v1/admin-manage-customer',
  RESELLER_DASHBOARD: '/functions/v1/reseller-dashboard',
  RESELLER_CREATE_LICENSE: '/functions/v1/reseller-create-license',
  RESELLER_LIST_LICENSES: '/functions/v1/reseller-list-licenses',
  RESELLER_BUY_CREDITS: '/functions/v1/reseller-buy-credits',
  RESELLER_DELETE_LICENSE: '/functions/v1/reseller-delete-license',
  USER_CREATE_TRIAL: '/functions/v1/user-create-trial',
  CUSTOMER_CREATE_PAYMENT: '/functions/v1/customer-create-payment',
  CUSTOMER_CHECK_PAYMENT: '/functions/v1/customer-check-payment',
}
```

**Funções não mapeadas no frontend (13):** `admin-get-users`, `admin-list-resellers`, `check-payment-status`, `create-lovable-project`, `customer-webhook-mp`, `mercadopago-webhook`, `optimize-prompt`, `process-extension-payment`, `publish-project`, `remove-watermark`, `reseller-register`, `upload-temp-image`, `validate-license`.

---

## 5. Autenticação e Autorização

### 5.1 Fluxo de Login

```
1. Usuário envia email + senha
2. supabase.auth.signInWithPassword() valida no GoTrue
3. Frontend busca role em user_roles
4. Redireciona baseado na role:
   - admin → /admin
   - reseller → /reseller
   - user → /user
```

### 5.2 Trigger de Role Automática

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 5.3 Protected Routes (Frontend)

```tsx
// src/App.tsx
<Routes>
  {/* Públicas */}
  <Route path="/" element={<Landing />} />
  <Route path="/login" element={<Login />} />
  <Route path="/signup" element={<Signup />} />
  <Route path="/checkout/:slug" element={<Checkout />} />

  {/* Usuário */}
  <Route path="/user" element={<ProtectedRoute role="user"><UserDashboard /></ProtectedRoute>} />

  {/* Admin */}
  <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
  <Route path="/admin/customers" element={<ProtectedRoute role="admin"><Customers /></ProtectedRoute>} />
  <Route path="/admin/resellers" element={<ProtectedRoute role="admin"><Resellers /></ProtectedRoute>} />
  <Route path="/admin/sales" element={<ProtectedRoute role="admin"><Sales /></ProtectedRoute>} />
  <Route path="/admin/products" element={<ProtectedRoute role="admin"><Products /></ProtectedRoute>} />
  <Route path="/admin/branding" element={<ProtectedRoute role="admin"><AdminBranding /></ProtectedRoute>} />
  <Route path="/admin/theme" element={<ProtectedRoute role="admin"><AdminTheme /></ProtectedRoute>} />
  <Route path="/admin/endcustomer-products" element={<ProtectedRoute role="admin"><EndcustomerProducts /></ProtectedRoute>} />
  <Route path="/admin/customer-purchases" element={<ProtectedRoute role="admin"><CustomerPurchases /></ProtectedRoute>} />

  {/* Revendedor */}
  <Route path="/reseller" element={<ProtectedRoute role="reseller"><ResellerDashboard /></ProtectedRoute>} />
  <Route path="/reseller/branding" element={<ProtectedRoute role="reseller"><ResellerBranding /></ProtectedRoute>} />
</Routes>
```

### 5.4 Verificação de Role nas Edge Functions

**Admin:**
```typescript
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const adminClient = createClient(supabaseUrl, serviceKey);
const token = authHeader.replace("Bearer ", "");
const { data: { user } } = await adminClient.auth.getUser(token);
const { data: roles } = await adminClient.from("user_roles")
  .select("role").eq("user_id", user.id).single();
if (roles?.role !== "admin") throw new Error("Forbidden");
```

**Reseller:**
```typescript
const { data: reseller } = await adminClient.from("resellers")
  .select("id, status").eq("user_id", user.id).single();
if (!reseller || reseller.status !== "active") throw new Error("Forbidden");
```

---

## 6. Pagamentos — Mercado Pago (PIX)

### 6.1 Credenciais

```
MP_ACCESS_TOKEN = APP_USR-1956464108264660-110212-c09d3e0e1b63035e401c8ff9a4a28955-173764383
```

### 6.2 Endpoints Utilizados

| Operação | Endpoint |
|----------|----------|
| Criar pagamento PIX | `POST https://api.mercadopago.com/v1/payments` |
| Consultar pagamento | `GET https://api.mercadopago.com/v1/payments/{id}` |

### 6.3 Payload de Criação de PIX

```json
{
  "transaction_amount": 29.90,
  "description": "Ultra Chat - Plano TRY 7",
  "payment_method_id": "pix",
  "payer": {
    "email": "cliente@email.com",
    "first_name": "Nome",
    "identification": { "type": "CPF", "number": "12345678900" }
  }
}
```

### 6.4 Webhooks

| Nome | Edge Function | Eventos processados | verify_jwt |
|------|--------------|--------------------|------------|
| Pagamento revendedor | `mercadopago-webhook` | Pagamento de créditos aprovados | **FALSE** |
| Pagamento cliente final | `customer-webhook-mp` | Pagamento de planos aprovados | **FALSE** |

> ⚠️ Ambos precisam de `verify_jwt = FALSE` configurado manualmente no Supabase Dashboard.

### 6.5 Processo de Pagamento (Cliente Final)

```
1. Cliente escolhe plano → /checkout/try-7
2. Se não logado → prompt "Criar conta" ou "Entrar"
3. Se logado → "Gerar Pix para pagamento"
4. Frontend chama customer-create-payment → cria customer_purchases + MP payment
5. MP retorna QR code → exibe na tela
6. Frontend faz polling a cada 5s via customer-check-payment
7. MP envia webhook → customer-webhook-mp processa
8. Webhook aprova → atualiza customer_purchases, gera license_key em ts_licenses
9. Polling detecta "paid" → redireciona para /user
10. /user mostra licença + compra no histórico
```

### 6.6 Processo de Compra de Créditos (Revendedor)

```
1. Revendedor escolhe quantidade e preenche dados
2. Frontend chama reseller-buy-credits
3. Cria credit_purchases + MP payment
4. MP retorna QR code
5. Webhook mercadopago-webhook processa aprovação
6. Atualiza credit_purchases + adiciona créditos em resellers.credits
```

---

## 7. Storage Buckets

### 7.1 `extension-releases` (Público)

| Propriedade | Valor |
|-------------|-------|
| Público | Sim |
| Tamanho máximo | 50 MB |
| MIME types | `application/zip`, `application/x-zip-compressed` |
| Upload | Apenas service_role |
| Leitura | Qualquer um |

### 7.2 `temp-images` (Público temporário)

| Propriedade | Valor |
|-------------|-------|
| Público | Sim |
| Tamanho máximo | 20 MB |
| MIME types | `image/jpeg`, `image/png`, `image/webp`, `image/gif` |
| Upload | Qualquer um (prefixo = data YYYY-MM-DD) |
| Leitura | Qualquer um |
| Delete | Apenas service_role |
| Cleanup | Função `cleanup_temp_images()` remove pastas anteriores |

### 7.3 `user-uploads` (Privado)

| Propriedade | Valor |
|-------------|-------|
| Público | Não |
| Tamanho máximo | 20 MB |
| MIME types | PDF, DOC, XLS, TXT, CSV, JSON, ZIP |
| Upload | Usuário no próprio diretório (`auth.uid()/...`) |
| Leitura | Apenas dono |
| Delete | Apenas dono |

---

## 8. Frontend — Telas e Fluxos

### 8.1 Estrutura de Arquivos

```
src/
├── App.tsx                        # Rotas + ProtectedRoute
├── lib/
│   └── supabase.ts               # Cliente Supabase + endpoints
├── hooks/
│   ├── useAuth.ts                 # Login, signup, role
│   ├── useLicenseActions.ts      # CRUD de licenças
│   ├── useTheme.ts               # Tema dark/light
│   └── useToast.tsx              # Notificações toast
├── pages/
│   ├── Landing.tsx                # Página inicial (marketing)
│   ├── Login.tsx                  # Login
│   ├── Signup.tsx                 # Cadastro
│   ├── Checkout.tsx               # Checkout PIX
│   ├── user/
│   │   └── Dashboard.tsx          # Dashboard do usuário
│   ├── reseller/
│   │   ├── Dashboard.tsx          # Dashboard revendedor
│   │   └── Branding.tsx           # Branding revendedor
│   └── admin/
│       ├── Dashboard.tsx          # Dashboard admin
│       ├── Customers.tsx          # Clientes finais
│       ├── Resellers.tsx          # Gerenciar revendedores
│       ├── Sales.tsx              # Vendas de créditos
│       ├── Products.tsx           # Tabela de preços
│       ├── Branding.tsx           # Branding admin
│       ├── Theme.tsx              # Personalizar tema
│       ├── EndcustomerProducts.tsx# Produtos para cliente final
│       └── CustomerPurchases.tsx  # Compras de clientes finais
├── components/
│   ├── AdminLayout.tsx            # Layout admin (sidebar + topbar)
│   ├── AdminSidebar.tsx           # Sidebar admin
│   ├── AdminTopbar.tsx            # Topbar admin
│   ├── ResellerLayout.tsx        # Layout revendedor
│   ├── ResellerSidebar.tsx       # Sidebar revendedor
│   ├── ResellerMobileMenu.tsx    # Menu mobile revendedor
│   ├── BrandingGenerator.tsx     # Gerador de branding
│   ├── ConfirmationDialog.tsx    # Modal de confirmação
│   ├── EmptyState.tsx            # Estado vazio
│   ├── FormField.tsx             # Campo de formulário
│   ├── LoadingOverlay.tsx        # Overlay de loading
│   ├── MobileMenu.tsx            # Menu mobile admin
│   ├── SalesChart.tsx            # Gráfico de vendas
│   ├── TemplateManager.tsx       # Gerenciador de templates
│   ├── ThemeCustomizer.tsx       # Customizador de tema
│   ├── ui/
│   │   ├── Logo.tsx              # Componente Logo
│   │   └── button.tsx            # Botão estilizado
│   └── landing/                  # Componentes da landing page
│       ├── AppMock.tsx
│       ├── ComparisonTable.tsx
│       ├── FAQ.tsx
│       ├── Features.tsx
│       ├── FinalCTA.tsx
│       ├── Footer.tsx
│       ├── Hero.tsx
│       ├── Navbar.tsx
│       ├── PainPoints.tsx
│       ├── Pricing.tsx
│       ├── PromoBar.tsx
│       ├── Reveal.tsx
│       ├── Steps.tsx
│       ├── Testimonials.tsx
│       └── WhatsAppFAB.tsx
└── utils/
    ├── format.ts                  # Formatação (WhatsApp, CPF, telefone)
    ├── brandingStorage.ts         # LocalStorage branding
    ├── templateStorage.ts         # LocalStorage templates
    └── extensionBuilder.ts        # Gerador ZIP extensão
```

### 8.2 Páginas Públicas

| Rota | Página | Descrição |
|------|--------|-----------|
| `/` | Landing | Hero, pain points, features, comparison table, pricing (TRY 7, ULTRA 15, ULTRA 30), steps, testimonials, FAQ, final CTA, footer, WhatsApp FAB |
| `/login` | Login | Formulário email + senha, link "Esqueci senha", link cadastro |
| `/signup` | Signup | Formulário nome, email, WhatsApp formatado, senha + confirmação |
| `/checkout/:slug` | Checkout | Exibe plano, se não logado oferece login/cadastro, se logado gera PIX e faz polling |

### 8.3 Páginas Protegidas

| Rota | Página | Funcionalidades |
|------|--------|-----------------|
| `/user` | UserDashboard | Licenças ativas, histórico de compras, criar trial, download extensão, planos disponíveis |
| `/admin` | AdminDashboard | Stats gerais, criar licença, tabela de licenças, ações (copiar/renovar/reset/revogar/excluir), métricas de receita |
| `/admin/customers` | Customers | Lista de clientes, editar perfil (nome/email/whatsapp), excluir |
| `/admin/resellers` | Resellers | CRUD revendedores, gerenciar créditos, aprovar/suspender |
| `/admin/sales` | Sales | Histórico de compras de créditos por revendedores |
| `/admin/products` | Products | Faixas de preço progressivas para revendedores |
| `/admin/endcustomer-products` | EndcustomerProducts | CRUD de planos (TRY 7, ULTRA 15, ULTRA 30) |
| `/admin/customer-purchases` | CustomerPurchases | Histórico de compras de clientes finais |
| `/admin/branding` | AdminBranding | Configurar branding da extensão (logo, cores, WhatsApp, comunidade) |
| `/admin/theme` | AdminTheme | Personalizar cores do tema |
| `/reseller` | ResellerDashboard | Créditos disponíveis, criar licenças, comprar créditos, lista de licenças criadas |
| `/reseller/branding` | ResellerBranding | Branding personalizado do revendedor |

### 8.4 Fluxo de Venda Direta (Cliente Final)

```
Landing → Escolhe plano → /checkout/:slug
  → Não logado? → Prompt "Criar conta grátis" ou "Entrar"
  → Logado? → "Gerar Pix"
  → customer-create-payment → QR code PIX
  → Polling a cada 5s via customer-check-payment
  → Webhook aprova → license_key gerada
  → Polling detecta "paid" → redireciona para /user
```

### 8.5 Fluxo de Revenda

```
Admin cria revendedor → envia email+senha
Revendedor faz login → /reseller
  → Compra créditos via PIX (reseller-buy-credits)
  → Usa créditos para gerar licenças (reseller-create-license)
  → Acompanha licenças e créditos no dashboard
```

### 8.6 Fluxo de Trial

```
Usuário logado → /user → "Criar Trial Gratuito"
  → user-create-trial → verifica user_trials
  → Cria licença trial de 30 min
  → Trials expiram e são limpas pelo pg_cron (a cada 5 min)
```

### 8.7 Fluxo de Validação de Licença (Extensão)

```
Extensão → POST /functions/v1/validate-license
  → Envia license_key + device_id
  → Edge function valida existência, status, expires_at
  → Se heartbeat=true, atualiza last_heartbeat
  → Retorna { valid: boolean, session_id, user_name, ... }
  → Extensão envia heartbeats periódicos
```

---

## 9. Hooks e Utilitários

### 9.1 `useAuth.ts`
```typescript
// Retorna:
user: User | null       // Usuário atual
role: 'admin' | 'reseller' | 'user' | null
loading: boolean

// Métodos:
signIn(email: string, password: string): Promise<void>
signUp(email: string, password: string, options?: { data: { name, whatsapp }}): Promise<void>
signOut(): void
resetPassword(email: string): Promise<void>
```

**Lógica:** Escuta `onAuthStateChange`, após login busca `user_roles` via `supabase.from('user_roles').select('role').eq('user_id', user.id).single()`.

### 9.2 `useLicenseActions.ts`
```typescript
copyLicenseKey(licenseKey: string): Promise<void>  // Copia para clipboard
renewLicense(licenseKey: string, days: number): Promise<void>
resetHwid(licenseKey: string): Promise<void>
revokeLicense(licenseKey: string, reason: string): Promise<void>
deleteLicense(licenseKey: string): Promise<void>
submitMutation(element: string, callback: () => Promise<any>): Promise<void>  // Wrapper loading
```

### 9.3 `useTheme.ts`
```typescript
theme: 'dark' | 'light'
toggleTheme(): void  // Alterna + persiste no localStorage
```

### 9.4 `useToast.tsx`
```typescript
showToast(message: string, type: 'success' | 'error' | 'info'): void
```

### 9.5 `format.ts`
```typescript
formatWhatsApp(value: string): string  // Formata (11) 9 9999-9999
cleanDigits(value: string): string     // Remove \D
```

### 9.6 `brandingStorage.ts`
```typescript
saveBrandingConfig(config: BrandingConfig): void  // localStorage
loadBrandingConfig(): BrandingConfig | null        // localStorage
```

### 9.7 `templateStorage.ts`
```typescript
saveTemplate(template: TemplateConfig): void
getStoredTemplate(): TemplateConfig | null
```

### 9.8 `extensionBuilder.ts`
```typescript
generateExtensionZip(config: BrandingConfig, templateBlob: Blob): Promise<Blob>  // Gera ZIP
downloadZip(blob: Blob, filename: string): void  // Dispara download
```

---

## 10. Variáveis de Ambiente

### Frontend (Vite)

| Variável | Valor (dev/produção) | Onde é usada |
|----------|---------------------|-------------|
| `VITE_SUPABASE_URL` | `https://rkntjizbuusaozipvaqm.supabase.co` | `src/lib/supabase.ts` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | `src/lib/supabase.ts` |
| `VITE_TEMPLATE_URL` | (não definido) | `BrandingGenerator.tsx` |

### Edge Functions (Deno)

| Variável | Onde é usada |
|----------|-------------|
| `SUPABASE_URL` | Todas as edge functions |
| `SUPABASE_SERVICE_ROLE_KEY` | Todas as edge functions |
| `SUPABASE_ANON_KEY` | `admin-create-license`, `admin-list-licenses` |
| `MP_ACCESS_TOKEN` | `customer-create-payment`, `reseller-buy-credits`, `mercadopago-webhook`, `customer-webhook-mp`, `check-payment-status` |

---

## 11. RLS Policies

### `ts_licenses`
- `Users can view own licenses`: `auth.uid() = user_id`
- `Service role can insert licenses`: `auth.jwt()->>'role' = 'service_role'`
- `Service role can update licenses`: `auth.jwt()->>'role' = 'service_role'`
- `Resellers see own licenses`: `reseller_id IN (SELECT id FROM resellers WHERE user_id = auth.uid())`

### `user_roles`
- `Users can view own roles`: `auth.uid() = user_id`

### `resellers`
- `Resellers see own data`: `user_id = auth.uid()`
- `Admins see all resellers`: `EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')`

### `reseller_credit_transactions`
- `Resellers see own transactions`: `reseller_id IN (SELECT id FROM resellers WHERE user_id = auth.uid())`
- `Admins see all transactions`: admin check

### `reseller_activation_payments`
- `Resellers see own activation`: `reseller_id IN (SELECT id FROM resellers WHERE user_id = auth.uid())`
- `Admins see all activations`: admin check

### `credit_purchases`
- `Revendedores podem ver suas compras`: `reseller_id = auth.uid() AND role = 'reseller'`
- `Admin pode ver todas as compras`: admin check
- `Sistema pode inserir compras`: `reseller_id = auth.uid()` (INSERT)
- `Sistema pode atualizar compras`: `reseller_id = auth.uid()` (UPDATE)

### `reseller_credits_log`
- `Admin pode ver log de créditos`: admin check
- `Admin pode inserir log`: admin check

### `product_pricing`
- `Todos podem ver preços ativos`: `is_active = TRUE`
- `Admin pode gerenciar preços`: admin check

### `products_endcustomer`
- `admin_all_products_endcustomer`: admin check (FOR ALL)
- `users_view_active_products`: `active = TRUE` (SELECT only)

### `customer_purchases`
- `user_own_customer_purchases`: `user_id = auth.uid()` (FOR ALL)
- `admin_all_customer_purchases`: admin check (SELECT only)

### `user_trials`
- `Users see own trial status`: `user_id = auth.uid()`
- `Service role manage trials`: `true` (FOR ALL)

### `notifications`
- `Public can read active notifications`: `is_active = TRUE AND (expires_at IS NULL OR expires_at > NOW())`
- `Service role can manage notifications`: service_role (FOR ALL)

### `packages` (legado)
- `Public can read active packages`: `is_active = TRUE`
- `Service role can manage packages`: service_role

### `payment_transactions` (legado)
- `Service role can manage transactions`: service_role

### `extension_versions`
- `Public can read active version alerts`: `is_alert_active = TRUE`

### `admin_audit_logs`
- `Admins can read audit logs`: admin check

---

## 12. Perguntas Abertas

- [ ] **MP token expirado?** Verificar validade do token de produção `APP_USR-1956464108264660-110212-c09d3e0e1b63035e401c8ff9a4a28955-173764383`
- [ ] **Verify JWT = FALSE** deve ser configurado manualmente no Dashboard Supabase para `customer-webhook-mp` e `mercadopago-webhook`
- [ ] **Idempotência de webhooks:** Garantir que múltiplas notificações do mesmo pagamento não gerem duplicatas
- [ ] **Notificação por email** após pagamento aprovado — ainda não implementada
- [ ] **Reembolso/cancelamento:** Webhooks de reembolso não tratam desativação de licença
- [ ] **13 funções não mapeadas** no frontend (`FUNCTIONS` em `supabase.ts`): possivelmente legadas ou chamadas externamente

---

> **Projeto:** Ultra Chat — Painel de Licenciamento  
> **Frontend:** React + Vite + TypeScript + Tailwind  
> **Backend:** Supabase (PostgreSQL + Edge Functions + Auth + Storage)  
> **Pagamentos:** Mercado Pago PIX
