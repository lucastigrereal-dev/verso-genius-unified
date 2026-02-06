/**
 * Migration: Events System
 * Sistema de eventos temporários com recompensas limitadas
 */

-- Tabela events
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  image_url TEXT,

  -- Tipo de evento
  type VARCHAR(50) DEFAULT 'challenge' CHECK (type IN ('challenge', 'tournament', 'seasonal', 'special')),

  -- Datas
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,

  -- Recompensas
  reward_coins INTEGER DEFAULT 0,
  reward_gems INTEGER DEFAULT 0,
  reward_xp INTEGER DEFAULT 0,
  reward_cosmetic_id UUID REFERENCES cosmetics(id),

  -- Requisitos
  min_level INTEGER DEFAULT 1,
  max_participants INTEGER, -- NULL = ilimitado

  -- Config
  is_active BOOLEAN DEFAULT true,
  is_repeating BOOLEAN DEFAULT false,
  repeat_interval_days INTEGER, -- NULL = não repete

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CHECK (end_date > start_date)
);

-- Tabela event_objectives
CREATE TABLE IF NOT EXISTS event_objectives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,

  title VARCHAR(200) NOT NULL,
  description TEXT,

  -- Tipo de objetivo
  objective_type VARCHAR(50) NOT NULL CHECK (objective_type IN (
    'rhymes_count',       -- Criar X rimas
    'battles_won',        -- Vencer X batalhas
    'daily_streak',       -- Manter streak por X dias
    'xp_earned',          -- Ganhar X XP
    'exercises_completed', -- Completar X exercícios
    'score_threshold'     -- Atingir pontuação X
  )),

  target_value INTEGER NOT NULL,

  -- Ordem de exibição
  order_index INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela user_event_progress
CREATE TABLE IF NOT EXISTS user_event_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Progresso
  current_progress INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,

  -- Recompensa
  reward_claimed BOOLEAN DEFAULT false,
  reward_claimed_at TIMESTAMPTZ,

  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  UNIQUE(event_id, user_id)
);

-- Tabela event_leaderboard
CREATE TABLE IF NOT EXISTS event_leaderboard (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  score INTEGER DEFAULT 0,
  rank INTEGER,

  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(event_id, user_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_end_date ON events(end_date);
CREATE INDEX IF NOT EXISTS idx_events_is_active ON events(is_active);

CREATE INDEX IF NOT EXISTS idx_event_objectives_event_id ON event_objectives(event_id);
CREATE INDEX IF NOT EXISTS idx_event_objectives_order ON event_objectives(order_index);

CREATE INDEX IF NOT EXISTS idx_user_event_progress_event_id ON user_event_progress(event_id);
CREATE INDEX IF NOT EXISTS idx_user_event_progress_user_id ON user_event_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_event_progress_completed ON user_event_progress(is_completed);

CREATE INDEX IF NOT EXISTS idx_event_leaderboard_event_id ON event_leaderboard(event_id);
CREATE INDEX IF NOT EXISTS idx_event_leaderboard_score ON event_leaderboard(score DESC);
CREATE INDEX IF NOT EXISTS idx_event_leaderboard_rank ON event_leaderboard(rank);

-- Triggers
CREATE OR REPLACE FUNCTION update_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER events_updated_at
BEFORE UPDATE ON events
FOR EACH ROW
EXECUTE FUNCTION update_events_updated_at();

-- Function: Atualizar rank no leaderboard quando score muda
CREATE OR REPLACE FUNCTION update_event_leaderboard_rank()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalcular ranks para o evento
  WITH ranked AS (
    SELECT
      id,
      ROW_NUMBER() OVER (PARTITION BY event_id ORDER BY score DESC) as new_rank
    FROM event_leaderboard
    WHERE event_id = NEW.event_id
  )
  UPDATE event_leaderboard el
  SET rank = ranked.new_rank
  FROM ranked
  WHERE el.id = ranked.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER event_leaderboard_rank_update
AFTER INSERT OR UPDATE OF score ON event_leaderboard
FOR EACH ROW
EXECUTE FUNCTION update_event_leaderboard_rank();

-- Function: Desativar eventos expirados (chamar via cron)
CREATE OR REPLACE FUNCTION deactivate_expired_events()
RETURNS void AS $$
BEGIN
  UPDATE events
  SET is_active = false
  WHERE end_date < NOW()
    AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_event_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_leaderboard ENABLE ROW LEVEL SECURITY;

-- Events: Todos podem ver eventos ativos
CREATE POLICY "Active events are viewable by everyone"
ON events FOR SELECT
USING (is_active = true AND NOW() BETWEEN start_date AND end_date);

-- Event Objectives: Todos podem ver objetivos de eventos ativos
CREATE POLICY "Event objectives are viewable"
ON event_objectives FOR SELECT
USING (EXISTS (
  SELECT 1 FROM events
  WHERE events.id = event_objectives.event_id
    AND events.is_active = true
));

-- User Event Progress: Usuários podem ver seu próprio progresso
CREATE POLICY "Users can view own event progress"
ON user_event_progress FOR SELECT
USING (auth.uid() = user_id);

-- User Event Progress: Sistema pode inserir/atualizar
CREATE POLICY "System can manage event progress"
ON user_event_progress FOR ALL
USING (true);

-- Event Leaderboard: Todos podem ver leaderboard
CREATE POLICY "Event leaderboard is viewable"
ON event_leaderboard FOR SELECT
USING (EXISTS (
  SELECT 1 FROM events
  WHERE events.id = event_leaderboard.event_id
    AND events.is_active = true
));

-- Comentários
COMMENT ON TABLE events IS 'Eventos temporários com recompensas e objetivos';
COMMENT ON TABLE event_objectives IS 'Objetivos/missões de cada evento';
COMMENT ON TABLE user_event_progress IS 'Progresso individual do usuário em cada evento';
COMMENT ON TABLE event_leaderboard IS 'Ranking de pontuação dos eventos';

COMMENT ON COLUMN events.type IS 'Tipo: challenge (desafio), tournament (torneio), seasonal (temporada), special (especial)';
COMMENT ON COLUMN events.is_repeating IS 'Se true, evento se repete automaticamente após repeat_interval_days';
COMMENT ON COLUMN event_objectives.objective_type IS 'Tipo de objetivo a ser completado';
COMMENT ON COLUMN event_objectives.target_value IS 'Valor alvo para completar o objetivo';
