-- ============================================================================
-- ULTRA CHAT - SCHEMA INICIAL COM RLS
-- Versão: 1.0
-- Data: 2026-06-07
-- ============================================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- TABELA: ts_licenses
-- Descrição: Armazena licenças de usuários
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.ts_licenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    license_key TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name TEXT,
    email TEXT,
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'suspended', 'trial')),
    license_type TEXT NOT NULL DEFAULT 'paid' CHECK (license_type IN ('trial', 'paid', 'lifetime')),
    lifetime BOOLEAN DEFAULT FALSE,
    activated_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    device_id TEXT,
    session_id TEXT,
    last_heartbeat TIMESTAMPTZ,
    online_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Índices para performance
CREATE INDEX idx_licenses_key ON public.ts_licenses(license_key);
CREATE INDEX idx_licenses_user ON public.ts_licenses(user_id);
CREATE INDEX idx_licenses_status ON public.ts_licenses(status);
CREATE INDEX idx_licenses_device ON public.ts_licenses(device_id);
CREATE INDEX idx_licenses_session ON public.ts_licenses(session_id);

-- RLS: Habilitar Row Level Security
ALTER TABLE public.ts_licenses ENABLE ROW LEVEL SECURITY;

-- Política: Usuários só veem suas próprias licenças
CREATE POLICY "Users can view own licenses"
ON public.ts_licenses
FOR SELECT
USING (auth.uid() = user_id);

-- Política: Apenas service_role pode inserir/atualizar
CREATE POLICY "Service role can insert licenses"
ON public.ts_licenses
FOR INSERT
WITH CHECK (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can update licenses"
ON public.ts_licenses
FOR UPDATE
USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- TABELA: notifications
-- Descrição: Notificações do sistema
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Índices
CREATE INDEX idx_notifications_active ON public.notifications(is_active, created_at DESC);
CREATE INDEX idx_notifications_priority ON public.notifications(priority DESC);

-- RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Política: Todos podem ler notificações ativas
CREATE POLICY "Public can read active notifications"
ON public.notifications
FOR SELECT
USING (is_active = TRUE AND (expires_at IS NULL OR expires_at > NOW()));

-- Política: Apenas service_role pode gerenciar
CREATE POLICY "Service role can manage notifications"
ON public.notifications
FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- TABELA: packages
-- Descrição: Planos de pagamento
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'MZN',
    duration_days INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    is_popular BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    features JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Índices
CREATE INDEX idx_packages_active ON public.packages(is_active, sort_order);

-- RLS
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

-- Política: Todos podem ler pacotes ativos
CREATE POLICY "Public can read active packages"
ON public.packages
FOR SELECT
USING (is_active = TRUE);

-- Política: Apenas service_role pode gerenciar
CREATE POLICY "Service role can manage packages"
ON public.packages
FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- TABELA: extension_versions
-- Descrição: Controle de versões da extensão
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.extension_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    version TEXT UNIQUE NOT NULL,
    changelog TEXT,
    file_path TEXT,
    is_alert_active BOOLEAN DEFAULT FALSE,
    is_mandatory BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Índices
CREATE INDEX idx_versions_active ON public.extension_versions(is_alert_active, created_at DESC);

-- RLS
ALTER TABLE public.extension_versions ENABLE ROW LEVEL SECURITY;

-- Política: Todos podem ler versões com alerta ativo
CREATE POLICY "Public can read active version alerts"
ON public.extension_versions
FOR SELECT
USING (is_alert_active = TRUE);

-- ============================================================================
-- TABELA: user_roles
-- Descrição: Roles de usuários (reseller, admin, etc)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'reseller', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(user_id, role)
);

-- Índices
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);

-- RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Política: Usuários só veem seus próprios roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- ============================================================================
-- TABELA: payment_transactions
-- Descrição: Histórico de transações de pagamento
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    license_key TEXT,
    package_id UUID REFERENCES public.packages(id),
    phone TEXT NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('mpesa', 'emola')),
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'MZN',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'cancelled')),
    transaction_id TEXT,
    provider_response JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Índices
