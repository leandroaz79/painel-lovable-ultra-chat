# ULTRA CHAT — PROMPT COMPLETO DO SISTEMA

> **Propósito:** Este documento é a fonte de verdade única sobre todo o sistema Ultra Chat. Use este prompt para instruir outra IA ou desenvolvedor a reconstruir, manter ou integrar qualquer parte do sistema.

---

## INSTRUÇÃO GERAL

Você é um desenvolvedor full-stack encarregado de reconstruir ou manter o sistema **Ultra Chat**. Abaixo está a especificação completa do sistema. Siga exatamente as regras de negócio, fluxos, telas e integrações descritas. Qualquer desvio deve ser perguntado antes de implementar.

---

## 1. VISÃO GERAL DO SISTEMA

Ultra Chat é uma plataforma de licenciamento com três painéis:
- **Cliente Final** — Compra planos via PIX, ativa licenças, cria trial
- **Revendedor** — Compra créditos em lote, cria licenças para clientes
- **Administrador** — Controle total: licenças, clientes, revendedores, preços, branding, produtos

A stack obrigatória é: **React + Vite + TypeScript + Tailwind** (frontend), **Supabase** (backend: PostgreSQL + Edge Functions + Auth + Storage), **Mercado Pago PIX** (pagamentos).

---

## 2. REGRAS DE NEGÓCIO FUNDAMENTAIS

### 2.1 Licenças
- Cada licença tem uma `license_key` única (formato `TS-XXXX...` ou `TRIAL-XXXX...` ou `ULTRA-XXXX...`)
- Status possíveis: `active`, `expired`, `suspended`, `trial`
- Tipos possíveis: `trial`, `paid`, `lifetime`
- Licenças têm `expires_at`, `device_id` (HWID), `session_id`, `last_heartbeat`
- Só pode haver 1 dispositivo ativo por licença (via `device_id`)
- Resets de HWID são permitidos (zera device_id)

### 2.2 Revendedores
- Status possíveis: `pending`, `active`, `suspended`
- Precisam de taxa de ativação (R$ 300) para ficarem ativos
- Trabalham com sistema de créditos
- Cada licença criada por revendedor consome 1 crédito
- Créditos são comprados via PIX ou dados manualmente pelo admin
- Faixas de preço progressivas para créditos

### 2.3 Clientes Finais
- Se cadastram via signup
- Podem criar 1 trial gratuito de 30 minutos
- Compram planos via PIX
- Planos disponíveis: TRY 7 (R$29,90/7dias/1disp), ULTRA 15 (R$49,90/15dias/2disp), ULTRA 30 (R$79,90/30dias/2disp)

### 2.4 Validação de Licença (Extensão)
- Endpoint público validate-license
- Rate limit: 20 req/min/IP
- Pode receber heartbeat para manter sessão ativa
- Gera session_id único por ativação

---

## 3. TELAS E FLUXOS COMPLETOS

### 3.1 LANDING PAGE (`/`)
**Componentes (15):**
- `PromoBar` — Barra promocional no topo
- `Navbar` — Navegação com links para Login, Preços
- `Hero` — Título, subtítulo, CTA "Começar Gratuitamente"
- `PainPoints` — Seção de dores do cliente
- `Features` — Funcionalidades do produto
- `ComparisonTable` — Tabela comparativa
- `Pricing` — Cards dos 3 planos (TRY 7, ULTRA 15, ULTRA 30) com preços, features e CTA "Assinar Agora"
- `Steps` — Passos para começar
- `Testimonials` — Depoimentos
- `FAQ` — Perguntas frequentes (acordeão)
- `FinalCTA` — Última chamada para ação
- `Footer` — Rodapé
- `WhatsAppFAB` — Botão flutuante do WhatsApp
- `AppMock` — Mockup do aplicativo
- `Reveal` — Animação de revelar ao scroll

