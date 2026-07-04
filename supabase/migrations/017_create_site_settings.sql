-- =====================================================
-- 017: site_settings — configurações globais do sistema
-- =====================================================
CREATE TABLE IF NOT EXISTS public.site_settings (
    key         TEXT PRIMARY KEY,
    value       JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_by  UUID REFERENCES auth.users(id),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Admin pode ler e escrever
CREATE POLICY "site_settings_admin_all"
    ON public.site_settings
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Qualquer usuário autenticado pode ler (para carregar tema)
CREATE POLICY "site_settings_authenticated_read"
    ON public.site_settings
    FOR SELECT
    TO authenticated
    USING (true);

-- Anônimo pode ler (landing page)
CREATE POLICY "site_settings_anon_read"
    ON public.site_settings
    FOR SELECT
    TO anon
    USING (true);

-- Seed: tema padrão
INSERT INTO public.site_settings (key, value, updated_by)
VALUES (
    'theme_colors',
    '{
        "accent": "#9dff2f",
        "accent2": "#6de8ff",
        "bg": "#050b12",
        "bgSoft": "#07111c",
        "card": "rgba(13, 27, 40, 0.78)",
        "cardStrong": "rgba(17, 33, 48, 0.94)",
        "line": "rgba(137, 180, 209, 0.18)",
        "text": "#f4fbff",
        "muted": "#b0c8db",
        "muted2": "#7a94a8",
        "danger": "#ff3d55",
        "warning": "#f5b83d",
        "cyan": "#62d11f"
    }'::jsonb,
    NULL
)
ON CONFLICT (key) DO NOTHING;
