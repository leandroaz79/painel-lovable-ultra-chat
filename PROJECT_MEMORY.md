# 📝 Memória do Projeto - Painel Ultra Chat v4.4+
**Data:** 24/06/2026  
**Última atualização:** Fix global — modais não fecham ao arrastar mouse para fora (03/07/2026)


## 🚀 Contexto do Projeto
Painel administrativo para gerenciamento de licenças Ultra Chat, com:
- **Autenticação:** Supabase Auth (roles `admin` / `reseller`)
- **Frontend:** React + TypeScript + Vite + Tailwind
- **Backend:** Supabase Edge Functions (Deno)
- **Banco de Dados:** PostgreSQL com Supabase
- **Funcionalidades:**
  - Admin: Criar/renovar/revogar/excluir licenças, gerenciar revendedores, estatísticas
  - Revendedor: Criar licenças (com créditos), gerenciar suas licenças, comprar créditos


## 🔧 Problemas Identificados e Corrigidos (Sessão Atual)

---

### 1. **Botão HWID não aparecia para licenças Vitalícias**
**Problema:** Licenças `lifetime` tinham o botão HWID oculto
**Arquivos modificados:**
- `src/pages/admin/Dashboard.tsx`: Alterou a condição do botão para exibir HWID quando `license_type != 'trial'` (inclui lifetime)
- `src/pages/reseller/Dashboard.tsx`: Mesma correção
- `supabase/functions/admin-reset-hwid/index.ts`: Corrigido para usar `device_id` (campo correto no banco) em vez de `hwid`

---

### 2. **Faltava funcionalidade de Excluir Licença**
**Problema:** Não havia botão/função para excluir licenças
**Arquivos criados/modificados:**
- **Criado:** `supabase/functions/admin-delete-license/index.ts`: Função para admin excluir licenças
- **Modificado:** `supabase/functions/reseller-delete-license/index.ts`:
  - Corrigido para usar tabela `ts_licenses` (não `licenses`)
  - Adicionada lógica para devolver crédito ao revendedor (apenas para licenças não-trial)
  - Adicionada atualização do contador `total_licenses_created`
- **Modificado:** `src/hooks/useLicenseActions.ts`: Adicionada função `deleteLicense()`
- **Modificado:** `src/lib/supabase.ts`: Adicionado `FUNCTIONS.DELETE_LICENSE`
- **Modificado:** `src/pages/admin/Dashboard.tsx`: Adicionado botão "Excluir" na tabela
- **Modificado:** `src/pages/reseller/Dashboard.tsx`: Atualizado para usar o hook `deleteLicense()`

---

### 3. **Licenças do Admin e Revendedor Misturadas**
**Problema:** Admin via todas as licenças (incluindo do revendedor), e vice-versa
**Arquivos modificados:**
- `supabase/functions/admin-list-licenses/index.ts`: Adicionado filtro `.is("reseller_id", null)` para retornar apenas licenças do admin
- **Criados scripts SQL:**
  - `DOCs/supabase/fix_reseller_licenses.sql`: Script inicial para atribuir reseller_id
  - `DOCs/supabase/separate_admin_reseller_licenses.sql`: Script para separar licenças (com ID hardcoded)
  - `DOCs/supabase/separate_licenses_auto.sql`: Script AUTOMÁTICO (melhor) para separar licenças (busca revendedor ativo automaticamente)
  - `DOCs/supabase/recalculate_reseller_credits.sql`: Script PARA EXECUTAR AGORA para recalcular créditos e criar RPC

---

### 4. **Problema com Créditos e Contadores do Revendedor**
**Problema:**
- Licenças atribuídas manualmente não consumiram créditos
- `total_licenses_created` não estava sincronizado
- Faltava a RPC `increment_reseller_credits` no banco
- Quando revendedor excluía licença, o crédito não voltava corretamente
**Arquivos relacionados:**
- `supabase/migrations/004_resellers_system.sql`: Migration original com sistema de créditos
- **Criado:** `DOCs/supabase/recalculate_reseller_credits.sql`: Script para:
  1. Criar a RPC `increment_reseller_credits()` que faltava
  2. Recalcular `total_licenses_created`
  3. Ajustar os créditos disponíveis para 8 (conforme mencionado)

---

### 5. **Formato da Chave de Licença Diferente no Revendedor**
**Problema:** Licenças do revendedor tinham formato `XXXX-XXXX-XXXX-XXXX` em vez de `TS-XXXXXXXXXXXXXXXX`
**Arquivo modificado:**
- `supabase/functions/reseller-create-license/index.ts`: Substituída a função `generateLicenseKey()` para usar o mesmo padrão do admin (prefixo TS- e hexadecimal)

---

