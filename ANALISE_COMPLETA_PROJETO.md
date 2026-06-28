# Analise Completa — painel-ultra-chat

## Resumo Executivo

Sistema SaaS white-label para gerenciamento de licencas de uma extensao Chrome chamada "Lovable Ultra Chat". Tres atores: admin, revendedor e usuario final. Pagamentos via PIX (Mercado Pago). Customizacao visual (branding) da extensao antes de download.

---

## 1. Stack Tecnologica

| Camada | Tecnologia | Versao |
|--------|-----------|--------|
| UI Framework | React | 19.2.x |
| Build Tool | Vite | 8.x |
| Linguagem | TypeScript | 6.x |
| CSS | Tailwind CSS | 3.4.x |
| Roteamento | React Router | 7.x |
| Backend/BaaS | Supabase | 2.108.x |
| Testes | Vitest + Testing Library | 4.1.x |
| Linting | ESLint | 10.x |
| Deploy | Docker / Vercel / Netlify | multiplas opcoes |

### Scripts npm

| Script | Comando | Funcao |
|--------|---------|--------|
| `dev` | `vite` | Servidor de desenvolvimento |
| `build` | `tsc -b && vite build` | Build de producao |
| `lint` | `eslint .` | Linting |
| `test` | `vitest run` | Testes one-shot |
| `test:watch` | `vitest` | Testes em watch mode |
| `preview` | `vite preview` | Preview do build local |

### Dependencias de Producao

| Pacote | Versao | Descricao |
|--------|--------|-----------|
| `@supabase/supabase-js` | `^2.108.0` | Cliente Supabase |
| `jszip` | `^3.10.1` | Manipulacao de ZIPs |
| `lucide-react` | `^1.21.0` | Icones SVG |
| `react` | `^19.2.6` | React 19 |
| `react-dom` | `^19.2.6` | ReactDOM 19 |
| `react-router-dom` | `^7.17.0` | Roteamento |
| `recharts` | `^3.8.1` | Graficos |

### Dependencias de Desenvolvimento

| Pacote | Versao | Descricao |
|--------|--------|-----------|
| `@testing-library/jest-dom` | `^6.9.1` | Matchers DOM |
| `@testing-library/react` | `^16.3.2` | Utilities teste React |
| `@testing-library/user-event` | `^14.6.1` | Simulacao eventos |
| `@vitejs/plugin-react` | `^6.0.1` | Plugin React Vite |
| `autoprefixer` | `^10.5.0` | Prefixos CSS |
| `eslint` | `^10.3.0` | Linter |
| `jsdom` | `^29.1.1` | DOM falso para testes |
| `postcss` | `^8.5.15` | Transformacoes CSS |
| `tailwindcss` | `^3.4.19` | Tailwind v3 |
| `typescript` | `~6.0.2` | TypeScript 6 |
| `vite` | `^8.0.12` | Build tool |
| `vitest` | `^4.1.8` | Runner de testes |

---

## 2. Estrutura de Diretorios

