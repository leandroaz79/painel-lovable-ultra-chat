# ⚠️ AÇÃO URGENTE - REDEPLOY NECESSÁRIO

## 🔴 PROBLEMA IDENTIFICADO:

As Edge Functions foram deployadas com **`verify_jwt: true`** (padrão do Supabase), mas o código da produção antiga **NÃO usa JWT authentication**!

---

## ✅ SOLUÇÃO:

### **VOCÊ PRECISA FAZER REDEPLOY DAS FUNCTIONS COM `--no-verify-jwt`**

**Via Dashboard:**
1. **NÃO DÁ!** Dashboard sempre força `verify_jwt: true`

**Via CLI (ÚNICA FORMA):**
```powershell
cd supabase

# Redeploy com --no-verify-jwt
supabase functions deploy validate-license --no-verify-jwt
supabase functions deploy optimize-prompt --no-verify-jwt
supabase functions deploy process-extension-payment --no-verify-jwt
supabase functions deploy upload-temp-image --no-verify-jwt
supabase functions deploy remove-watermark --no-verify-jwt
supabase functions deploy publish-project --no-verify-jwt
supabase functions deploy create-lovable-project --no-verify-jwt
```

---

## 🎯 POR QUÊ?

**Produção antiga:**
- Edge Functions **SEM** JWT verification
- Apenas `apikey` no header
- Funciona com anon key

**Novo projeto (erro):**
- Edge Functions **COM** JWT verification (padrão)
- Exige `Authorization: Bearer <jwt-token>`
- Por isso dá "Missing authorization header"

---

## ⏱️ TEMPO: 5 MINUTOS

1. Instalar Supabase CLI (se não tiver)
2. `supabase login`
3. `cd supabase`
4. `supabase link --project-ref rkntjizbuusaozipvaqm`
5. Executar os 7 comandos de redeploy acima

---

## 🚨 IMPOSSÍVEL RESOLVER SEM CLI

O Dashboard do Supabase **SEMPRE força `verify_jwt: true`** ao criar/atualizar functions manualmente.

A única forma de deployar com `--no-verify-jwt` é via CLI.

---

**Você consegue instalar o Supabase CLI e fazer o redeploy?**

Ou prefere que eu te ajude de outra forma? 🤔
