# Documentação Técnica Completa — Painel Ultra Chat

> **Versão do documento:** 1.0 (Julho 2026)
> **Versão do sistema:** ~5.5.x
> **Autor:** Análise automatizada do código-fonte

---

## Índice

1. [Visão Geral](#1-visão-geral)
2. [Arquitetura do Sistema](#2-arquitetura-do-sistema)
3. [Stack Tecnológica](#3-stack-tecnológica)
4. [Frontend — Estrutura e Componentes](#4-frontend)
5. [Backend — Edge Functions](#5-backend)
6. [Banco de Dados — Modelo de Dados](#6-banco-de-dados)
7. [Design System](#7-design-system)
8. [Sistemas de Negócio](#8-sistemas-de-negócio)
9. [Fluxos de Execução](#9-fluxos-de-execução)
10. [Segurança](#10-segurança)
11. [Deploy e Infraestrutura](#11-deploy)
12. [Boas Práticas e Observações](#12-boas-práticas)
13. [Resumo Final](#13-resumo-final)

---

## 1. Visão Geral

### O que é o sistema

O **Painel Ultra Chat** é uma plataforma SaaS de **licenciamento white-label** de uma extensão Chrome para IA. O sistema gerencia o ciclo de vida completo de licenças — criação, validação, expiração, renovação e revogação — para três perfis de usuário com níveis de acesso distintos.

### Problema que resolve

Permite que um **administrador** distribua licenças de uma extensão Chrome de IA, que **revendedores** comprem no atacado e revendam com customização de marca (logo, cores, nome), e que **clientes finais** comprem planos individuais — tudo com validação de dispositivo, controle de expiração e pagamento via Mercado Pago.

### Público-alvo

| Perfil | Dispositivo principal | Acesso |
|--------|----------------------|--------|
| Admin | Desktop | Total — gerencia tudo |
| Revendedor | Mobile/Desktop | Parcial — vende licenças |
| Cliente Final | Mobile | Limitado — usa licença |

---

## 2. Arquitetura do Sistema

### Diagrama de Alto Nível

```
┌─────────────────────────────────────────────────────────┐
│                   FRONTEND (Vite + React)                │
│                                                          │
│  Landing Page ─ Login/Signup ─ Checkout                   │
│  Painel Admin ─ Painel Revendedor ─ Painel Cliente       │
│                                                          │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS (REST + Supabase Client JS)
                       ▼
┌─────────────────────────────────────────────────────────┐
│              SUPABASE (Backend as a Service)              │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │    Auth     │  │  PostgreSQL  │  │ Edge Functions │  │
│  │   (JWT)     │  │  (18 tabelas)│  │  (40 funções)  │  │
│  └─────────────┘  └──────────────┘  └────────────────┘  │
│                         │               │                 │
│                         ▼               ▼                 │
│  ┌──────────────────────────────────────────────────┐    │
│  │         Mercado Pago (Webhooks + API PIX)        │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │     Lovable API (Criação de projetos, deploy)    │    │
│  └──────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### Padrão Arquitetural

- **Frontend:** SPA (Single Page Application) com Component-Based Architecture (React)
- **Backend:** BaaS (Backend as a Service) com Edge Functions para lógica customizada
- **Dados:** PostgreSQL com RLS (Row Level Security) para isolamento multi-tenant
- **Autenticação:** JWT via Supabase Auth com role-based access control (RBAC)
- **Pagamentos:** Mercado Pago PIX/CC com webhooks assíncronos
- **Deploy:** Containerização Docker com serve estático

---

## 3. Stack Tecnológica

### Frontend

| Biblioteca | Versão | Papel |
|------------|--------|-------|
| React | 19.2.6 | Framework UI |
| TypeScript | 6.0.2 | Tipagem estática |
| Vite | 8.0.12 | Build tool + dev server |
| React Router DOM | 7.17.0 | Roteamento SPA |
| Tailwind CSS | 3.4.19 | Utility-first CSS |
| Supabase JS | 2.108.0 | Cliente autenticado |
| Lucide React | 1.21.0 | Ícones SVG |
| JSZip | 3.10.1 | Geração de ZIP (extensão) |
| Recharts | 3.8.1 | Gráficos |
| clsx + tailwind-merge | — | Classes condicionais |
| Vitest | 4.1.8 | Testes unitários |

### Backend (Supabase)

| Componente | Papel |
|------------|-------|
| PostgreSQL 15 | Banco relacional |
| Edge Functions (Deno) | Lógica de negócio server-side |
| Auth | Autenticação JWT + RBAC |
| Storage | Armazenamento temporário de imagens |
| pg_cron | Limpeza automática de trials expirados |

### Infraestrutura

| Ferramenta | Papel |
|------------|-------|
| Docker + Docker Compose | Containerização |
| Nginx (via serve) | Servidor estático |
| Easypanel | Orquestração Docker |
| Netlify / Vercel | Deploy frontend |
| Mercado Pago | Pagamentos PIX e cartão |

---

## 4. Frontend — Estrutura e Componentes

### 4.1 Entry Point

**`src/main.tsx`** — Ponto de entrada. Monta React com `StrictMode`, envolve em `ToastProvider`.

**`src/App.tsx`** (237 linhas) — Componente raiz. Define 18 rotas com lazy loading e `ProtectedRoute` para RBAC.

### 4.2 Sistema de Autenticação e Rotas

```
ProtectedRoute(user, role, loading)
  ├─ loading → LoadingScreen (spinner + "Carregando...")
  ├─ não autenticado → /login
  ├─ role errada → /login
  └─ autorizado → renderiza children
```

**Rotas por perfil:**

| Perfil | Rotas |
|--------|-------|
| Público | `/`, `/login`, `/signup`, `/checkout/:slug`, `/resetar-licenca` |
| Qualquer | `/profile` |
| `user` | `/user` |
| `admin` | `/admin`, `/admin/customers`, `/admin/resellers`, `/admin/sales`, `/admin/products`, `/admin/branding`, `/admin/theme`, `/admin/endcustomer-products`, `/admin/customer-purchases` |
| `reseller` | `/reseller`, `/reseller/purchases`, `/reseller/branding` |

### 4.3 Hooks Customizados

#### `useAuth()` — Autenticação central

```typescript
useAuth() → { user: User | null, role: 'admin'|'reseller'|'user', loading: boolean, signIn, signOut }
```

- Inscrito em `onAuthStateChange` do Supabase
- Resolve role via query em `user_roles`
- Prioridade: admin > reseller > user

#### `useLicenseActions()` — Ações de licença

```typescript
useLicenseActions() → { submitMutation, copyLicenseKey, renewLicense, resetHwid, revokeLicense, deleteLicense, fetchWithAuth }
```

- `fetchWithAuth()` — fetch com Bearer token injetado
- `submitMutation()` — wrapper genérico com loading state, toast, try/catch
- Usado por admin, revendedor e cliente para gerenciar licenças

#### `useTheme()` — Inicialização do tema

- Carrega do localStorage imediatamente (cache-first)
- Busca do Supabase em background (via `get-site-settings`)
- Aplica CSS custom properties no `document.documentElement`

#### `useToast()` — Notificações

- React Context com `ToastProvider`
- Auto-dismiss em 3.6 segundos
- Posicionamento fixo (bottom-right, top no mobile)

### 4.4 Componentes Principais

#### Layout

| Componente | Responsabilidade |
|------------|-----------------|
| `AdminLayout` | Wrapper com sidebar + main content |
| `ResellerLayout` | Wrapper com sidebar + main content |
| `AdminSidebar` | Navegação lateral do admin (11 links) |
| `ResellerSidebar` | Navegação lateral do revendedor (7 links) |
| `AdminTopbar` | Barra superior com título e logout |
| `MobileMenu` / `ResellerMobileMenu` | Menu hambúrguer responsivo |

#### UI Primitivos

| Componente | Responsabilidade |
|------------|-----------------|
| `Button` | 6 variantes: default, ghost, outline, destructive, link, tiny |
| `Logo` | Logo da marca com variantes admin/reseller/landing |
| `FormField` | Input estilizado com label, erro, ícone |
| `ConfirmationDialog` | Modal de confirmação para ações perigosas |
| `LoadingOverlay` | Overlay com spinner para carregamento |
| `EmptyState` | Estado vazio para listas |
| `SalesChart` | Gráfico SVG de barras para vendas |

#### Feature Components

| Componente | Responsabilidade |
|------------|-----------------|
| `BrandingGenerator` | Personalização de extensão Chrome (cores, logo, nome) |
| `ThemeCustomizer` | Customização de cores do tema do painel |
| `TemplateManager` | Upload/gerenciamento de template ZIP da extensão |
| `CheckoutModal` | Modal de checkout com PIX e cartão |

### 4.5 Páginas

#### Públicas

| Página | Linhas | Descrição |
|--------|--------|-----------|
| `Landing` | 48 | Composição: Hero, Steps, Features, Pricing, Testimonials, FAQ, Footer |
| `Login` | 136 | Login email/senha com redirect baseado em role |
| `Signup` | 186 | Cadastro com CPF/WhatsApp, validação, verificação de email duplicado |
| `Checkout` | 526 | Checkout completo com PIX e cartão, polling de status |
| `ResetLicense` | 186 | Reset público de HWID por chave + email |
| `Profile` | 265 | Perfil adaptativo (admin/reseller/user) com exclusão de conta |

#### Admin (9 páginas)

| Página | Linhas | Descrição |
|--------|--------|-----------|
| `Dashboard` | 617 | Licenças, criar licença, gráfico de vendas, ações CRUD |
| `Customers` | 589 | Listar/buscar/filtrar clientes, promover a revendedor |
| `Resellers` | 794 | CRUD de revendedores, gerenciar créditos, modal de criar |
| `Sales` | 332 | Gerenciar compras de crédito de revendedores |
| `Products` | 246 | Gerenciar faixas de preço de crédito |
| `EndcustomerProducts` | 431 | CRUD de produtos para cliente final (TRY7/ULTRA15/ULTRA30) |
| `CustomerPurchases` | 384 | Gerenciar compras de clientes |
| `Branding` | 26 | Wraps BrandingGenerator + TemplateManager |
| `Theme` | 23 | Wraps ThemeCustomizer |

#### Resendedor (3 páginas)

| Página | Linhas | Descrição |
|--------|--------|-----------|
| `Dashboard` | 952 | Créditos, comprar créditos, criar licenças/trials, tabela de licenças |
| `Purchases` | 193 | Histórico de compras de crédito com cards resumo |
| `Branding` | 43 | Wraps BrandingGenerator |

#### Cliente Final (1 página)

| Página | Linhas | Descrição |
|--------|--------|-----------|
| `Dashboard` | 816 | Stats, planos, trial, licenças, compras, download extensão, tutorial, dicas, CTA revendedor |

### 4.6 Utilitários

| Módulo | Responsabilidade |
|--------|-----------------|
| `extensionBuilder.ts` | Gera ZIP da extensão Chrome personalizada (JSZip) |
| `brandingStorage.ts` | Persiste config de branding no localStorage |
| `templateStorage.ts` | Armazena template ZIP no IndexedDB |
| `themeStorage.ts` | Engine de tema dinâmico (13 CSS vars + 7 derivadas) |
| `format.ts` | Formatação de WhatsApp e limpeza de dígitos |
| `validateRedirect.ts` | Validação contra Open Redirect |

---

## 5. Backend — Edge Functions

### 5.1 Visão Geral

**40 Edge Functions** distribuídas em 6 categorias:

| Categoria | Qtd | Autenticação |
|-----------|-----|-------------|
| Admin | 20 | JWT + role admin |
| Revendedor | 7 | JWT + role reseller |
| Cliente/Pagamento | 3 | JWT (usuário) |
| Webhook | 1 | HMAC-SHA256 (Mercado Pago) |
| Público/Licença | 5 | Nenhuma ou rate-limited |
| Lovable Integration | 3 | License key validation |
| Utility | 3 | Variável |

### 5.2 Funções Admin Principais

| Função | Ação | Tabelas afetadas |
|--------|------|-----------------|
| `admin-create-license` | Cria licença (trial/paid/lifetime) | INSERT ts_licenses |
| `admin-renew-license` | Renova licença por N dias | UPDATE ts_licenses |
| `admin-revoke-license` | Suspende licença | UPDATE ts_licenses |
| `admin-delete-license` | Deleta licença permanentemente | DELETE ts_licenses |
| `admin-reset-hwid` | Libera dispositivo vinculado | UPDATE ts_licenses |
| `admin-manage-customer` | CRUD cliente + promoção a revendedor | UPDATE auth.users, INSERT resellers |
| `admin-manage-reseller` | CRUD revendedor (aprovar/suspender/creditos/deletar) | UPDATE resellers, DELETE auth.users |
| `admin-manage-credit-purchase` | Aprovar/estornar compra de crédito | UPDATE credit_purchases, UPDATE resellers |
| `admin-manage-customer-purchase` | Reembolsar/comprar/cancelar compra de cliente | UPDATE customer_purchases, UPDATE ts_licenses |

### 5.3 Funções de Pagamento

#### Fluxo Revendedor (PIX)
```
reseller-buy-credits → Mercado Pago PIX → mercadopago-webhook
  ├─ approved → UPDATE credit_purchases + ADD credits ao reseller
  ├─ refunded → UPDATE credit_purchases + REMOVE credits
  └─ rejected/cancelled → UPDATE status
```

#### Fluxo Cliente (PIX/Cartão)
```
customer-create-payment → Mercado Pago → customer-webhook-mp
  ├─ approved → INSERT ts_licenses + UPDATE customer_purchases
  ├─ refunded → UPDATE customer_purchases + SUSPEND ts_licenses
  └─ rejected/cancelled → UPDATE status + SUSPEND ts_licenses
```

### 5.4 Funções de Validação de Licença

#### `validate-license` — Função core da extensão Chrome

```typescript
Entrada: { license_key, device_id?, session_id?, heartbeat? }
Saída: { valid, message, session_id?, user_name?, expires_at?, ... }
Rate limit: 20 req/min por IP
```

**Lógica:**
1. Verifica se licença existe e está ativa
2. Verifica expiração (auto-marca como expired)
3. Verifica conflito de dispositivo (HWID binding)
4. Gerencia sessões e heartbeats
5. Suporta renovação automática

#### `user-create-trial` — Trial de 30 minutos

```typescript
Entrada: (nenhuma — usa auth do token)
Saída: { success, message, license }
Constraints: 1 trial por usuário (user_trials table)
```

### 5.5 Funções do Lovable (Integração Chrome Extension)

| Função | Limite | Descrição |
|--------|--------|-----------|
| `create-lovable-project` | 5/5min | Cria projeto via API Lovable |
| `publish-project` | 5/5min | Faz deploy do projeto |
| `remove-watermark` | 3/5min | Remove watermark via chat API |

---

## 6. Banco de Dados — Modelo de Dados

### 6.1 Inventário de Tabelas (18 tabelas + 1 view)

| # | Tabela | Migration | Propósito |
|---|--------|-----------|-----------|
| 1 | `ts_licenses` | 001 | Tabela central de licenças (20+ colunas) |
| 2 | `notifications` | 001 | Notificações do sistema |
| 3 | `packages` | 001 | Planos de pagamento M-Pesa/e-Mola |
| 4 | `extension_versions` | 001 | Controle de versão da extensão |
| 5 | `user_roles` | 001 | Atribuição de papéis (user/reseller/admin) |
| 6 | `payment_transactions` | 001 | Histórico de transações M-Pesa |
| 7 | `admin_audit_logs` | 002 | Auditoria de ações administrativas |
| 8 | `resellers` | 004 | Contas de revendedor (com name, whatsapp) |
| 9 | `reseller_credit_transactions` | 004 | Log de transações de crédito |
| 10 | `reseller_activation_payments` | 004 | Pagamento taxa ativação R$300 |
| 11 | `credit_purchases` | 005 | Compras de crédito via Mercado Pago |
| 12 | `reseller_credits_log` | 006 | Ajustes manuais de crédito (admin) |
| 13 | `product_pricing` | 008 | Faixas de preço de crédito |
| 14 | `product_pricing_history` | 008 | Histórico de alterações de preço |
| 15 | `user_trials` | 010 | Controle de 1 trial por usuário |
| 16 | `products_endcustomer` | 011 | Produtos da landing page (TRY7/ULTRA15/ULTRA30) |
| 17 | `customer_purchases` | 011 | Compras de clientes finais |
| 18 | `site_settings` | 017 | Configurações globais (tema) |
| — | `resellers_with_email` | 007 | VIEW: resellers + auth.users |

### 6.2 Tabela Central — `ts_licenses`

```sql
ts_licenses (
  license_key    TEXT PRIMARY KEY,     -- TS-XXXXXXXXXXXXXXXX
  user_id        UUID REFERENCES auth.users,
  reseller_id    UUID REFERENCES resellers,
  license_type   TEXT,                 -- 'trial' | 'paid' | 'lifetime'
  status         TEXT,                 -- 'active' | 'expired' | 'suspended' | 'trial'
  lifetime       BOOLEAN DEFAULT false,
  expires_at     TIMESTAMPTZ,
  activated_at   TIMESTAMPTZ,
  device_id      TEXT,                 -- HWID binding
  session_id     TEXT,
  last_heartbeat TIMESTAMPTZ,
  online_count   INTEGER DEFAULT 0,
  user_name      TEXT,
  email          TEXT,
  phone          TEXT,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
)
```

### 6.3 Funções SQL e Triggers

| Nome | Tipo | Propósito |
|------|------|-----------|
| `generate_license_key()` | SECURITY DEFINER | Gera chave TS-XXXX única |
| `auto_cleanup_expired_trials()` | SECURITY DEFINER | pg_cron: deleta trials expirados (5min) |
| `increment_reseller_credits(UUID, INT)` | SECURITY DEFINER | Adiciona/remove créditos (protegido) |
| `consume_reseller_credit()` | Trigger (AFTER INSERT) | Deduz 1 crédito ao criar licença paga |
| `update_updated_at_column()` | Trigger (BEFORE UPDATE) | Auto-atualiza updated_at |

### 6.4 Políticas RLS (Row Level Security)

| Tabela | Política | Escopo |
|--------|----------|--------|
| `ts_licenses` | user vê próprias, reseller vê suas, admin vê todas | SELECT |
| `resellers` | reseller vê própria, admin vê todas | SELECT |
| `credit_purchases` | reseller vê próprias, admin vê todas | SELECT |
| `customer_purchases` | user vê próprias, admin lê todas | ALL |
| `products_endcustomer` | todos veem ativos, admin gerencia tudo | SELECT/ALL |
| `user_roles` | user vê própria, service_role tudo | SELECT |
| `site_settings` | anon lê, authenticated lê, admin escreve | SELECT/ALL |

---

## 7. Design System

### 7.1 Identidade Visual

**Conceito:** "The Power Grid" — estética de sala de controle.

| Elemento | Valor | Papel |
|----------|-------|-------|
| Fundo | `#050b12` (void escuro) | Superfície base |
| Texto | `#f4fbff` | Contraste máximo |
| Accent | `#9dff2f` (Electric Lime) | Cor de ação — ≤15% da tela |
| Secundário | `#6de8ff` (Cyan) | Destaque secundário |
| Perigo | `#ff3d55` | Erros e destruição |
| Aviso | `#f5b83d` | Alertas |

### 7.2 Design Tokens (30+ variáveis CSS)

```
tokens.css
├── --bg, --bg-soft           (fundo)
├── --card, --card-strong     (superfícies)
├── --line, --line-hot        (bordas)
├── --text, --muted, --muted-2 (texto)
├── --accent, --accent-2      (cores de destaque)
├── --accent-rgb, --accent-r/g/b (componentes RGB)
├── --accent-light, --accent-bg, --accent-glow (derivadas)
├── --cyan, --danger, --warning (semânticas)
├── --gradient-brand          (gradiente da marca)
├── --radius, --radius-sm, --radius-btn (arredondamento)
├── --shadow                  (sombras)
└── --font                    (tipografia)
```

**Light mode:** Override completo via `@media (prefers-color-scheme: light)`.

**Tema customizável:** `themeStorage.ts` atualiza 13 variáveis + 7 derivadas em runtime via `applyTheme()`.

### 7.3 Regras de Design

| Regra | Descrição |
|-------|-----------|
| Accent Scarcity | Accent em ≤15% da área visível |
| Glow-Only-on-Action | Glow apenas em hover/focus/active |
| Weight-is-Hierarchy | Hierarquia por peso da fonte |
| Flat-By-Default | Flat por padrão, elevação só em hover |

### 7.4 CSS Modular

| Arquivo | Linhas | Conteúdo |
|---------|--------|----------|
| `tokens.css` | 68 | Design tokens + light mode + reduced-motion |
| `base.css` | 54 | Resets, body background, focus-visible, keyframes |
| `components.css` | 491 | Sidebar, buttons, cards, forms, tables, modals, toast |
| `layout.css` | 107 | Breakpoints mobile/tablet/desktop, responsive |
| `landing.css` | 429 | Landing page, user dashboard, trial, video, branding |

---

## 8. Sistemas de Negócio

### 8.1 Sistema de Licenças

**Tipos de licença:**

| Tipo | Duração | Custo crédito | Renovável |
|------|---------|---------------|-----------|
| Trial | 30 minutos | Não | Não (1/usuário) |
| Paid | 7/15/30/90 dias | 1 crédito | Sim |
| Lifetime | Perpétua | 1 crédito | N/A |

**Formato da chave:** `TS-XXXXXXXXXXXXXXXX` (20 caracteres hex)

**HWID Binding:** 1 dispositivo por licença. Se outro dispositivo tenta ativar, a licença é liberada automaticamente. 

**Heartbeat:** Extensão envia ping periódico para manter sessão ativa. Após 3 heartbeats sem resposta, sessão é liberada.

### 8.2 Sistema de Revendedores

**Ciclo de vida:**
1. Cadastro → status `pending`
2. Pagamento taxa R$300 → admin aprova → status `active`
3. Compra créditos (1-9: R$30, 10-19: R$25, 20-29: R$20, 30+: R$15)
4. Cria licenças para clientes (cada licença paga consome 1 crédito)
5. Customiza marca via BrandingGenerator

**Trigger `consume_reseller_credit`:** Ao inserir em `ts_licenses` com `license_type IN ('paid','lifetime')`, automaticamente deduz 1 crédito do revendedor.

### 8.3 Sistema de Produtos para Cliente Final

| Produto | Slug | Preço | Dias | Dispositivos |
|---------|------|-------|------|-------------|
| TRY 7 | try-7 | R$29,90 | 7 | 1 |
| ULTRA 15 | ultra-15 | R$49,90 | 15 | 1 |
| ULTRA 30 | ultra-30 | R$79,90 | 30 | 1 |

### 8.4 Sistema de Branding (White-Label)

**Fluxo:**
1. Admin/Revendedor preenche: nome empresa, WhatsApp, cores, logo, ícone
2. `extensionBuilder.ts` processa o template ZIP:
   - Injeta `branding.config.js` (CSS vars + DOM replacement)
   - Substitui cores (#7C5AFF → cor personalizada)
   - Substitui ícones (16/32/48/128px)
   - Atualiza manifest.json (nome, descrição)
3. ZIP personalizado é baixado pelo admin/revendedor
4. Enviado ao cliente via WhatsApp/email

**Arquivo base:** `public/templates/lovable-ultra-chat-full.zip`

### 8.5 Sistema de Tema

- **Admin** `/admin/theme` customiza 13 cores
- `applyTheme()` atualiza CSS custom properties em runtime
- Persiste no Supabase (`site_settings`) + cache no localStorage
- `useTheme()` no `App.tsx` aplica ao carregar (cache-first + background fetch)

---

## 9. Fluxos de Execução

### 9.1 Fluxo de Inicialização

```
1. main.tsx → ReactDOM.createRoot
2. ToastProvider monta Context
3. App monta:
   a. useTheme() → loadTheme(localStorage) → applyTheme()
   b. useTheme() → fetchThemeFromSupabase() → applyTheme() (async)
   c. BrowserRouter monta rotas
4. Rota pública renderiza diretamente
5. Rota protegida → ProtectedRoute:
   a. useAuth() → getSession() → onAuthStateChange
   b. fetchRole() → query user_roles
   c. Retorna user + role
   d. Se autorizado, renderiza componente
6. Lazy componentes são importados sob demanda
```

### 9.2 Fluxo de Login

```
1. Usuário preenche email/senha
2. signIn(email, password) → supabase.auth.signInWithPassword
3. Supabase retorna JWT + session
4. onAuthStateChange dispara
5. fetchRole() → query user_roles WHERE user_id = auth.uid()
6. Redireciona por role: /admin | /reseller | /user
```

### 9.3 Fluxo de Compra (Cliente)

```
1. Clica "Comprar agora" no card de produto
2. CheckoutModal abre → loadProduct(slug) → supabase.from('products_endcustomer')
3. Step 1 (checkout): formulário com nome, email, WhatsApp, CPF
4. Clica "Gerar Pix" → customer-create-payment:
   a. Cria registro em customer_purchases (status: pending)
   b. Chama Mercado Pago API → retorna QR code PIX
   c. Retorna { payment_id, pix_qr_code, pix_qr_code_base64 }
5. Step 2 (pix): QR code exibido + polling a cada 5s
6. Usuário paga PIX no banco
7. Mercado Pago envia webhook → customer-webhook-mp:
   a. Atomic guard: UPDATE payment_status = 'approved' WHERE status = 'pending'
   b. Gera chave TS-XXXX
   c. INSERT ts_licenses
   d. UPDATE customer_purchases com license_key
8. Polling detecta status 'approved' → Step 3 (success)
9. Modal fecha → loadLicenses() + loadPurchases() atualiza dashboard
```

### 9.4 Fluxo de Validação de Licença (Extensão Chrome)

```
1. Extensão envia POST validate-license:
   { license_key, device_id, session_id? }
2. Edge Function:
   a. Busca licença por license_key
   b. Verifica status (active/expired/suspended)
   c. Verifica expiração (auto-atualiza se expirada)
   d. Se não tem device_id → vincula ao dispositivo
   e. Se device_id diferente → verifica se anterior inativo
   f. Gera ou mantém session_id
   g. Retorna { valid: true, session_id, expires_at, ... }
3. Extensão envia heartbeat periódico (mantém sessão)
```

### 9.5 Fluxo de Branding

```
1. Admin/Revendedor preenche formulário (nome, WhatsApp, cores, logo)
2. Clica "Gerar e baixar .zip"
3. getStoredTemplate() ou fetch(TEMPLATE_URL) → ArrayBuffer do ZIP base
4. generateExtensionZip(templateBuffer, brandingData):
   a. flattenZip() — remove diretório raiz aninhado
   b. gerarBrandingConfig() — gera JS IIFE com CSS vars + DOM observer
   c. zip.file('branding.config.js', novoBranding)
   d. Se tem logo → resizePng() para 16/32/48/128px
   e. Se tem ícone → substitui icons/icon{16,32,48,128}.png
   f. replaceColorsInZip() — substitui #7C5AFF em todos os arquivos JS/CSS/HTML/JSON
   g. updateManifest() — atualiza nome e descrição
5. downloadZip() — gera blob e dispara download
6. Nome do arquivo: extensao-{companyName}.zip
```

---

## 10. Segurança

### 10.1 Autenticação e Autorização

- **JWT:** Todas as Edge Functions admin/revendedor verificam token via `getUser(token)`
- **RBAC:** `user_roles` table com verificação por function
- **RLS:** Todas as 18 tabelas têm políticas de segurança
- **Service Role:** Usado internamente nas Edge Functions (bypassa RLS)
- **Open Redirect Prevention:** `validateRedirect()` — apenas caminhos relativos

### 10.2 Proteção de Webhooks

- Mercado Pago webhooks verificados via HMAC-SHA256 com `MERCADOPAGO_WEBHOOK_SECRET`
- Sem autenticação JWT (webhooks são externos)
- Retornam HTTP 200 mesmo em erro (evita retries infinitos do MP)

### 10.3 Rate Limiting

| Função | Limite |
|--------|--------|
| `validate-license` | 20 req/min por IP |
| `optimize-prompt` | 10 req/min por license |
| `remove-watermark` | 3 req/5min por license |
| `create-lovable-project` | 5 req/5min por license |
| `process-extension-payment` | 3 req/5min por telefone |
| `upload-temp-image` | 10 req/min por IP |

### 10.4 Data Protection

- `user-delete-account` remove dados de auth + licenses + purchases + trials (GDPR-like)
- Exclusão de revendedor remove auth.users + resellers + user_roles
- Audit log em `admin_audit_logs` para todas as ações administrativas

---

## 11. Deploy

### 11.1 Docker (Easypanel)

```dockerfile
# Build stage
FROM node:20-alpine
COPY package*.json ./ → RUN npm ci
COPY . . → RUN npm run build (tsc + vite build)
# Production stage
FROM node:20-alpine
COPY --from=builder /app/dist ./dist
RUN npm install -g serve
CMD ["serve", "-s", "dist", "-l", "3000"]
```

**Variáveis de build:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

### 11.2 Netlify

- SPA redirect: `/* → /index.html`
- Headers de segurança: X-Frame-Options, X-Content-Type-Options, etc.
- Cache: 1 ano para `/assets/*`

### 11.3 Deploy de Edge Functions

```bash
supabase functions deploy <function_name>
```

Ou via Dashboard do Supabase > Edge Functions > Deploy.

### 11.4 Migrations

```bash
supabase db push          # Aplica migrations pendentes
supabase migration new    # Cria nova migration
```

---

## 12. Boas Práticas

### Pontos Positivos

1. **Separação clara de camadas** — frontend, Edge Functions, banco, pagamentos
2. **RBAC robusto** — 3 tiers com RLS + verificação por function
3. **Lazy loading** — todas as páginas de admin/revendedor são lazy-loaded
4. **Design tokens centralizados** — 30+ CSS variables com tema customizável
5. **Auditoria completa** — toda ação admin logada em `admin_audit_logs`
6. **Webhook idempotente** — atomic guard em webhooks (evita processamento duplicado)
7. **Rate limiting** — todas as funções públicas têm rate limit
8. **Validação de input** — formatação de CPF, WhatsApp, sanitização de redirect
9. **CSS modular** — 5 arquivos CSS organizados por responsabilidade
10. **Extensão white-label completa** — geração de ZIP com branding personalizado

### Pontos de Atenção

1. **Sem React Query/RTK** — toda fetching é useState/useEffect local, sem cache compartilhado entre páginas
2. **IndexedDB para template** — template fica no navegador do admin, clientes não têm acesso automático
3. **37+ Edge Functions** — volume alto para deploy e manutenção
4. **In-memory rate limiting** — reseta a cada cold start da Edge Function
5. **M-Pesa/e-Mola simulado** — gateway de pagamento placeholder (70% sucesso aleatório)
6. **Webhook race condition** — `mercadopago-webhook` usa read-then-write para créditos (mitigado com atomic guard, mas não perfeito)

---

## 13. Resumo Final

### O que é

Plataforma SaaS de licenciamento white-label de extensão Chrome para IA, com 3 perfis (admin/revendedor/cliente), pagamentos via Mercado Pago, e geração de extensão personalizada.

### Fluxo geral

```
Admin configura sistema → Revendedor compra créditos → Cria licenças para clientes
→ Cliente compra plano → Recebe licença → Instala extensão → Valida chave
```

### Pontos críticos para manutenção

1. **`validate-license`** — função mais chamada (pela extensão Chrome). Qualquer alteração afeta todos os usuários ativos.
2. **Webhooks MP** — processam pagamentos. Erros aqui significam dinheiro perdido ou duplicado.
3. **`consume_reseller_credit` trigger** — deduz créditos automaticamente. Testar bem qualquer alteração em `ts_licenses`.
4. **Tema customizável** — qualquer CSS novo deve usar `var(--accent-r/g/b)` ao invés de cores hardcoded.
5. **RLS policies** — cuidado ao criar novas tabelas ou funções. Sempre testar com cada role.
6. **Edge Functions** — deploy manual. Não esquecer de publicar após alterações server-side.