**Regras:**
- Ao clicar "Assinar Agora" em qualquer plano → redirecionar para `/checkout/:slug`
- Se usuário não estiver logado, mostrar modal/prompt para criar conta ou entrar

### 3.2 LOGIN (`/login`)
- Formulário: email + senha
- Link "Esqueceu sua senha?"
- Link para `/signup`
- Após login: verificar role do usuário e redirecionar:
  - `admin` → `/admin`
  - `reseller` → `/reseller`
  - `user` → `/user`

### 3.3 SIGNUP (`/signup`)
- Campos: nome completo, email, WhatsApp (formatado automaticamente `(XX) 9 XXXX-XXXX`), senha, confirmar senha
- Ao criar conta: `supabase.auth.signUp()` + trigger SQL insere role 'user' em `user_roles`
- Após cadastro: redirecionar para login ou já autenticar

### 3.4 CHECKOUT (`/checkout/:slug`)
- Exibe detalhes do plano (nome, descrição, dias, dispositivos, suporte prioritário, preço)
- Se usuário NÃO está logado:
  - Mostrar mensagem "Crie uma conta grátis para continuar" + botão Cadastrar
  - Mostrar "Já tem conta? Faça login" + botão Entrar
- Se usuário está logado:
  - Botão "Gerar Pix para pagamento"
  - Ao clicar: chamar `customer-create-payment`
  - Exibir QR Code PIX (imagem + código copia-e-cola)
  - Iniciar polling a cada 5 segundos via `customer-check-payment`
  - Quando status = "paid" → redirecionar para `/user`
  - Se status = "expired" → mostrar botão "Gerar novo Pix"

### 3.5 PAINEL DO CLIENTE (`/user`) — Dashboard
**O que mostra:**
1. **Licenças ativas do usuário**
   - Tabela/cards com: license_key, status, tipo, ativação, expiração, dispositivo
   - Botão copiar license_key
2. **Histórico de compras** (`customer_purchases`)
   - Produto, valor, status do pagamento, data, license_key vinculada
3. **Criação de Trial**
   - Botão "Criar Trial Gratuito" (desabilitado se já usou)
   - Ao criar: chamar `user-create-trial`
   - Exibir license_key gerada + tempo restante (30 min)
4. **Download da Extensão**
   - Link para download do ZIP da extensão
5. **Planos Disponíveis**
   - Cards dos 3 planos com link para `/checkout/:slug`

### 3.6 PAINEL DO ADMIN (`/admin`) — Dashboard
**Layout:** Sidebar + Topbar + Conteúdo

**Sidebar contém:**
- Dashboard (visão geral)
- Licenças
- Clientes
- Revendedores
- Vendas
- Produtos
- Preços (tabela de preços)
- Compras de Clientes
- Branding
- Tema
- Sair

**Página Dashboard `/admin`:**
- Cards de estatísticas: Total de licenças, Ativas, Trial, Expiradas, Suspensas, Vitalícias
- Botão "Nova Licença" → modal/form para criar
- Botão "Limpar Trials Expiradas"
- Tabela de licenças com colunas: license_key (copiável), cliente, email, status (badge colorido), tipo, ativação, expiração, dispositivo, ações
- Ações por licença: Copiar, Renovar, Resetar HWID, Revogar, Excluir (com confirmação)
- Filtros: busca por texto, filtro por status (todos/ativos/trial/expirados/suspensos)

**Página Clientes `/admin/customers`:**
- Tabela: nome, email, WhatsApp, data cadastro, total de licenças, ativas, trial, expiradas
- Ações: Editar perfil (nome/email/whatsapp), Excluir conta (com confirmação)
- Paginação (10 por página)

**Página Revendedores `/admin/resellers`:**
- Tabela: nome, email, WhatsApp, status (badge), créditos, licenças criadas, data cadastro
- Botão "Novo Revendedor" → modal: nome, email, WhatsApp, senha, créditos iniciais
- Ações por revendedor:
  - Aprovar (se pending → active)
  - Suspender (active → suspended)
  - Editar perfil (nome, email, WhatsApp, status)
  - Gerenciar créditos (adicionar/remover com motivo)
  - Excluir

