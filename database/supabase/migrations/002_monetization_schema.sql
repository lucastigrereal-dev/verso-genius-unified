-- ============================================================================
-- VERSO GENIUS - MONETIZATION SCHEMA
-- Implementação completa de 20 features de monetização
-- ============================================================================

-- ============================================================================
-- 1. VIRTUAL CURRENCY
-- ============================================================================

-- Tipos de moeda
CREATE TYPE currency_type AS ENUM ('coins', 'gems');

-- Saldo de moedas do usuário
CREATE TABLE user_currency (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  coins BIGINT DEFAULT 0 CHECK (coins >= 0),
  gems BIGINT DEFAULT 0 CHECK (gems >= 0),
  lifetime_coins_earned BIGINT DEFAULT 0,
  lifetime_gems_earned BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transações de moeda
CREATE TABLE currency_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  currency_type currency_type NOT NULL,
  amount BIGINT NOT NULL,
  balance_after BIGINT NOT NULL,
  transaction_type VARCHAR(50) NOT NULL, -- purchase, reward, spend, refund
  source VARCHAR(100), -- daily_challenge, loot_box, purchase
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_currency_transactions_user ON currency_transactions(user_id, created_at DESC);
CREATE INDEX idx_currency_transactions_type ON currency_transactions(transaction_type);

-- ============================================================================
-- 2. PREMIUM TIERS
-- ============================================================================

CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'elite');
CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'expired', 'trial');

CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier subscription_tier NOT NULL,
  status subscription_status NOT NULL DEFAULT 'active',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  auto_renew BOOLEAN DEFAULT TRUE,
  payment_method VARCHAR(50),
  stripe_subscription_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON user_subscriptions(status, expires_at);

-- ============================================================================
-- 3. LOOT BOXES
-- ============================================================================

CREATE TYPE rarity_tier AS ENUM ('common', 'rare', 'epic', 'legendary');

CREATE TABLE loot_boxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  cost_coins INTEGER,
  cost_gems INTEGER,
  rarity_weights JSONB NOT NULL, -- {"common": 60, "rare": 25, "epic": 10, "legendary": 5}
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_loot_box_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  loot_box_id UUID NOT NULL REFERENCES loot_boxes(id),
  opened_at TIMESTAMPTZ,
  rewards JSONB, -- [{type: "rhyme", id: "...", rarity: "epic"}]
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_loot_inventory_user ON user_loot_box_inventory(user_id, opened_at);

-- ============================================================================
-- 4. COSMETICS & ITEMS
-- ============================================================================

CREATE TYPE cosmetic_type AS ENUM ('avatar_frame', 'profile_theme', 'badge', 'effect');

CREATE TABLE cosmetics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  type cosmetic_type NOT NULL,
  rarity rarity_tier NOT NULL,
  cost_coins INTEGER,
  cost_gems INTEGER,
  image_url VARCHAR(500),
  metadata JSONB DEFAULT '{}'::jsonb,
  is_available BOOLEAN DEFAULT TRUE,
  limited_edition BOOLEAN DEFAULT FALSE,
  available_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_cosmetics (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cosmetic_id UUID NOT NULL REFERENCES cosmetics(id),
  acquired_at TIMESTAMPTZ DEFAULT NOW(),
  equipped BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (user_id, cosmetic_id)
);

CREATE INDEX idx_user_cosmetics_equipped ON user_cosmetics(user_id, equipped);

-- ============================================================================
-- 5. DAILY CHALLENGES
-- ============================================================================

CREATE TYPE challenge_difficulty AS ENUM ('easy', 'medium', 'hard');

CREATE TABLE daily_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  difficulty challenge_difficulty NOT NULL,
  reward_coins INTEGER NOT NULL,
  reward_xp INTEGER NOT NULL,
  requirements JSONB NOT NULL, -- {type: "rhyme_count", target: 10}
  active_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_daily_challenges (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES daily_challenges(id),
  completed_at TIMESTAMPTZ,
  progress JSONB DEFAULT '{}'::jsonb,
  PRIMARY KEY (user_id, challenge_id)
);

