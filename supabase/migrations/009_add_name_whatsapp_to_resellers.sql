-- ============================================================================
-- Migration 009: Adicionar campos name e whatsapp à tabela resellers
-- Descrição: Adiciona campos para armazenar nome completo e WhatsApp do revendedor
-- ============================================================================

-- 1. Adicionar campos à tabela resellers
ALTER TABLE public.resellers 
ADD COLUMN IF NOT EXISTS name text,
ADD COLUMN IF NOT EXISTS whatsapp text;

-- 2. Comentários
COMMENT ON COLUMN public.resellers.name IS 'Nome completo do revendedor';
COMMENT ON COLUMN public.resellers.whatsapp IS 'Número de WhatsApp do revendedor';

-- 3. Verificação final
DO $$
BEGIN
  RAISE NOTICE 'Migration 009 executada com sucesso!';
  RAISE NOTICE 'Campos adicionados: name, whatsapp';
END $$;
