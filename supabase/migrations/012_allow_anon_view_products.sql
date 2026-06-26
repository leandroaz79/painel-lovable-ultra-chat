-- ===============================================================
-- MIGRATION 012: Permitir que anônimos vejam produtos ativos
-- ===============================================================
-- Rollback:
--   DROP POLICY IF EXISTS "anon_view_active_products" ON public.products_endcustomer;
-- ===============================================================

-- Landing page precisa mostrar produtos mesmo para não-logados
CREATE POLICY "anon_view_active_products"
  ON public.products_endcustomer
  FOR SELECT
  TO anon
  USING (active = TRUE);
