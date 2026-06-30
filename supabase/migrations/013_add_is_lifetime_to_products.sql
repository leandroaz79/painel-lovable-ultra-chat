-- Migration 013: Adicionar campo is_lifetime para planos vitalícios
-- ============================================================================

ALTER TABLE public.products_endcustomer 
ADD COLUMN IF NOT EXISTS is_lifetime BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.products_endcustomer.is_lifetime IS 'Se TRUE, o plano não expira (license expires_at = NULL)';

-- Atualizar view de compras admin para incluir is_lifetime
-- (não há view materializada, apenas SELECT direto)
