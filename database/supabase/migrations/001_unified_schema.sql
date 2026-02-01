-- ========================================
-- APRENDA RIMA: SCHEMA UNIFICADO FINAL
-- 28 TABELAS CONSOLIDADAS & OTIMIZADAS
-- PostgreSQL 15 | Supabase Ready
-- ========================================

-- Última atualização: 2026-01-17
-- Status: PRODUCTION READY
-- Copy-paste direto em Supabase SQL Editor

-- ========================================
-- 0. SETUP INICIAL
-- ========================================

-- Habilitar extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Para full-text search em rimas

-- ========================================
-- 1. ENUMS & CUSTOM TYPES
-- ========================================

CREATE TYPE user_role AS ENUM ('admin', 'user', 'moderator');
CREATE TYPE exercise_type AS ENUM ('listening', 'matching', 'fill_blank', 'production', 'speed', 'sequencing', 'rhythm', 'comparison', 'simulation', 'freestyle');
CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE duel_status AS ENUM ('pending', 'completed', 'won', 'lost', 'draw');
CREATE TYPE purchase_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE cosmetic_type AS ENUM ('skin', 'border', 'avatar', 'emote');
CREATE TYPE cosmetic_rarity AS ENUM ('common', 'rare', 'epic', 'legendary');
CREATE TYPE rank_tier AS ENUM ('bronze', 'silver', 'gold', 'platinum', 'diamond');
CREATE TYPE quest_type AS ENUM ('daily', 'weekly', 'monthly', 'special');

-- ========================================
-- 2. CORE TABLES
-- ========================================

-- 2.1 Users (UNIFIED: auth + profile + progress + gamification)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  role user_role DEFAULT 'user',

  -- Gamification
  nivel INTEGER DEFAULT 1 CHECK (nivel BETWEEN 1 AND 50),
  xp_total INTEGER DEFAULT 0 CHECK (xp_total >= 0),
  rating INTEGER DEFAULT 1200 CHECK (rating >= 0),

  -- Streaks & Stats
  current_streak INTEGER DEFAULT 0 CHECK (current_streak >= 0),
  best_streak INTEGER DEFAULT 0 CHECK (best_streak >= 0),
  last_activity_at TIMESTAMP,

  -- Learning Progress
  current_pillar INTEGER DEFAULT 1 CHECK (current_pillar BETWEEN 1 AND 4),
  current_lesson INTEGER DEFAULT 1 CHECK (current_lesson BETWEEN 1 AND 4),
  current_exercise INTEGER DEFAULT 1 CHECK (current_exercise BETWEEN 1 AND 5),

  -- Battle Stats
  duels_total INTEGER DEFAULT 0 CHECK (duels_total >= 0),
  duels_won INTEGER DEFAULT 0 CHECK (duels_won >= 0),
  duels_lost INTEGER DEFAULT 0 CHECK (duels_lost >= 0),

  -- Theme Specialization
  theme_specialization VARCHAR(100),

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE users IS 'Tabela central unificada de usuários com auth, perfil, gamificação e progresso';

-- 2.2 Sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ========================================
-- 3. LEARNING SYSTEM
-- ========================================

-- 3.1 Exercise Template
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pillar INTEGER NOT NULL CHECK (pillar BETWEEN 1 AND 4),
  lesson INTEGER NOT NULL CHECK (lesson BETWEEN 1 AND 4),
  exercise_num INTEGER NOT NULL CHECK (exercise_num BETWEEN 1 AND 5),
  type exercise_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  instructions TEXT,
  audio_urls TEXT[],
  difficulty difficulty_level NOT NULL DEFAULT 'easy',
  time_limit_seconds INTEGER,
  base_xp INTEGER DEFAULT 10 CHECK (base_xp > 0),
  bonus_xp_threshold INTEGER DEFAULT 80,
  bonus_xp INTEGER DEFAULT 20,
  badge_reward UUID,
  ai_metrics TEXT[],
  sequence_order INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(pillar, lesson, exercise_num)
);

