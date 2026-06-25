-- ============================================================================
-- SCRIPT PARA VERIFICAR O ID CORRETO DO REVENDEDOR
-- ============================================================================

-- 1. Verifica todos os revendedores e seus IDs corretos
SELECT 'Revendedores cadastrados:' AS info;
SELECT 
  id, 
  user_id, 
  status, 
  credits, 
  total_licenses_created,
  LENGTH(id::text) AS id_length,
  id::text AS id_as_text
FROM resellers;

-- 2. Verifica o formato válido de UUID (deve ter 36 caracteres)
SELECT 'Formato de UUID válido:' AS info, 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' AS exemplo;
