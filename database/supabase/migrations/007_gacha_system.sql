/**
 * Migration: Advanced Gacha System
 * Sistema avançado de gacha com pity, banners rate-up e spark currency
 */

-- Tabela gacha_banners (banners temporários com rate-up)
CREATE TABLE IF NOT EXISTS gacha_banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  banner_image_url TEXT,

  -- Duração
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,

  -- Rate-up (cosméticos com probabilidade aumentada)
  featured_cosmetic_ids UUID[] DEFAULT '{}',
  rate_up_multiplier DECIMAL(3,2) DEFAULT 2.0 CHECK (rate_up_multiplier >= 1.0),

  -- Pity system config
  pity_threshold INTEGER DEFAULT 90 CHECK (pity_threshold > 0),
  guaranteed_rarity VARCHAR(20) DEFAULT 'legendary', -- Qual raridade é garantida no pity

  -- Custo
  cost_gems INTEGER DEFAULT 100 CHECK (cost_gems > 0),
  multi_pull_discount INTEGER DEFAULT 10, -- 10% off em 10-pull

  -- Tipo de banner
  banner_type VARCHAR(20) DEFAULT 'standard' CHECK (banner_type IN ('standard', 'limited', 'seasonal', 'character')),

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CHECK (end_date > start_date)
);

-- Tabela gacha_pity_tracker (tracking de pity por usuário/banner)
CREATE TABLE IF NOT EXISTS gacha_pity_tracker (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  banner_id UUID NOT NULL REFERENCES gacha_banners(id) ON DELETE CASCADE,

  -- Contadores
  pulls_since_last_legendary INTEGER DEFAULT 0 CHECK (pulls_since_last_legendary >= 0),
  pulls_since_last_epic INTEGER DEFAULT 0 CHECK (pulls_since_last_epic >= 0),
  total_pulls INTEGER DEFAULT 0 CHECK (total_pulls >= 0),

  -- Estatísticas
  total_legendary_pulled INTEGER DEFAULT 0,
  total_epic_pulled INTEGER DEFAULT 0,
  total_rare_pulled INTEGER DEFAULT 0,

  -- Spark currency (1 spark por pull)
  spark_tokens INTEGER DEFAULT 0 CHECK (spark_tokens >= 0),

  last_pull_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, banner_id)
);

-- Tabela gacha_pull_history (histórico completo de pulls)
CREATE TABLE IF NOT EXISTS gacha_pull_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  banner_id UUID NOT NULL REFERENCES gacha_banners(id) ON DELETE CASCADE,

  -- Resultado do pull
  cosmetic_id UUID NOT NULL REFERENCES cosmetics(id),
  cosmetic_rarity VARCHAR(20) NOT NULL,

  -- Foi pity?
  was_pity_pull BOOLEAN DEFAULT false,
  was_rate_up BOOLEAN DEFAULT false,

  -- Pull único ou multi?
  pull_type VARCHAR(10) CHECK (pull_type IN ('single', 'multi')),
  pull_number INTEGER, -- Número na sequência (1-10 se multi)

  -- Custo
  gems_spent INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela spark_shop (cosméticos disponíveis para troca por sparks)
CREATE TABLE IF NOT EXISTS spark_shop (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  banner_id UUID NOT NULL REFERENCES gacha_banners(id) ON DELETE CASCADE,
  cosmetic_id UUID NOT NULL REFERENCES cosmetics(id) ON DELETE CASCADE,

  -- Custo em sparks
  spark_cost INTEGER DEFAULT 300 CHECK (spark_cost > 0),

  -- Limite de trocas
  max_exchanges INTEGER DEFAULT 1, -- Quantas vezes pode trocar
  times_exchanged INTEGER DEFAULT 0,

  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(banner_id, cosmetic_id)
);

