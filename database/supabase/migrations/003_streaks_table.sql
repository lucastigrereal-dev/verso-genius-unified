/**
 * Migration: Streaks System
 * Adiciona tabela user_streaks para sistema de login diário
 */

-- Criar tabela user_streaks
CREATE TABLE IF NOT EXISTS user_streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0 CHECK (current_streak >= 0),
  longest_streak INTEGER DEFAULT 0 CHECK (longest_streak >= 0),
  last_check_in TIMESTAMPTZ,
  total_check_ins INTEGER DEFAULT 0 CHECK (total_check_ins >= 0),
  streak_frozen_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_streaks_current_streak ON user_streaks(current_streak DESC);
CREATE INDEX IF NOT EXISTS idx_user_streaks_longest_streak ON user_streaks(longest_streak DESC);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_user_streaks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_streaks_updated_at
BEFORE UPDATE ON user_streaks
FOR EACH ROW
EXECUTE FUNCTION update_user_streaks_updated_at();

-- RLS Policies
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

-- Usuários podem ler seu próprio streak
CREATE POLICY "Users can view own streak"
ON user_streaks
FOR SELECT
USING (auth.uid() = user_id);

-- Usuários podem atualizar seu próprio streak (via service)
CREATE POLICY "Users can update own streak"
ON user_streaks
FOR UPDATE
USING (auth.uid() = user_id);

-- Sistema pode inserir streaks
CREATE POLICY "System can insert streaks"
ON user_streaks
FOR INSERT
WITH CHECK (true);

-- Comentários
COMMENT ON TABLE user_streaks IS 'Armazena streaks de check-in diário dos usuários';
COMMENT ON COLUMN user_streaks.current_streak IS 'Streak atual (dias consecutivos)';
COMMENT ON COLUMN user_streaks.longest_streak IS 'Maior streak já alcançado';
COMMENT ON COLUMN user_streaks.last_check_in IS 'Data/hora do último check-in';
COMMENT ON COLUMN user_streaks.total_check_ins IS 'Total de check-ins realizados (histórico completo)';
COMMENT ON COLUMN user_streaks.streak_frozen_until IS 'Data até quando o streak está protegido (feature premium)';