**Página Vendas `/admin/sales`:**
- Histórico de compras de créditos: data, revendedor (nome + email), quantidade, valor, status do pagamento

**Página Produtos `/admin/products` (Tabela de Preços):**
- Faixas de preço para créditos de revendedores:
  - 1–9: R$ 30,00/un (0% desc)
  - 10–19: R$ 25,00/un (17% desc)
  - 20–29: R$ 20,00/un (33% desc)
  - 30+: R$ 15,00/un (50% desc)
- CRUD de faixas (min, max, preço unitário, % desconto, ativo)

**Página Produtos Cliente Final `/admin/endcustomer-products`:**
- CRUD dos planos: nome, slug, descrição, dias, preço (em centavos), dispositivos, suporte prioritário, ativo, ordem
- Seed inicial: TRY 7, ULTRA 15, ULTRA 30

**Página Compras de Clientes `/admin/customer-purchases`:**
- Histórico: data, cliente (nome/email), produto, valor, status, license_key gerada

**Página Branding `/admin/branding`:**
- Configurar branding da extensão: nome empresa, cor primária, cor secundária, logo (upload), ícone (upload), WhatsApp, link comunidade
- Upload de imagens para `temp-images`
- Gerar ZIP da extensão com branding personalizado

**Página Tema `/admin/theme`:**
- Customização de cores do tema (light/dark)
- Ajustes em tempo real (exemplo visual)

### 3.7 PAINEL DO REVENDEDOR (`/reseller`) — Dashboard
**Layout:** Sidebar + Conteúdo

**Sidebar:**
- Dashboard
- Branding
- Sair

**Página Dashboard `/reseller`:**
- Cards: Créditos disponíveis, Créditos usados, Créditos comprados, Créditos concedidos (admin)
- Botão "Criar Licença" → modal: nome, email, telefone, tipo (pago/vitalício), dias
  - Se tipo "pago": consome 1 crédito
  - Se tipo "vitalício": consome 1 crédito (não tem expiração)
  - Se não tem créditos: bloquear com mensagem
- Botão "Comprar Créditos" → modal/exibe cálculo:
  - Selecionar quantidade
  - Mostrar preço baseado na faixa (`product_pricing`)
  - Preencher dados do comprador (nome, CPF, telefone, email)
  - Gerar PIX via `reseller-buy-credits`
  - Exibir QR Code + polling
- Tabela de licenças criadas: license_key, cliente, status, tipo, expiração, ações (copiar, renovar, reset HWID, revogar, excluir)

**Página Branding `/reseller/branding`:**
- Mesma lógica do branding admin, mas para o revendedor

---

## 4. EDGE FUNCTIONS (COMPLETO)

Todas as 32 funções. Devem ser implementadas em **TypeScript/Deno**.

### 4.1 ADMIN (13 funções)

#### `admin-list-licenses`
- **Auth:** admin
- **Método:** POST
- **Request:** `{ limit?: number }`
- **Lógica:**
  - Extrai token JWT do header Authorization
  - Cria cliente Supabase com SERVICE_ROLE_KEY
  - Verifica se user.role === 'admin' em user_roles
  - Busca `ts_licenses` WHERE `reseller_id IS NULL`, ORDER created_at DESC, LIMIT limit
  - Calcula stats (total, active, expired, suspended, trial, lifetime)
- **Response:** `{ success, licenses: [...], stats }`

#### `admin-create-license`
- **Auth:** admin
- **Método:** POST
- **Request:** `{ user_name?, email?, phone?, license_type: "paid"|"lifetime"|"trial", days?: number, lifetime?: boolean, trial_minutes?: number }`
- **Lógica:**
  - Gera license_key via `crypto.getRandomValues` → `TS-${hex}`
  - Se trial: expires_at = now + trial_minutes (máx 30), status = 'trial'
  - Se lifetime: expires_at = null, status = 'active'
  - Se paid: expires_at = now + days, status = 'active'
  - Insere em `ts_licenses`
  - Registra em `admin_audit_logs`