```
painel-ultra-chat/
├── src/
│   ├── main.tsx                      # Entry point: ReactDOM + ToastProvider
│   ├── App.tsx                       # Router com todas as rotas
│   ├── App.css
│   ├── index.css                     # Entry CSS
│   ├── assets/                       # hero.png, vite.svg, react.svg
│   ├── styles/                       # Design system
│   │   ├── tokens.css                # 27 CSS custom properties
│   │   ├── base.css                  # Reset + 5 keyframes
│   │   ├── components.css            # 413 linhas — cards, badges, tables, forms
│   │   ├── layout.css                # Sidebar, topbar, grid, responsivo
│   │   └── landing.css               # 208 linhas — estilos landing
│   ├── lib/
│   │   └── supabase.ts              # Cliente Supabase + mapa FUNCTIONS
│   ├── hooks/
│   │   ├── useAuth.ts                # Autenticacao + roles
│   │   ├── useTheme.ts               # Aplica tema CSS
│   │   ├── useLicenseActions.ts      # CRUD licencas
│   │   └── useToast.tsx             # Provider toast
│   ├── utils/
│   │   ├── format.ts                 # formatWhatsApp(), cleanDigits()
│   │   ├── themeStorage.ts           # localStorage tema + applyTheme()
│   │   ├── brandingStorage.ts        # localStorage branding
│   │   ├── templateStorage.ts        # IndexedDB template ZIP
│   │   └── extensionBuilder.ts       # Gera ZIP extensao (JSZip)
│   ├── pages/
│   │   ├── Landing.tsx               # Landing page publica
│   │   ├── Login.tsx                 # Login
│   │   ├── Signup.tsx                # Cadastro
│   │   ├── Checkout.tsx              # Checkout Pix
│   │   ├── admin/
│   │   │   ├── Dashboard.tsx         # Stats + criar/gerenciar licencas
│   │   │   ├── Customers.tsx         # CRUD clientes finais
│   │   │   ├── CustomerPurchases.tsx # Historico compras
│   │   │   ├── Resellers.tsx         # CRUD revendedores + creditos
│   │   │   ├── Sales.tsx             # Vendas creditos
│   │   │   ├── Products.tsx          # Tabela precos progressivos
│   │   │   ├── EndcustomerProducts.tsx # Planos cliente final
│   │   │   ├── Branding.tsx          # Gerador extensao
│   │   │   └── Theme.tsx             # Customizador cores
│   │   ├── reseller/
│   │   │   ├── Dashboard.tsx         # Painel revendedor + comprar creditos
│   │   │   └── Branding.tsx          # Branding revendedor
│   │   └── user/
│   │       └── Dashboard.tsx         # Painel usuario final
│   ├── components/
│   │   ├── AdminLayout.tsx           # Shell layout admin
│   │   ├── AdminSidebar.tsx          # Sidebar admin colapsavel
│   │   ├── AdminTopbar.tsx           # Topbar admin
│   │   ├── MobileMenu.tsx            # Menu mobile admin
│   │   ├── ResellerLayout.tsx        # Shell layout revendedor
│   │   ├── ResellerSidebar.tsx       # Sidebar revendedor
│   │   ├── ResellerMobileMenu.tsx    # Menu mobile revendedor
│   │   ├── BrandingGenerator.tsx     # UI geracao extensao branded
│   │   ├── ThemeCustomizer.tsx       # UI customizador cores
│   │   ├── TemplateManager.tsx       # Upload/remocao template ZIP
│   │   ├── SalesChart.tsx            # Grafico vendas (Recharts)
│   │   ├── ConfirmationDialog.tsx    # Modal confirmacao reutilizavel
│   │   ├── FormField.tsx             # Campo formulario padronizado
│   │   ├── LoadingOverlay.tsx        # Overlay carregamento
│   │   ├── EmptyState.tsx            # Estado vazio tabelas
│   │   ├── ui/
│   │   │   ├── button.tsx            # Button (5 variants, 5 sizes)
│   │   │   └── Logo.tsx              # Logo (5 variants)
│   │   └── landing/
│   │       ├── PromoBar.tsx          # Barra promocao topo
│   │       ├── Navbar.tsx            # Navegacao landing
│   │       ├── Hero.tsx              # Secao hero
│   │       ├── Steps.tsx             # Passos de uso
│   │       ├── PainPoints.tsx        # Dores do cliente
│   │       ├── Features.tsx          # 9 funcionalidades
│   │       ├── Pricing.tsx           # Tabela precos (busca do Supabase)
│   │       ├── AppMock.tsx           # Mockup visual extensao
│   │       ├── Testimonials.tsx      # 6 depoimentos hardcoded
│   │       ├── ComparisonTable.tsx   # Tabela comparativa
│   │       ├── FAQ.tsx               # 6 perguntas accordion
│   │       ├── FinalCTA.tsx          # CTA final
│   │       ├── Footer.tsx            # Rodape 4 colunas
│   │       ├── WhatsAppFAB.tsx       # Botao flutuante WhatsApp
│   │       ├── Reveal.tsx            # Animacao scroll (IntersectionObserver)
│   │       └── CheckoutModal.tsx     # Modal checkout multi-step
│   ├── test/
│   │   └── setup.ts
│   └── __tests__/
│       ├── useAuth.test.tsx           # 5 testes
│       ├── useLicenseActions.test.tsx # 4 testes
│       └── useToast.test.tsx          # 6 testes
├── supabase/
│   ├── migrations/                   # 13 migrations SQL
│   ├── functions/                    # 33 Edge Functions Deno
│   └── storage/
│       └── 001_storage_buckets.sql
├── lp-lovable/                       # Sub-projeto: TanStack Start
├── DOCs/                             # Documentacao
├── public/                           # Assets estaticos
├── Dockerfile                        # Build multi-stage Node 20
├── docker-compose.yml                # Orquestracao local
├── vercel.json                       # Deploy Vercel
├── netlify.toml                      # Deploy Netlify
└── Config files raiz
```

