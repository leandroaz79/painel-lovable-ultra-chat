-- ============================================================================
-- CRIAR TABELA DE COMPRAS DE CRÉDITOS
-- Execute este SQL no Supabase Dashboard > SQL Editor
-- ============================================================================

-- Tabela para registrar compras de créditos via Mercado Pago
CREATE TABLE IF NOT EXISTS public.credit_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reseller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_id TEXT NOT NULL UNIQUE,
  quantity INTEGER NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  buyer_name TEXT NOT NULL,
  buyer_cpf TEXT NOT NULL,
  buyer_phone TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  pix_qr_code TEXT,
  pix_qr_code_base64 TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'refunded'))
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_credit_purchases_reseller_id ON public.credit_purchases(reseller_id);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_payment_id ON public.credit_purchases(payment_id);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_status ON public.credit_purchases(status);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_created_at ON public.credit_purchases(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.credit_purchases ENABLE ROW LEVEL SECURITY;

-- Policy: Revendedores podem ver suas próprias compras
CREATE POLICY "Revendedores podem ver suas compras"
ON public.credit_purchases
FOR SELECT
TO authenticated
USING (
  reseller_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'reseller'
  )
);

-- Policy: Admin pode ver todas as compras
CREATE POLICY "Admin pode ver todas as compras"
ON public.credit_purchases
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Policy: Sistema pode inserir/atualizar (para Edge Functions)
CREATE POLICY "Sistema pode inserir compras"
ON public.credit_purchases
FOR INSERT
TO authenticated
WITH CHECK (reseller_id = auth.uid());

CREATE POLICY "Sistema pode atualizar compras"
ON public.credit_purchases
FOR UPDATE
TO authenticated
USING (reseller_id = auth.uid());

-- Comentários
COMMENT ON TABLE public.credit_purchases IS 'Registra compras de créditos via Mercado Pago';
COMMENT ON COLUMN public.credit_purchases.payment_id IS 'ID do pagamento no Mercado Pago';
COMMENT ON COLUMN public.credit_purchases.status IS 'Status do pagamento: pending, approved, rejected, cancelled, refunded';