CREATE INDEX idx_transactions_license ON public.payment_transactions(license_key);
CREATE INDEX idx_transactions_status ON public.payment_transactions(status, created_at DESC);
CREATE INDEX idx_transactions_phone ON public.payment_transactions(phone);

-- RLS
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Política: Apenas service_role pode acessar transações
CREATE POLICY "Service role can manage transactions"
ON public.payment_transactions
FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- FUNÇÕES AUXILIARES
-- ============================================================================

-- Função: Atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_ts_licenses_updated_at
    BEFORE UPDATE ON public.ts_licenses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_packages_updated_at
    BEFORE UPDATE ON public.packages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_transactions_updated_at
    BEFORE UPDATE ON public.payment_transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Função: Gerar chave de licença única
CREATE OR REPLACE FUNCTION public.generate_license_key()
RETURNS TEXT AS $$
DECLARE
    prefix TEXT := 'TS-';
    random_part TEXT;
    full_key TEXT;
    key_exists BOOLEAN;
BEGIN
    LOOP
        -- Gerar 20 caracteres aleatórios (A-Z, 0-9)
        random_part := UPPER(substring(md5(random()::text || clock_timestamp()::text) from 1 for 20));
        full_key := prefix || random_part;
        
        -- Verificar se já existe
        SELECT EXISTS(SELECT 1 FROM public.ts_licenses WHERE license_key = full_key) INTO key_exists;
        
        EXIT WHEN NOT key_exists;
    END LOOP;
    
    RETURN full_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- DADOS INICIAIS (SEED)
-- ============================================================================

-- Inserir pacotes padrão
INSERT INTO public.packages (name, price, duration_days, is_active, is_popular, sort_order, features) VALUES
('Plano Teste', 50.00, 7, TRUE, FALSE, 1, '["Acesso por 7 dias", "Todas as funcionalidades", "Suporte básico"]'::jsonb),
('Plano Mensal', 150.00, 30, TRUE, TRUE, 2, '["Acesso por 30 dias", "Todas as funcionalidades", "Suporte prioritário", "Atualizações automáticas"]'::jsonb),
('Plano Trimestral', 400.00, 90, TRUE, FALSE, 3, '["Acesso por 90 dias", "Todas as funcionalidades", "Suporte VIP", "Atualizações automáticas", "Desconto de 11%"]'::jsonb),
('Plano Vitalício', 800.00, NULL, TRUE, TRUE, 4, '["Acesso vitalício", "Todas as funcionalidades", "Suporte VIP", "Atualizações perpétuas", "Prioridade em novos recursos"]'::jsonb)
ON CONFLICT DO NOTHING;

-- Inserir notificação de boas-vindas
INSERT INTO public.notifications (title, message, is_active, priority) VALUES
('Bem-vindo ao Ultra Chat!', 'Obrigado por usar nossa extensão. Configure sua licença para começar.', TRUE, 1)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================================================

COMMENT ON TABLE public.ts_licenses IS 'Armazena licenças de usuários com controle de dispositivo e sessão';
COMMENT ON TABLE public.notifications IS 'Notificações do sistema exibidas na extensão';
COMMENT ON TABLE public.packages IS 'Planos de pagamento disponíveis';
COMMENT ON TABLE public.extension_versions IS 'Controle de versões para notificar atualizações';
COMMENT ON TABLE public.user_roles IS 'Roles especiais (reseller, admin)';
COMMENT ON TABLE public.payment_transactions IS 'Histórico de transações de pagamento';

-- ============================================================================
-- PERMISSÕES
-- ============================================================================

-- Conceder acesso anon role para leitura pública (RLS controla o resto)
GRANT SELECT ON public.notifications TO anon;
GRANT SELECT ON public.packages TO anon;
GRANT SELECT ON public.extension_versions TO anon;
GRANT SELECT ON public.ts_licenses TO anon;
GRANT SELECT ON public.user_roles TO anon;

-- Authenticated users
GRANT SELECT ON public.notifications TO authenticated;
GRANT SELECT ON public.packages TO authenticated;
GRANT SELECT ON public.extension_versions TO authenticated;
GRANT SELECT ON public.ts_licenses TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================
