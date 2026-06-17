-- ============================================================================
-- SCRIPT PARA CORRIGIR LICENÇAS DOS REVENDEDORES
-- ============================================================================
-- Este script atribui o reseller_id às licenças existentes e atualiza os contadores

-- 1. Primeiro, vamos verificar os dados
SELECT 'Revendedores:' AS info;
SELECT id, user_id, status, credits, total_licenses_created FROM resellers;

SELECT 'Licenças sem reseller_id:' AS info;
SELECT COUNT(*) FROM ts_licenses WHERE reseller_id IS NULL;

-- 2. Se você tem apenas 1 revendedor, use este script para atribuir todas as licenças a ele:
-- (Substitua 'SEU-RESELLER-ID' pelo ID do revendedor encontrado na consulta acima)

-- Opção A: Atribuir todas as licenças sem reseller_id ao primeiro revendedor ativo
DO $$
DECLARE
  v_reseller_id uuid;
BEGIN
  -- Busca o primeiro revendedor ativo
  SELECT id INTO v_reseller_id
  FROM resellers
  WHERE status = 'active'
  LIMIT 1;
  
  IF v_reseller_id IS NOT NULL THEN
    RAISE NOTICE 'Atribuindo licenças ao revendedor: %', v_reseller_id;
    
    -- Atualiza licenças sem reseller_id
    UPDATE ts_licenses
    SET reseller_id = v_reseller_id
    WHERE reseller_id IS NULL;
    
    RAISE NOTICE 'Licenças atualizadas com sucesso!';
    
    -- (Opcional) Atualiza o contador total_licenses_created se necessário
    UPDATE resellers
    SET total_licenses_created = (
      SELECT COUNT(*) FROM ts_licenses WHERE reseller_id = v_reseller_id
    )
    WHERE id = v_reseller_id;
    
    RAISE NOTICE 'Contador de licenças atualizado!';
  ELSE
    RAISE NOTICE 'Nenhum revendedor ativo encontrado!';
  END IF;
END $$;

-- 3. Verificar o resultado
SELECT 'Resultado final:' AS info;
SELECT r.id, r.user_id, r.total_licenses_created, COUNT(l.id) AS total_licencas
FROM resellers r
LEFT JOIN ts_licenses l ON r.id = l.reseller_id
GROUP BY r.id, r.user_id, r.total_licenses_created;
