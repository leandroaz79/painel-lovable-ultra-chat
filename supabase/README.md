# 📦 ULTRA CHAT v4.5 - SUPABASE SETUP COMPLETO

## 🎉 ESTRUTURA CRIADA COM SUCESSO!

Todos os arquivos necessários para migração foram gerados na pasta `supabase/`.

---

## 📁 ESTRUTURA DE ARQUIVOS

```
supabase/
├── migrations/
│   └── 001_initial_schema.sql          # Schema completo do database
├── storage/
│   └── 001_storage_buckets.sql         # Configuração de storage buckets
├── functions/
│   ├── validate-license/
│   │   └── index.ts                    # Validação de licenças
│   ├── optimize-prompt/
│   │   └── index.ts                    # Otimização de prompts com IA
│   ├── process-extension-payment/
│   │   └── index.ts                    # Processamento de pagamentos
│   ├── upload-temp-image/
│   │   └── index.ts                    # Upload de imagens temporárias
│   ├── remove-watermark/
│   │   └── index.ts                    # Remoção de marca d'água
│   └── publish-project/
│       └── index.ts                    # Publicação de projetos
└── docs/
    ├── CHECKLIST_DEPLOY.md             # Checklist passo a passo
    ├── EDGE_FUNCTIONS_GUIDE.md         # Guia de uso das functions
    └── DATABASE_STRUCTURE.md           # Documentação do database

config.js                                # Configuração centralizada
config.example.js                        # Template de configuração
.gitignore                               # Arquivos ignorados pelo git
```

---

## 🚀 PRÓXIMOS PASSOS

### 1️⃣ **CRIAR PROJETO NO SUPABASE**
1. Acesse https://supabase.com/dashboard
2. Clique em "New Project"
3. Preencha:
   - Nome: Ultra Chat Production
   - Database Password: (gere uma senha forte)
   - Region: South America (mais próximo de Moçambique)
4. Aguarde criação (~2 minutos)

### 2️⃣ **COPIAR CREDENCIAIS**
No Dashboard do projeto criado:

**Project Settings > API:**
- [ ] Copiar `Project URL` → Anotar
- [ ] Copiar `anon public` key → Anotar
- [ ] Copiar `service_role` key → **Manter segredo!**

### 3️⃣ **EXECUTAR SCRIPTS SQL**

**3.1 Schema Principal:**
1. Abrir **SQL Editor** no dashboard
2. Copiar TODO conteúdo de `supabase/migrations/001_initial_schema.sql`
3. Colar e clicar em **RUN**
4. Verificar mensagem de sucesso

**3.2 Storage Buckets:**
1. Ainda no SQL Editor
2. Copiar conteúdo de `supabase/storage/001_storage_buckets.sql`
3. Executar
4. Ir em **Storage** no menu → Verificar 3 buckets criados

### 4️⃣ **CONFIGURAR EDGE FUNCTIONS**

**4.1 Instalar Supabase CLI:**
```powershell
# Via npm
npm install -g supabase

# Verificar instalação
supabase --version
```

**4.2 Login:**
```powershell
supabase login
```

**4.3 Link ao Projeto:**
```powershell
cd supabase
supabase link --project-ref [SEU-PROJECT-REF]
```
*PROJECT-REF: encontrar em Project Settings > General > Reference ID*

**4.4 Deploy Functions:**
```powershell
# Deploy todas de uma vez
supabase functions deploy

# Ou uma por uma
supabase functions deploy validate-license
supabase functions deploy optimize-prompt
supabase functions deploy process-extension-payment
supabase functions deploy upload-temp-image
supabase functions deploy remove-watermark
supabase functions deploy publish-project
```

**4.5 Configurar Secrets:**
```powershell
# Obrigatórios
supabase secrets set SUPABASE_URL=https://[seu-projeto].supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=[sua-service-role-key]

# Opcional: OpenAI para optimize-prompt
supabase secrets set OPENAI_API_KEY=[sua-chave-openai]

# Opcional: Gateway de pagamento
supabase secrets set MPESA_API_URL=[url-api-mpesa]
supabase secrets set MPESA_API_KEY=[chave-mpesa]
```

### 5️⃣ **ATUALIZAR EXTENSÃO**

**5.1 Preencher config.js:**
```javascript
// Abrir: config.js
// Substituir:
SUPABASE_URL: 'https://[SEU-PROJETO].supabase.co',
SUPABASE_ANON_KEY: '[SUA-ANON-KEY]',
```

