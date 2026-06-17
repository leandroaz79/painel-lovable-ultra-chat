-- ============================================================================
-- SCRIPT PARA RECALCULAR CRÉDITOS E CONTADORES DO REVENDEDOR
-- ============================================================================

-- 1. Verifica o estado atual
SELECT 'Estado atual dos revendedores:' AS info;
SELECT 
  id,
  user_id,
  status,
  credits,
  total_licenses_created,
  total_credits_purchased
FROM resellers;

SELECT 'Licenças do revendedor (não trials):' AS info;
SELECT 
  COUNT(*) AS total_licencas_validas,
  STRING_AGG(license_key, ', ') AS licencas
FROM ts_licenses 
WHERE reseller_id IS NOT NULL
  AND license_type != 'trial';

-- 2. Cria a RPC que faltava (increment_reseller_credits)
CREATE OR REPLACE FUNCTION public.increment_reseller_credits(
  reseller_user_id uuid,
  amount integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reseller_id uuid;
BEGIN
  -- Busca o ID do revendedor pelo user_id
  SELECT id INTO v_reseller_id
  FROM public.resellers
  WHERE user_id = reseller_user_id;
  
  IF v_reseller_id IS NULL THEN
    RAISE EXCEPTION 'Revendedor não encontrado para user_id: %', reseller_user_id;
  END IF;
  
  -- Atualiza os créditos
  UPDATE public.resellers
  SET credits = credits + amount
  WHERE id = v_reseller_id;
  
  -- Registra a transação
  INSERT INTO public.reseller_credit_transactions (
    reseller_id,
    type,
    amount,
    metadata
  ) VALUES (
    v_reseller_id,
    CASE WHEN amount > 0 THEN 'adjustment' ELSE 'consume' END,
    amount,
    jsonb_build_object(
      'reason', 'recalculation',
      'adjustment_amount', amount
    )
  );
  
  RAISE NOTICE 'Créditos atualizados: reseller=% amount=%', v_reseller_id, amount;
END;
$$;

-- 3. Recalcula o total de licenças criadas pelo revendedor
DO $$
DECLARE
  v_reseller_id uuid;
  v_num_licencas_validas integer;
  v_credits_atuais integer;
  v_total_licencas_criadas_atuais integer;
  v_total_credits_comprados integer;
BEGIN
  -- Busca o primeiro revendedor ativo
  SELECT id, credits, total_licenses_created, total_credits_purchased 
  INTO v_reseller_id, v_credits_atuais, v_total_licencas_criadas_atuais, v_total_credits_comprados
  FROM resellers
  WHERE status = 'active'
  LIMIT 1;
  
  IF v_reseller_id IS NULL THEN
    RAISE EXCEPTION 'Nenhum revendedor ativo encontrado!';
  END IF;
  
  -- Conta quantas licenças não-trial o revendedor tem
  SELECT COUNT(*)
  INTO v_num_licencas_validas
  FROM ts_licenses
  WHERE reseller_id = v_reseller_id
    AND license_type != 'trial';
  
  RAISE NOTICE 'Revendedor: %', v_reseller_id;
  RAISE NOTICE 'Licenças válidas atuais: %', v_num_licencas_validas;
  RAISE NOTICE 'Total licenças criadas (atual): %', v_total_licencas_criadas_atuais;
  RAISE NOTICE 'Créditos (atual): %', v_credits_atuais;
  RAISE NOTICE 'Total comprados: %', v_total_credits_comprados;
  
  -- Atualiza total_licenses_created
  UPDATE resellers
  SET total_licenses_created = v_num_licencas_validas
  WHERE id = v_reseller_id;
  
  -- Recalcula os créditos disponíveis (total comprados + concedidos - licenças criadas)
  -- Lógica: total_credits_purchased (comprados) + créditos concedidos pelo admin - licenças usadas
  -- Para não mexer com o que já foi pago, vamos assumir que:
  -- créditos disponíveis = total_credits_purchased - licenças criadas + 7 (se for o caso dos concedidos)
  
  -- Opção 1: Se você quer deixar 8 créditos disponíveis (como o usuário mencionou)
  UPDATE resellers
  SET credits = 8
  WHERE id = v_reseller_id;
  
  RAISE NOTICE 'Créditos definidos para 8, total_licenses_created para %', v_num_licencas_validas;
  
END $$;

-- 4. Verifica o resultado final
SELECT 'Resultado final:' AS info;
SELECT 
  id,
  user_id,
  status,
  credits,
  total_licenses_created,
  total_credits_purchased
FROM resellers;

SELECT 'Licenças do revendedor:' AS info;
SELECT license_key, user_name, license_type FROM ts_licenses WHERE reseller_id IS NOT NULL;
