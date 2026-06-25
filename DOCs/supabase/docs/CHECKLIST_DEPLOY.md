# ============================================================================
# CHECKLIST DE DEPLOY - ULTRA CHAT v4.5
# Data: 2026-06-07
# ============================================================================

## 📋 PRÉ-REQUISITOS

- [ ] Criar novo projeto no Supabase
- [ ] Anotar SUPABASE_URL do novo projeto
- [ ] Anotar SUPABASE_ANON_KEY do novo projeto
- [ ] Anotar SUPABASE_SERVICE_ROLE_KEY (manter seguro!)

---

## 🗄️ FASE 1: CONFIGURAÇÃO DO DATABASE

### 1.1 Executar Schema SQL
- [ ] Abrir Supabase Dashboard > SQL Editor
- [ ] Copiar conteúdo de `supabase/migrations/001_initial_schema.sql`
- [ ] Executar script completo
- [ ] Verificar se todas tabelas foram criadas:
  - [ ] ts_licenses
  - [ ] notifications
  - [ ] packages
  - [ ] extension_versions
  - [ ] user_roles
  - [ ] payment_transactions

### 1.2 Verificar RLS (Row Level Security)
- [ ] Ir em Database > Tables
- [ ] Para cada tabela, verificar que RLS está ENABLED:
  - [ ] ts_licenses ✓
  - [ ] notifications ✓
  - [ ] packages ✓
  - [ ] extension_versions ✓
  - [ ] user_roles ✓
  - [ ] payment_transactions ✓

### 1.3 Verificar Políticas RLS
- [ ] Cada tabela tem pelo menos 1 política ativa
- [ ] Testar acesso anon (não deve ver dados sensíveis)
- [ ] Testar acesso authenticated (deve ver apenas próprios dados)

### 1.4 Verificar Funções
- [ ] Função `update_updated_at_column()` existe
- [ ] Função `generate_license_key()` existe
- [ ] Testar: `SELECT generate_license_key();` (deve retornar chave TS-XXXX)

### 1.5 Verificar Dados Seed
- [ ] Tabela `packages` tem 4 planos
- [ ] Tabela `notifications` tem notificação de boas-vindas

---

## 📦 FASE 2: CONFIGURAÇÃO DO STORAGE

### 2.1 Criar Buckets
- [ ] Abrir Storage no Dashboard
- [ ] Executar `supabase/storage/001_storage_buckets.sql` no SQL Editor
- [ ] Verificar buckets criados:
  - [ ] extension-releases (público)
  - [ ] temp-images (público)
  - [ ] user-uploads (privado)

### 2.2 Configurar Políticas de Storage
- [ ] extension-releases:
  - [ ] Public SELECT habilitado
  - [ ] Service role INSERT habilitado
- [ ] temp-images:
  - [ ] Public INSERT habilitado (com filtro de data)
  - [ ] Public SELECT habilitado
- [ ] user-uploads:
  - [ ] Users INSERT em própria pasta
  - [ ] Users SELECT/DELETE próprios arquivos

### 2.3 Testar Upload
- [ ] Fazer upload teste em cada bucket via Dashboard
- [ ] Verificar URLs públicas funcionam
- [ ] Deletar arquivos de teste

---

## ⚡ FASE 3: DEPLOY DAS EDGE FUNCTIONS

### 3.1 Instalar Supabase CLI
```bash
# Windows (PowerShell)
scoop install supabase

# Ou via npm
npm install -g supabase
```

### 3.2 Login e Link ao Projeto
```bash
supabase login
supabase link --project-ref [SEU-PROJECT-REF]
```

### 3.3 Deploy das Functions
```bash
cd supabase/functions

# Deploy individual
supabase functions deploy validate-license
supabase functions deploy optimize-prompt
supabase functions deploy process-extension-payment
supabase functions deploy upload-temp-image
supabase functions deploy remove-watermark
supabase functions deploy publish-project

# Ou deploy todas de uma vez
supabase functions deploy
```