---

## 3. Rotas / Paginas

### Rotas Publicas

| Rota | Componente | Descricao |
|------|-----------|-----------|
| `/` | Landing | Landing page completa (14 secoes) |
| `/login` | Login | Autenticacao com redirect por role |
| `/signup` | Signup | Cadastro (nome, email, WhatsApp, CPF, senha) |
| `/checkout/:slug` | Checkout | Checkout PIX por produto |

### Rotas Protegidas — Usuario Final (role=user)

| Rota | Componente |
|------|-----------|
| `/user` | UserDashboard — licencas, trial, planos, download extensao |

### Rotas Protegidas — Admin (role=admin)

| Rota | Componente |
|------|-----------|
| `/admin` | AdminDashboard — stats, criar licencas |
| `/admin/customers` | Customers — CRUD clientes |
| `/admin/customer-purchases` | CustomerPurchases — historico compras |
| `/admin/resellers` | Resellers — CRUD revendedores + creditos |
| `/admin/sales` | Sales — vendas de creditos |
| `/admin/products` | Products — tabela precos progressivos |
| `/admin/endcustomer-products` | EndcustomerProducts — planos cliente final |
| `/admin/branding` | AdminBranding — gerador extensao |
| `/admin/theme` | AdminTheme — customizador cores |

### Rotas Protegidas — Revendedor (role=reseller)

| Rota | Componente |
|------|-----------|
| `/reseller` | ResellerDashboard — painel + comprar creditos |
| `/reseller/branding` | ResellerBranding — gerador extensao branded |

Todas as rotas protegidas usam `<ProtectedRoute>` que verifica `useAuth().role` contra `requiredRole`. Componentes sao carregados via `React.lazy()` com `<Suspense>`.

---

## 4. Banco de Dados — 17 Tabelas + 1 View + 5 Funcoes SQL

### Tabelas

| Tabela | Proposito |
|--------|-----------|
| `ts_licenses` | Tabela central — todas as licencas (trial/paga/vitalicia). Controla device_id, session_id, heartbeat, reseller_id |
| `resellers` | Dados revendedores + saldo creditos + estatisticas |
| `reseller_credit_transactions` | Log movimentacoes de credito (compra, bonus, delete devolve, consume) |
| `credit_purchases` | Compras de creditos por revendedores via PIX |
| `customer_purchases` | Compras diretas do cliente final |
| `user_trials` | Controle de trials (1 por pessoa, garante unicidade) |
| `user_roles` | Papels: admin, reseller, user |
| `admin_audit_logs` | Auditoria de todas as acoes administrativas |
| `packages` | Planos legados (MZN — Moçambique) |
| `products_endcustomer` | Planos atuais: TRY-7 (R$29.90/7d), ULTRA-15 (R$49.90/15d), ULTRA-30 (R$79.90/30d) |
| `product_pricing` | Tabela precos progressivos para revendedores |
| `product_pricing_history` | Historico alteracoes de preco |
| `reseller_activation_payments` | Pagamentos ativacao (R$300) |
| `payment_transactions` | Transacoes M-Pesa/e-Mola |
| `branding_configs` | Configuracoes branding por revendedor |
| `temp_images` | Upload temporario de imagens |
| `resellers_with_email` | View combinando resellers + auth.users |

