-- ============================================================================
-- CRIAR VIEW PARA LISTAR REVENDEDORES COM EMAIL
-- Execute este SQL no Supabase Dashboard > SQL Editor
-- ============================================================================

-- Primeiro, dropar a view existente (se houver)
DROP VIEW IF EXISTS public.resellers_with_email;

-- View que combina resellers com emails dos usuários
CREATE OR REPLACE VIEW public.resellers_with_email AS
SELECT 
  r.id,
  r.user_id,
  r.name,
  r.whatsapp,
  u.email,
  r.credits,
  r.total_licenses_created,
  r.total_credits_purchased,
  r.status,
  r.activation_fee_paid,
  r.activation_paid_at,
  r.created_at,
  r.updated_at
FROM public.resellers r
JOIN auth.users u ON u.id = r.user_id;

-- Dar permissão para admin visualizar
GRANT SELECT ON public.resellers_with_email TO authenticated;

-- RLS para apenas admin ver
ALTER VIEW public.resellers_with_email SET (security_invoker = on);

COMMENT ON VIEW public.resellers_with_email IS 'View que combina dados de revendedores com emails (apenas para admin)';
