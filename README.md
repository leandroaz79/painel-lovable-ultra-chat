# Painel Lovable Ultra Chat

Painel administrativo e de revendedor para gerenciamento de licenças, extensão Chrome e chaves temporárias do Lovable Ultra Chat.

## 🚀 Stack Tecnológico

- **Frontend**: React 19 + TypeScript + Vite
- **Estilo**: Tailwind CSS + CSS Custom Properties
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Autenticação**: Supabase Auth
- **Deploy**: Netlify / Easypanel (Docker)

## 📋 Pré-requisitos

- Node.js 20+
- npm ou yarn
- Conta Supabase ativa
- Git

## 🔧 Setup Local

### 1. Clonar repositório

```bash
git clone https://github.com/leandroaz79/painel-lovable-ultra-chat.git
cd painel-lovable-ultra-chat
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

```bash
cp .env.example .env.local
```

Editar `.env.local` com suas credenciais Supabase:

```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
VITE_API_URL=http://localhost:5173
```

### 4. Executar migrations Supabase

```bash
npx supabase db push
```

### 5. Deploy Edge Functions

```bash
npx supabase functions deploy
```

### 6. Iniciar servidor de desenvolvimento

```bash
npm run dev
```

Acesse http://localhost:5173

## 📦 Build para Produção

```bash
npm run build
npm run preview
```

## 🌐 Deploy Netlify

1. Conectar repositório GitHub no dashboard Netlify
2. Configurar variáveis de ambiente no Netlify
3. Build command: `npm run build`
4. Publish directory: `dist`

A configuração `netlify.toml` já está pronta com:
- SPA routing (redirects)
- Cache headers otimizados
- Security headers

## 🐳 Deploy Easypanel (Docker)

### Opção 1: Usando Docker Compose

```bash
# Build local
docker-compose up --build

# Acesse http://localhost:3000
```

### Opção 2: Usando Easypanel Dashboard

1. Conectar repositório GitHub
2. Configurar variáveis de ambiente
3. Definir porta: `3000`
4. Easypanel detecta `Dockerfile` automaticamente

**Variáveis necessárias:**
```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
VITE_API_URL=https://seu-dominio.com
```

## 📁 Estrutura do Projeto

```
src/
├── pages/              # Páginas principais
│   ├── Landing.tsx     # Landing page (100% responsiva)
│   ├── Login.tsx       # Autenticação
│   ├── admin/          # Painel administrativo
│   ├── reseller/       # Painel revendedor
│   └── user/           # Painel usuário
├── components/         # Componentes reutilizáveis
│   ├── ui/             # Componentes base (Button, Modal, etc)
│   └── [outros]/       # Específicos por feature
├── lib/                # Utilitários e helpers
├── index.css           # Estilos globais + mobile-first
└── App.tsx             # Componente raiz
```

## 📱 Responsividade

Landing page é **100% responsiva** com:
- Mobile-first architecture
- Fluid typography com `clamp()`
- Touch targets mínimos de 44px
- Breakpoints estratégicos (320px → 1920px+)
- CSS Grid + Flexbox adaptativo

Teste em múltiplas resoluções:
```
320px   (smartwatch)
375px   (mobile)
640px   (tablet portrait)
768px   (iPad)
1024px  (desktop)
1920px+ (ultrawide)
```

## 🔐 Segurança

- Variáveis sensíveis em `.env` (git-ignored)
- RLS (Row Level Security) no Supabase
- CORS configurado
- Security headers no Netlify/Easypanel

## 📝 Licenças e Planos

- **Professional**: R$ 39,90/mês
- **Business**: R$ 69,90/mês
- **Ultra Pro**: R$ 99,90/mês
- **Trial**: 30 min grátis (1x por usuário)

## 🚀 Funcionalidades

### Admin
- Dashboard com resumo de vendas
- Gerenciar revendedores (CRUD)
- Visualizar licenças ativas
- Gerar chaves temporárias

### Revendedor
- Dashboard com comissões
- Painel de vendas
- Histórico de transações

### Usuário
- Download da extensão
- Gerar chave trial (30 min)
- Visualizar planos disponíveis
- Gerenciar licenças ativas

## 🛠️ Desenvolvimento

Scripts disponíveis:

```bash
npm run dev        # Dev server
npm run build      # Build produção
npm run preview    # Preview build local
npm run type-check # Type checking
```

## 📞 Suporte

Para issues e dúvidas, abra uma issue no GitHub.

## 📄 Licença

Propriedade intelectual de Lovable Ultra Chat
