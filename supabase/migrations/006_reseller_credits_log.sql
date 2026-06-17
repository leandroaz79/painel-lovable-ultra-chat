-- ============================================================================
-- CRIAR TABELA DE LOG DE CRÉDITOS (AUDITORIA)
-- Execute este SQL no Supabase Dashboard > SQL Editor
-- ============================================================================

-- Tabela para auditar todas as alterações manuais de créditos pelo admin
CREATE TABLE IF NOT EXISTS public.reseller_credits_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reseller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- positivo = adição, negativo = remoção
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_credits_log_reseller ON public.reseller_credits_log(reseller_id);
CREATE INDEX IF NOT EXISTS idx_credits_log_admin ON public.reseller_credits_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_credits_log_created ON public.reseller_credits_log(created_at DESC);

-- RLS
ALTER TABLE public.reseller_credits_log ENABLE ROW LEVEL SECURITY;

-- Policy: Admin pode ver tudo
CREATE POLICY "Admin pode ver log de créditos"
ON public.reseller_credits_log
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Policy: Admin pode inserir
CREATE POLICY "Admin pode inserir log"
ON public.reseller_credits_log
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

COMMENT ON TABLE public.reseller_credits_log IS 'Log de auditoria de alterações manuais de créditos por admins';
