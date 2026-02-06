/**
 * Migration: Battles System
 * Sistema de batalhas 1v1 em tempo real com betting
 */

-- Tabela battles
CREATE TABLE IF NOT EXISTS battles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Participantes
  player1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  player2_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Status
  status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'matched', 'in_progress', 'completed', 'cancelled')),

  -- Tipo de batalha
  battle_type VARCHAR(20) DEFAULT 'ranked' CHECK (battle_type IN ('ranked', 'casual', 'friendly', 'tournament')),

  -- Betting (opcional)
  bet_amount_coins INTEGER DEFAULT 0 CHECK (bet_amount_coins >= 0),
  bet_amount_gems INTEGER DEFAULT 0 CHECK (bet_amount_gems >= 0),

  -- Resultado
  winner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  loser_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Scores
  player1_score INTEGER DEFAULT 0,
  player2_score INTEGER DEFAULT 0,

  -- Tema da batalha
  theme VARCHAR(100),
  time_limit_seconds INTEGER DEFAULT 120, -- 2 minutos por rodada

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  matched_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Tabela battle_rounds (rodadas da batalha)
CREATE TABLE IF NOT EXISTS battle_rounds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  battle_id UUID NOT NULL REFERENCES battles(id) ON DELETE CASCADE,

  round_number INTEGER NOT NULL,

  -- Versos dos jogadores
  player1_verse TEXT,
  player2_verse TEXT,

  -- Votos (público ou juízes)
  player1_votes INTEGER DEFAULT 0,
  player2_votes INTEGER DEFAULT 0,

  -- Winner da rodada
  round_winner_id UUID REFERENCES users(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  UNIQUE(battle_id, round_number)
);

-- Tabela battle_votes (votos em batalhas públicas)
CREATE TABLE IF NOT EXISTS battle_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  battle_id UUID NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  voter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Voto
  voted_for_player_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(battle_id, round_number, voter_id)
);

-- Tabela battle_rankings (ELO ranking)
CREATE TABLE IF NOT EXISTS battle_rankings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- ELO rating
  elo_rating INTEGER DEFAULT 1200,

  -- Stats
  total_battles INTEGER DEFAULT 0 CHECK (total_battles >= 0),
  wins INTEGER DEFAULT 0 CHECK (wins >= 0),
  losses INTEGER DEFAULT 0 CHECK (losses >= 0),
  draws INTEGER DEFAULT 0 CHECK (draws >= 0),

  -- Win rate calculado
  win_rate DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE
      WHEN total_battles = 0 THEN 0
      ELSE ROUND((wins::DECIMAL / total_battles * 100), 2)
    END
  ) STORED,

  -- Streak
  current_win_streak INTEGER DEFAULT 0 CHECK (current_win_streak >= 0),
  best_win_streak INTEGER DEFAULT 0 CHECK (best_win_streak >= 0),

  -- Money earned
  total_coins_won INTEGER DEFAULT 0,
  total_gems_won INTEGER DEFAULT 0,

  -- Timestamps
  last_battle_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_battles_player1 ON battles(player1_id);
CREATE INDEX IF NOT EXISTS idx_battles_player2 ON battles(player2_id);
CREATE INDEX IF NOT EXISTS idx_battles_status ON battles(status);
CREATE INDEX IF NOT EXISTS idx_battles_type ON battles(battle_type);
CREATE INDEX IF NOT EXISTS idx_battles_created_at ON battles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_battles_winner ON battles(winner_id);

CREATE INDEX IF NOT EXISTS idx_battle_rounds_battle ON battle_rounds(battle_id);
CREATE INDEX IF NOT EXISTS idx_battle_votes_battle ON battle_votes(battle_id);
CREATE INDEX IF NOT EXISTS idx_battle_votes_voter ON battle_votes(voter_id);

CREATE INDEX IF NOT EXISTS idx_battle_rankings_elo ON battle_rankings(elo_rating DESC);
CREATE INDEX IF NOT EXISTS idx_battle_rankings_wins ON battle_rankings(wins DESC);
CREATE INDEX IF NOT EXISTS idx_battle_rankings_win_rate ON battle_rankings(win_rate DESC);

-- Trigger: Auto-update updated_at
CREATE OR REPLACE FUNCTION update_battle_rankings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_battle_rankings_updated_at
BEFORE UPDATE ON battle_rankings
FOR EACH ROW
EXECUTE FUNCTION update_battle_rankings_updated_at();

-- Function: Calcular novo ELO
CREATE OR REPLACE FUNCTION calculate_elo_change(
  winner_elo INTEGER,
  loser_elo INTEGER,
  k_factor INTEGER DEFAULT 32
)
RETURNS TABLE(winner_new_elo INTEGER, loser_new_elo INTEGER) AS $$
DECLARE
  expected_winner DECIMAL;
  expected_loser DECIMAL;
  winner_change INTEGER;
  loser_change INTEGER;