### Funcoes SQL

| Funcao | Descricao |
|--------|-----------|
| `auto_cleanup_expired_trials()` | pg_cron a cada 5min — remove trials expiradas ha 3+ min |
| `increment_reseller_credits()` | Devolve credito ao revendedor ao deletar licenca paga |
| `consume_reseller_credit()` | Trigger no INSERT de ts_licenses — desconta 1 credito |
| `update_updated_at_column()` | Trigger para auto-atualizar updated_at |
| `handle_new_user()` | Trigger apos INSERT em auth.users — cria role padrao |

### Trigger Principal

O trigger `consume_reseller_credit` dispara automaticamente no INSERT de `ts_licenses`. Se a licenca nao for trial e tiver `reseller_id`, desconta 1 credito e registra em `reseller_credit_transactions`.

---

## 5. Edge Functions — 33 Funcoes Deno

### Dominio: Licencas e Validacao

| Funcao | JWT | Descricao |
|--------|-----|-----------|
| `validate-license` | Nao | Valida chave + device_id. Rate-limit 20 req/min por IP. Verifica expiracao, conflito de dispositivo, suporta heartbeats. |
| `user-create-trial` | Sim | Gera trial 30min. Consulta user_trials para garantir unicidade. Gera chave `TS-` + 20 hex chars. |

### Dominio: Pagamento Cliente Final

| Funcao | JWT | Descricao |
|--------|-----|-----------|
| `customer-create-payment` | Sim | Recebe product_slug + dados comprador. Cria pagamento PIX no Mercado Pago. Salva em customer_purchases. |
| `customer-webhook-mp` | Nao | Webhook Mercado Pago. Quando approved, gera license_key com prefixo (TRY7/ULTRA15/ULTRA30), insere em ts_licenses. |
| `customer-check-payment` | Sim | Polling do frontend. Retorna status + license_key se aprovada. |
| `check-payment-status` | Nao | Consulta direta API Mercado Pago por payment_id. |

### Dominio: Compra de Creditos (Revendedor)

| Funcao | JWT | Descricao |
|--------|-----|-----------|
| `reseller-buy-credits` | Sim | Cria pagamento PIX no Mercado Pago. Salva em credit_purchases. |
| `mercadopago-webhook` | Nao | Webhook para creditos. Quando aprovado, incrementa resellers.credits diretamente. |

### Dominio: Revendedor

| Funcao | JWT | Descricao |
|--------|-----|-----------|
| `reseller-register` | Sim | Cadastro como revendedor. Cria registro resellers (status=pending), role em user_roles, pagamento ativacao R$300. |
| `reseller-create-license` | Sim | Cria licencas. Trials gratuitas (max 30min). Paid/lifetime exigem creditos (trigger consome automaticamente). |
| `reseller-list-licenses` | Sim | Lista licencas criadas pelo revendedor. |
| `reseller-delete-license` | Sim | Exclui licenca propria. Se nao for trial, devolve 1 credito via RPC. |
| `reseller-dashboard` | Sim | Retorna saldo, estatisticas por status/tipo, 10 ultimas transacoes de credito. |

### Dominio: Gerenciamento Admin de Revendedores

| Funcao | JWT | Descricao |
|--------|-----|-----------|
| `admin-create-reseller` | Sim | Cria revendedor. Verifica se email existe em auth.users. Insere em resellers + user_roles. |
| `admin-manage-reseller` | Sim | Acoes: approve, suspend, add_credits (bonus), update_profile, delete. Gera audit logs. |
| `admin-list-resellers` | Sim | Lista todos os revendedores com email resolvido via auth.admin.getUserById. |

### Dominio: Gerenciamento Admin de Clientes

