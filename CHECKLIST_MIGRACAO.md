# 📋 Checklist de Migração - Painel Ultra Chat

Este documento contém o passo a passo completo para configurar o projeto em uma **nova máquina de desenvolvimento**, garantindo que nada seja esquecido e que o ambiente fique 100% funcional.

---

## ✅ Pré-migração (Origem)

Antes de sair da máquina atual, garanta que estes passos foram executados:

- [ ] **Commit e push** de todas as alterações para o repositório Git remoto
  ```bash
  git status                      # Verificar alterações pendentes
  git add .                       # Adicionar arquivos alterados
  git commit -m "descrição"       # Commitar
  git push origin <branch>        # Enviar para remoto
  ```
- [ ] **Exportar variáveis de ambiente** da máquina atual (`cat .env`) e salvar em local seguro (cofre de senhas ou .env.example)
- [ ] **Anotar as credenciais do Supabase** (caso não estejam no .env da máquina atual):
  - Project URL
  - anon key (pública)
  - service_role key (privada)
- [ ] **(Opcional) Fazer dump do banco de dados local** se usar Supabase local:
  ```bash
  supabase db dump -f supabase/seed.sql
  ```
- [ ] **Verificar se `.gitignore` está correto** — nenhum arquivo `.env` ou `.env.*.local` está versionado
- [ ] **Verificar se o projeto compila** antes de encerrar:
  ```bash
  npm run build
  ```

---

## 🔧 Setup da Nova Máquina (Destino)

### 1. Instalar Pré-requisitos