**5.2 Atualizar manifest.json:**
```json
{
  "version": "4.5",
  "host_permissions": [
    "https://[SEU-NOVO-PROJETO].supabase.co/*"
  ]
}
```

**5.3 Modificar content.js (topo do arquivo):**
```javascript
// ADICIONAR no início:
import CONFIG from './config.js'

// SUBSTITUIR:
const SUPABASE_ANON_KEY = "eyJ[antiga]..."
const VALIDATE_URL = "https://wogunbzijppmeuleitjq..."

// POR:
const SUPABASE_ANON_KEY = CONFIG.SUPABASE_ANON_KEY
const VALIDATE_URL = `${CONFIG.SUPABASE_URL}/functions/v1/validate-license`
const OPTIMIZE_URL = `${CONFIG.SUPABASE_URL}/functions/v1/optimize-prompt`
const NOTIFICATIONS_URL = `${CONFIG.SUPABASE_URL}/rest/v1/notifications?select=*&order=created_at.desc&limit=20`
// ... (repetir para todas URLs)
```

**5.4 Fazer o mesmo em sidepanel.js**

### 6️⃣ **TESTAR LOCALMENTE**
1. Chrome → Extensões → Modo desenvolvedor
2. Remover extensão antiga
3. Carregar sem compactação → selecionar pasta do projeto
4. Abrir lovable.dev
5. Testar todas funcionalidades

### 7️⃣ **DEPLOY PRODUÇÃO**
1. Compactar extensão (.zip)
2. Chrome Web Store → Upload
3. Atualizar descrição
4. Enviar para revisão

---

## ✅ CHECKLIST RÁPIDO

- [ ] Projeto Supabase criado
- [ ] SQL schema executado (6 tabelas criadas)
- [ ] Storage buckets configurados (3 buckets)
- [ ] RLS verificado (todas tabelas com políticas)
- [ ] Edge Functions deployadas (6 functions)
- [ ] Secrets configurados
- [ ] config.js preenchido
- [ ] Extensão atualizada (imports)
- [ ] Testado localmente
- [ ] Publicado na Chrome Store

---

## 📚 DOCUMENTAÇÃO

Consulte os arquivos em `supabase/docs/`:

1. **CHECKLIST_DEPLOY.md** → Guia detalhado passo a passo
2. **EDGE_FUNCTIONS_GUIDE.md** → Como usar cada function
3. **DATABASE_STRUCTURE.md** → Estrutura completa do database

---

## 🔒 SEGURANÇA

### ⚠️ IMPORTANTE:

1. **NUNCA commitar config.js** (já está no .gitignore)
2. **Usar apenas config.example.js** no repositório
3. **Service Role Key** → Apenas em secrets das functions
4. **Anon Key** → Pode ser no client (RLS protege)

### Validações Implementadas:

✅ RLS em todas tabelas  
✅ Rate limiting em todas functions  
✅ Validação de inputs  
✅ Sanitização de dados  
✅ Device fingerprinting  
✅ Session management  

---

## 🆘 SUPORTE

### Problemas Comuns:

**Erro: "RLS policy violation"**
- Verificar RLS está habilitado
- Verificar políticas criadas corretamente

**Erro: "Function not found"**
- Verificar deploy das functions
- Verificar URL está correta

**Erro: "Invalid anon key"**
- Verificar chave copiada corretamente
- Verificar não tem espaços extras

**Erro: "Rate limit exceeded"**
- Aguardar 1-5 minutos
- Verificar não está em loop infinito

---

## 📊 ESTIMATIVA DE TEMPO

| Fase | Tempo |
|------|-------|
| Criar projeto Supabase | 5 min |
| Executar SQL scripts | 10 min |
| Deploy Edge Functions | 15 min |
| Atualizar extensão | 30 min |
| Testes | 20 min |
| **TOTAL** | **~80 min** |

---

## 🎯 RESULTADO ESPERADO

Após concluir todos passos:

✅ Novo backend Supabase seguro e otimizado  
✅ RLS protegendo todos dados sensíveis  
✅ Rate limiting prevenindo abuso  
✅ Extensão funcionando com novo backend  
✅ Sistema antigo ainda funcionando (transição gradual)  
✅ Zero downtime para usuários  

---

**Data de Criação:** 2026-06-07  
**Versão:** 4.5  
**Status:** ✅ Pronto para deploy

**Boa sorte com a migração! 🚀**
