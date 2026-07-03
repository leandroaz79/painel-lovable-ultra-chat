-- ============================================================================
-- Migration 016: Remover GRANT permissivo de increment_reseller_credits (CRIT-003)
-- ============================================================================
-- PROBLEMA: A função increment_reseller_credits tem GRANT EXECUTE para
-- authenticated, permitindo que qualquer usuário autenticado conceda
-- créditos a si mesmo sem pagamento.
--
-- SOLUÇÃO: Revogar o GRANT. A função é SECURITY DEFINER e owner é
-- o role postgres, então service_role já tem acesso.
--
-- ROLLBACK:
--   GRANT EXECUTE ON FUNCTION increment_reseller_credits(UUID, INTEGER) TO authenticated;
-- ============================================================================

-- Revogar permissão de authenticated
REVOKE EXECUTE ON FUNCTION increment_reseller_credits(UUID, INTEGER) FROM authenticated;
