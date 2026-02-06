/**
 * Migration: Friends System
 * Sistema de amizades com activity feed
 */

-- Tabela friendships
CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),

  -- Quem enviou o pedido
  requested_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,

  -- Constraints
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

-- Tabela activity_feed
CREATE TABLE IF NOT EXISTS activity_feed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Tipo de atividade
  activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN (
    'level_up',
    'achievement_unlocked',
    'cosmetic_acquired',
    'gacha_legendary',
    'nft_minted',
    'crew_joined',
    'event_completed',
    'streak_milestone',
    'battle_won'
  )),

  -- Dados da atividade
  activity_data JSONB DEFAULT '{}',

  -- Visibilidade
  is_public BOOLEAN DEFAULT true,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela friend_gifts
CREATE TABLE IF NOT EXISTS friend_gifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Gift
  gift_type VARCHAR(20) NOT NULL CHECK (gift_type IN ('coins', 'gems', 'xp', 'cosmetic')),
  gift_value INTEGER,
  cosmetic_id UUID REFERENCES cosmetics(id) ON DELETE SET NULL,

  -- Mensagem opcional
  message TEXT,

  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'claimed', 'expired')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  claimed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),

  CHECK (
    (gift_type = 'cosmetic' AND cosmetic_id IS NOT NULL) OR
    (gift_type != 'cosmetic' AND gift_value IS NOT NULL)
  )
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_friendships_user ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend ON friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);
CREATE INDEX IF NOT EXISTS idx_friendships_user_status ON friendships(user_id, status);

CREATE INDEX IF NOT EXISTS idx_activity_feed_user ON activity_feed(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_type ON activity_feed(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_feed_created_at ON activity_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_public ON activity_feed(is_public, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_friend_gifts_sender ON friend_gifts(sender_id);
CREATE INDEX IF NOT EXISTS idx_friend_gifts_receiver ON friend_gifts(receiver_id);
CREATE INDEX IF NOT EXISTS idx_friend_gifts_status ON friend_gifts(status);
CREATE INDEX IF NOT EXISTS idx_friend_gifts_receiver_status ON friend_gifts(receiver_id, status);

-- Function: Criar amizade bidirecional
CREATE OR REPLACE FUNCTION create_bidirectional_friendship()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando aceita, criar friendship reversa
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    INSERT INTO friendships (user_id, friend_id, status, requested_by, accepted_at)
    VALUES (NEW.friend_id, NEW.user_id, 'accepted', NEW.requested_by, NOW())
    ON CONFLICT (user_id, friend_id) DO NOTHING;

    NEW.accepted_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_bidirectional_friendship
BEFORE UPDATE ON friendships
FOR EACH ROW
EXECUTE FUNCTION create_bidirectional_friendship();

-- Function: Expirar gifts antigos (cron)
CREATE OR REPLACE FUNCTION expire_friend_gifts()
RETURNS void AS $$
BEGIN
  UPDATE friend_gifts
  SET status = 'expired'
  WHERE expires_at < NOW()
    AND status = 'pending';
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_gifts ENABLE ROW LEVEL SECURITY;

-- Friendships: Usuário pode ver próprias amizades
CREATE POLICY "Users can view own friendships"
ON friendships FOR SELECT
USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Friendships: Usuário pode criar pedidos
CREATE POLICY "Users can create friend requests"
ON friendships FOR INSERT
WITH CHECK (auth.uid() = user_id AND auth.uid() = requested_by);

-- Friendships: Usuário pode aceitar/recusar pedidos recebidos
CREATE POLICY "Users can update received requests"
ON friendships FOR UPDATE
USING (auth.uid() = friend_id AND requested_by != auth.uid());

-- Activity Feed: Usuário pode ver próprio feed
CREATE POLICY "Users can view own activity"
ON activity_feed FOR SELECT
USING (auth.uid() = user_id);

-- Activity Feed: Usuário pode ver feed público de amigos
CREATE POLICY "Users can view friends public activity"
ON activity_feed FOR SELECT
USING (
  is_public = true AND
  EXISTS (
    SELECT 1 FROM friendships
    WHERE (user_id = auth.uid() AND friend_id = activity_feed.user_id)
       OR (friend_id = auth.uid() AND user_id = activity_feed.user_id)
    AND status = 'accepted'
  )
);

-- Activity Feed: Usuário pode criar próprias atividades
CREATE POLICY "Users can create own activity"
ON activity_feed FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Friend Gifts: Usuário pode ver gifts enviados/recebidos
CREATE POLICY "Users can view own gifts"
ON friend_gifts FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Friend Gifts: Usuário pode enviar gifts para amigos
CREATE POLICY "Users can send gifts to friends"
ON friend_gifts FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM friendships
    WHERE (user_id = auth.uid() AND friend_id = receiver_id)
       OR (friend_id = auth.uid() AND user_id = receiver_id)
    AND status = 'accepted'
  )
);

-- Friend Gifts: Receiver pode clamar
CREATE POLICY "Receivers can claim gifts"
ON friend_gifts FOR UPDATE
USING (auth.uid() = receiver_id);

-- Comentários
COMMENT ON TABLE friendships IS 'Sistema de amizades entre usuários';
COMMENT ON TABLE activity_feed IS 'Feed de atividades dos usuários (para amigos verem)';
COMMENT ON TABLE friend_gifts IS 'Presentes entre amigos';

COMMENT ON COLUMN friendships.status IS 'pending: aguardando, accepted: amigos, declined: recusado, blocked: bloqueado';
COMMENT ON COLUMN activity_feed.is_public IS 'Se true, amigos podem ver. Se false, apenas o usuário';
COMMENT ON COLUMN friend_gifts.status IS 'pending: aguardando claim, claimed: reivindicado, expired: expirado';