- **Response:** `{ success, license, license_key }`

#### `admin-delete-license`
- **Auth:** admin
- **Request:** `{ license_key }`
- **Lógica:** DELETE ts_licenses WHERE license_key, audita

#### `admin-renew-license`
- **Auth:** admin OU reseller
- **Request:** `{ license_key, days?: number }`
- **Lógica:**
  - Se reseller: verifica se a licença pertence ao reseller
  - Se trial: rejeita (trials não podem ser renovadas)
  - UPDATE ts_licenses SET status = 'active', expires_at = now + days
  - audita
- **Response:** `{ success, data: { license_key, expires_at } }`

#### `admin-reset-hwid`
- **Auth:** admin OU reseller
- **Request:** `{ license_key }`
- **Lógica:** UPDATE ts_licenses SET device_id = NULL WHERE license_key

#### `admin-revoke-license`
- **Auth:** admin OU reseller
- **Request:** `{ license_key }`
- **Lógica:** UPDATE ts_licenses SET status = 'suspended' WHERE license_key

#### `admin-cleanup-expired-trials`
- **Auth:** admin
- **Lógica:** DELETE FROM ts_licenses WHERE license_type = 'trial' AND expires_at < now() - 3 minutes

#### `admin-list-customers`
- **Auth:** admin
- **Request:** `{ page, pageSize }`
- **Lógica:**
  - Lista todos os `auth.users`
  - Exclui admins e resellers (por user_roles)
  - Para cada user: busca licenças, trials
  - Monta objeto com nome (user_metadata.name), whatsapp (user_metadata.whatsapp), email
  - Paginação
- **Response:** `{ success, customers: [...], total, page, pageSize, totalPages }`

#### `admin-manage-customer`
- **Auth:** admin
- **Request:** `{ user_id, action: "update_profile"|"delete", name?, email?, whatsapp? }`
- **Lógica:**
  - `update_profile`: atualiza `auth.users` (email + user_metadata), atualiza `ts_licenses` com novo nome/email
  - `delete`: deleta `auth.users` (CASCADE deleta resto)
  - audita

#### `admin-list-resellers`
- **Auth:** admin
- **Lógica:** SELECT * FROM resellers + busca email em auth.users
- **Response:** `{ success, resellers: [...], total }`

#### `admin-create-reseller`
- **Auth:** admin
- **Request:** `{ name, email, whatsapp?, password, initial_credits?, status? }`
- **Lógica:**
  - Verifica se email já existe; se sim, reusa user_id
  - Se não: cria em `auth.users` com email_confirm = true
  - Insere em `resellers` (user_id, name, whatsapp, status, credits)
  - Insere em `user_roles` com role = 'reseller'
  - audita
- **Response:** `{ success, reseller, message }`

#### `admin-manage-reseller`
- **Auth:** admin
- **Request:** `{ reseller_id?|user_id?, action: "approve"|"suspend"|"add_credits"|"update_profile"|"delete", credits?, name?, email?, whatsapp?, status? }`
- **Lógica:**
  - `approve`: status='active', activation_fee_paid=true
  - `suspend`: status='suspended'
  - `add_credits`: credits += amount, registra em `reseller_credit_transactions`
  - `update_profile`: atualiza name, email (no auth.user também), whatsapp, status
  - `delete`: deleta de resellers + user_roles

#### `admin-get-users`
- **Auth:** admin
- **Request:** `{ user_ids: string[] }`
- **Lógica:** Busca emails de auth.users por IDs
- **Response:** `{ success, users: [{ id, email }] }`

### 4.2 REVENDEDOR (6 funções)