| Funcao | JWT | Descricao |
|--------|-----|-----------|
| `admin-list-customers` | Sim | Cruzamento auth.users + ts_licenses + user_trials. Exclui admin/reseller. Retorna contadores por status. |
| `admin-manage-customer` | Sim | Acoes: update_profile (auth.users + ts_licenses) e delete (remove do auth). Audit logs. |
| `admin-list-customer-purchases` | Sim | Lista compras cliente final com join products_endcustomer, paginacao server-side. |
| `admin-get-users` | Sim | Batch lookup de emails por array de user_ids. |

### Dominio: Admin de Licencas (auxiliares)

| Funcao | JWT | Descricao |
|--------|-----|-----------|
| `admin-list-licenses` | Sim | Lista licencas criadas direto por admin (reseller_id IS NULL). |
| `admin-create-license` | Sim | Criacao manual de qualquer tipo. |
| `admin-delete-license` | Sim | Exclui licenca. |
| `admin-revoke-license` | Sim | Suspends licenca. |
| `admin-renew-license` | Sim | Estende prazo da licenca. |
| `admin-reset-hwid` | Sim | Limpa device_id para permitir novo dispositivo. |
| `admin-cleanup-expired-trials` | Sim | Deleta trials expiradas (mesma logica do pg_cron, acionamento manual). |

### Dominio: Integracoes Externas (Lovable API)

| Funcao | JWT | Descricao |
|--------|-----|-----------|
| `create-lovable-project` | Sim | Verifica licenca ativa, chama POST api.lovable.dev/projects. |
| `publish-project` | Sim | Verifica licenca, chama POST api.lovable.dev/projects/{id}/deploy. |
| `remove-watermark` | Sim | Placeholder — API Lovable nao tem endpoint oficial. |

Rate-limit: 5 tentativas a cada 5 minutos por license_key (as 3 funcoes Lovable).

### Dominio: Pagamento Movil (Mocambique)

| Funcao | JWT | Descricao |
|--------|-----|-----------|
| `process-extension-payment` | Nao | Fluxo M-Pesa (prefixo 84/85) e e-Mola (86/87). Valida telefone mocambicano, busca pacote em packages, gera ou renova licenca. |

### Dominio: Utilitarios

| Funcao | JWT | Descricao |
|--------|-----|-----------|
| `optimize-prompt` | Sim | Otimiza prompts de IA. Rate-limit 10/min. Placeholder para integracao OpenAI/Anthropic. |
| `upload-temp-image` | Sim | Upload para bucket temp-images. Rate-limit 10/min. Aceita JPEG/PNG/WebP/GIF ate 20MB. |

---

## 6. Hooks (src/hooks/)

### useAuth.ts

- **Exporta**: `{ user, role, loading, signIn, signOut }`
- **Estado**: `user: User | null`, `role: 'admin' | 'reseller' | 'user' | null`, `loading: boolean`
- **Fluxo**:
  1. `supabase.auth.getSession()` — le sessao persistida
  2. `onAuthStateChange()` — listener sincroniza login/logout entre abas
  3. `fetchRole(userId)` — consulta `user_roles`, sem registro assume `'user'`
  4. `signIn()` — `signInWithPassword` + busca role
  5. `signOut()` — limpa state + `supabase.auth.signOut()`

### useLicenseActions.ts

- **Exporta**: `{ submitMutation, copyLicenseKey, renewLicense, resetHwid, revokeLicense, deleteLicense, showToast, fetchWithAuth }`
- **Padrao**: Toda chamada passa por `submitMutation` que desabilita botao, mostra "Processando...", executa callback, exibe toast
- **Chamadas HTTP**: Usa `fetch()` com header `Authorization: Bearer {token}` obtido de `supabase.auth.getSession()`
- **Rota inteligente**: `deleteLicense` aceita `isReseller` flag para alternar entre endpoint admin e revendedor

### useToast.tsx

- **Provider**: `ToastProvider` criado em `main.tsx`
- **Hook**: `{ toasts, showToast, removeToast }`
- **Comportamento**: Auto-dismiss apos 3600ms. Container fixo canto inferior-direito (z-index 9999)
- **Tipos**: `success` (fundo solido) e `error` (fundo vermelho translucido)

### useTheme.ts