-- Tabela spark_exchange_history (histórico de trocas de spark)
CREATE TABLE IF NOT EXISTS spark_exchange_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  banner_id UUID NOT NULL REFERENCES gacha_banners(id) ON DELETE CASCADE,
  cosmetic_id UUID NOT NULL REFERENCES cosmetics(id),

  sparks_spent INTEGER NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_gacha_banners_active ON gacha_banners(is_active, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_gacha_banners_type ON gacha_banners(banner_type);
CREATE INDEX IF NOT EXISTS idx_gacha_banners_dates ON gacha_banners(start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_gacha_pity_user ON gacha_pity_tracker(user_id);
CREATE INDEX IF NOT EXISTS idx_gacha_pity_banner ON gacha_pity_tracker(banner_id);
CREATE INDEX IF NOT EXISTS idx_gacha_pity_user_banner ON gacha_pity_tracker(user_id, banner_id);

CREATE INDEX IF NOT EXISTS idx_gacha_pull_history_user ON gacha_pull_history(user_id);
CREATE INDEX IF NOT EXISTS idx_gacha_pull_history_banner ON gacha_pull_history(banner_id);
CREATE INDEX IF NOT EXISTS idx_gacha_pull_history_created_at ON gacha_pull_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_spark_shop_banner ON spark_shop(banner_id);
CREATE INDEX IF NOT EXISTS idx_spark_exchange_user ON spark_exchange_history(user_id);

-- Trigger: Auto-update updated_at
CREATE OR REPLACE FUNCTION update_gacha_pity_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_gacha_pity_updated_at
BEFORE UPDATE ON gacha_pity_tracker
FOR EACH ROW
EXECUTE FUNCTION update_gacha_pity_updated_at();

-- Function: Expirar banners automáticos (cron)
CREATE OR REPLACE FUNCTION expire_gacha_banners()
RETURNS void AS $$
BEGIN
  UPDATE gacha_banners
  SET is_active = false
  WHERE end_date < NOW()
    AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Function: Calcular probabilidade com rate-up
CREATE OR REPLACE FUNCTION calculate_gacha_probability(
  base_probability DECIMAL,
  is_featured BOOLEAN,
  rate_up_mult DECIMAL
)
RETURNS DECIMAL AS $$
BEGIN
  IF is_featured THEN
    RETURN LEAST(base_probability * rate_up_mult, 1.0);
  ELSE
    RETURN base_probability;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE gacha_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE gacha_pity_tracker ENABLE ROW LEVEL SECURITY;
ALTER TABLE gacha_pull_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE spark_shop ENABLE ROW LEVEL SECURITY;
ALTER TABLE spark_exchange_history ENABLE ROW LEVEL SECURITY;

-- Banners: Todos podem ver banners ativos
CREATE POLICY "Active banners are viewable by everyone"
ON gacha_banners FOR SELECT
USING (is_active = true AND NOW() BETWEEN start_date AND end_date);

-- Pity Tracker: Usuário pode ver/atualizar próprio tracker
CREATE POLICY "Users can view own pity tracker"
ON gacha_pity_tracker FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own pity tracker"
ON gacha_pity_tracker FOR UPDATE
USING (auth.uid() = user_id);

-- Pull History: Usuário pode ver próprio histórico
CREATE POLICY "Users can view own pull history"
ON gacha_pull_history FOR SELECT
USING (auth.uid() = user_id);

-- Spark Shop: Todos podem ver itens disponíveis
CREATE POLICY "Spark shop items are viewable by everyone"
ON spark_shop FOR SELECT
USING (is_available = true);

-- Spark Exchange History: Usuário pode ver próprio histórico
CREATE POLICY "Users can view own spark exchanges"
ON spark_exchange_history FOR SELECT
USING (auth.uid() = user_id);

-- Comentários
COMMENT ON TABLE gacha_banners IS 'Banners temporários de gacha com rate-up para cosméticos específicos';
COMMENT ON TABLE gacha_pity_tracker IS 'Tracking de pity system por usuário e banner';
COMMENT ON TABLE gacha_pull_history IS 'Histórico completo de todos os pulls (single e multi)';
COMMENT ON TABLE spark_shop IS 'Loja de sparks - troca de tokens por cosméticos garantidos';
COMMENT ON TABLE spark_exchange_history IS 'Histórico de trocas de spark tokens';

COMMENT ON COLUMN gacha_banners.pity_threshold IS 'Número de pulls para garantir legendary (ex: 90 pulls)';
COMMENT ON COLUMN gacha_banners.rate_up_multiplier IS 'Multiplicador de probabilidade para featured items (ex: 2.0 = 2x chance)';
COMMENT ON COLUMN gacha_pity_tracker.spark_tokens IS 'Moeda especial ganha a cada pull (1 spark = 1 pull)';
COMMENT ON COLUMN spark_shop.spark_cost IS 'Custo em sparks para garantir o cosmético (tipicamente 300 sparks)';
