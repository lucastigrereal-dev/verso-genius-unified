/**
 * Migration: Crews System
 * Sistema de grupos/equipes para competição colaborativa
 */

-- Tabela crews
CREATE TABLE IF NOT EXISTS crews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  tag VARCHAR(10) UNIQUE, -- Ex: [TAG]
  avatar_url TEXT,
  leader_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Stats
  total_members INTEGER DEFAULT 1 CHECK (total_members >= 0 AND total_members <= 50),
  total_xp BIGINT DEFAULT 0 CHECK (total_xp >= 0),
  level INTEGER DEFAULT 1 CHECK (level >= 1),

  -- Config
  is_public BOOLEAN DEFAULT true,
  require_approval BOOLEAN DEFAULT false,
  min_level_to_join INTEGER DEFAULT 1,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela crew_members
CREATE TABLE IF NOT EXISTS crew_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crew_id UUID NOT NULL REFERENCES crews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Role
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('leader', 'officer', 'member')),

  -- Stats
  xp_contributed BIGINT DEFAULT 0 CHECK (xp_contributed >= 0),

  joined_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(crew_id, user_id)
);

-- Tabela crew_invites
CREATE TABLE IF NOT EXISTS crew_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crew_id UUID NOT NULL REFERENCES crews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),

  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,

  UNIQUE(crew_id, user_id, status)
);

-- Tabela crew_chat_messages
CREATE TABLE IF NOT EXISTS crew_chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crew_id UUID NOT NULL REFERENCES crews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  message TEXT NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_crews_name ON crews(name);
CREATE INDEX IF NOT EXISTS idx_crews_tag ON crews(tag);
CREATE INDEX IF NOT EXISTS idx_crews_total_xp ON crews(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_crews_level ON crews(level DESC);

CREATE INDEX IF NOT EXISTS idx_crew_members_crew_id ON crew_members(crew_id);
CREATE INDEX IF NOT EXISTS idx_crew_members_user_id ON crew_members(user_id);
CREATE INDEX IF NOT EXISTS idx_crew_members_xp_contributed ON crew_members(xp_contributed DESC);

CREATE INDEX IF NOT EXISTS idx_crew_invites_user_id ON crew_invites(user_id);
CREATE INDEX IF NOT EXISTS idx_crew_invites_status ON crew_invites(status);

CREATE INDEX IF NOT EXISTS idx_crew_chat_crew_id ON crew_chat_messages(crew_id);
CREATE INDEX IF NOT EXISTS idx_crew_chat_created_at ON crew_chat_messages(created_at DESC);

-- Triggers
CREATE OR REPLACE FUNCTION update_crews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER crews_updated_at
BEFORE UPDATE ON crews
FOR EACH ROW
EXECUTE FUNCTION update_crews_updated_at();

-- Function: Atualizar XP total do crew quando membro contribui
CREATE OR REPLACE FUNCTION update_crew_total_xp()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE crews
    SET total_xp = (
      SELECT COALESCE(SUM(xp_contributed), 0)
      FROM crew_members
      WHERE crew_id = NEW.crew_id
    )
    WHERE id = NEW.crew_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER crew_members_xp_update
AFTER INSERT OR UPDATE OF xp_contributed ON crew_members
FOR EACH ROW
EXECUTE FUNCTION update_crew_total_xp();

-- Function: Calcular nível do crew baseado em XP
CREATE OR REPLACE FUNCTION calculate_crew_level()
RETURNS TRIGGER AS $$
DECLARE
  new_level INTEGER;
BEGIN
  -- Level = sqrt(total_xp / 1000)
  new_level := GREATEST(1, FLOOR(SQRT(NEW.total_xp / 1000.0))::INTEGER);

  IF new_level != NEW.level THEN
    NEW.level := new_level;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER crews_level_update
BEFORE UPDATE OF total_xp ON crews
FOR EACH ROW
EXECUTE FUNCTION calculate_crew_level();

-- RLS Policies
ALTER TABLE crews ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_chat_messages ENABLE ROW LEVEL SECURITY;

-- Crews: Todos podem ver crews públicos
CREATE POLICY "Public crews are viewable by everyone"
ON crews FOR SELECT
USING (is_public = true OR auth.uid() IN (
  SELECT user_id FROM crew_members WHERE crew_id = crews.id
));

-- Crews: Leader pode atualizar
CREATE POLICY "Leaders can update their crew"
ON crews FOR UPDATE
USING (auth.uid() = leader_id);

-- Crews: Qualquer um autenticado pode criar
CREATE POLICY "Authenticated users can create crews"
ON crews FOR INSERT
WITH CHECK (auth.uid() = leader_id);

-- Crew Members: Membros podem ver outros membros
CREATE POLICY "Crew members can view other members"
ON crew_members FOR SELECT
USING (auth.uid() IN (
  SELECT user_id FROM crew_members cm WHERE cm.crew_id = crew_members.crew_id
));

-- Crew Invites: Usuários podem ver seus próprios convites
CREATE POLICY "Users can view their invites"
ON crew_invites FOR SELECT
USING (auth.uid() = user_id OR auth.uid() = invited_by);

-- Crew Chat: Membros podem ver e enviar mensagens
CREATE POLICY "Crew members can view chat"
ON crew_chat_messages FOR SELECT
USING (auth.uid() IN (
  SELECT user_id FROM crew_members WHERE crew_id = crew_chat_messages.crew_id
));

CREATE POLICY "Crew members can send messages"
ON crew_chat_messages FOR INSERT
WITH CHECK (auth.uid() IN (
  SELECT user_id FROM crew_members WHERE crew_id = crew_chat_messages.crew_id
));

-- Comentários
COMMENT ON TABLE crews IS 'Grupos/equipes de usuários para competição colaborativa';
COMMENT ON TABLE crew_members IS 'Membros de cada crew com suas contribuições';
COMMENT ON TABLE crew_invites IS 'Convites pendentes para entrar em crews';
COMMENT ON TABLE crew_chat_messages IS 'Chat interno do crew';

COMMENT ON COLUMN crews.tag IS 'Tag/sigla do crew exibida antes do nome (ex: [TAG])';
COMMENT ON COLUMN crews.total_xp IS 'XP total acumulado por todos os membros';
COMMENT ON COLUMN crews.level IS 'Nível do crew calculado baseado em total_xp';
COMMENT ON COLUMN crew_members.role IS 'leader: líder do crew, officer: moderador, member: membro comum';
COMMENT ON COLUMN crew_members.xp_contributed IS 'XP que este membro contribuiu para o crew';
