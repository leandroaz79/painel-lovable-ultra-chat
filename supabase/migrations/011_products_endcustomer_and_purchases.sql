-- ===============================================================
-- MIGRATION 011: Produtos para cliente final + Compras
-- ===============================================================
-- Rollback:
--   DROP TABLE IF EXISTS customer_purchases;
--   DROP TABLE IF EXISTS products_endcustomer;
-- ===============================================================

-- 1. Tabela de produtos (planos para cliente final)
CREATE TABLE IF NOT EXISTS public.products_endcustomer (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  days INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  devices INTEGER DEFAULT 1,
  has_priority_support BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.products_endcustomer ENABLE ROW LEVEL SECURITY;

-- Admin pode ver e gerenciar todos os produtos
CREATE POLICY "admin_all_products_endcustomer"
  ON public.products_endcustomer
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Usuários autenticados podem ver apenas produtos ativos
CREATE POLICY "users_view_active_products"
  ON public.products_endcustomer
  FOR SELECT
  TO authenticated
  USING (active = TRUE);

-- Seed dos planos da landing page
INSERT INTO public.products_endcustomer (name, slug, description, days, price_cents, devices, has_priority_support, sort_order) VALUES
  ('TRY 7', 'try-7', 'Experimente o Lovable Ultra Chat por 7 dias com todas as features liberadas.', 7, 2990, 1, FALSE, 1),
  ('ULTRA 15', 'ultra-15', '15 dias de poder ilimitado com suporte prioritário no WhatsApp.', 15, 4990, 2, TRUE, 2),
  ('ULTRA 30', 'ultra-30', '30 dias para criar sem barreiras. Suporte prioritário e até 2 dispositivos.', 30, 7990, 2, TRUE, 3)
ON CONFLICT (slug) DO NOTHING;

-- 2. Tabela de compras do cliente final
CREATE TABLE IF NOT EXISTS public.customer_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products_endcustomer(id),
  license_key TEXT REFERENCES public.ts_licenses(license_key) ON DELETE SET NULL,
  payment_id TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'approved', 'rejected', 'cancelled', 'refunded')),
  payment_data JSONB DEFAULT '{}'::jsonb,
  pix_qr_code TEXT,
  pix_qr_code_base64 TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ
);

ALTER TABLE public.customer_purchases ENABLE ROW LEVEL SECURITY;

-- Usuário vê apenas suas próprias compras
CREATE POLICY "user_own_customer_purchases"
  ON public.customer_purchases
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admin vê todas as compras
CREATE POLICY "admin_all_customer_purchases"
  ON public.customer_purchases
  FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE INDEX IF NOT EXISTS idx_customer_purchases_user_id ON public.customer_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_purchases_payment_id ON public.customer_purchases(payment_id);
CREATE INDEX IF NOT EXISTS idx_customer_purchases_status ON public.customer_purchases(payment_status);