- [ ] **Node.js 20.x** instalado
  ```bash
  node --version    # Deve exibir v20.x.x
  ```
  Download: [nodejs.org](https://nodejs.org/)

- [ ] **Git** instalado
  ```bash
  git --version     # Deve exibir 2.x.x
  ```

- [ ] **npm** disponível (acompanha Node.js)
  ```bash
  npm --version     # Deve exibir 10.x+
  ```

- [ ] **(Opcional) Docker + Docker Compose** instalado (para produção via container)
  ```bash
  docker --version
  docker compose version
  ```

- [ ] **(Opcional) Supabase CLI** instalado
  ```bash
  npm install -g supabase
  supabase --version   # Deve exibir 2.98.2+
  ```

### 2. Clonar o Repositório

- [ ] Clonar o projeto
  ```bash
  git clone <url-do-repositorio> painel-ultra-chat
  cd painel-ultra-chat
  ```

- [ ] Verificar branch correta (geralmente `main` ou `master`)
  ```bash
  git branch          # Asterisco na branch correta
  ```

### 3. Instalar Dependências

- [ ] Instalar pacotes npm
  ```bash
  npm install
  ```

- [ ] Verificar se não há erros de instalação (verificar warnings apenas, sem errors)

### 4. Configurar Variáveis de Ambiente

- [ ] Criar arquivo `.env` a partir do template
  ```bash
  cp .env.example .env
  ```

- [ ] Editar `.env` com as credenciais reais do Supabase:
  ```env
  VITE_SUPABASE_URL=https://seu-projeto.supabase.co
  VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
  VITE_API_URL=http://localhost:5173
  ```

  **Onde encontrar as chaves:**
  - Supabase Dashboard > Settings > API > Project URL
  - Supabase Dashboard > Settings > API > anon public key
  - Supabase Dashboard > Settings > API > service_role key (apenas para deploy de Edge Functions)

- [ ] Garantir que `.env` está no `.gitignore` (confirmar que não será commitado)
  ```bash
  cat .gitignore | grep -i ".env"
  ```

### 5. Configurar o Banco de Dados (Supabase)

- [ ] **Criar projeto no Supabase** (se ainda não existir)
  - Acessar [supabase.com/dashboard](https://supabase.com/dashboard)
  - Clicar em "New project"
  - Escolher nome, região e senha do banco
  - Aguardar provisionamento

- [ ] **Executar as migrations no SQL Editor**, na ordem exata abaixo:

  | Ordem | Migration                          | Descrição                    |
  |-------|------------------------------------|------------------------------|
  | 1     | `001_initial_schema.sql`           | Schema base                  |
  | 2     | `002_admin_audit_logs.sql`         | Auditoria admin              |
  | 3     | `003_auto_cleanup_trials.sql`      | Limpeza de trials            |
  | 4     | `004_resellers_system.sql`         | Sistema de revendedores      |
  | 5     | `004_increment_reseller_credits.sql` | Trigger de créditos        |
  | 6     | `005_credit_purchases.sql`         | Compras de créditos          |
  | 7     | `006_reseller_credits_log.sql`     | Log de créditos              |
  | 8     | `007_resellers_view.sql`           | View de revendedores         |
  | 9     | `008_product_pricing.sql`          | Precificação                 |
  | 10    | `009_add_name_whatsapp_to_resellers.sql` | Nome/WhatsApp revendedor |
  | 11    | `010_user_trials.sql`              | Controle de trial            |

  Como executar:
  ```bash
  # Abrir cada arquivo e copiar o conteúdo
  # Colar no SQL Editor do Supabase Dashboard
  # Clicar em "Run" (ou Ctrl+Enter)
  ```

- [ ] **Verificar se todas as tabelas foram criadas**
  ```sql
  SELECT table_name FROM information_schema.tables
  WHERE table_schema = 'public'
  ORDER BY table_name;
  ```

### 6. Deployar Edge Functions

Para deploy das Edge Functions no Supabase:

- [ ] Deployar via **Supabase Dashboard** (método usado atualmente):
  1. Acessar Supabase Dashboard > Edge Functions
  2. Para cada function listada abaixo, criar uma nova function:
     - Copiar o conteúdo do arquivo `supabase/functions/<function-name>/index.ts`
     - Colar no editor do Dashboard
     - Clicar em "Deploy"
  3. Functions obrigatórias:
     - `admin-list-licenses`
     - `admin-create-license`
     - `admin-delete-license`
     - `admin-renew-license`
     - `admin-revoke-license`
     - `admin-reset-hwid`
     - `admin-cleanup-expired-trials`
     - `admin-create-reseller`
     - `admin-manage-reseller`
     - `admin-manage-customer`
     - `admin-list-customers`
     - `admin-get-users`
     - `admin-list-resellers`
     - `reseller-dashboard`
     - `reseller-create-license`
     - `reseller-list-licenses`
     - `reseller-delete-license`
     - `reseller-buy-credits`
     - `reseller-register`
     - `user-create-trial`
     - `validate-license`
     - `mercadopago-webhook`
     - `check-payment-status`
     - `process-extension-payment`
     - `optimize-prompt`
     - `upload-temp-image`
     - `create-lovable-project`
     - `publish-project`
     - `remove-watermark`

- [ ] **Se preferir via CLI** (alternativa):
  ```bash
  supabase link --project-ref <project-ref>
  supabase secrets set SUPABASE_URL=<url> SUPABASE_SERVICE_ROLE_KEY=<key> SUPABASE_ANON_KEY=<key>
  supabase functions deploy <function-name>
  ```

- [ ] **Configurar secrets** das Edge Functions no Dashboard > Edge Functions > Secrets:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

### 7. Verificar Configuração de Autenticação (Supabase Auth)

- [ ] No Supabase Dashboard > Authentication > Settings:
  - Verificar se os provedores de autenticação estão configurados (email/password padrão)
  - `SITE_URL` configurado (ex: `http://localhost:5173` para dev)
  - Redirect URLs configuradas (ex: `http://localhost:5173/**`)

### 8. Criar Usuário Admin

- [ ] Acessar a aplicação em `http://localhost:5173`
- [ ] Clicar em "Criar conta" na Landing Page
- [ ] Preencher nome, email e senha
- [ ] Confirmar cadastro (verificar email de confirmação ou desabilitar confirmação no Supabase)
- [ ] No Supabase Dashboard > SQL Editor, executar:
  ```sql
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    '<UUID-DO-USUARIO-AUTENTICADO>',
    'admin'
  )
  ON CONFLICT (user_id, role) DO NOTHING;
  ```
- [ ] Fazer logout e login novamente — deve redirecionar para `/admin`

---

## 🔄 Pós-migração (Validação)

### 9. Validar o Build

- [ ] Compilar o frontend sem erros
  ```bash
  npm run build
  ```
- [ ] Verificar se não há erros TypeScript, de importação ou de sintaxe

### 10. Validar o Funcionamento

- [ ] **Login admin** em `/login` — redireciona para `/admin`
- [ ] **Dashboard admin** carrega métricas, gráficos e licenças
- [ ] **Criar uma licença** de teste
- [ ] **Listar licenças** — nova licença aparece na tabela
- [ ] **Renovar, revogar e deletar** licença
- [ ] **Gestão de revendedores** em `/admin/resellers`
- [ ] **Gestão de clientes** em `/admin/customers`
- [ ] **Vendas** em `/admin/sales`
- [ ] **Produtos** em `/admin/products`
- [ ] **Logout** funciona corretamente

### 11. Validar Perfil Revendedor

- [ ] Criar um revendedor em `/admin/resellers`
- [ ] Fazer login como revendedor em `/login`
- [ ] Dashboard revendedor carrega corretamente
- [ ] Criar licença como revendedor
- [ ] Listar licenças do revendedor
- [ ] Comprar créditos (testar geração de pagamento)

### 12. Validar Perfil Cliente Final

- [ ] Criar conta de cliente na Landing Page
- [ ] Fazer login como cliente
- [ ] Dashboard cliente carrega
- [ ] Gerar trial gratuito
- [ ] Verificar licença trial na listagem

### 13. Validar APIs Externas

- [ ] **Edge Functions**: testar pelo menos uma chamada de cada perfil (admin, revendedor, cliente)
  ```javascript
  // Exemplo: listar licenças via admin
  fetch('https://<project>.supabase.co/functions/v1/admin-list-licenses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  })
  ```
- [ ] **Mercado Pago**: verificar webhook está acessível (se aplicável)
- [ ] **Supabase Auth**: login, signup, logout funcionam

### 14. Validar Ferramentas de Colaboração

- [ ] **Git**: `git pull`, `git push` funcionam
- [ ] **Editor/IDE**: VS Code ou WebStorm reconhece TypeScript e ESLint

---

## 🔐 Pacote de Migração (Recursos Não Versionados)

Os seguintes recursos NÃO estão no repositório Git e precisam ser transferidos separadamente:

### Arquivos Sensíveis
| Recurso              | Localização       | Como transferir              |
|----------------------|-------------------|------------------------------|
| `.env` (credenciais) | Raiz do projeto   | Copiar manualmente ou salvar em cofre de senhas |
| `service_role.key`   | Supabase Dashboard | Acessar Dashboard > Settings > API |

### Serviços Externos (Credenciais)
| Serviço           | O que salvar                              | Onde encontrar                    |
|-------------------|-------------------------------------------|-----------------------------------|
| Supabase          | Project URL, anon key, service_role key   | Dashboard > Settings > API        |
| Mercado Pago      | Access Token, Public Key, Webhook Secret  | Mercado Pago Developers           |
| Netlify/Vercel    | Auth token (se aplicável)                 | Dashboard da plataforma           |

### Dados de Desenvolvimento
| Recurso                | Localização                       | Backup / Restauração                           |
|------------------------|-----------------------------------|-------------------------------------------------|
| Dados do banco local   | Supabase local (Docker)           | `supabase db dump -f backup.sql`               |
| Dados do banco remoto  | Supabase remoto                   | Acessar Dashboard > Database > Backup           |

---

## 📝 Script de Verificação Rápida

Execute este script para verificar se o ambiente está pronto:

```bash
#!/bin/bash
echo "=== Verificação de Ambiente ==="

echo -n "Node.js: "
node --version 2>/dev/null || echo "NÃO INSTALADO"

echo -n "npm: "
npm --version 2>/dev/null || echo "NÃO INSTALADO"

echo -n "Git: "
git --version 2>/dev/null || echo "NÃO INSTALADO"

echo -n "Docker: "
docker --version 2>/dev/null || echo "NÃO INSTALADO (opcional)"

echo -n ".env: "
[ -f .env ] && echo "PRESENTE" || echo "AUSENTE - criar com cp .env.example .env"

echo -n "node_modules: "
[ -d node_modules ] && echo "INSTALADO" || echo "AUSENTE - executar npm install"

echo -n "Build: "
[ -d dist ] && echo "PRESENTE" || echo "AUSENTE - executar npm run build"
```

---

## 🔄 Procedimento de Emergência (Rollback)

Se algo der errado durante a migração:

1. **Reverter código**: `git checkout -- .` para descartar alterações locais
2. **Reinstalar dependências**: `rm -rf node_modules && npm install`
3. **Resetar banco**: Executar migrations novamente do zero no SQL Editor
4. **Restaurar `.env`**: Recuperar do cofre de senhas

---

## 📌 Resumo de Comandos

```bash
# Clone e setup
git clone <url> && cd painel-ultra-chat
cp .env.example .env          # Editar com credenciais reais
npm install
npm run dev                   # http://localhost:5173

# Build produção
npm run build
npm run preview               # http://localhost:4173

# Docker
docker compose build
docker compose up -d          # http://localhost:3000

# Testes
npm test
npm run test:watch
npm run lint

# Deploy Netlify
netlify deploy --prod
```
