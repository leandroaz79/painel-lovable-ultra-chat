-- ============================================================================
-- SCRIPT PARA SEPARAR LICENÇAS DO ADMIN E REVENDEDOR
-- ============================================================================

-- 1. Primeiro, vamos ver todas as licenças e quem é o dono de cada uma
SELECT 'Todas as licenças:' AS info;
SELECT id, license_key, user_name, status, license_type, reseller_id, created_at
FROM ts_licenses
ORDER BY created_at DESC;

-- ============================================================================
-- OPÇÃO 1: DEIXAR APENAS ALGUMAS LICENÇAS COM O REVENDEDOR
-- ============================================================================
-- Se você quiser deixar apenas licenças específicas com o revendedor,
-- substitua as chaves abaixo pelas licenças que realmente são do revendedor
-- e execute esse bloco:

/*
DO $$
BEGIN
  -- Primeiro, zera todos os reseller_id
  UPDATE ts_licenses SET reseller_id = NULL;
  
  -- Agora, atribui apenas as licenças que realmente são do revendedor
  UPDATE ts_licenses
  SET reseller_id = 'd8e01059-e36d-4015-bfa3-60007cd2558' -- ID do seu revendedor
  WHERE license_key IN (
    -- Coloque aqui as chaves das licenças que são do revendedor, uma por linha:
    'TS-CHAVE-1',
    'TS-CHAVE-2',
    'TS-CHAVE-3'
  );
  
  -- Atualiza o contador
  UPDATE resellers
  SET total_licenses_created = (
    SELECT COUNT(*) FROM ts_licenses WHERE reseller_id = 'd8e01059-e36d-4015-bfa3-60007cd2558'
  )
  WHERE id = 'd8e01059-e36d-4015-bfa3-60007cd2558';
  
  RAISE NOTICE 'Licenças separadas com sucesso!';
END $$;
*/

-- ============================================================================
-- OPÇÃO 2: DEIXAR APENAS AS LICENÇAS MAIS RECENTES COM O REVENDEDOR
-- ============================================================================
-- Se as licenças do revendedor são as mais recentes (ex: últimas X licenças),
-- use esse script (ajuste o número de licenças conforme necessário):

DO $$
DECLARE
  v_reseller_id uuid := 'd8e01059-e36d-4015-bfa3-60007cd2558'; -- ID do seu revendedor
  v_num_licencas integer := 7; -- Número de licenças que são realmente são do revendedor (ajuste esse número!
BEGIN
  -- Primeiro, zera todos os reseller_id
  UPDATE ts_licenses SET reseller_id = NULL;
  
  -- Agora, atribui as últimas v_num_licencas licenças ao revendedor
  UPDATE ts_licenses
  SET reseller_id = v_reseller_id
  WHERE id IN (
    SELECT id
    FROM ts_licenses
    ORDER BY created_at DESC
    LIMIT v_num_licencas
  );
  
  -- Atualiza o contador
  UPDATE resellers
  SET total_licenses_created = (
    SELECT COUNT(*) FROM ts_licenses WHERE reseller_id = v_reseller_id
  )
  WHERE id = v_reseller_id;
  
  RAISE NOTICE 'Últimas % licenças atribuídas ao revendedor!', v_num_licencas;
END $$;

-- Verifica o resultado final
SELECT 'Resultado final:' AS info;
SELECT 
  CASE WHEN reseller_id IS NULL THEN 'Admin' ELSE 'Revendedor' END AS dono,
  COUNT(*) AS total
FROM ts_licenses
GROUP BY dono;

SELECT 'Licenças do Admin (reseller_id = NULL):' AS info;
SELECT license_key, user_name, created_at FROM ts_licenses WHERE reseller_id IS NULL ORDER BY created_at DESC;

SELECT 'Licenças do Revendedor:' AS info;
SELECT license_key, user_name, created_at FROM ts_licenses WHERE reseller_id IS NOT NULL ORDER BY created_at DESC;
