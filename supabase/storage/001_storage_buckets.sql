-- ============================================================================
-- ULTRA CHAT - STORAGE BUCKETS E POLÍTICAS
-- Versão: 1.0
-- Data: 2026-06-07
-- ============================================================================

-- ============================================================================
-- BUCKET: extension-releases
-- Descrição: Arquivos de release da extensão (público, read-only)
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'extension-releases',
    'extension-releases',
    TRUE,
    52428800, -- 50MB
    ARRAY['application/zip', 'application/x-zip-compressed']
)
ON CONFLICT (id) DO NOTHING;

-- Política: Qualquer um pode ler
CREATE POLICY "Public can read extension releases"
ON storage.objects
FOR SELECT
USING (bucket_id = 'extension-releases');

-- Política: Apenas service_role pode fazer upload
CREATE POLICY "Service role can upload releases"
ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'extension-releases' 
    AND auth.jwt()->>'role' = 'service_role'
);

-- ============================================================================
-- BUCKET: temp-images
-- Descrição: Imagens temporárias (expiram em 24h)
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'temp-images',
    'temp-images',
    TRUE,
    20971520, -- 20MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Política: Qualquer um pode fazer upload (com limite de data)
CREATE POLICY "Anyone can upload temp images"
ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'temp-images'
    AND (storage.foldername(name))[1] = to_char(now(), 'YYYY-MM-DD')
);

-- Política: Qualquer um pode ler imagens temporárias
CREATE POLICY "Anyone can read temp images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'temp-images');

-- Política: Apenas service_role pode deletar
CREATE POLICY "Service role can delete temp images"
ON storage.objects
FOR DELETE
USING (
    bucket_id = 'temp-images'
    AND auth.jwt()->>'role' = 'service_role'
);

-- ============================================================================
-- BUCKET: user-uploads
-- Descrição: Arquivos enviados por usuários autenticados
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'user-uploads',
    'user-uploads',
    FALSE,
    20971520, -- 20MB
    ARRAY[
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'text/csv',
        'application/json',
        'application/zip'
    ]
)
ON CONFLICT (id) DO NOTHING;

-- Política: Usuários podem fazer upload nos seus próprios diretórios
CREATE POLICY "Users can upload to own folder"
ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'user-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Política: Usuários podem ler seus próprios arquivos
CREATE POLICY "Users can read own files"
ON storage.objects
FOR SELECT
USING (
    bucket_id = 'user-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Política: Usuários podem deletar seus próprios arquivos
CREATE POLICY "Users can delete own files"
ON storage.objects
FOR DELETE
USING (
    bucket_id = 'user-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- FUNÇÃO: Limpeza automática de imagens temporárias (executar diariamente)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cleanup_temp_images()
RETURNS void AS $$
DECLARE
    yesterday TEXT;
BEGIN
    yesterday := to_char(now() - interval '1 day', 'YYYY-MM-DD');
    
    DELETE FROM storage.objects
    WHERE bucket_id = 'temp-images'
    AND (storage.foldername(name))[1] < yesterday;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON FUNCTION public.cleanup_temp_images() IS 'Remove imagens temporárias com mais de 24 horas. Execute via cron diariamente.';

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================
