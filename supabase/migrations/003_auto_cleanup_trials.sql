-- Migration: Auto cleanup trials expiradas via pg_cron
-- Executa a cada 5 minutos, deleta trials expiradas há mais de 3 minutos

-- 1. Ativar extensão pg_cron (executar se ainda não habilitado)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Criar função SQL para cleanup automático
CREATE OR REPLACE FUNCTION auto_cleanup_expired_trials()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.ts_licenses
  WHERE license_type = 'trial'
    AND expires_at < now() - interval '3 minutes';
END;
$$;

-- 3. Agendar job no pg_cron (roda a cada 5 minutos)
-- Importante: Ajustar timezone conforme necessário
SELECT cron.schedule(
  'cleanup-expired-trials', 
  '*/5 * * * *',  -- A cada 5 minutos
  $$SELECT auto_cleanup_expired_trials();$$
);

-- 4. Comentário para auditoria
COMMENT ON FUNCTION auto_cleanup_expired_trials() IS 'Deleta automaticamente licenças trial expiradas há mais de 3 minutos. Executado via pg_cron a cada 5 minutos.';

-- 5. Verificar jobs agendados (opcional, para debug)
-- SELECT * FROM cron.job WHERE jobname = 'cleanup-expired-trials';
