/**
 * Migration: Marketplace System
 * Sistema de mercado P2P para compra/venda de cosméticos entre players
 */

-- Tabela marketplace_listings
CREATE TABLE IF NOT EXISTS marketplace_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cosmetic_id UUID NOT NULL REFERENCES cosmetics(id) ON DELETE CASCADE,

  -- Preço
  price_coins INTEGER CHECK (price_coins >= 0),
  price_gems INTEGER CHECK (price_gems >= 0),

  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'sold', 'cancelled', 'expired')),

  -- Comprador (quando vendido)
  buyer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  sold_at TIMESTAMPTZ,

  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CHECK (price_coins > 0 OR price_gems > 0)
);

-- Tabela marketplace_transactions
CREATE TABLE IF NOT EXISTS marketplace_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES users(id),
  buyer_id UUID NOT NULL REFERENCES users(id),
  cosmetic_id UUID NOT NULL REFERENCES cosmetics(id),

  -- Valores
  price_coins INTEGER DEFAULT 0,
  price_gems INTEGER DEFAULT 0,
  fee_coins INTEGER DEFAULT 0, -- Taxa de 5%
  fee_gems INTEGER DEFAULT 0,

  -- Valores líquidos
  seller_receives_coins INTEGER DEFAULT 0,
  seller_receives_gems INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela marketplace_offers
CREATE TABLE IF NOT EXISTS marketplace_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Oferta
  offer_coins INTEGER DEFAULT 0,
  offer_gems INTEGER DEFAULT 0,
  message TEXT,

  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),

  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '2 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_seller ON marketplace_listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_cosmetic ON marketplace_listings(cosmetic_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_status ON marketplace_listings(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_created_at ON marketplace_listings(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_marketplace_transactions_seller ON marketplace_transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_transactions_buyer ON marketplace_transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_transactions_created_at ON marketplace_transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_marketplace_offers_listing ON marketplace_offers(listing_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_offers_buyer ON marketplace_offers(buyer_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_offers_status ON marketplace_offers(status);

-- Function: Expirar listings automáticos (cron)
CREATE OR REPLACE FUNCTION expire_marketplace_listings()
RETURNS void AS $$
BEGIN
  UPDATE marketplace_listings
  SET status = 'expired'
  WHERE expires_at < NOW()
    AND status = 'active';

  UPDATE marketplace_offers
  SET status = 'expired'
  WHERE expires_at < NOW()
    AND status = 'pending';
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_offers ENABLE ROW LEVEL SECURITY;

-- Listings: Todos podem ver listings ativos
CREATE POLICY "Active listings are viewable by everyone"
ON marketplace_listings FOR SELECT
USING (status = 'active');

-- Listings: Seller pode criar
CREATE POLICY "Users can create listings"
ON marketplace_listings FOR INSERT
WITH CHECK (auth.uid() = seller_id);

-- Listings: Seller pode cancelar
CREATE POLICY "Sellers can update own listings"
ON marketplace_listings FOR UPDATE
USING (auth.uid() = seller_id);

-- Transactions: Seller e buyer podem ver suas transações
CREATE POLICY "Users can view own transactions"
ON marketplace_transactions FOR SELECT
USING (auth.uid() = seller_id OR auth.uid() = buyer_id);

-- Offers: Buyer pode criar
CREATE POLICY "Users can create offers"
ON marketplace_offers FOR INSERT
WITH CHECK (auth.uid() = buyer_id);

-- Offers: Buyer e seller podem ver
CREATE POLICY "Users can view own offers"
ON marketplace_offers FOR SELECT
USING (
  auth.uid() = buyer_id OR
  auth.uid() IN (
    SELECT seller_id FROM marketplace_listings WHERE id = marketplace_offers.listing_id
  )
);

-- Comentários
COMMENT ON TABLE marketplace_listings IS 'Anúncios de venda de cosméticos no marketplace P2P';
COMMENT ON TABLE marketplace_transactions IS 'Histórico de transações do marketplace';
COMMENT ON TABLE marketplace_offers IS 'Ofertas feitas em listings (sistema de negociação)';

COMMENT ON COLUMN marketplace_listings.status IS 'active: ativo, sold: vendido, cancelled: cancelado, expired: expirado';
COMMENT ON COLUMN marketplace_transactions.fee_coins IS 'Taxa de 5% sobre o valor da venda (coins)';
COMMENT ON COLUMN marketplace_transactions.fee_gems IS 'Taxa de 5% sobre o valor da venda (gems)';
