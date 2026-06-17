# ⚡ QUICK START - ULTRA CHAT v4.5

## 🎯 COMEÇE AQUI!

Guia de 5 minutos para entender o que fazer.

---

## 📦 O QUE VOCÊ TEM

```
✅ 1 script SQL de schema (6 tabelas + RLS)
✅ 1 script SQL de storage (3 buckets)
✅ 6 Edge Functions em TypeScript
✅ 3 documentos de referência
✅ Configuração centralizada
```

---

## 🚀 3 PASSOS PRINCIPAIS

### PASSO 1: SUPABASE DASHBOARD (15 min)
```
1. Criar novo projeto em supabase.com
2. SQL Editor → Colar e executar 001_initial_schema.sql
3. SQL Editor → Colar e executar 001_storage_buckets.sql
4. Copiar URL + anon_key do projeto
```

### PASSO 2: TERMINAL (20 min)
```powershell
# Instalar CLI
npm install -g supabase

# Login
supabase login

# Ir para pasta functions
cd supabase

# Link ao projeto
supabase link --project-ref [SEU-REF]

# Deploy functions
supabase functions deploy

# Configurar secrets
supabase secrets set SUPABASE_URL=https://[projeto].supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=[chave]
```

### PASSO 3: CÓDIGO DA EXTENSÃO (25 min)
```javascript
// 1. Abrir: config.js
// 2. Substituir URLs e chaves pelas novas
// 3. Salvar

// 4. Abrir: content.js (linha 1)
// 5. Adicionar:
import CONFIG from './config.js'

// 6. Substituir todas URLs hardcoded por:
const VALIDATE_URL = `${CONFIG.SUPABASE_URL}/functions/v1/validate-license`
// ... (repetir para todas)

// 7. Fazer o mesmo em sidepanel.js

// 8. Atualizar manifest.json:
"version": "4.5"
```

---

## 📋 CHECKLIST MÍNIMO

**Antes de testar:**
- [ ] Schema SQL executado (verificar 6 tabelas existem)
- [ ] Storage SQL executado (verificar 3 buckets existem)
- [ ] 6 functions deployadas (verificar no dashboard)
- [ ] config.js preenchido com chaves novas
- [ ] content.js usando CONFIG import
- [ ] sidepanel.js usando CONFIG import

**Teste básico:**
- [ ] Carregar extensão no Chrome
- [ ] Abrir lovable.dev
- [ ] Inserir chave de licença teste
- [ ] Verificar validação funciona

---

## 🆘 PROBLEMAS COMUNS

### "Tabela não existe"
→ Executar `001_initial_schema.sql` novamente

### "Function not found"
→ Verificar deploy: `supabase functions list`

### "Invalid anon key"
→ Copiar chave correta de Project Settings > API

### "RLS policy violation"
→ Verificar RLS habilitado: Database > Tables > ts_licenses

---

## 📚 DOCUMENTAÇÃO COMPLETA

Após setup básico funcionar, consulte:

1. **CHECKLIST_DEPLOY.md** → Guia detalhado completo
2. **EDGE_FUNCTIONS_GUIDE.md** → Como usar cada function
3. **DATABASE_STRUCTURE.md** → Estrutura do banco

---

## ⏱️ TEMPO TOTAL: ~60 MINUTOS

- Setup Supabase: 15 min
- Deploy Functions: 20 min  
- Atualizar Código: 25 min

---

## 🎯 RESULTADO

Após concluir:
- ✅ Backend novo funcionando
- ✅ RLS protegendo dados
- ✅ Rate limiting ativo
- ✅ Extensão conectada
- ✅ Sistema antigo ainda ativo (transição)

---

## 📞 PRÓXIMO PASSO

Abra: `supabase/docs/CHECKLIST_DEPLOY.md`

**BOA SORTE! 🚀**
