-- ============================================================================
-- Migration 010: Controle de Trial para Usuários Finais
-- ============================================================================

-- Tabela para controlar se o usuário já usou seu trial gratuito
CREATE TABLE IF NOT EXISTS public.user_trials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  license_key TEXT REFERENCES public.ts_licenses(license_key) ON DELETE SET NULL
);

-- Índice
CREATE INDEX IF NOT EXISTS idx_user_trials_user_id ON public.user_trials(user_id);

-- RLS
ALTER TABLE public.user_trials ENABLE ROW LEVEL SECURITY;

-- Política: usuário vê seu próprio registro
DROP POLICY IF EXISTS "Users see own trial status" ON public.user_trials;
CREATE POLICY "Users see own trial status"
ON public.user_trials
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Política: service_role pode tudo (usado pela edge function)
DROP POLICY IF EXISTS "Service role manage trials" ON public.user_trials;
CREATE POLICY "Service role manage trials"
ON public.user_trials
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Garantir permissões para a tabela
GRANT ALL ON public.user_trials TO service_role;
GRANT SELECT ON public.user_trials TO authenticated;

-- Comentários
COMMENT ON TABLE public.user_trials IS 'Controle de trial gratuito por usuário (máx. 1 por usuário)';