-- 3.2 Exercise Content
CREATE TABLE exercises_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  content_type VARCHAR(50),
  content TEXT NOT NULL,
  audio_url TEXT,
  sequence_order INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3.3 User Exercise Results
CREATE TABLE user_exercise_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,
  score INTEGER CHECK (score BETWEEN 0 AND 100),
  xp_earned INTEGER DEFAULT 0 CHECK (xp_earned >= 0),
  audio_url TEXT,
  audio_duration_seconds INTEGER,
  attempts INTEGER DEFAULT 1 CHECK (attempts > 0),
  completed_at TIMESTAMP,
  time_spent_seconds INTEGER,
  is_best_attempt BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 3.4 AI Evaluations
CREATE TABLE ai_evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  result_id UUID NOT NULL REFERENCES user_exercise_results(id) ON DELETE CASCADE,
  rhyme_score INTEGER CHECK (rhyme_score BETWEEN 0 AND 100),
  flow_score INTEGER CHECK (flow_score BETWEEN 0 AND 100),
  timing_score INTEGER CHECK (timing_score BETWEEN 0 AND 100),
  content_score INTEGER CHECK (content_score BETWEEN 0 AND 100),
  delivery_score INTEGER CHECK (delivery_score BETWEEN 0 AND 100),
  overall_score INTEGER CHECK (overall_score BETWEEN 0 AND 100),
  feedback_text TEXT,
  improvements JSONB,
  confidence_score INTEGER CHECK (confidence_score BETWEEN 0 AND 100),
  model_used VARCHAR(50),
  evaluated_at TIMESTAMP DEFAULT NOW()
);

-- ========================================
-- 4. RIMAS
-- ========================================

CREATE TABLE rimas_banco (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  verso TEXT NOT NULL,
  tema VARCHAR(100) NOT NULL,
  familia_rima VARCHAR(50),
  dificuldade difficulty_level NOT NULL,
  citacao_real TEXT,
  mc_source VARCHAR(100),
  musica_source VARCHAR(255),
  ranking INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE rimas_temas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(100) UNIQUE NOT NULL,
  descricao TEXT,
  icone_emoji VARCHAR(10),
  cor_hex VARCHAR(7),
  ranking INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ========================================
-- 5. GAMIFICATION
-- ========================================

CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon_emoji VARCHAR(10),
  xp_reward INTEGER DEFAULT 0,
  points_reward INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE RESTRICT,
  unlocked_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon_url TEXT,
  rarity cosmetic_rarity DEFAULT 'common',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE RESTRICT,
  equipped BOOLEAN DEFAULT FALSE,
  earned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

CREATE TABLE daily_quests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(100) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  quest_type quest_type DEFAULT 'daily',
  condition_type VARCHAR(50),
  condition_value INTEGER,
  xp_reward INTEGER DEFAULT 50,
  points_reward INTEGER DEFAULT 20,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_daily_quest_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quest_id UUID NOT NULL REFERENCES daily_quests(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, quest_id)
);

CREATE TABLE seasons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  season_number INTEGER UNIQUE NOT NULL,
  starts_at TIMESTAMP NOT NULL,
  ends_at TIMESTAMP NOT NULL,
  active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE seasonal_ranks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  points INTEGER DEFAULT 0,
  rank_tier rank_tier DEFAULT 'bronze',
  position INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, season_id)
);

-- ========================================
-- 6. BATTLE & DUELS
-- ========================================

