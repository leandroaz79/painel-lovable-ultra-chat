-- ============================================================================
-- Migration 004: Sistema de Revendedores
-- Descrição: Tabelas, RLS e funções para sistema de revenda com créditos
-- ============================================================================

-- 1. Tabela de Revendedores
CREATE TABLE IF NOT EXISTS public.resellers (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id uuid REFERENCES auth.users NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended')),
  credits integer NOT NULL DEFAULT 0 CHECK (credits >= 0),
  total_licenses_created integer NOT NULL DEFAULT 0,
  total_credits_purchased integer NOT NULL DEFAULT 0,
  activation_fee_paid boolean NOT NULL DEFAULT false,
  activation_paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Tabela de Transações de Créditos
CREATE TABLE IF NOT EXISTS public.reseller_credit_transactions (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  reseller_id uuid REFERENCES public.resellers(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('purchase', 'consume', 'refund', 'bonus', 'adjustment')),
  amount integer NOT NULL, -- positivo=adiciona, negativo=consome
  price_per_unit numeric(10,2), -- preço unitário (null para consume/bonus)
  total_paid numeric(10,2), -- valor total transação
  payment_method text CHECK (payment_method IN ('pix', 'credit_card', 'manual', NULL)),
  payment_status text CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', NULL)),
  payment_id text, -- ID do Mercado Pago
  license_key text, -- se type=consume, qual licença foi criada
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Tabela de Pagamentos de Ativação (R$ 300)
CREATE TABLE IF NOT EXISTS public.reseller_activation_payments (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  reseller_id uuid REFERENCES public.resellers(id) ON DELETE CASCADE NOT NULL,
  amount numeric(10,2) NOT NULL DEFAULT 300.00,
  payment_method text NOT NULL DEFAULT 'pix',
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_id text UNIQUE, -- ID do Mercado Pago
  paid_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Adicionar coluna reseller_id em ts_licenses
ALTER TABLE public.ts_licenses 
ADD COLUMN IF NOT EXISTS reseller_id uuid REFERENCES public.resellers(id) ON DELETE SET NULL;

-- 5. Índices para Performance
CREATE INDEX IF NOT EXISTS idx_resellers_user_id ON public.resellers(user_id);
CREATE INDEX IF NOT EXISTS idx_resellers_status ON public.resellers(status);
CREATE INDEX IF NOT EXISTS idx_reseller_transactions_reseller_id ON public.reseller_credit_transactions(reseller_id);
CREATE INDEX IF NOT EXISTS idx_reseller_transactions_created_at ON public.reseller_credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reseller_transactions_payment_id ON public.reseller_credit_transactions(payment_id) WHERE payment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reseller_activation_payment_id ON public.reseller_activation_payments(payment_id) WHERE payment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_licenses_reseller_id ON public.ts_licenses(reseller_id) WHERE reseller_id IS NOT NULL;

-- 6. Habilitar Row Level Security
ALTER TABLE public.resellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reseller_credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reseller_activation_payments ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies - Resellers (revendedores veem apenas seus dados)
DROP POLICY IF EXISTS "Resellers see own data" ON public.resellers;
CREATE POLICY "Resellers see own data"
  ON public.resellers
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins see all resellers" ON public.resellers;
CREATE POLICY "Admins see all resellers"
  ON public.resellers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 8. RLS Policies - Credit Transactions
DROP POLICY IF EXISTS "Resellers see own transactions" ON public.reseller_credit_transactions;
CREATE POLICY "Resellers see own transactions"
  ON public.reseller_credit_transactions
  FOR SELECT
  TO authenticated
  USING (
    reseller_id IN (
      SELECT id FROM public.resellers WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins see all transactions" ON public.reseller_credit_transactions;
CREATE POLICY "Admins see all transactions"
  ON public.reseller_credit_transactions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 9. RLS Policies - Activation Payments
DROP POLICY IF EXISTS "Resellers see own activation" ON public.reseller_activation_payments;
CREATE POLICY "Resellers see own activation"
  ON public.reseller_activation_payments
  FOR SELECT
  TO authenticated
  USING (
    reseller_id IN (
      SELECT id FROM public.resellers WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins see all activations" ON public.reseller_activation_payments;
CREATE POLICY "Admins see all activations"
  ON public.reseller_activation_payments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- 10. RLS Policies - Licenses (revendedores só veem suas licenças)
DROP POLICY IF EXISTS "Resellers see own licenses" ON public.ts_licenses;
CREATE POLICY "Resellers see own licenses"
  ON public.ts_licenses
  FOR SELECT
  TO authenticated
  USING (
    reseller_id IN (
      SELECT id FROM public.resellers WHERE user_id = auth.uid()
    )
  );

-- 11. Função: Atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_reseller_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_reseller_updated_at ON public.resellers;
CREATE TRIGGER trigger_update_reseller_updated_at
  BEFORE UPDATE ON public.resellers
  FOR EACH ROW
  EXECUTE FUNCTION update_reseller_updated_at();

-- 12. Função: Consumir crédito ao criar licença
CREATE OR REPLACE FUNCTION consume_reseller_credit()
RETURNS TRIGGER AS $$
DECLARE
  v_reseller_id uuid;
  v_credits integer;
BEGIN
  -- Só processa se licença criada por revendedor
  IF NEW.reseller_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Não consome crédito para trials
  IF NEW.license_type = 'trial' THEN
    RETURN NEW;
  END IF;

  -- Verificar saldo de créditos
  SELECT id, credits INTO v_reseller_id, v_credits
  FROM public.resellers
  WHERE id = NEW.reseller_id
  FOR UPDATE;

  IF v_credits < 1 THEN
    RAISE EXCEPTION 'Créditos insuficientes. Saldo atual: %', v_credits;
  END IF;

  -- Consumir 1 crédito
  UPDATE public.resellers
  SET 
    credits = credits - 1,
    total_licenses_created = total_licenses_created + 1
  WHERE id = NEW.reseller_id;

  -- Registrar transação
  INSERT INTO public.reseller_credit_transactions (
    reseller_id,
    type,
    amount,
    license_key,
    metadata
  ) VALUES (
    NEW.reseller_id,
    'consume',
    -1,
    NEW.license_key,
    jsonb_build_object(
      'license_type', NEW.license_type,
      'lifetime', NEW.lifetime,
      'expires_at', NEW.expires_at
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_consume_reseller_credit ON public.ts_licenses;
CREATE TRIGGER trigger_consume_reseller_credit
  AFTER INSERT ON public.ts_licenses
  FOR EACH ROW
  EXECUTE FUNCTION consume_reseller_credit();

-- 13. Adicionar role 'reseller' em user_roles
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_role_check 
  CHECK (role IN ('admin', 'reseller', 'user'));

-- 14. Comentários para documentação
COMMENT ON TABLE public.resellers IS 'Cadastro de revendedores com controle de créditos';
COMMENT ON TABLE public.reseller_credit_transactions IS 'Histórico de transações de créditos (compra, consumo, bônus)';
COMMENT ON TABLE public.reseller_activation_payments IS 'Pagamentos de taxa de ativação (R$ 300)';
COMMENT ON COLUMN public.ts_licenses.reseller_id IS 'ID do revendedor que criou a licença (NULL se criada por admin)';
COMMENT ON FUNCTION consume_reseller_credit() IS 'Trigger: consome 1 crédito ao criar licença paid/lifetime';

-- 15. Verificação final
DO $$
BEGIN
  RAISE NOTICE 'Migration 004 executada com sucesso!';
  RAISE NOTICE 'Tabelas criadas: resellers, reseller_credit_transactions, reseller_activation_payments';
  RAISE NOTICE 'RLS habilitado e policies configuradas';
  RAISE NOTICE 'Trigger de consumo de crédito ativo';
END $$;