### 6. **Adicionada Funcionalidade de Criar Revendedores Manualmente**
**Problema:** Não havia forma do admin criar revendedores diretamente pelo painel
**Arquivos criados/modificados:**
- **Criado:** `supabase/functions/admin-create-reseller/index.ts`: Função para admin criar revendedores manualmente
  - Aceita email, créditos iniciais e status
  - Cria novo usuário se o email não existir
  - Cria role de revendedor automaticamente
  - Registra log de auditoria
- **Modificado:** `src/pages/admin/Resellers.tsx`:
  - Adicionado botão "Novo Revendedor"
  - Adicionado modal de cadastro com campos: email, créditos iniciais, status
  - Adicionada função `handleCreateReseller()` para integrar com a função
- **Modificado:** `src/lib/supabase.ts`: Adicionado `FUNCTIONS.ADMIN_CREATE_RESELLER`

---


### 7. **Limpeza de Arquivos Legados — Movidos para DOCs/**
**Problema:** O projeto continha diversos arquivos de documentação, scripts SQL avulsos e pastas de temas/branding que poluíam a raiz e o diretório supabase/ sem fazer parte do código ou funções do sistema.
**Arquivos movidos para `DOCs/`:**
- **Raiz:** `CHECKLIST_MIGRACAO.md`, `CONVERSAO_COMPLETA.md`, `CREATE_RESELLER_USER.sql`, `DEPLOY_COMPRA_CREDITOS.md`, `INSERT_ADMIN_USER.sql`, `painel-branding/`
- **supabase/:** `ACAO_URGENTE_REDEPLOY.md`, `ANALISE_FALTANTE.md`, `AUDITORIA_NOVO_PROJETO.md`, `MIGRACAO_COMPLETA.md`, `QUICK_START.md`, `README.md`, `RESUMO_ENTREGA.md`, `STATUS_FINAL.md`, `docs/`, `.temp/`, `fix_id_check.sql`, `fix_reseller_licenses.sql`, `recalculate_reseller_credits.sql`, `separate_admin_reseller_licenses.sql`, `separate_licenses_auto.sql`
- **Preservados no lugar:** `PROJECT_MEMORY.md`, `README.md` (raiz), `public/templates/lovable-ultra-chat-5.4-1R.zip`
**Benefício:** Raiz do projeto mais limpa e organizada, separação clara entre código ativo e documentação legada.

---

### 8. **Fix Global — Modal não fecha ao arrastar mouse para fora**
**Problema:** Ao clicar dentro de um modal e arrastar o mouse para o backdrop, o modal fechava indesejadamente. Isso acontecia porque `onClick` no backdrop disparava quando o mouseup acontecia lá, mesmo que o mousedown tivesse sido dentro do modal.
**Solução:** Trocar `onClick` por `onMouseDown` + verificação `e.target === e.currentTarget` em todos os backdrops. Isso garante que o modal só feche se o clique **começar e terminar** diretamente no backdrop.
**Arquivos modificados (9 modais em 7 arquivos):**
1. `src/components/ConfirmationDialog.tsx`: `onClick={onCancel}` → `onMouseDown` + target check
2. `src/components/MobileMenu.tsx`: `onClick={() => setIsOpen(false)}` → `onMouseDown` + target check
3. `src/components/ResellerMobileMenu.tsx`: `onClick={() => setIsOpen(false)}` → `onMouseDown` + target check
4. `src/pages/admin/Customers.tsx`: `onClick={closeManageModal}` → `onMouseDown` + target check
5. `src/pages/admin/EndcustomerProducts.tsx`: `onClick={closeModal}` → `onMouseDown` + target check
6. `src/pages/admin/Resellers.tsx`: Dois modais (Gerenciar + Criar revendedor) → `onMouseDown` + target check
7. `src/pages/reseller/Dashboard.tsx`: Dois modais (Compra + Pix) → `onMouseDown` + target check
**Padrão aplicado:**
```tsx
// Antes
onClick={closeHandler}

// Depois
onMouseDown={(e) => { if (e.target === e.currentTarget) closeHandler() }}
```
**Nota:** `src/components/landing/CheckoutModal.tsx` já tinha o fix (usava `onMouseDown` + `e.target === e.currentTarget`). O `stopPropagation` no `.modal-content` dos modais legados continua como camada extra de segurança.

---

## 📂 Lista Completa de Arquivos Modificados/Criados

### Criados do Zero:
1. `supabase/functions/admin-delete-license/index.ts`: Função de exclusão para admin
2. `supabase/functions/admin-create-reseller/index.ts`: Função de criação de revendedores para admin
3. `DOCs/supabase/fix_reseller_licenses.sql`: Primeiro script de correção de licenças
4. `DOCs/supabase/separate_admin_reseller_licenses.sql`: Segundo script de separação
5. `DOCs/supabase/separate_licenses_auto.sql`: Script automático de separação
6. `DOCs/supabase/fix_id_check.sql`: Verificação de ID do revendedor
7. `DOCs/supabase/recalculate_reseller_credits.sql`: SCRIPT PRINCIPAL A EXECUTAR
8. `PROJECT_MEMORY.md`: Este arquivo!