CREATE TABLE user_duels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  verso_id UUID REFERENCES rimas_banco(id) ON DELETE SET NULL,
  user_verso TEXT NOT NULL,
  ai_response TEXT,
  difficulty difficulty_level NOT NULL DEFAULT 'easy',
  status duel_status DEFAULT 'pending',
  user_score INTEGER DEFAULT 0 CHECK (user_score BETWEEN 0 AND 100),
  ai_score INTEGER DEFAULT 0 CHECK (ai_score BETWEEN 0 AND 100),
  user_votes INTEGER DEFAULT 0,
  ai_votes INTEGER DEFAULT 0,
  xp_gained INTEGER DEFAULT 0,
  rating_change INTEGER DEFAULT 0,
  streak_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE duel_replays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  duel_id UUID NOT NULL REFERENCES user_duels(id) ON DELETE CASCADE,
  video_url TEXT,
  thumbnail_url TEXT,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE replay_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  replay_id UUID NOT NULL REFERENCES duel_replays(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ========================================
-- 7. SHOP & MONETIZATION
-- ========================================

CREATE TABLE cosmetics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type cosmetic_type NOT NULL,
  rarity cosmetic_rarity DEFAULT 'common',
  price_brl DECIMAL(10, 2) NOT NULL,
  is_limited BOOLEAN DEFAULT FALSE,
  available_until TIMESTAMP,
  image_url TEXT,
  preview_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_cosmetics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cosmetic_id UUID NOT NULL REFERENCES cosmetics(id) ON DELETE RESTRICT,
  purchased_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, cosmetic_id)
);

CREATE TABLE user_equipped (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  skin_id UUID REFERENCES cosmetics(id) ON DELETE SET NULL,
  border_id UUID REFERENCES cosmetics(id) ON DELETE SET NULL,
  avatar_id UUID REFERENCES cosmetics(id) ON DELETE SET NULL,
  emote_id UUID REFERENCES cosmetics(id) ON DELETE SET NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_session_id VARCHAR(255) UNIQUE,
  stripe_payment_intent VARCHAR(255) UNIQUE,
  cosmetic_id UUID REFERENCES cosmetics(id) ON DELETE SET NULL,
  amount_brl DECIMAL(10, 2) NOT NULL,
  status purchase_status DEFAULT 'pending',
  currency VARCHAR(3) DEFAULT 'BRL',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE referral_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(50) UNIQUE NOT NULL,
  uses INTEGER DEFAULT 0,
  credits_earned DECIMAL(10, 2) DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE referral_uses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code_id UUID NOT NULL REFERENCES referral_codes(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credit_amount DECIMAL(10, 2),
  used_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  balance DECIMAL(10, 2) DEFAULT 0 CHECK (balance >= 0),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ========================================
-- 8. SOCIAL
-- ========================================

CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

CREATE TABLE favorite_verses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  verso_id UUID NOT NULL REFERENCES rimas_banco(id) ON DELETE CASCADE,
  favorited_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, verso_id)
);

CREATE TABLE verse_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  verso_id UUID NOT NULL REFERENCES rimas_banco(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, verso_id)
);

-- ========================================
-- 9. ÍNDICES
-- ========================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_rating ON users(rating DESC);
CREATE INDEX idx_users_current_pillar ON users(current_pillar);
CREATE INDEX idx_users_last_activity ON users(last_activity_at DESC);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

CREATE INDEX idx_exercises_pillar_lesson ON exercises(pillar, lesson, exercise_num);
CREATE INDEX idx_exercises_type ON exercises(type);
CREATE INDEX idx_exercises_difficulty ON exercises(difficulty);

CREATE INDEX idx_user_exercise_results_user_id ON user_exercise_results(user_id);
CREATE INDEX idx_user_exercise_results_exercise_id ON user_exercise_results(exercise_id);
CREATE INDEX idx_user_exercise_results_completed_at ON user_exercise_results(completed_at DESC);
CREATE INDEX idx_user_exercise_results_best_attempt ON user_exercise_results(user_id, is_best_attempt) WHERE is_best_attempt = TRUE;

CREATE INDEX idx_ai_evaluations_result_id ON ai_evaluations(result_id);
CREATE INDEX idx_ai_evaluations_overall_score ON ai_evaluations(overall_score DESC);

CREATE INDEX idx_rimas_banco_tema ON rimas_banco(tema);
CREATE INDEX idx_rimas_banco_familia_rima ON rimas_banco(familia_rima);
CREATE INDEX idx_rimas_banco_dificuldade ON rimas_banco(dificuldade);
CREATE INDEX idx_rimas_banco_verso_trgm ON rimas_banco USING GIN(verso gin_trgm_ops);

CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_daily_quest_progress_user_id ON user_daily_quest_progress(user_id);
CREATE INDEX idx_user_daily_quest_progress_completed ON user_daily_quest_progress(completed);

CREATE INDEX idx_user_duels_user_id ON user_duels(user_id);
CREATE INDEX idx_user_duels_status ON user_duels(status);
CREATE INDEX idx_user_duels_created_at ON user_duels(created_at DESC);

CREATE INDEX idx_purchases_user_id ON purchases(user_id);
CREATE INDEX idx_purchases_status ON purchases(status);

CREATE INDEX idx_friendships_user_id ON friendships(user_id);
CREATE INDEX idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX idx_favorite_verses_user_id ON favorite_verses(user_id);

-- ========================================
-- 10. TRIGGERS
-- ========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_exercises_updated_at BEFORE UPDATE ON exercises
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_user_exercise_results_updated_at BEFORE UPDATE ON user_exercise_results
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_purchases_updated_at BEFORE UPDATE ON purchases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION calculate_nivel_from_xp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.nivel := LEAST(50, (NEW.xp_total / 500) + 1);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_calculate_nivel BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION calculate_nivel_from_xp();

-- ========================================
-- 11. VIEWS
-- ========================================

CREATE OR REPLACE VIEW leaderboard_global AS
SELECT
  ROW_NUMBER() OVER (ORDER BY u.rating DESC) AS position,
  u.id,
  u.username,
  u.avatar_url,
  u.nivel,
  u.xp_total,
  u.rating,
  u.duels_total,
  u.duels_won,
  ROUND(100.0 * u.duels_won / NULLIF(u.duels_total, 0), 2) AS win_rate,
  u.best_streak,
  u.updated_at
FROM users u
WHERE u.duels_total > 0
ORDER BY u.rating DESC;

CREATE OR REPLACE VIEW user_learning_progress AS
SELECT
  u.id,
  u.username,
  u.current_pillar,
  u.current_lesson,
  u.current_exercise,
  COUNT(DISTINCT CASE WHEN ex.pillar = 1 THEN uer.exercise_id END) AS pillar1_completed,
  COUNT(DISTINCT CASE WHEN ex.pillar = 2 THEN uer.exercise_id END) AS pillar2_completed,
  COUNT(DISTINCT CASE WHEN ex.pillar = 3 THEN uer.exercise_id END) AS pillar3_completed,
  COUNT(DISTINCT CASE WHEN ex.pillar = 4 THEN uer.exercise_id END) AS pillar4_completed
FROM users u
LEFT JOIN user_exercise_results uer ON u.id = uer.user_id AND uer.is_best_attempt = TRUE
LEFT JOIN exercises ex ON uer.exercise_id = ex.id
GROUP BY u.id;

-- ========================================
-- ✅ SCHEMA FINAL CRIADO COM SUCESSO
-- 28 tabelas consolidadas, production-ready
-- ========================================

-- ========================================
-- ADDITIONAL TABLES FROM IA-RIMAS-BRASIL
-- ========================================

-- Notifications (from ia-rimas-brasil)
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'friend_request', 'battle_invite', 'achievement', 'level_up',
    'message', 'system', 'challenge', 'reward'
  )),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  reference_id UUID,
  reference_type VARCHAR(50),
  icon_url TEXT,
  action_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

COMMENT ON TABLE notifications IS 'Sistema de notificações push/in-app para usuários';

-- Messages & Conversations (from ia-rimas-brasil)
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(20) DEFAULT 'direct' CHECK (type IN ('direct', 'group')),
  name VARCHAR(255),
  last_message_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE conversation_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT NOW(),
  last_read_at TIMESTAMP,
  UNIQUE(conversation_id, user_id)
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_user ON messages(from_user_id);
CREATE INDEX idx_conversation_participants ON conversation_participants(user_id);

COMMENT ON TABLE conversations IS 'Sistema de mensagens diretas e em grupo';
COMMENT ON TABLE messages IS 'Mensagens trocadas entre usuários';

