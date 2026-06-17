-- Auditoria de ações administrativas no painel Ultra Chat
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  admin_user_id uuid NOT NULL,
  action text NOT NULL,
  target_table text NOT NULL DEFAULT 'ts_licenses',
  target_id uuid,
  license_key text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at
  ON public.admin_audit_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_license_key
  ON public.admin_audit_logs (license_key)
  WHERE license_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_user_id
  ON public.admin_audit_logs (admin_user_id);

DROP POLICY IF EXISTS "Admins can read audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins can read audit logs"
  ON public.admin_audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
    )
  );
