/**
 * Migration: Analytics System
 * Sistema de tracking de eventos e métricas
 */

-- Tabela analytics_events
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Tipo de evento
  event_type VARCHAR(100) NOT NULL,

  -- Propriedades do evento (JSON flexível)
  event_properties JSONB DEFAULT '{}',

  -- Timestamp
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para queries rápidas
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_type ON analytics_events(user_id, event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type_timestamp ON analytics_events(event_type, timestamp DESC);

-- Índice GIN para queries em JSONB
CREATE INDEX IF NOT EXISTS idx_analytics_events_properties ON analytics_events USING GIN (event_properties);

-- RLS Policy
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Admin pode ver tudo
CREATE POLICY "Admins can view all events"
ON analytics_events FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Usuário pode ver próprios eventos
CREATE POLICY "Users can view own events"
ON analytics_events FOR SELECT
USING (auth.uid() = user_id);

-- Sistema pode inserir eventos (service role)
CREATE POLICY "System can insert events"
ON analytics_events FOR INSERT
WITH CHECK (true);

-- Comentários
COMMENT ON TABLE analytics_events IS 'Eventos de analytics e tracking de métricas';
COMMENT ON COLUMN analytics_events.event_type IS 'Tipo de evento (page_view, purchase, gacha_pull, etc)';
COMMENT ON COLUMN analytics_events.event_properties IS 'Propriedades flexíveis do evento em JSON';

-- Function: Limpar eventos antigos (cron semanal)
CREATE OR REPLACE FUNCTION cleanup_old_analytics_events()
RETURNS void AS $$
BEGIN
  -- Deletar eventos com mais de 90 dias
  DELETE FROM analytics_events
  WHERE timestamp < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;
