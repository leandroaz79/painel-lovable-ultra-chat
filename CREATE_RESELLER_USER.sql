-- ============================================================================
-- CRIAR USUÁRIO REVENDEDOR - CORRIGIDO
-- Execute este SQL no Supabase Dashboard > SQL Editor
-- ============================================================================

-- Passo 1: VOCÊ JÁ CRIOU O USUÁRIO no Auth ✅
-- UUID copiado: 7623e0dd-5538-412d-88df-a896095a7f54

-- Passo 2: Inserir role de revendedor
INSERT INTO public.user_roles (user_id, role)
VALUES (
  '7623e0dd-5538-412d-88df-a896095a7f54',
  'reseller'
)
ON CONFLICT (user_id, role) DO NOTHING;

-- Passo 3: Criar registro de revendedor com créditos (COLUNAS CORRETAS)
INSERT INTO public.resellers (
  user_id, 
  status, 
  credits, 
  total_licenses_created, 
  total_credits_purchased,
  activation_fee_paid
)
VALUES (
  '7623e0dd-5538-412d-88df-a896095a7f54',
  'active',     -- Status ativo
  10,           -- 10 créditos iniciais
  0,            -- Nenhuma licença criada ainda
  0,            -- Nenhum crédito comprado ainda
  true          -- Taxa de ativação já paga (para testar)
)
ON CONFLICT (user_id) 
DO UPDATE SET 
  credits = 10,
  status = 'active',
  activation_fee_paid = true;

-- ============================================================================
-- VERIFICAR SE FUNCIONOU
-- ============================================================================

-- Ver role
SELECT 
  u.email,
  ur.role
FROM auth.users u
JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.id = '7623e0dd-5538-412d-88df-a896095a7f54';

-- Ver dados do revendedor
SELECT 
  status,
  credits,
  total_licenses_created,
  activation_fee_paid
FROM public.resellers 
WHERE user_id = '7623e0dd-5538-412d-88df-a896095a7f54';
