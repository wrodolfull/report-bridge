-- Report Bridge - Schema do Banco de Dados
-- Execute este script no SQL Editor do Supabase

-- Criar tabela de relatórios
CREATE TABLE IF NOT EXISTS reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) DEFAULT 'general' CHECK (type IN ('general', 'sales', 'financial', 'marketing', 'operations')),
    data JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'completed', 'archived')),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(type);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);

-- Habilitar Row Level Security (RLS)
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Users can view own reports" ON reports;
DROP POLICY IF EXISTS "Users can create reports" ON reports;
DROP POLICY IF EXISTS "Users can update own reports" ON reports;
DROP POLICY IF EXISTS "Users can delete own reports" ON reports;

-- Policy para usuários verem apenas seus próprios relatórios
CREATE POLICY "Users can view own reports" ON reports
    FOR SELECT USING (auth.uid() = user_id);

-- Policy para usuários criarem relatórios
CREATE POLICY "Users can create reports" ON reports
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy para usuários atualizarem seus próprios relatórios
CREATE POLICY "Users can update own reports" ON reports
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy para usuários deletarem seus próprios relatórios
CREATE POLICY "Users can delete own reports" ON reports
    FOR DELETE USING (auth.uid() = user_id);

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_reports_updated_at ON reports;
CREATE TRIGGER update_reports_updated_at
    BEFORE UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Criar tabela de configurações do usuário (opcional)
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    theme VARCHAR(20) DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
    notifications BOOLEAN DEFAULT true,
    language VARCHAR(5) DEFAULT 'pt-BR',
    timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS para user_settings
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Policies para user_settings
CREATE POLICY "Users can view own settings" ON user_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON user_settings
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Trigger para user_settings
CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Função para criar configurações padrão quando um usuário se registra
CREATE OR REPLACE FUNCTION create_user_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_settings (user_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para criar configurações automáticas
DROP TRIGGER IF EXISTS create_user_settings_trigger ON auth.users;
CREATE TRIGGER create_user_settings_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_settings();

-- Inserir dados de exemplo (opcional - remova em produção)
-- INSERT INTO reports (title, description, type, user_id) VALUES
-- ('Relatório de Vendas Q1', 'Análise das vendas do primeiro trimestre', 'sales', auth.uid()),
-- ('Relatório Financeiro Março', 'Resumo financeiro do mês de março', 'financial', auth.uid()),
-- ('Campanha Marketing Digital', 'Resultados da campanha no Google Ads', 'marketing', auth.uid());

-- Comentários para documentação
COMMENT ON TABLE reports IS 'Tabela principal para armazenar relatórios dos usuários';
COMMENT ON COLUMN reports.type IS 'Tipo do relatório: general, sales, financial, marketing, operations';
COMMENT ON COLUMN reports.status IS 'Status do relatório: draft, pending, completed, archived';
COMMENT ON COLUMN reports.data IS 'Dados adicionais do relatório em formato JSON';

COMMENT ON TABLE user_settings IS 'Configurações personalizadas de cada usuário';

-- Mostrar mensagem de sucesso
SELECT 'Schema do Report Bridge criado com sucesso! 🚀' as message;

