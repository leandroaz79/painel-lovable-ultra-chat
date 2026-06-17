-- ============================================================================
-- Migration 008: Tabela de Preços Configuráveis
-- ============================================================================

-- Tabela de precificação de créditos
CREATE TABLE IF NOT EXISTS public.product_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  min_quantity INTEGER NOT NULL,
  max_quantity INTEGER, -- NULL significa "sem limite superior"
  unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price > 0),
  discount_percent INTEGER DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(min_quantity, max_quantity)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_product_pricing_active ON public.product_pricing(is_active, min_quantity);

-- Trigger para updated_at
CREATE TRIGGER update_product_pricing_updated_at
  BEFORE UPDATE ON public.product_pricing
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.product_pricing ENABLE ROW LEVEL SECURITY;

-- Policy: Todos podem ler preços ativos
CREATE POLICY "Todos podem ver preços ativos"
ON public.product_pricing
FOR SELECT
TO authenticated
USING (is_active = TRUE);

-- Policy: Admin pode gerenciar
CREATE POLICY "Admin pode gerenciar preços"
ON public.product_pricing
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Inserir preços padrão
INSERT INTO public.product_pricing (min_quantity, max_quantity, unit_price, discount_percent) VALUES
(1, 9, 30.00, 0),
(10, 19, 25.00, 17),
(20, 29, 20.00, 33),
(30, NULL, 15.00, 50)
ON CONFLICT DO NOTHING;

-- Tabela de histórico de alterações de preços (auditoria)
CREATE TABLE IF NOT EXISTS public.product_pricing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pricing_id UUID REFERENCES public.product_pricing(id) ON DELETE CASCADE,
  min_quantity INTEGER NOT NULL,
  max_quantity INTEGER,
  old_unit_price NUMERIC(10,2),
  new_unit_price NUMERIC(10,2) NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  change_reason TEXT
);

-- Índices de auditoria
CREATE INDEX IF NOT EXISTS idx_pricing_history_pricing_id ON public.product_pricing_history(pricing_id);
CREATE INDEX IF NOT EXISTS idx_pricing_history_changed_at ON public.product_pricing_history(changed_at DESC);

-- RLS para histórico
ALTER TABLE public.product_pricing_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin pode ver histórico de preços"
ON public.product_pricing_history
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Comentários
COMMENT ON TABLE public.product_pricing IS 'Tabela de preços progressivos para créditos';
COMMENT ON TABLE public.product_pricing_history IS 'Histórico de alterações de preços (auditoria)';
COMMENT ON COLUMN public.product_pricing.max_quantity IS 'NULL significa sem limite superior (30+)';
