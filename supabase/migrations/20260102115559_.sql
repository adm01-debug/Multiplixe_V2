-- Migration: Implementar sistema de Filtros Salvos
-- Data: 2024-12-31
-- Autor: Agente IA BPM
-- Sistema: MULTIPLIXE (Ascend Learning Platform)

-- Tabela para salvar filtros personalizados por usuário
CREATE TABLE IF NOT EXISTS saved_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL, -- ex: 'courses', 'learning_paths', 'users', 'quizzes'
  name TEXT NOT NULL,
  description TEXT,
  filters JSONB NOT NULL, -- Estrutura do filtro em formato JSON
  is_default BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false, -- Se outros usuários podem usar
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_filter_name_per_user UNIQUE (user_id, entity_type, name)
);

-- Índices para performance
CREATE INDEX idx_saved_filters_user ON saved_filters(user_id);
CREATE INDEX idx_saved_filters_entity ON saved_filters(entity_type);
CREATE INDEX idx_saved_filters_default ON saved_filters(is_default) WHERE is_default = true;
CREATE INDEX idx_saved_filters_public ON saved_filters(is_public) WHERE is_public = true;

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_saved_filters_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER saved_filters_updated_at
BEFORE UPDATE ON saved_filters
FOR EACH ROW
EXECUTE FUNCTION update_saved_filters_timestamp();

-- Row Level Security (RLS)
ALTER TABLE saved_filters ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver seus próprios filtros
CREATE POLICY "Users can view own filters"
ON saved_filters FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Usuários podem ver filtros públicos
CREATE POLICY "Users can view public filters"
ON saved_filters FOR SELECT
USING (is_public = true);

-- Policy: Usuários podem criar seus próprios filtros
CREATE POLICY "Users can create own filters"
ON saved_filters FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Usuários podem atualizar seus próprios filtros
CREATE POLICY "Users can update own filters"
ON saved_filters FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Usuários podem deletar seus próprios filtros
CREATE POLICY "Users can delete own filters"
ON saved_filters FOR DELETE
USING (auth.uid() = user_id);

-- Comentários para documentação
COMMENT ON TABLE saved_filters IS 'Filtros personalizados salvos por usuários para diferentes entidades do sistema';
COMMENT ON COLUMN saved_filters.entity_type IS 'Tipo de entidade: courses, learning_paths, users, quizzes, etc';
COMMENT ON COLUMN saved_filters.filters IS 'Estrutura JSON com os filtros aplicados';
COMMENT ON COLUMN saved_filters.is_default IS 'Se este é o filtro padrão carregado automaticamente';
COMMENT ON COLUMN saved_filters.is_public IS 'Se outros usuários podem visualizar e usar este filtro';

-- Função helper para garantir apenas 1 filtro padrão por entity_type
CREATE OR REPLACE FUNCTION ensure_single_default_filter()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    -- Remove is_default de todos os outros filtros do mesmo user e entity_type
    UPDATE saved_filters
    SET is_default = false
    WHERE user_id = NEW.user_id
      AND entity_type = NEW.entity_type
      AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_default
AFTER INSERT OR UPDATE OF is_default ON saved_filters
FOR EACH ROW
WHEN (NEW.is_default = true)
EXECUTE FUNCTION ensure_single_default_filter();