BEGIN
  -- Fórmula ELO
  expected_winner := 1.0 / (1.0 + POWER(10, (loser_elo - winner_elo) / 400.0));
  expected_loser := 1.0 / (1.0 + POWER(10, (winner_elo - loser_elo) / 400.0));

  winner_change := ROUND(k_factor * (1 - expected_winner));
  loser_change := ROUND(k_factor * (0 - expected_loser));

  RETURN QUERY SELECT
    winner_elo + winner_change,
    loser_elo + loser_change;
END;
$$ LANGUAGE plpgsql;

-- Function: Processar resultado da batalha
CREATE OR REPLACE FUNCTION process_battle_result()
RETURNS TRIGGER AS $$
DECLARE
  winner_ranking RECORD;
  loser_ranking RECORD;
  new_elos RECORD;
BEGIN
  -- Apenas processar quando status muda para 'completed'
  IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.winner_id IS NOT NULL THEN
    -- Buscar rankings
    SELECT * INTO winner_ranking FROM battle_rankings WHERE user_id = NEW.winner_id;
    SELECT * INTO loser_ranking FROM battle_rankings WHERE user_id = NEW.loser_id;

    -- Criar ranking se não existir
    IF winner_ranking IS NULL THEN
      INSERT INTO battle_rankings (user_id) VALUES (NEW.winner_id) RETURNING * INTO winner_ranking;
    END IF;

    IF loser_ranking IS NULL THEN
      INSERT INTO battle_rankings (user_id) VALUES (NEW.loser_id) RETURNING * INTO loser_ranking;
    END IF;

    -- Calcular novo ELO
    SELECT * INTO new_elos FROM calculate_elo_change(winner_ranking.elo_rating, loser_ranking.elo_rating);

    -- Atualizar winner
    UPDATE battle_rankings SET
      elo_rating = new_elos.winner_new_elo,
      total_battles = total_battles + 1,
      wins = wins + 1,
      current_win_streak = current_win_streak + 1,
      best_win_streak = GREATEST(best_win_streak, current_win_streak + 1),
      total_coins_won = total_coins_won + NEW.bet_amount_coins,
      total_gems_won = total_gems_won + NEW.bet_amount_gems,
      last_battle_at = NOW()
    WHERE user_id = NEW.winner_id;

    -- Atualizar loser
    UPDATE battle_rankings SET
      elo_rating = new_elos.loser_new_elo,
      total_battles = total_battles + 1,
      losses = losses + 1,
      current_win_streak = 0,
      last_battle_at = NOW()
    WHERE user_id = NEW.loser_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_process_battle_result
AFTER UPDATE ON battles
FOR EACH ROW
EXECUTE FUNCTION process_battle_result();

-- RLS Policies
ALTER TABLE battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_rankings ENABLE ROW LEVEL SECURITY;

-- Battles: Participantes e público podem ver
CREATE POLICY "Public can view active battles"
ON battles FOR SELECT
USING (status IN ('matched', 'in_progress', 'completed'));

-- Battles: Players podem criar
CREATE POLICY "Users can create battles"
ON battles FOR INSERT
WITH CHECK (auth.uid() = player1_id);

-- Battles: Players podem atualizar
CREATE POLICY "Players can update own battles"
ON battles FOR UPDATE
USING (auth.uid() = player1_id OR auth.uid() = player2_id);

-- Battle Rounds: Público pode ver
CREATE POLICY "Public can view battle rounds"
ON battle_rounds FOR SELECT
USING (true);

-- Battle Votes: Todos podem votar
CREATE POLICY "Users can vote on battles"
ON battle_votes FOR INSERT
WITH CHECK (auth.uid() = voter_id);

-- Battle Rankings: Todos podem ver
CREATE POLICY "Rankings are public"
ON battle_rankings FOR SELECT
USING (true);

-- Comentários
COMMENT ON TABLE battles IS 'Batalhas 1v1 em tempo real entre players';
COMMENT ON TABLE battle_rounds IS 'Rodadas de cada batalha (múltiplas rodadas por batalha)';
COMMENT ON TABLE battle_votes IS 'Votos do público em batalhas';
COMMENT ON TABLE battle_rankings IS 'ELO ranking e estatísticas de batalhas';

COMMENT ON COLUMN battles.status IS 'waiting: aguardando oponente, matched: oponente encontrado, in_progress: em andamento, completed: finalizada';
COMMENT ON COLUMN battle_rankings.elo_rating IS 'Rating ELO (começa em 1200)';
COMMENT ON COLUMN battle_rankings.win_rate IS 'Porcentagem de vitórias (calculado automaticamente)';
