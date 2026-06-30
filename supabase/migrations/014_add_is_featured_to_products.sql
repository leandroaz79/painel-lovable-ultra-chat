-- Migration 014: Adicionar campo is_featured para plano em destaque
-- ============================================================================

ALTER TABLE public.products_endcustomer 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.products_endcustomer.is_featured IS 'Se TRUE, o plano aparece como destaque na landing page';
