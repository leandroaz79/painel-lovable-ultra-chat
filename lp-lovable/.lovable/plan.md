# Plano — Lovable Ultra Chat sobre Supabase existente

## Princípio
Nada de schema novo, nada de mock como fonte. Tudo lê/grava no Supabase já existente (`rkntjizbuusaozipvaqm`). Painéis administrativos só chamam Edge Functions já publicadas.

## Bloqueio atual — preciso de você antes de codar painéis
A diagnose anterior (`/diagnostico`, anon key) só conseguiu ler `packages` e `notifications`. Tudo que vai alimentar admin/reseller/cliente (`licenses`, `profiles`, `user_trials`, `credit_purchases`, `resellers`, `ts_licenses`, `product_pricing`, `admin_audit_logs`) está atrás de RLS — correto, mas significa que **eu não consigo confirmar os nomes de colunas pela anon key**. Sem isso, qualquer painel que eu escrever vai chutar campos e quebrar em runtime.

Preciso de **um** destes para destravar:

- **(A) Schema dump** — cole aqui o output de `pg_dump --schema-only` (ou só os `CREATE TABLE` das tabelas listadas acima), **e** a lista de Edge Functions existentes (`supabase functions list`). É o caminho mais rápido e seguro.
- **(B) Credenciais admin de teste** — me dá um email/senha de um usuário com role `admin` no projeto. Eu logo via `/diagnostico` autenticado, leio as tabelas reais com RLS aplicada e descubro colunas + funções.
- **(C) Conectar este projeto Lovable ao Supabase existente como integração gerenciada** — habilita Lovable Cloud apontando para o mesmo projeto (se você tiver acesso owner). Aí eu enxergo schema, policies, secrets e edge functions diretamente, sem você colar nada.

Me diga A, B ou C.

## Fases (executadas depois que o bloqueio sair)

### Fase 1 — Fundação auth + roles (sem painéis ainda)
- `src/integrations/supabase/client.ts` já existe; adicionar `types.ts` gerado a partir do schema real.
- Hook `useAuth` (sessão + `onAuthStateChange` no `__root.tsx`).
- Hook `useRole` lendo de `user_roles` via `has_role` RPC (padrão seguro — não ler role de `profiles`).
- Rotas protegidas: `_authenticated/route.tsx` (gate genérico) + sub-layouts `_admin`, `_reseller`, `_customer` checando role e redirecionando.
- Telas: `/auth` (login + recuperação), `/auth/reset-password`, redirect pós-login por role.
- **Critério de pronto:** login real funciona, role é detectada do banco, redirect correto, logout limpa cache.

### Fase 2 — Painel Cliente (`/dashboard`)
Menor superfície, valida o pipeline.
- Lista licenças do usuário (`licenses` filtrada por RLS).
- Botão "Gerar Trial" → Edge Function `user-create-trial` (espera 1x por usuário, 30 min).
- Lista de planos lendo `packages` (já confirmada acessível) — moeda MZN.
- Download da extensão + tutorial (links estáticos por enquanto, peço URLs depois).

### Fase 3 — Painel Revendedor (`/reseller`)
- Cards: saldo / usados / comprados / liberados (Edge `reseller-dashboard`).
- Tabela das próprias licenças (Edge `reseller-list-licenses`).
- Ações: criar licença, criar trial, copiar, renovar, reset HWID, revogar, excluir — cada uma chama a Edge Function correspondente. Se a função 404, mostro toast "Função X não publicada" — sem fluxo fake.
- Compra de créditos (Edge `reseller-buy-credits`).

### Fase 4 — Painel Admin (`/admin`)
- Métricas (total/ativas/trial/vitalícias/expiradas/suspensas/receita/revendedores/vendas) via Edges `admin-list-licenses` + `admin-list-resellers` agregadas no client (ou um RPC dedicado se existir).
- Tabela de licenças com filtros + paginação.
- Modais: criar licença, gerar trial, gerenciar revendedor.
- Ações por linha: copiar, renovar, reset HWID, revogar, excluir → Edges `admin-*`.
- Confirmação obrigatória antes de revogar/excluir.

### Fase 5 — Landing
Já existe e foi reskinada para verde. Apenas:
- Trocar a Pricing para ler de `packages` (MZN).
- Ligar CTA "Entrar" → `/auth`, "Começar trial" → `/auth?mode=signup`.
- Manter resto.

### Fase 6 — Polimento
Loading skeletons, empty states, toasts (sonner), confirm dialogs, responsive tables (cards no mobile), modais full-screen no mobile.

## Detalhes técnicos
- **Edge Functions:** chamadas via `supabase.functions.invoke('nome', { body })` — token do usuário vai automático. Erros HTTP viram toast vermelho com a mensagem real do servidor.
- **RLS:** nunca burlar. Se uma tela precisa de algo que RLS bloqueia para aquele role, vai por Edge Function.
- **Tipos:** rodar `supabase gen types typescript` localmente (eu te passo o comando) ou você cola o output — sem isso fica `any`.
- **Sem service_role no client.** Garantido — só anon key no `.env`.
- **Rotas:**
  ```
  /                       landing
  /auth, /auth/reset-password
  /diagnostico            (já existe, mantenho)
  /_authenticated/_customer/dashboard
  /_authenticated/_reseller/...
  /_authenticated/_admin/...
  ```

## O que NÃO vou fazer
- Criar migrations.
- Renomear tabelas/colunas.
- Inventar Edge Functions — se não existir, a UI mostra erro real.
- Usar mocks como fonte de verdade (mocks só em storybook/loading skeleton).

---

**Próximo passo:** me responde A, B ou C acima. Assim que eu tiver schema + lista de funções, executo Fase 1 imediatamente.