#### `reseller-dashboard`
- **Auth:** reseller
- **Lógica:** Busca reseller por user_id, retorna credits, total_licenses_created, total_credits_purchased
- **Response:** `{ success, credits, credits_used, credits_purchased, credits_granted }`

#### `reseller-create-license`
- **Auth:** reseller
- **Request:** `{ user_name, email, phone?, license_type: "paid"|"lifetime", days?, lifetime? }`
- **Lógica:**
  - Verifica se reseller tem credits > 0
  - Decrementa 1 crédito
  - Cria licença com reseller_id
  - Se não tiver créditos: erro 400 "Créditos insuficientes"
  - (O trigger `consume_reseller_credit` no banco também faz essa verificação)

#### `reseller-list-licenses`
- **Auth:** reseller
- **Lógica:** SELECT * FROM ts_licenses WHERE reseller_id = (SELECT id FROM resellers WHERE user_id = ?)

#### `reseller-delete-license`
- **Auth:** reseller
- **Lógica:** DELETE FROM ts_licenses WHERE license_key AND reseller_id = ?

#### `reseller-buy-credits`
- **Auth:** reseller
- **Request:** `{ quantity, buyer_name, buyer_cpf, buyer_phone, buyer_email }`
- **Lógica:**
  - Busca preço em `product_pricing` baseado na quantidade
  - Calcula total = quantity * unit_price
  - Cria pagamento no Mercado Pago (PIX)
  - Salva em `credit_purchases` com status 'pending'
- **Response:** `{ success, payment_id, pix: { qr_code, qr_code_base64, ticket_url } }`

#### `reseller-register`
- **Auth:** público
- **Request:** `{ name, email, password, whatsapp }`
- **Lógica:** Cria user + reseller com status 'pending'

### 4.3 CLIENTE FINAL (4 funções)

#### `customer-create-payment`
- **Auth:** user
- **Request:** `{ product_slug }`
- **Lógica:**
  - Busca `products_endcustomer` por slug (WHERE active = true)
  - Cria `customer_purchases` com status 'pending'
  - Chama Mercado Pago: POST /v1/payments
  - Retorna QR code + payment_id
- **Response:** `{ success, payment_id, product, pix: { qr_code, qr_code_base64, ticket_url } }`

#### `customer-check-payment`
- **Auth:** user
- **Request:** `{ payment_id }`
- **Lógica:** Busca `customer_purchases` por payment_id, retorna status + license_key (se aprovado)

#### `customer-webhook-mp`
- **Auth:** NENHUMA (verify_jwt = FALSE)
- **Lógica:**
  - Recebe `{ action, data: { id } }` do Mercado Pago
  - Chama GET /v1/payments/{id} no MP
  - Se status = 'approved':
    - Atualiza `customer_purchases` SET payment_status='approved', approved_at=now()
    - Gera license_key (ex: `ULTRA-XXXX1234XXXX`)
    - Cria em `ts_licenses` com status 'active', baseado nos dias/products_endcustomer
    - Devolve crédito se foi compra de revendedor? Não, isso é outra função

#### `user-create-trial`
- **Auth:** user
- **Lógica:**
  - Verifica `user_trials` para o user_id
  - Se já usou: erro "Trial já utilizado"
  - Cria `ts_licenses` com tipo trial, 30 min de expiração
  - Registra em `user_trials`
- **Response:** `{ success, license_key, expires_at }`

### 4.4 PAGAMENTO (3 funções)

#### `mercadopago-webhook`
- **Auth:** NENHUMA (verify_jwt = FALSE)
- **Lógica:**
  - Recebe notificação MP com payment_id
  - Consulta MP: GET /v1/payments/{payment_id}
  - Se status = 'approved':
    - Busca `credit_purchases` por payment_id
    - Atualiza status = 'approved', approved_at = now()
    - Atualiza `resellers` SET credits += quantity
    - Registra transação em `reseller_credit_transactions`

#### `check-payment-status`
- **Auth:** público
- **Request:** `{ payment_id }`
- **Lógica:** Chama MP API direto, retorna status
- **Response:** `{ success, status, status_detail }`

