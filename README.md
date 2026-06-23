# ⚡ Painel Ultra Chat

Sistema de gestão de licenças, usuários e revendedores para a extensão Ultra Chat. Painel administrativo multi-perfil (Admin, Revendedor, Cliente).

---

## 📋 Índice

1. [Versões e Dependências](#-versões-e-dependências)
2. [Arquitetura do Projeto](#-arquitetura-do-projeto)
3. [Estrutura de Diretórios](#-estrutura-de-diretórios)
4. [Variáveis de Ambiente](#-variáveis-de-ambiente)
5. [Instalação e Configuração](#-instalação-e-configuração)
6. [Execução](#-execução)
7. [Fluxos Principais](#-fluxos-principais)
8. [Banco de Dados](#-banco-de-dados)
9. [Edge Functions (Supabase)](#-edge-functions-supabase)
10. [Deploy](#-deploy)
11. [Testes](#-testes)
12. [Solução de Problemas](#-solução-de-problemas)

---

## 🛠 Versões e Dependências

### Linguagens e Runtimes

| Tecnologia  | Versão   | Instalação                                      |
|-------------|----------|-------------------------------------------------|
| Node.js     | 20.x     | [nodejs.org](https://nodejs.org/)               |
| TypeScript  | ~6.0.2   | Incluso via `npm install`                       |
| npm         | 10.x+    | Acompanha Node.js                               |

### Frameworks e Bibliotecas (Frontend - `package.json`)

| Pacote                  | Versão       | Finalidade                          |
|-------------------------|--------------|-------------------------------------|
| react                   | ^19.2.6      | UI Framework                       |
| react-dom               | ^19.2.6      | Renderização DOM                   |
| react-router-dom        | ^7.17.0      | Roteamento SPA                     |
| @supabase/supabase-js   | ^2.108.0     | Cliente Supabase (Auth + Database) |
| recharts                | ^3.8.1       | Gráficos e métricas                |
| vite                    | ^8.0.12      | Bundler + Dev Server               |
| @vitejs/plugin-react    | ^6.0.1       | Integração React + Vite            |
| tailwindcss             | ^3.4.19      | CSS utility-first                  |
| postcss                 | ^8.5.15      | Processador CSS                    |
| autoprefixer            | ^10.5.0      | Prefixos CSS automáticos           |
| eslint                  | ^10.3.0      | Linter                             |
| typescript-eslint       | ^8.59.2      | TypeScript + ESLint                |
| vitest                  | ^4.1.8       | Test runner                        |
| jsdom                   | ^29.1.1      | Ambiente DOM para testes           |
| @testing-library/react  | ^16.3.2      | Testes de componentes              |
| @types/react            | ^19.2.14     | Tipos React                        |
| @types/react-dom        | ^19.2.3      | Tipos ReactDOM                     |
| @types/node             | ^24.12.3     | Tipos Node.js                      |

### Ferramentas de Infraestrutura

| Ferramenta        | Versão   | Finalidade                              |
|-------------------|----------|-----------------------------------------|
| Docker            | 24.x+    | Containerização (opcional)              |
| Docker Compose    | v3.8     | Orquestração local                      |
| Supabase CLI      | 2.98.2+  | Deploy de Edge Functions                |
| Supabase Dashboard| -        | Gerenciamento do projeto Supabase       |

---

## 🏗 Arquitetura do Projeto

### Visão Geral

```
┌──────────────────────────────────────────────────────┐
│                 Frontend (Vite + React)               │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐ │
│  │ Admin     │ │ Reseller │ │ User (Cliente Final) │ │
│  │ Dashboard │ │ Dashboard│ │ Dashboard            │ │
│  └────┬─────┘ └────┬─────┘ └──────────┬───────────┘ │
│       │            │                  │              │
│  ┌────┴────────────┴──────────────────┴──────────┐  │
│  │         @supabase/supabase-js Client           │  │
│  │    (Auth + Queries + Edge Functions Calls)      │  │
│  └────────────────────┬───────────────────────────┘  │
└───────────────────────┼───────────────────────────────┘
                        │
┌───────────────────────┼───────────────────────────────┐
│          Supabase (Backend as a Service)              │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │ Auth     │  │ PostgreSQL   │  │ Edge Functions │ │
│  │ (JWT)    │  │ + RLS        │  │ (Deno)         │ │
│  └──────────┘  └──────────────┘  └────────────────┘ │
└──────────────────────────────────────────────────────┘
```

### Perfis de Acesso

| Perfil     | Rota               | Acesso                               |
|------------|--------------------|--------------------------------------|
| **Admin**  | `/admin/*`         | Gestão total: licenças, revendedores, clientes, vendas, produtos |
| **Revendedor** | `/reseller/*` | Gerenciar créditos, criar licenças, lista de licenças próprias |
| **Cliente** | `/user`            | Dashboard cliente, trial, licenças próprias |

### Responsabilidade dos Módulos

| Módulo          | Responsabilidade                                          |
|-----------------|-----------------------------------------------------------|
| `src/hooks/`    | Hooks customizados: useAuth (autenticação), useToast (notificações), useLicenseActions (ações de licenças) |
| `src/components/` | Componentes reutilizáveis: layout, sidebar, modais, botões, gráficos |
| `src/pages/admin/` | Telas administrativas: dashboard, licenças, revendedores, clientes, vendas, produtos |
| `src/pages/reseller/` | Dashboard do revendedor com criação de licenças e gestão de créditos |
| `src/pages/user/` | Dashboard do cliente final com trial e visualização de licenças |
| `src/lib/` | Configuração do cliente Supabase e constantes de endpoints |
| `supabase/functions/` | Edge functions em Deno para operações seguras (service_role) |
| `supabase/migrations/` | Scripts SQL de migração do banco de dados |

---

## 📁 Estrutura de Diretórios

```
/
├── public/                        # Arquivos estáticos
│   ├── favicon.svg
│   └── icons.svg
│
├── src/                           # Código fonte do frontend
│   ├── __tests__/                 # Testes unitários
│   │   ├── useAuth.test.tsx
│   │   ├── useLicenseActions.test.tsx
│   │   └── useToast.test.tsx
│   ├── assets/                    # Imagens e assets estáticos
│   ├── components/                # Componentes React reutilizáveis
│   │   ├── ui/                    # Componentes de UI atômicos
│   │   │   └── button.tsx
│   │   ├── AdminLayout.tsx        # Layout wrapper para páginas admin
│   │   ├── AdminSidebar.tsx       # Sidebar de navegação admin
│   │   ├── ConfirmationDialog.tsx # Modal de confirmação (Portal)
│   │   ├── EmptyState.tsx         # Estado vazio padrão
│   │   ├── FormField.tsx          # Campo de formulário padronizado
│   │   ├── LoadingOverlay.tsx     # Overlay de carregamento
│   │   ├── MobileMenu.tsx         # Menu hamburger mobile (admin)
│   │   ├── ResellerLayout.tsx     # Layout wrapper para páginas revendedor
│   │   ├── ResellerMobileMenu.tsx # Menu hamburger mobile (revendedor)
│   │   ├── ResellerSidebar.tsx    # Sidebar de navegação revendedor
│   │   └── SalesChart.tsx         # Gráfico de vendas (Recharts)
│   ├── hooks/                     # Hooks customizados
│   │   ├── useAuth.ts             # Hook de autenticação e role
│   │   ├── useLicenseActions.ts   # Ações de licenças (copiar, renovar, deletar)
│   │   └── useToast.tsx           # Sistema de notificações Toast
│   ├── lib/
│   │   └── supabase.ts            # Cliente Supabase + endpoints constantes
│   ├── pages/
│   │   ├── admin/
│   │   │   ├── Customers.tsx      # Gestão de clientes finais
│   │   │   ├── Dashboard.tsx      # Dashboard admin (licenças + métricas)
│   │   │   ├── Products.tsx       # Gestão de preços/produtos
│   │   │   ├── Resellers.tsx      # Gestão de revendedores
│   │   │   └── Sales.tsx          # Vendas e compras de créditos
│   │   ├── reseller/
│   │   │   └── Dashboard.tsx      # Painel do revendedor
│   │   ├── user/
│   │   │   └── Dashboard.tsx      # Painel do cliente final
│   │   ├── Landing.tsx            # Landing page + cadastro
│   │   └── Login.tsx              # Tela de login
│   ├── test/
│   │   └── setup.ts               # Setup do vitest
│   ├── App.css                    # Estilos globais adicionais
│   ├── App.tsx                    # Roteador principal + ProtectedRoute
│   ├── index.css                  # Estilos globais (Tailwind + custom)
│   └── main.tsx                   # Entry point React + ToastProvider
│
├── supabase/                      # Backend Supabase
│   ├── docs/                      # Documentação do backend
│   │   ├── CHECKLIST_DEPLOY.md
│   │   ├── DATABASE_STRUCTURE.md
│   │   └── EDGE_FUNCTIONS_GUIDE.md
│   ├── functions/                 # Edge Functions (Deno)
│   │   ├── admin-cleanup-expired-trials/
│   │   ├── admin-create-license/
│   │   ├── admin-create-reseller/
│   │   ├── admin-delete-license/
│   │   ├── admin-get-users/
│   │   ├── admin-list-customers/       # Lista clientes normais com agregação
│   │   ├── admin-list-licenses/
│   │   ├── admin-list-resellers/
│   │   ├── admin-manage-customer/      # Editar/excluir cliente
│   │   ├── admin-manage-reseller/      # CRUD de revendedores
│   │   ├── admin-renew-license/
│   │   ├── admin-reset-hwid/
│   │   ├── admin-revoke-license/
│   │   ├── check-payment-status/
│   │   ├── create-lovable-project/
│   │   ├── mercadopago-webhook/        # Webhook Mercado Pago
│   │   ├── optimize-prompt/
│   │   ├── process-extension-payment/
│   │   ├── publish-project/
│   │   ├── remove-watermark/
│   │   ├── reseller-buy-credits/       # Compra de créditos (Mercado Pago)
│   │   ├── reseller-create-license/
│   │   ├── reseller-dashboard/
│   │   ├── reseller-delete-license/
│   │   ├── reseller-list-licenses/
│   │   ├── reseller-register/
│   │   ├── upload-temp-image/
│   │   ├── user-create-trial/
│   │   └── validate-license/
│   ├── migrations/                     # Migrations SQL
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_admin_audit_logs.sql
│   │   ├── 003_auto_cleanup_trials.sql
│   │   ├── 004_increment_reseller_credits.sql
│   │   ├── 004_resellers_system.sql
│   │   ├── 005_credit_purchases.sql
│   │   ├── 006_reseller_credits_log.sql
│   │   ├── 007_resellers_view.sql
│   │   ├── 008_product_pricing.sql
│   │   ├── 009_add_name_whatsapp_to_resellers.sql
│   │   └── 010_user_trials.sql
│   └── storage/
│       └── 001_storage_buckets.sql
│
├── .env.example                   # Template de variáveis de ambiente
├── .gitignore                     # Arquivos ignorados pelo Git
├── Dockerfile                     # Build Docker multi-stage
├── docker-compose.yml             # Orquestração Docker
├── eslint.config.js               # Configuração do ESLint
├── index.html                     # HTML de entrada
├── netlify.toml                   # Configuração de deploy Netlify
├── package.json                   # Dependências e scripts
├── postcss.config.js              # Configuração PostCSS
├── tailwind.config.js             # Configuração Tailwind CSS
├── tsconfig.json                  # TypeScript root config
├── tsconfig.app.json              # TypeScript config (app)
├── tsconfig.node.json             # TypeScript config (node)
├── vercel.json                    # Configuração de deploy Vercel
└── vite.config.ts                 # Configuração Vite
```

---

## 🔐 Variáveis de Ambiente

### Arquivo `.env` (raiz do projeto)

```env
# ============================================================================
# SUPABASE - Obrigatório
# ============================================================================
# URL do projeto Supabase. Ex: https://abc123.supabase.co
VITE_SUPABASE_URL=https://seu-projeto.supabase.co

# Chave anônima do Supabase (pública, usada no frontend)
# Encontre em: Supabase Dashboard > Settings > API > anon public key
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui

# ============================================================================
# API URL - Opcional (usada para contexto de ambiente)
# ============================================================================
# Desenvolvimento: http://localhost:5173
# Netlify: https://seu-projeto.netlify.app
# Docker/Easypanel: https://seu-dominio-easypanel.com
VITE_API_URL=https://seu-dominio-aqui.com
```

### Configuração por Ambiente

| Ambiente       | VITE_SUPABASE_URL                        | VITE_API_URL                         |
|----------------|------------------------------------------|--------------------------------------|
| Desenvolvimento| `http://localhost:54321` (Supabase local) ou URL real | `http://localhost:5173` |
| Produção       | URL real do projeto Supabase             | URL do domínio de produção           |

### Arquivos Sensíveis no `.gitignore`

Os seguintes arquivos NÃO devem ser commitados:

- `.env` - Arquivo real com chaves
- `.env.local` - Override local
- `.env.*.local` - Overrides de ambiente
- `.env.production.local` - Chaves de produção

O arquivo `.env.example` é a versão segura para versionamento.

---

## 🚀 Instalação e Configuração

### Pré-requisitos

1. **Node.js 20.x** instalado ([download](https://nodejs.org/))
2. **Git** instalado
3. **Conta Supabase** ([supabase.com](https://supabase.com)) - plano Free ou superior
4. **NPM** (acompanha Node.js)

### Passo a Passo

```bash
# 1. Clonar o repositório
git clone <url-do-repositorio> painel-ultra-chat
cd painel-ultra-chat

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas credenciais reais do Supabase

# 4. Configurar Supabase
# 4a. Criar um projeto em https://supabase.com/dashboard
# 4b. Anotar SUPABASE_URL e SUPABASE_ANON_KEY
# 4c. Executar as migrations no SQL Editor do Supabase:
#    - Abra Dashboard > SQL Editor
#    - Execute cada arquivo em supabase/migrations/ em ordem numérica:
#      001_initial_schema.sql
#      002_admin_audit_logs.sql
#      003_auto_cleanup_trials.sql
#      004_resellers_system.sql
#      004_increment_reseller_credits.sql
#      005_credit_purchases.sql
#      006_reseller_credits_log.sql
#      007_resellers_view.sql
#      008_product_pricing.sql
#      009_add_name_whatsapp_to_resellers.sql
#      010_user_trials.sql

# 5. (Opcional) Iniciar Supabase localmente
# npx supabase start

# 6. Iniciar servidor de desenvolvimento
npm run dev
```

### Configuração do Usuário Admin

Após executar as migrations e configurar o `.env`:

1. Acesse a aplicação em `http://localhost:5173`
2. Crie uma conta na Landing Page (botão "Criar conta")
3. No Supabase Dashboard > SQL Editor, execute:
   ```sql
   INSERT INTO public.user_roles (user_id, role)
   VALUES (
     '<UUID-DO-USUARIO-AUTENTICADO>',
     'admin'
   )
   ON CONFLICT (user_id, role) DO NOTHING;
   ```
4. Faça logout e login novamente. Você será redirecionado ao painel admin.

---

## ▶️ Execução

### Modo Desenvolvimento

```bash
npm run dev
# Acessar em http://localhost:5173
```

### Build de Produção

```bash
npm run build
# Saída em ./dist/
```

### Preview do Build

```bash
npm run preview
# Acessar em http://localhost:4173
```

### Docker (Produção)

```bash
# Construir imagem
docker compose build

# Iniciar container
docker compose up -d

# Acessar em http://localhost:3000
```

### Testes

```bash
# Executar testes uma vez
npm test

# Modo watch
npm run test:watch
```

### Lint

```bash
npm run lint
```

---

## 🔄 Fluxos Principais

### Autenticação (useAuth)

1. Usuário faz login em `/login`
2. `supabase.auth.signInWithPassword()` autentica
3. `fetchRole()` consulta `public.user_roles` para determinar perfil
4. Role determina redirecionamento (`/admin`, `/reseller` ou `/user`)
5. `onAuthStateChange` mantém sessão sincronizada

### Ciclo de Licença (Admin)

1. Admin cria licença via formulário no Dashboard
2. Frontend chama edge function `admin-create-license` (autenticada com JWT)
3. Edge function valida permissão, gera chave e insere em `ts_licenses`
4. Admin pode: renovar, revogar, deletar, resetar HWID
5. Licenças são listadas via `admin-list-licenses` com stats agregados

### Gestão de Revendedores (Admin)

1. Admin cria revendedor via `admin-create-reseller` (cria auth.user + insere em `public.resellers`)
2. Admin gerencia créditos e dados cadastrais via `admin-manage-reseller`
3. Admin pode suspender, reativar ou excluir revendedores
4. Revendedor acessa `/reseller/*` e gerencia licenças e créditos próprios

### Gestão de Clientes (Admin)

1. Admin acessa `/admin/customers`
2. Lista clientes normais via `admin-list-customers` (agrega auth + licenças + trials)
3. Admin pode editar nome/email via `admin-manage-customer`
4. Admin pode excluir conta (remove de auth + cascade nas tabelas relacionadas)

### Compra de Créditos (Revendedor)

1. Revendedor seleciona quantidade e gera pagamento Pix via `reseller-buy-credits`
2. Integração com Mercado Pago cria QR Code
3. Webhook `mercadopago-webhook` recebe notificação e atualiza créditos
4. Iframe/Polling no frontend verifica status do pagamento

### Trial (Cliente Final)

1. Cliente acessa `/user` e clica "Gerar teste"
2. Frontend chama `user-create-trial` (edge function)
3. Verifica se cliente já usou trial (tabela `user_trials`)
4. Cria licença trial com expiração e registra em `user_trials`

---

## 🗄 Banco de Dados

### Estrutura (PostgreSQL)

O banco de dados é gerenciado pelo Supabase (PostgreSQL 15+). As migrations estão em `supabase/migrations/`.

### Tabelas Principais

| Tabela                       | Finalidade                                    |
|------------------------------|-----------------------------------------------|
| `public.ts_licenses`         | Licenças ativas, trials e vitalícias          |
| `public.user_roles`          | Roles (admin, reseller, user)                 |
| `public.resellers`           | Cadastro de revendedores                      |
| `public.reseller_credit_transactions` | Transações de créditos de revendedores |
| `public.reseller_credits_log` | Log de alterações manuais de créditos        |
| `public.reseller_activation_payments` | Pagamentos de ativação de revendedor   |
| `public.credit_purchases`    | Compras de créditos por revendedores          |
| `public.product_pricing`     | Tabela de preços dos créditos                 |
| `public.admin_audit_logs`    | Auditoria de ações administrativas            |
| `public.user_trials`         | Controle de trial por cliente final           |
| `public.notifications`       | Notificações do sistema                       |
| `public.packages`            | Planos de pagamento                           |
| `public.payment_transactions`| Histórico de transações de pagamento          |
| `public.extension_versions`  | Controle de versões da extensão               |

### Views

| View                            | Finalidade                                   |
|---------------------------------|----------------------------------------------|
| `public.resellers_with_email`  | Revendedores com email do auth.users         |

### Migrations (Ordem de Execução)

| Migration                              | Descrição                                |
|----------------------------------------|------------------------------------------|
| `001_initial_schema.sql`              | Schema base: ts_licenses, user_roles, packages, etc. |
| `002_admin_audit_logs.sql`            | Tabela de auditoria admin               |
| `003_auto_cleanup_trials.sql`         | Limpeza automática de trials expirados  |
| `004_resellers_system.sql`            | Sistema de revendedores + créditos      |
| `004_increment_reseller_credits.sql`  | Trigger para incrementar créditos       |
| `005_credit_purchases.sql`            | Tabela de compras de créditos           |
| `006_reseller_credits_log.sql`        | Log de alterações de créditos           |
| `007_resellers_view.sql`              | View resellers_with_email               |
| `008_product_pricing.sql`             | Tabela de precificação                  |
| `009_add_name_whatsapp_to_resellers.sql` | Colunas name/whatsapp em resellers   |
| `010_user_trials.sql`                 | Controle de trial de cliente final      |

### RLS (Row Level Security)

Todas as tabelas públicas têm RLS habilitado. As políticas seguem este padrão:

- **Usuários**: veem apenas seus próprios dados (SELECT com `auth.uid()`)
- **Admins**: acesso total via role check em `user_roles`
- **Service Role**: acesso irrestrito (usado pelas Edge Functions)

---

## ⚡ Edge Functions (Supabase)

Todas as Edge Functions estão em `supabase/functions/` e executam em runtime Deno.

### Functions Administrativas

| Function                    | Endpoint                                   | Ação                                       |
|-----------------------------|--------------------------------------------|--------------------------------------------|
| `admin-list-licenses`       | `/functions/v1/admin-list-licenses`        | Listar todas as licenças com stats         |
| `admin-create-license`      | `/functions/v1/admin-create-license`       | Criar licença (paid, trial, lifetime)      |
| `admin-delete-license`      | `/functions/v1/admin-delete-license`       | Excluir licença                            |
| `admin-renew-license`       | `/functions/v1/admin-renew-license`        | Renovar licença por dias                   |
| `admin-revoke-license`      | `/functions/v1/admin-revoke-license`       | Suspender/revogar licença                  |
| `admin-reset-hwid`          | `/functions/v1/admin-reset-hwid`           | Resetar device_id da licença               |
| `admin-cleanup-expired-trials` | `/functions/v1/admin-cleanup-expired-trials` | Limpar trials expirados               |
| `admin-create-reseller`     | `/functions/v1/admin-create-reseller`      | Criar novo revendedor                      |
| `admin-manage-reseller`     | `/functions/v1/admin-manage-reseller`      | Aprovar/suspender/editar/excluir revendedor|
| `admin-manage-customer`     | `/functions/v1/admin-manage-customer`      | Editar/excluir cliente final               |
| `admin-list-customers`      | `/functions/v1/admin-list-customers`       | Listar clientes finais (paginado)          |
| `admin-get-users`           | `/functions/v1/admin-get-users`            | Buscar emails de usuários por IDs          |

### Functions do Revendedor

| Function                    | Endpoint                                   | Ação                                       |
|-----------------------------|--------------------------------------------|--------------------------------------------|
| `reseller-dashboard`        | `/functions/v1/reseller-dashboard`         | Dados do dashboard do revendedor           |
| `reseller-create-license`   | `/functions/v1/reseller-create-license`    | Criar licença (consome 1 crédito)          |
| `reseller-list-licenses`    | `/functions/v1/reseller-list-licenses`     | Listar licenças criadas pelo revendedor    |
| `reseller-delete-license`   | `/functions/v1/reseller-delete-license`    | Excluir licença do revendedor              |
| `reseller-buy-credits`      | `/functions/v1/reseller-buy-credits`       | Gerar pagamento Pix via Mercado Pago       |
| `reseller-register`         | `/functions/v1/reseller-register`          | Cadastro de novo revendedor (público)      |

### Functions do Usuário Final

| Function                    | Endpoint                                   | Ação                                       |
|-----------------------------|--------------------------------------------|--------------------------------------------|
| `user-create-trial`         | `/functions/v1/user-create-trial`          | Criar trial gratuito                       |
| `validate-license`          | `/functions/v1/validate-license`           | Validar licença + heartbeat               |

### Functions de Integração

| Function                    | Endpoint                                   | Ação                                       |
|-----------------------------|--------------------------------------------|--------------------------------------------|
| `mercadopago-webhook`       | `/functions/v1/mercadopago-webhook`        | Webhook de pagamento Mercado Pago          |
| `check-payment-status`      | `/functions/v1/check-payment-status`       | Polling de status de pagamento             |
| `process-extension-payment` | `/functions/v1/process-extension-payment`  | Pagamento M-Pesa/e-Mola                    |
| `optimize-prompt`           | `/functions/v1/optimize-prompt`            | Otimização de prompts com IA               |
| `upload-temp-image`         | `/functions/v1/upload-temp-image`          | Upload de imagem temporária                |
| `remove-watermark`          | `/functions/v1/remove-watermark`           | Remover marca d'água Lovable               |
| `publish-project`           | `/functions/v1/publish-project`            | Publicar projeto Lovable                   |
| `create-lovable-project`    | `/functions/v1/create-lovable-project`     | Criar projeto Lovable                      |

### Secrets Obrigatórios (Edge Functions)

Configurar no Supabase Dashboard > Edge Functions > Secrets:

| Secret                      | Finalidade                           |
|-----------------------------|--------------------------------------|
| `SUPABASE_URL`              | URL do projeto Supabase             |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service_role (nunca expor!)   |
| `SUPABASE_ANON_KEY`         | Chave anônima                       |

Deploy via CLI:
```bash
supabase link --project-ref <project-ref>
supabase secrets set SUPABASE_URL=<url> SUPABASE_SERVICE_ROLE_KEY=<key>
supabase functions deploy <function-name>
```

> **Importante:** O deploy das Edge Functions deve ser feito pelo **Supabase Dashboard** (copiar/colar o código) ou via **Supabase CLI**.

---

## 🚢 Deploy

### Opção 1: Netlify (Recomendado)

O projeto já inclui `netlify.toml` configurado:

```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

Configurações do `netlify.toml`:
- Build command: `npm run build`
- Publish directory: `dist`
- SPA redirect: `/* -> /index.html` (status 200)
- Headers de segurança: X-Frame-Options, X-Content-Type-Options, etc.
- Cache de assets: 1 ano (imutável)

### Opção 2: Docker / Easypanel

```bash
# Construir e iniciar
docker compose up -d

# Parar
docker compose down

# Ver logs
docker compose logs -f
```

### Opção 3: Vercel

O projeto inclui `vercel.json` com rewrite SPA.

---

## 🧪 Testes

### Testes Unitários

Localização: `src/__tests__/`

| Arquivo                  | O que testa                     |
|--------------------------|---------------------------------|
| `useAuth.test.tsx`       | Hook de autenticação            |
| `useLicenseActions.test.tsx` | Ações de licenças           |
| `useToast.test.tsx`      | Sistema de notificações         |

### Setup de Teste

Arquivo: `src/test/setup.ts`
```typescript
import '@testing-library/jest-dom'
```

### Executar

```bash
# Todos os testes
npm test

# Modo watch
npm run test:watch

# Com coverage
npx vitest run --coverage
```

---

## 🔧 Solução de Problemas

### Erro: `Missing VITE_SUPABASE_URL environment variable`

**Causa:** Arquivo `.env` não configurado ou variável faltando.
**Solução:** Copie `.env.example` para `.env` e preencha as credenciais.

### Erro: `Failed to fetch` ao chamar Edge Function

**Causa:** Edge function não está deployada no Supabase.
**Solução:** Faça deploy da function específica pelo Dashboard.

### Erro: `RLS policy violation`

**Causa:** Política RLS bloqueando operação.
**Solução:** Verifique se o usuário tem a role correta em `user_roles`.

### Erro: `relation "public.resellers_with_email" does not exist`

**Causa:** Migration `007_resellers_view.sql` não foi executada.
**Solução:** Execute a migration no SQL Editor do Supabase.

### Erro de build: `Cannot find name 'signOut'`

**Causa:** Hook `useAuth` sem destructuring de `signOut`.
**Solução:** Adicione `signOut` ao destructuring: `const { user, signOut } = useAuth()`.

### Porta 5173 já em uso

```bash
# Alterar porta
npx vite --port 3000
```

---

## 📄 Licença

Proprietário. Uso interno autorizado.