- **Efeito colateral puro**: No mount, le cores salvas e aplica como CSS variables no `:root`
- **Fluxo**: `loadTheme()` -> `applyTheme(colors)` via `themeStorage.ts`

---

## 7. Utils (src/utils/)

### format.ts

- `formatWhatsApp(value)` — mascara progressiva `(XX) X XXXX-XXXX` (max 11 digitos)
- `cleanDigits(value)` — remove tudo que nao e digito

### themeStorage.ts

- Interface `ThemeColors` — 13 propriedades de cor
- `loadTheme()` / `saveTheme()` — persistencia em localStorage
- `applyTheme()` — injeta CSS variables no `:root` + variaveis derivadas (`--accent-rgb`, `--accent-light`, `--accent-bg`, `--accent-glow`)
- `resetTheme()` — remove todas as variaveis
- Funcao auxiliar `adjustHex(hex, percent)` — clareia/escurece cor

### brandingStorage.ts

- Interface `StoredBranding`: companyName, whatsapp, communityLink, primaryColor, secondaryColor
- Persistencia em localStorage com chave `ultra-branding-config`

### templateStorage.ts

- IndexedDB banco `branding-template`, object store `template`, chave `extension-zip`
- `storeTemplate()`, `getStoredTemplate()`, `removeStoredTemplate()`
- Trata falhas silenciosamente — retorna null/void

### extensionBuilder.ts

- Funcao principal `generateExtensionZip(templateZip, data)` — gera extensao white-label
- **Fluxo**:
  1. `JSZip.loadAsync(templateZip)` — carrega template
  2. `flattenZip()` — normaliza estrutura
  3. `gerarBrandingConfig()` — gera `branding.config.js` com IIFE que configura CSS vars, substitui textos, links WhatsApp, MutationObserver
  4. Redimensionamento de icones via canvas (16/32/48/128px)
  5. `replaceColorsInZip()` — substituicoes de cor em todos .js/.css/.html/.json
  6. Atualiza `manifest.json` com nome/descricao empresa
  7. Gera ZIP final com compressao DEFLATE nivel 9
- Paletas predefinidas: Roxo, Azul, Verde, Vermelho, Dourado, Preto Elegante

---

## 8. Design System (src/styles/)

### tokens.css — 27 variaveis CSS

| Categoria | Variaveis |
|-----------|-----------|
| Fundos | `--bg`, `--bg-soft` |
| Cartoes | `--card`, `--card-strong` |
| Bordas | `--line`, `--line-hot` |
| Tipografia | `--text`, `--muted`, `--muted-2` |
| Accent | `--accent`, `--accent-2`, `--accent-rgb`, `--accent-r`, `--accent-g`, `--accent-b`, `--accent-light`, `--accent-bg`, `--accent-glow` |
| Semanticas | `--danger`, `--warning`, `--cyan` |
| Layout | `--shadow`, `--radius`, `--radius-sm`, `--font` |

Suporte a dark mode (padrao) e light mode via `@media prefers-color-scheme`. Acessibilidade via `@media prefers-reduced-motion: reduce`.

### base.css

- Reset universal: `box-sizing: border-box`, `scroll-behavior: smooth`
- Body com radial gradients + grid overlay texturizado
- 5 keyframes: fadeIn, slideUp, slideIn, spin, pulse

### components.css (413 linhas)

- **Sidebar**: Menu lateral fixo, colapsavel (72px), items ativos, avatar, logout
- **Buttons**: 4 variantes (primary-action, ghost-action, danger-action, tiny-action)
- **Cards**: hero-panel (glow radial), glass-card, table-card
- **Forms**: stack-form, split-fields, inline-form, segmented toggle
- **Tables**: table-card com busca, scroll, badges (active/trial/expired/suspended)
- **Auth**: auth-page, auth-card
- **Modal**: modal-overlay com blur + slide-up animation
- **Stats**: stats-grid (6 colunas), metric-card

### layout.css

