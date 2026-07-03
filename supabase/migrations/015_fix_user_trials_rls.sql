-- ============================================================================
-- Migration 015: Corrigir RLS de user_trials (CRIT-002)
-- ============================================================================
-- PROBLEMA: A política "Service role manage trials" usa TO authenticated
-- com USING (true), permitindo que qualquer usuário autenticado manipule
-- todos os registros da tabela (INSERT, UPDATE, DELETE).
--
-- SOLUÇÃO: Corrigir para TO service_role, que é o correto para funções
-- edge que usam service_role key.
--
-- ROLLBACK:
--   DROP POLICY IF EXISTS "Service role manage trials" ON public.user_trials;
--   CREATE POLICY "Service role manage trials"
--   ON public.user_trials FOR ALL TO authenticated
--   USING (true) WITH CHECK (true);
-- ============================================================================

-- Remover política permissiva
DROP POLICY IF EXISTS "Service role manage trials" ON public.user_trials;

-- Criar política correta: apenas service_role pode manipular
CREATE POLICY "Service role manage trials"
ON public.user_trials
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