#### `process-extension-payment`
- **Auth:** ?
- Processa pagamento de extensão (detalhes a verificar)

### 4.5 LOVABLE/PROJETO (3 funções)

#### `create-lovable-project`
- **Auth:** JWT
- **Request:** `{ license_key, token_lovable }`
- **Lógica:** Cria projeto no Lovable via API proxy. Rate limit: 5 req / 5 min.

#### `publish-project`
- Publica projeto Lovable

#### `optimize-prompt`
- Otimiza prompt via IA

### 4.6 UTILITÁRIAS (3 funções)

#### `upload-temp-image`
- **Auth:** JWT
- Upload para bucket `temp-images` com prefixo de data

#### `remove-watermark`
- Remove marca d'água de imagens

#### `validate-license`
- **Auth:** NENHUMA (verify_jwt = FALSE)
- **Rate limit:** 20 req/min/IP
- **Request:** `{ license_key, device_id?, session_id?, heartbeat?: boolean }`
- **Lógica:**
  - Busca license_key em `ts_licenses`
  - Se não encontrada → `{ valid: false, message: "Licença não encontrada" }`
  - Se expirada → atualiza status='expired' → `{ valid: false, message: "Licença expirada", reason: "expired" }`
  - Se suspended → `{ valid: false, message: "Licença suspensa", reason: "suspended" }`
  - Se heartbeat=true → atualiza `last_heartbeat`
  - Se novo device_id e device_id atual é null → ativa
  - Gera session_id via `crypto.randomUUID()`
- **Response (sucesso):** `{ valid: true, message, session_id, user_name, expires_at, activated_at, status, license_type, lifetime, online_count }`

---

## 5. BANCO DE DADOS (ESQUEMA COMPLETO)

### 5.1 Tabelas (18)

```
ts_licenses              → Licenças do sistema
user_roles               → Papéis (user, reseller, admin)
resellers                → Revendedores (créditos, status)
reseller_credit_transactions → Transações de créditos
reseller_activation_payments → Taxa de ativação R$300
credit_purchases         → Compras de créditos (MP)
reseller_credits_log     → Log de alterações manuais
product_pricing          → Faixas de preço
product_pricing_history  → Histórico de alterações de preços
products_endcustomer     → Planos para cliente final
customer_purchases       → Compras de clientes
admin_audit_logs         → Auditoria admin
notifications            → Notificações
packages                 → Planos (LEGADO)
user_trials              → Controle de trial
payment_transactions     → Transações M-Pesa (LEGADO)
extension_versions       → Versões da extensão
branding_files           → Arquivos de branding
branding_templates       → Templates de branding
```

### 5.2 Trigger Essencial

```sql
-- Role automática para novos usuários
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 5.3 Trigger Consumo de Crédito

```sql
CREATE OR REPLACE FUNCTION consume_reseller_credit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reseller_id IS NULL THEN RETURN NEW; END IF;
  IF NEW.license_type = 'trial' THEN RETURN NEW; END IF;

  -- Verifica saldo
  SELECT credits INTO v_credits FROM resellers WHERE id = NEW.reseller_id FOR UPDATE;
  IF v_credits < 1 THEN RAISE EXCEPTION 'Créditos insuficientes'; END IF;

  -- Consome 1 crédito
  UPDATE resellers SET credits = credits - 1, total_licenses_created = total_licenses_created + 1
  WHERE id = NEW.reseller_id;

  INSERT INTO reseller_credit_transactions (reseller_id, type, amount, license_key)
  VALUES (NEW.reseller_id, 'consume', -1, NEW.license_key);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 6. AUTENTICAÇÃO

### 6.1 Fluxo
1. SignUp via `supabase.auth.signUp()` → trigger insere role='user'
2. SignIn via `supabase.auth.signInWithPassword()` → frontend busca role em `user_roles`
3. Redireciona baseado na role (`/user`, `/admin`, `/reseller`)
4. Edge functions verificam token JWT + user_roles