CREATE INDEX idx_daily_challenges_date ON daily_challenges(active_date DESC);
CREATE INDEX idx_user_challenges_completed ON user_daily_challenges(user_id, completed_at);

-- ============================================================================
-- 6. BATTLE PASS
-- ============================================================================

CREATE TABLE battle_passes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_number INTEGER NOT NULL,
  name VARCHAR(100) NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  cost_gems INTEGER NOT NULL DEFAULT 500,
  max_tier INTEGER NOT NULL DEFAULT 20,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE battle_pass_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_pass_id UUID NOT NULL REFERENCES battle_passes(id) ON DELETE CASCADE,
  tier_number INTEGER NOT NULL,
  xp_required INTEGER NOT NULL,
  free_rewards JSONB, -- [{type: "coins", amount: 50}]
  premium_rewards JSONB, -- [{type: "cosmetic_id", id: "..."}]
  UNIQUE(battle_pass_id, tier_number)
);

CREATE TABLE user_battle_passes (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  battle_pass_id UUID NOT NULL REFERENCES battle_passes(id),
  is_premium BOOLEAN DEFAULT FALSE,
  current_tier INTEGER DEFAULT 0,
  current_xp INTEGER DEFAULT 0,
  purchased_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, battle_pass_id)
);

CREATE INDEX idx_battle_pass_users ON user_battle_passes(battle_pass_id, current_tier DESC);

-- ============================================================================
-- 7. LEADERBOARDS
-- ============================================================================

CREATE TYPE leaderboard_type AS ENUM ('weekly', 'monthly', 'all_time');

CREATE TABLE leaderboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  type leaderboard_type NOT NULL,
  metric VARCHAR(50) NOT NULL, -- most_freestyles, highest_score, longest_streak
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  prize_pool_gems INTEGER,
  entry_fee_gems INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE leaderboard_entries (
  leaderboard_id UUID NOT NULL REFERENCES leaderboards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score BIGINT NOT NULL,
  rank INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (leaderboard_id, user_id)
);

CREATE INDEX idx_leaderboard_rank ON leaderboard_entries(leaderboard_id, rank);

-- ============================================================================
-- 8. REFERRAL SYSTEM
-- ============================================================================

CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referral_code VARCHAR(50) NOT NULL UNIQUE,
  status VARCHAR(20) DEFAULT 'pending', -- pending, completed
  reward_claimed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE referral_milestones (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  milestone INTEGER NOT NULL, -- 5, 10, 50 friends
  reward_type VARCHAR(50) NOT NULL,
  reward_value JSONB NOT NULL,
  claimed BOOLEAN DEFAULT FALSE,
  claimed_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, milestone)
);

CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX idx_referrals_code ON referrals(referral_code);

-- ============================================================================
-- 9. ACHIEVEMENTS
-- ============================================================================

CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  icon_url VARCHAR(500),
  rarity rarity_tier NOT NULL,
  requirements JSONB NOT NULL, -- {type: "freestyle_count", target: 100}
  reward_coins INTEGER,
  reward_gems INTEGER,
  reward_cosmetic_id UUID REFERENCES cosmetics(id),
  is_secret BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_achievements (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id),
  progress JSONB DEFAULT '{}'::jsonb,
  completed_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_completed ON user_achievements(user_id, completed_at);

-- ============================================================================
-- 10. CREWS (GRUPOS)
-- ============================================================================

CREATE TABLE crews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  tag VARCHAR(10) UNIQUE, -- [TAG]
  owner_id UUID NOT NULL REFERENCES users(id),
  max_members INTEGER DEFAULT 10,
  is_premium BOOLEAN DEFAULT FALSE,
  total_xp BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE crew_members (
  crew_id UUID NOT NULL REFERENCES crews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member', -- owner, admin, member
  contribution_xp BIGINT DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (crew_id, user_id)
);

CREATE TABLE crew_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  crew1_id UUID NOT NULL REFERENCES crews(id),
  crew2_id UUID NOT NULL REFERENCES crews(id),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  winner_id UUID REFERENCES crews(id),
  prize JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_crew_members_user ON crew_members(user_id);