### Modificados:
1. `supabase/functions/admin-reset-hwid/index.ts`: Correção do campo `device_id`
2. `supabase/functions/reseller-delete-license/index.ts`: Correções de tabela e créditos
3. `supabase/functions/admin-list-licenses/index.ts`: Filtro para licenças do admin
4. `supabase/functions/reseller-create-license/index.ts`: Correção do formato da chave de licença
5. `src/lib/supabase.ts`: Adicionado FUNCTIONS.DELETE_LICENSE e FUNCTIONS.ADMIN_CREATE_RESELLER
6. `src/hooks/useLicenseActions.ts`: Adicionada função `deleteLicense`
7. `src/pages/admin/Dashboard.tsx`: Botões HWID e Excluir, lógica de ações
8. `src/pages/reseller/Dashboard.tsx`: Botão HWID, lógica de exclusão, fix backdrop modal (Compra + Pix)
9. `src/pages/admin/Resellers.tsx`: Botão e modal de criação de revendedor, fix backdrop modal (Gerenciar + Criar)
10. `src/pages/admin/Customers.tsx`: Fix backdrop modal Gerenciar Cliente
11. `src/pages/admin/EndcustomerProducts.tsx`: Fix backdrop modal Editar/Criar Produto
12. `src/components/ConfirmationDialog.tsx`: Fix backdrop — onMouseDown + target check
13. `src/components/MobileMenu.tsx`: Fix overlay — onMouseDown + target check
14. `src/components/ResellerMobileMenu.tsx`: Fix overlay — onMouseDown + target check


## ⚠️ O Que Falta Fazer (Estado Atual)

### Passo 1: Executar o Script SQL de Recálculo
Ainda NÃO EXECUTOU o script `DOCs/supabase/recalculate_reseller_credits.sql`!

**Como executar:**
1. Acesse o painel do Supabase
2. Vá para **SQL Editor**
3. Abra o arquivo `DOCs/supabase/recalculate_reseller_credits.sql`
4. Clique em **Run**

### Passo 2: Fazer Deploy das Edge Functions
```bash
# No terminal, na pasta do projeto:
supabase functions deploy admin-delete-license
supabase functions deploy admin-reset-hwid
supabase functions deploy reseller-delete-license
supabase functions deploy admin-list-licenses
supabase functions deploy reseller-create-license
supabase functions deploy admin-create-reseller  # Nova função!
```

### Passo 3: Verificar Resultado
Depois de executar os passos acima:
- [ ] Admin deve ver apenas suas licenças (sem reseller_id)
- [ ] Revendedor deve ver apenas suas licenças (com seu reseller_id)
- [ ] Créditos disponíveis do revendedor devem ser 8
- [ ] Quando revendedor excluir uma licença (não-trial), o crédito deve voltar
- [ ] Botão HWID aparece para licenças paid/lifetime
- [ ] Licenças criadas pelo revendedor têm formato `TS-XXXXXXXXXXXXXXXX` (igual ao admin)
- [ ] Admin pode criar novos revendedores pelo painel


## 📋 Resumo dos Principais Conceitos
- **`reseller_id` na tabela `ts_licenses`:**
  - `NULL`: Licença criada pelo admin
  - UUID válido: Licença criada pelo revendedor
- **Controle de Créditos:**
  - `resellers.credits`: Créditos disponíveis para usar
  - `resellers.total_licenses_created`: Total de licenças criadas pelo revendedor
  - `resellers.total_credits_purchased`: Total de créditos comprados
- **Triggers e RPCs:**
  - `trigger_consume_reseller_credit`: Consome 1 crédito ao criar licença paid/lifetime
  - `increment_reseller_credits()`: RPC para adicionar/remover créditos (criada no script)


## 🔗 Links Úteis
- Supabase Dashboard: [https://supabase.com/dashboard](https://supabase.com/dashboard)
- Repositório do Projeto: [Local, conforme sua pasta]
- Documentação Supabase Edge Functions: [https://supabase.com/docs/guides/functions](https://supabase.com/docs/guides/functions)


## 💡 Dicas para Continuar
1. Sempre faça backup do banco antes de executar scripts SQL
2. Teste as funções localmente primeiro (se possível)
3. Mantenha este arquivo atualizado com novas alterações
4. Use `git` para versionar as alterações

---
**Fim da Memória** — Qualquer dúvida, volte a este arquivo!