### 6.2 ProtectedRoute (Frontend)
```tsx
<ProtectedRoute role="admin">
  <AdminDashboard />
</ProtectedRoute>
```
- Verifica se user existe e role corresponde
- Se não autenticado → redireciona `/login`
- Se role não corresponde → redireciona `/` ou mostra "Acesso negado"

---

## 7. MERCADO PAGO — PIX

### 7.1 Credenciais
```
ACCESS_TOKEN = APP_USR-1956464108264660-110212-c09d3e0e1b63035e401c8ff9a4a28955-173764383
```

### 7.2 Endpoints
- Criar: `POST https://api.mercadopago.com/v1/payments`
- Consultar: `GET https://api.mercadopago.com/v1/payments/{id}`

### 7.3 Payload de Criação
```json
{
  "transaction_amount": 29.90,
  "description": "Ultra Chat - Plano TRY 7",
  "payment_method_id": "pix",
  "payer": { "email": "cliente@email.com" }
}
```

### 7.4 Webhooks
| Webhook | Edge Function | verify_jwt |
|---------|--------------|------------|
| Pagamento créditos (revendedor) | mercadopago-webhook | FALSE |
| Pagamento planos (cliente final) | customer-webhook-mp | FALSE |

---

## 8. STORAGE BUCKETS

### 8.1 extension-releases (Público, 50MB, ZIP)
### 8.2 temp-images (Público, 20MB, imagens, prefixo = data)
### 8.3 user-uploads (Privado, 20MB, documentos, prefixo = user_id)

---

## 9. HOOKS FRONTEND

### useAuth
```typescript
user: User | null
role: 'admin' | 'reseller' | 'user' | null
loading: boolean
signIn(email, password): Promise
signUp(email, password, options?): Promise
signOut(): void
```

### useLicenseActions
```typescript
copyLicenseKey(key: string): void
renewLicense(key: string, days: number): Promise
resetHwid(key: string): Promise
revokeLicense(key: string, reason: string): Promise
deleteLicense(key: string): Promise
submitMutation(element: string, callback: Function): Promise
```

### useTheme
```typescript
theme: 'dark' | 'light'
toggleTheme(): void
```

### useToast
```typescript
showToast(message: string, type: 'success' | 'error' | 'info'): void
```

---

## 10. SUPABASE CLIENT (src/lib/supabase.ts)

```typescript
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

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

---

## 11. VARIÁVEIS DE AMBIENTE

### Frontend (.env)
```
VITE_SUPABASE_URL=https://rkntjizbuusaozipvaqm.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Edge Functions (Deno env vars)
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ANON_KEY=
MP_ACCESS_TOKEN=APP_USR-1956464108264660-110212-c09d3e0e1b63035e401c8ff9a4a28955-173764383
```

---

## 12. REGRAS DE CONSTRUÇÃO

1. **Todas as páginas devem ser responsivas** (mobile-first)
2. **Tema escuro e claro** suportados (useTheme)
3. **Todos os formulários devem validar** antes de enviar
4. **Todas as ações destrutivas** devem ter confirmação (ConfirmationDialog)
5. **Loading states** em todas as chamadas de API (LoadingOverlay)
6. **Toasts** para feedback ao usuário (useToast)
7. **Badges coloridos** para status (ex: active=verde, expired=vermelho, suspended=amarelo)
8. **Copiar license_key** com feedback visual
9. **Tabelas com paginação** para listas grandes
10. **Sidebar responsiva** com mobile menu
11. **Formatar WhatsApp** automaticamente `(XX) 9 XXXX-XXXX`
12. **Preços em centavos** no banco, converter para reais na exibição



---

> **Gerado em:** Junho 2026  
> **Projeto:** Ultra Chat — Painel de Licenciamento  
> **Stack:** React + Vite + TypeScript + Tailwind + Supabase + Mercado Pago