| Breakpoint | Comportamento |
|------------|---------------|
| Mobile (<768px) | Topbar 3 colunas, tabela vira cards empilhados, sidebar escondida, modal bottom-sheet |
| Tablet (768-1023px) | Grid 3 colunas stats |
| Desktop (1024px+) | Sidebar visivel, nav-links escondidos no topbar |
| Large (1440px+) | Shell maximizado 1400px |
| Touch devices | Remove transform hover |

### landing.css (208 linhas)

20 secoes: Header sticky blur, Hero grid 2col, Steps, Problem, Features 3col, Pricing, Testimonials, Comparison, FAQ accordion, CTA Final, Footer, classes utilitarias (.shimmer-band, .glass-card, .border-glow).

---

## 9. Componentes Principais

### Layout

- **AdminLayout**: Container flex com sidebar 240px + conteudo. Em <1024px sidebar oculta.
- **ResellerLayout**: Mesmo contrato, usa ResellerSidebar.
- **AdminSidebar**: 4 grupos, 10 links, iconMap com lucide-react, footer com avatar + logout. Colapsavel.
- **ResellerSidebar**: 6 itens, mesma mecanica.
- **AdminTopbar**: Header sticky com logo + nav horizontal + botao Sair.
- **MobileMenu / ResellerMobileMenu**: Hamburger em <768px, menu lateral 280px com overlay.

### BrandingGenerator

- Interface para gerar extensao white-label
- Upload de template ZIP (armazenado em IndexedDB via templateStorage)
- Formulario: nome empresa, WhatsApp, comunidade, cores primaria/secundaria
- Geracao via `generateExtensionZip()` do extensionBuilder
- Download do ZIP gerado

### ThemeCustomizer

- UI para customizar 13 cores do painel
- Pre-visualizacao em tempo real
- Salva em localStorage, aplica via CSS variables

### ConfirmationDialog

- Modal reutilizavel com `createPortal`
- Props: isOpen, title, message, onConfirm, onCancel, isDangerous
- Backdrop com clique para cancelar

### SalesChart

- Grafico de linhas duplo (vendas + receita) via Recharts
- Altura 300px, cores: accent (vendas) e cyan (receita)

---

## 10. Paginas de Dashboard

### AdminDashboard

- 12 states locais (licenses, stats, commercialStats, salesChartData, loading, filtros, paginacao, confirmDialog)
- Carrega: Edge Function LIST_LICENSES + queries diretas (credit_purchases, resellers, customer_purchases)
- Formularios: Gerar licenca (paid/lifetime), Gerar trial (max 30min), Resetar HWID
- Tabela com filtragem busca+status, paginacao client-side
- Acoes: Copiar, Renovar, Liberar PC, Revogar, Deletar

### ResellerDashboard

- ~20 states (licenses, creditos, modais, form comprador, pricing)
- **Realtime**: subscreve `postgres_changes` em `resellers` para creditos em tempo real
- Compra de creditos: modal -> tabela precos progressivos -> PIX QR Code -> polling 5s (max 10min)
- Tabela licencas: mesma logica do admin

### UserDashboard

- Nao usa AdminLayout — layout proprio estilo landing
- Secoes: Video tutorial (YouTube iframe), Download extensao (gera ZIP), Trial, Planos, Minhas licencas, Minhas compras
- Load via queries diretas ao Supabase (ts_licenses, customer_purchases, products_endcustomer, user_trials)

---

## 11. Fluxos de Dados Principais

### Fluxo Autenticacao

```
Login form -> signIn() -> supabase.auth.signInWithPassword()
    -> fetchRole(userId) -> supabase.from('user_roles').select()
    -> ProtectedRoute verifica role -> redireciona para dashboard correto
```

### Fluxo Compra Cliente Final

```
Landing/Checkout -> products_endcustomer por slug
    -> customer-create-payment (cria PIX no Mercado Pago)
    -> QR Code exibido -> Polling customer-check-payment (5s)
    -> customer-webhook-mp (callback Mercado Pago)
    -> Gera license_key (TRY7/ULTRA15/ULTRA30) -> insere em ts_licenses
    -> Redireciona para /user
```

### Fluxo Compra Creditos Revendedor