CREATE INDEX idx_crews_xp ON crews(total_xp DESC);

-- ============================================================================
-- 11. MARKETPLACE (UGC)
-- ============================================================================

CREATE TABLE marketplace_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES users(id),
  type VARCHAR(50) NOT NULL, -- rhyme_pack, beat, tutorial
  name VARCHAR(200) NOT NULL,
  description TEXT,
  price_coins INTEGER NOT NULL,
  preview_url VARCHAR(500),
  content_url VARCHAR(500),
  downloads INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.00,
  is_approved BOOLEAN DEFAULT FALSE,
  moderated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE marketplace_purchases (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES marketplace_items(id),
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, item_id)
);

CREATE TABLE marketplace_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES marketplace_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_marketplace_creator ON marketplace_items(creator_id);
CREATE INDEX idx_marketplace_approved ON marketplace_items(is_approved, downloads DESC);

-- ============================================================================
-- 12. LIVE BATTLES
-- ============================================================================

CREATE TYPE battle_status AS ENUM ('waiting', 'in_progress', 'completed', 'cancelled');

CREATE TABLE live_battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player1_id UUID NOT NULL REFERENCES users(id),
  player2_id UUID NOT NULL REFERENCES users(id),
  entry_fee_gems INTEGER NOT NULL,
  prize_gems INTEGER NOT NULL,
  status battle_status DEFAULT 'waiting',
  winner_id UUID REFERENCES users(id),
  rounds_data JSONB, -- [{round: 1, p1_score: 85, p2_score: 90}]
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE battle_spectators (
  battle_id UUID NOT NULL REFERENCES live_battles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bet_on_player_id UUID REFERENCES users(id),
  bet_amount_gems INTEGER,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (battle_id, user_id)
);

CREATE INDEX idx_battles_status ON live_battles(status, created_at DESC);

-- ============================================================================
-- 13. EVENTS (TIME-LIMITED)
-- ============================================================================

CREATE TABLE time_limited_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  event_type VARCHAR(50) NOT NULL, -- flash_sale, exclusive_drop, tournament
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  rewards JSONB, -- Exclusive rewards
  requirements JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_event_participation (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES time_limited_events(id),
  progress JSONB DEFAULT '{}'::jsonb,
  rewards_claimed JSONB DEFAULT '[]'::jsonb,
  PRIMARY KEY (user_id, event_id)
);

-- ============================================================================
-- 14. PARTNERSHIPS (MC Content)
-- ============================================================================

CREATE TABLE mc_partnerships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mc_name VARCHAR(100) NOT NULL,
  pack_name VARCHAR(200) NOT NULL,
  description TEXT,
  price_gems INTEGER NOT NULL,
  content_ids JSONB NOT NULL, -- [rhyme_ids, video_ids]
  image_url VARCHAR(500),
  revenue_share_percent INTEGER, -- 70 = 70% for MC
  total_sales INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_mc_packs (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pack_id UUID NOT NULL REFERENCES mc_partnerships(id),
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, pack_id)
);

-- ============================================================================
-- 15. AD SYSTEM
-- ============================================================================

CREATE TABLE ad_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ad_type VARCHAR(50) NOT NULL, -- video, banner, rewarded
  reward_coins INTEGER,
  watched_seconds INTEGER,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ad_views_user ON ad_views(user_id, created_at DESC);

-- ============================================================================
-- 16. PURCHASES & PAYMENTS
-- ============================================================================

CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_type VARCHAR(50) NOT NULL, -- subscription, gems, loot_box
  product_id VARCHAR(100),
  amount_brl DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'BRL',
  status VARCHAR(20) DEFAULT 'pending', -- pending, completed, failed, refunded
  payment_method VARCHAR(50),
  stripe_payment_id VARCHAR(255),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_purchases_user ON purchases(user_id, created_at DESC);