### 3.4 Configurar Secrets (Variáveis de Ambiente)
```bash
# Obrigatórias
supabase secrets set SUPABASE_URL=[SUA-URL]
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=[SUA-CHAVE]

# Opcionais (para optimize-prompt com OpenAI)
supabase secrets set OPENAI_API_KEY=[SUA-CHAVE-OPENAI]

# Para gateway de pagamento (M-Pesa/e-Mola)
supabase secrets set MPESA_API_URL=[URL-API]
supabase secrets set MPESA_API_KEY=[CHAVE]
supabase secrets set EMOLA_API_URL=[URL-API]
supabase secrets set EMOLA_API_KEY=[CHAVE]
```

### 3.5 Testar Edge Functions
- [ ] validate-license:
  ```bash
  curl -X POST https://[PROJECT].supabase.co/functions/v1/validate-license \
    -H "Content-Type: application/json" \
    -d '{"license_key":"TS-TEST"}'
  ```
- [ ] optimize-prompt (com licença válida)
- [ ] upload-temp-image (testar upload)
- [ ] Verificar logs: Dashboard > Edge Functions > Logs

---

## 🔧 FASE 4: ATUALIZAR EXTENSÃO

### 4.1 Atualizar config.js
- [ ] Abrir `config.js` na raiz
- [ ] Inserir nova SUPABASE_URL em `production`
- [ ] Inserir nova SUPABASE_ANON_KEY em `production`
- [ ] Salvar arquivo

### 4.2 Atualizar manifest.json
- [ ] Incrementar versão: `"version": "4.5"`
- [ ] Atualizar host_permissions com nova URL Supabase

### 4.3 Atualizar content.js
- [ ] Substituir imports:
  ```javascript
  // ANTES:
  const SUPABASE_ANON_KEY = "eyJ[antiga]..."
  
  // DEPOIS:
  import CONFIG from './config.js'
  const SUPABASE_ANON_KEY = CONFIG.SUPABASE_ANON_KEY
  const VALIDATE_URL = `${CONFIG.SUPABASE_URL}/functions/v1/validate-license`
  // ... (repetir para todas URLs)
  ```

### 4.4 Atualizar sidepanel.js
- [ ] Fazer mesmas alterações que em content.js
- [ ] Importar CONFIG
- [ ] Substituir todas URLs hardcoded

### 4.5 Adicionar config.js ao manifest
```json
"content_scripts": [{
  "js": ["config.js", "jszip.min.js", "hwFingerprint.js", ...]
}]
```

### 4.6 Criar .gitignore
```
# Arquivo de configuração com chaves
config.js

# Node modules
node_modules/

# Build
dist/
*.zip
```

### 4.7 Criar config.example.js
- [ ] Copiar config.js para config.example.js
- [ ] Substituir chaves por placeholders
- [ ] Commitar config.example.js (não config.js)

---

## 🧪 FASE 5: TESTES LOCAIS

### 5.1 Testar Extensão Localmente
- [ ] Chrome > Extensões > Modo desenvolvedor
- [ ] Carregar extensão sem compactação
- [ ] Abrir lovable.dev
- [ ] Verificar sincronização de token

### 5.2 Testar Fluxo de Licença
- [ ] Inserir chave de teste
- [ ] Verificar validação
- [ ] Verificar heartbeat (aguardar 1 min)
- [ ] Verificar countdown de trial

### 5.3 Testar Funcionalidades
- [ ] Enviar prompt simples
- [ ] Otimizar prompt (botão IA)
- [ ] Anexar imagem (upload temp)
- [ ] Anexar arquivo PDF
- [ ] Modo Plano on/off
- [ ] Reconhecimento de voz
- [ ] Histórico de mensagens
- [ ] Notificações
- [ ] Remover watermark
- [ ] Publicar projeto

