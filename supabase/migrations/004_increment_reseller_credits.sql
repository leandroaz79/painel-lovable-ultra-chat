-- ============================================================================
-- CRIAR FUNÇÃO SQL PARA DEVOLVER CRÉDITOS AO REVENDEDOR
-- Execute este SQL no Supabase Dashboard > SQL Editor
-- ============================================================================

-- Função para incrementar créditos do revendedor
CREATE OR REPLACE FUNCTION increment_reseller_credits(
  reseller_user_id UUID,
  amount INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.resellers
  SET 
    credits = credits + amount,
    total_licenses_created = GREATEST(0, total_licenses_created - amount)
  WHERE user_id = reseller_user_id;
END;
$$;

-- Dar permissão para authenticated users
GRANT EXECUTE ON FUNCTION increment_reseller_credits(UUID, INTEGER) TO authenticated;
