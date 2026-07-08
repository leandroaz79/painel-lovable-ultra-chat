-- =====================================================
-- 018: meta_settings — configuração Meta Pixel + Conversions API
-- =====================================================
CREATE TABLE IF NOT EXISTS public.meta_settings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pixel_id        TEXT NOT NULL DEFAULT '',
    access_token    TEXT NOT NULL DEFAULT '',
    test_event_code TEXT NOT NULL DEFAULT '',
    dataset_id      TEXT NOT NULL DEFAULT '',
    enabled         BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.meta_settings ENABLE ROW LEVEL SECURITY;

-- Admin pode ler e escrever
CREATE POLICY "meta_settings_admin_all"
    ON public.meta_settings
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

-- Qualquer usuário autenticado pode ler (para carregar pixel)
CREATE POLICY "meta_settings_authenticated_read"
    ON public.meta_settings
    FOR SELECT
    TO authenticated
    USING (true);

-- Anônimo pode ler (landing page / pixel loading)
CREATE POLICY "meta_settings_anon_read"
    ON public.meta_settings
    FOR SELECT
    TO anon
    USING (true);

-- Function para garantir apenas um registro ativo
CREATE OR REPLACE FUNCTION public.ensure_single_meta_settings()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.meta_settings LIMIT 1) THEN
        INSERT INTO public.meta_settings (pixel_id, access_token, enabled)
        VALUES ('', '', false)
        ON CONFLICT DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Seed: registro padrão
INSERT INTO public.meta_settings (pixel_id, access_token, enabled)
VALUES ('', '', false)
ON CONFLICT DO NOTHING;