### 5.4 Testar Sistema de Pagamento
- [ ] Abrir tela de pagamento
- [ ] Verificar listagem de pacotes
- [ ] Testar validação de número
- [ ] Simular pagamento (se em dev)

---

## 🚀 FASE 6: DEPLOY EM PRODUÇÃO

### 6.1 Build Final
- [ ] Testar todas funcionalidades novamente
- [ ] Verificar console (sem erros)
- [ ] Compactar extensão (.zip)

### 6.2 Publicar na Chrome Web Store
- [ ] Fazer upload do .zip
- [ ] Atualizar descrição (mencionar v4.5)
- [ ] Adicionar screenshots atualizados
- [ ] Enviar para revisão

### 6.3 Notificar Usuários
- [ ] Criar notificação no Supabase:
  ```sql
  INSERT INTO notifications (title, message, is_active, priority)
  VALUES (
    'Atualização Importante v4.5',
    'Nova versão com melhorias de segurança e performance. Atualize agora!',
    TRUE,
    10
  );
  ```

### 6.4 Criar Alerta de Versão
```sql
INSERT INTO extension_versions (version, changelog, is_alert_active, is_mandatory)
VALUES (
  '4.5',
  'Melhorias de segurança\nNovo backend otimizado\nPerformance aprimorada',
  TRUE,
  FALSE
);
```

---

## 📊 FASE 7: MONITORAMENTO PÓS-DEPLOY

### 7.1 Primeiras 24h
- [ ] Monitorar logs Edge Functions (erros?)
- [ ] Verificar RLS (acesso negado indevido?)
- [ ] Monitorar tabela ts_licenses (validações)
- [ ] Verificar payment_transactions (pagamentos)

### 7.2 Métricas
- [ ] Quantas licenças validadas com sucesso?
- [ ] Quantos erros 429 (rate limit)?
- [ ] Tempo médio de resposta das functions
- [ ] Storage usado (temp-images)

### 7.3 Limpeza Automática
- [ ] Configurar cron job para limpar temp-images:
  ```sql
  -- Executar diariamente via Supabase Dashboard
  SELECT cleanup_temp_images();
  ```

### 7.4 Backup
- [ ] Fazer backup do database após 7 dias
- [ ] Exportar tabela ts_licenses
- [ ] Exportar payment_transactions

---

## 🔄 FASE 8: DESATIVAÇÃO DO SISTEMA ANTIGO

### 8.1 Após 14 Dias (se tudo estável)
- [ ] Desativar edge functions antigas
- [ ] Manter database antigo por mais 30 dias (backup)
- [ ] Redirecionar URLs antigas (se possível)

### 8.2 Comunicação
- [ ] Email para usuários que ainda usam v4.4
- [ ] Notificação in-app mandatória

---

## ✅ CHECKLIST FINAL

- [ ] Todas tabelas criadas com RLS ✓
- [ ] Todas edge functions deployadas ✓
- [ ] Storage buckets configurados ✓
- [ ] Extensão atualizada e testada ✓
- [ ] config.js não commitado ✓
- [ ] Versão publicada na Chrome Store ✓
- [ ] Usuários notificados ✓
- [ ] Monitoramento ativo ✓

---

## 📞 SUPORTE EM CASO DE PROBLEMAS

### Erro: "RLS policy violation"
- Verificar políticas RLS estão ativas
- Verificar role correto (anon/authenticated/service_role)

### Erro: "Function timeout"
- Otimizar queries (adicionar índices)
- Verificar rate limiting não está muito agressivo

### Erro: "Storage upload failed"
- Verificar tamanho do arquivo (< 20MB)
- Verificar tipo MIME permitido
- Verificar políticas de storage

### Erro: "Invalid license key"
- Verificar chave existe no database
- Verificar status = 'active'
- Verificar não expirou

---

**Data de Deploy:** _________
**Responsável:** _________
**Status:** ⬜ Não iniciado | ⬜ Em andamento | ⬜ Concluído
