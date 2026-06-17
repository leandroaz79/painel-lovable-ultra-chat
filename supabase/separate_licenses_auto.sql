-- ============================================================================
-- SCRIPT AUTOMÁTICO PARA SEPARAR LICENÇAS (SEM ID HARDCODED)
-- ============================================================================

-- 1. Primeiro, verifica os dados
SELECT 'Revendedores cadastrados:' AS info;
SELECT id, user_id, status, credits, total_licenses_created FROM resellers;

SELECT 'Todas as licenças (antes):' AS info;
SELECT 
  CASE WHEN reseller_id IS NULL THEN 'Admin' ELSE 'Revendedor' END AS dono,
  COUNT(*) AS total
FROM ts_licenses
GROUP BY dono;

-- 2. Script automático: pega o primeiro revendedor e atribui apenas as últimas N licenças a ele
DO $$
DECLARE
  v_reseller_id uuid;
  v_num_licencas_revendedor integer := 7; -- Ajuste este número para quantas licenças são do revendedor!
BEGIN
  -- Busca o primeiro revendedor ativo automaticamente
  SELECT id INTO v_reseller_id
  FROM resellers
  WHERE status = 'active'
  LIMIT 1;
  
  IF v_reseller_id IS NULL THEN
    RAISE EXCEPTION 'Nenhum revendedor ativo encontrado!';
  END IF;
  
  RAISE NOTICE 'Usando revendedor com ID: %', v_reseller_id;
  
  -- Primeiro, zera todos os reseller_id
  UPDATE ts_licenses SET reseller_id = NULL;
  RAISE NOTICE 'Todos os reseller_id foram resetados';
  
  -- Atribui as últimas N licenças ao revendedor
  UPDATE ts_licenses
  SET reseller_id = v_reseller_id
  WHERE id IN (
    SELECT id
    FROM ts_licenses
    ORDER BY created_at DESC
    LIMIT v_num_licencas_revendedor
  );
  
  RAISE NOTICE 'Atribuídas % licenças ao revendedor', v_num_licencas_revendedor;
  
  -- Atualiza o contador de licenças do revendedor
  UPDATE resellers
  SET total_licenses_created = (
    SELECT COUNT(*) FROM ts_licenses WHERE reseller_id = v_reseller_id
  )
  WHERE id = v_reseller_id;
  
  RAISE NOTICE 'Contador de licenças atualizado!';
  
END $$;

-- 3. Verifica o resultado final
SELECT 'Resultado final:' AS info;
SELECT 
  CASE WHEN reseller_id IS NULL THEN 'Admin' ELSE 'Revendedor' END AS dono,
  COUNT(*) AS total
FROM ts_licenses
GROUP BY dono;

SELECT 'Licenças do Admin:' AS info;
SELECT license_key, user_name, created_at FROM ts_licenses WHERE reseller_id IS NULL ORDER BY created_at DESC;

SELECT 'Licenças do Revendedor:' AS info;
SELECT license_key, user_name, created_at FROM ts_licenses WHERE reseller_id IS NOT NULL ORDER BY created_at DESC;