CREATE INDEX idx_purchases_status ON purchases(status, created_at DESC);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_currency_updated_at BEFORE UPDATE ON user_currency
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Daily Challenges padrão
INSERT INTO daily_challenges (title, description, difficulty, reward_coins, reward_xp, requirements, active_date) VALUES
('10 Rimas Rápidas', 'Crie 10 rimas em sequência', 'easy', 10, 50, '{"type": "rhyme_count", "target": 10}', CURRENT_DATE),
('Freestyle 60s', 'Grave um freestyle de 60 segundos sem parar', 'medium', 25, 100, '{"type": "freestyle_duration", "target": 60}', CURRENT_DATE),
('Mestre das Métricas', 'Complete 3 exercícios com score acima de 90', 'hard', 50, 200, '{"type": "high_score_count", "target": 3, "min_score": 90}', CURRENT_DATE);

-- Loot Box padrão
INSERT INTO loot_boxes (name, description, cost_coins, rarity_weights) VALUES
('Caixa Básica', 'Loot box com rimas de todas as raridades', 100, '{"common": 60, "rare": 25, "epic": 10, "legendary": 5}'),
('Caixa Premium', 'Mais chances de itens raros', 250, '{"common": 30, "rare": 40, "epic": 20, "legendary": 10}');

-- Cosméticos iniciais
INSERT INTO cosmetics (name, description, type, rarity, cost_coins, image_url) VALUES
('Moldura Bronze', 'Moldura de avatar bronze', 'avatar_frame', 'common', 50, '/cosmetics/frame_bronze.png'),
('Moldura Prata', 'Moldura de avatar prata', 'avatar_frame', 'rare', 150, '/cosmetics/frame_silver.png'),
('Moldura Ouro', 'Moldura de avatar ouro', 'avatar_frame', 'epic', 500, '/cosmetics/frame_gold.png'),
('Tema Dark Gold', 'Tema escuro com detalhes dourados', 'profile_theme', 'epic', 400, '/cosmetics/theme_dark_gold.png'),
('Badge Lendário', 'Badge exclusivo MC Lendário', 'badge', 'legendary', 1000, '/cosmetics/badge_legend.png');

-- Achievements iniciais
INSERT INTO achievements (name, description, rarity, requirements, reward_coins, reward_gems) VALUES
('Primeiros Passos', 'Complete seu primeiro exercício', 'common', '{"type": "exercise_count", "target": 1}', 10, 0),
('100 Freestyles', 'Grave 100 freestyles', 'rare', '{"type": "freestyle_count", "target": 100}', 100, 10),
('Streak de 7 Dias', 'Mantenha uma streak de 7 dias', 'epic', '{"type": "streak_days", "target": 7}', 200, 25),
('Mestre das Rimas', 'Crie 1000 rimas', 'legendary', '{"type": "rhyme_count", "target": 1000}', 500, 100);

-- ============================================================================
-- FUNCTIONS ÚTEIS
-- ============================================================================

-- Adicionar moedas
CREATE OR REPLACE FUNCTION add_currency(
  p_user_id UUID,
  p_currency_type currency_type,
  p_amount BIGINT,
  p_source VARCHAR(100)
)
RETURNS VOID AS $$
DECLARE
  v_new_balance BIGINT;
BEGIN
  -- Atualizar saldo
  IF p_currency_type = 'coins' THEN
    UPDATE user_currency
    SET coins = coins + p_amount,
        lifetime_coins_earned = lifetime_coins_earned + p_amount
    WHERE user_id = p_user_id
    RETURNING coins INTO v_new_balance;
  ELSE
    UPDATE user_currency
    SET gems = gems + p_amount,
        lifetime_gems_earned = lifetime_gems_earned + p_amount
    WHERE user_id = p_user_id
    RETURNING gems INTO v_new_balance;
  END IF;

  -- Registrar transação
  INSERT INTO currency_transactions (user_id, currency_type, amount, balance_after, transaction_type, source)
  VALUES (p_user_id, p_currency_type, p_amount, v_new_balance, 'reward', p_source);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================

SELECT 'Schema de monetização criado com sucesso!' as status;
SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema = 'public';