```
ResellerDashboard -> Modal compra -> Tabela precos progressivos
    -> reseller-buy-credits (cria PIX no Mercado Pago)
    -> QR Code -> Polling (5s, max 10min)
    -> mercadopago-webhook (callback)
    -> Incrementa resellers.credits + credit_purchases.status
    -> Realtime atualiza dashboard
```

### Fluxo Criacao Licenca

```
Admin/ResellerDashboard -> Formulario (type, days)
    -> admin-create-license OU reseller-create-license
    -> Gera chave TS- + 20 hex chars
    -> INSERT em ts_licenses
    -> Trigger consume_reseller_credit (se nao for trial, desconta 1 credito)
```

### Fluxo Validacao Licenca (Extensao Chrome)

```
Extensao -> validate-license (license_key + device_id)
    -> Rate-limit 20/min por IP
    -> Verifica expiracao (atualiza status automaticamente)
    -> Verifica conflito de dispositivo
    -> Retorna validade + dados da licenca
    -> Suporta heartbeats periodicos para manter sessao ativa
```

### Fluxo Branding/Download Extensao

```
BrandingGenerator -> Upload template ZIP (IndexedDB)
    -> Formulario: empresa, WhatsApp, cores
    -> extensionBuilder.generateExtensionZip()
    -> JSZip carrega template -> substitui cores/textos/links
    -> Gera branding.config.js com IIFE
    -> Redimensiona icones via canvas
    -> Atualiza manifest.json
    -> downloadZip() -> usuario recebe extensao personalizada
```

---

## 12. Seguranca

- **Autenticacao duplicada**: Funcoes admin criam dois clientes Supabase (JWT do usuario + SERVICE_ROLE_KEY)
- **Webhooks sem JWT**: customer-webhook-mp, mercadopago-webhook, validate-license, check-payment-status
- **Rate limiting in-memory**: validate-license (20/min), upload-temp-image (10/min), optimize-prompt (10/min), Lovable functions (5/5min), process-extension-payment (3/5min). Nota: state e perdido entre cold starts do Deno.
- **RLS policies**: Cada ator so enxerga seus proprios dados, exceto admins com visao total
- **ATENcao**: Tokens Mercado Pago hardcoded em 3 arquivos (customer-create-payment, reseller-buy-credits, check-payment-status). Deveriam estar em variaveis de ambiente.

---

## 13. Deploy

### Docker

- Build multi-stage: Node 20 Alpine
- Builder: npm ci + npm run build
- Production: serve estatico na porta 3000
- Healthcheck: 30s interval, 3 tentativas
- Rede bridge: lovable-network
- ARGs: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_URL

### Vercel

- SPA rewrite: `/(.*)` -> `/`

### Netlify

- Build: npm run build
- SPA redirect: `/*` -> `/index.html`
- Headers seguranca: X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy
- Cache assets: max-age=31536000, immutable

### Variaveis Obrigatorias

| Variavel | Descricao |
|----------|-----------|
| `VITE_SUPABASE_URL` | URL projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Chave anonima Supabase |
| `VITE_API_URL` | URL da API (varia por ambiente) |

---

## 14. Testes

| Arquivo | Hooks testados | Cenarios |
|---------|---------------|----------|
| `useToast.test.tsx` | useToast, ToastProvider | 6 testes: erro sem provider, adicionar toast, tipo error, remover, auto-remove 3.7s, multiplos |
| `useLicenseActions.test.tsx` | useLicenseActions | 4 testes: copiar chave, desabilitar botao, retorno true/false, mutacao sem license_key |
| `useAuth.test.tsx` | useAuth | 5 testes: estado inicial loading, sessao+role, signIn, signOut, subscription |

Mocks: Supabase client, navigator.clipboard, window.confirm, fake timers.

---

## 15. Sub-Projeto: lp-lovable/

Landing page separada usando TanStack Start (SSR/SSG com Nitro/Cloudflare). Stack: Radix UI (21 componentes), Tailwind CSS v4, react-hook-form + zod, react-query. Build via Vite com plugin @lovable.dev/vite-tanstack-config.
