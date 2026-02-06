/**
 * Migration: NFT Integration
 * Sistema de NFTs - mint cosméticos raros como NFTs na blockchain
 */

-- Tabela nft_cosmetics (cosméticos que podem ser mintados como NFT)
CREATE TABLE IF NOT EXISTS nft_cosmetics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cosmetic_id UUID NOT NULL REFERENCES cosmetics(id) ON DELETE CASCADE,

  -- Blockchain config
  blockchain VARCHAR(20) DEFAULT 'polygon' CHECK (blockchain IN ('polygon', 'ethereum', 'solana', 'base')),
  contract_address VARCHAR(100),
  token_id VARCHAR(100),

  -- Metadata
  metadata_uri TEXT, -- IPFS link para metadata JSON
  image_uri TEXT, -- IPFS link para imagem

  -- Royalties
  royalty_percentage DECIMAL(5,2) DEFAULT 5.0 CHECK (royalty_percentage >= 0 AND royalty_percentage <= 100),
  royalty_recipient VARCHAR(100), -- Wallet address que recebe royalties

  -- Status
  is_mintable BOOLEAN DEFAULT true,
  max_supply INTEGER, -- NULL = ilimitado
  current_supply INTEGER DEFAULT 0,

  -- Raridade requirement (apenas raros e legendários podem ser NFT)
  min_rarity VARCHAR(20) DEFAULT 'epic' CHECK (min_rarity IN ('epic', 'legendary')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(cosmetic_id)
);

-- Tabela nft_mint_requests (requisições de mint)
CREATE TABLE IF NOT EXISTS nft_mint_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nft_cosmetic_id UUID NOT NULL REFERENCES nft_cosmetics(id) ON DELETE CASCADE,
  cosmetic_id UUID NOT NULL REFERENCES cosmetics(id),

  -- Wallet do usuário
  wallet_address VARCHAR(100) NOT NULL,
  blockchain VARCHAR(20) NOT NULL,

  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),

  -- Transaction info (preenchido quando completo)
  transaction_hash VARCHAR(100),
  block_number BIGINT,
  gas_used BIGINT,
  gas_price BIGINT, -- em wei

  -- Custo
  mint_fee_coins INTEGER DEFAULT 0,
  mint_fee_gems INTEGER DEFAULT 0,

  -- Error (se falhou)
  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  CHECK ((status = 'completed' AND transaction_hash IS NOT NULL) OR status != 'completed')
);

-- Tabela nft_transactions (histórico de transações blockchain)
CREATE TABLE IF NOT EXISTS nft_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nft_cosmetic_id UUID NOT NULL REFERENCES nft_cosmetics(id) ON DELETE CASCADE,

  -- Tipo de transação
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('mint', 'transfer', 'burn', 'sale')),

  -- Endereços
  from_address VARCHAR(100),
  to_address VARCHAR(100),

  -- Transaction data
  transaction_hash VARCHAR(100) NOT NULL,
  block_number BIGINT NOT NULL,
  blockchain VARCHAR(20) NOT NULL,

  -- Valor (se for venda)
  sale_price DECIMAL(20, 8), -- Em ETH/MATIC
  sale_price_usd DECIMAL(20, 2),

  -- Royalties pagos
  royalty_amount DECIMAL(20, 8),
  royalty_recipient VARCHAR(100),

  -- Marketplace (se aplicável)
  marketplace_name VARCHAR(50), -- ex: OpenSea, Rarible
  marketplace_url TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela nft_ownership (tracking de ownership atual)
CREATE TABLE IF NOT EXISTS nft_ownership (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nft_cosmetic_id UUID NOT NULL REFERENCES nft_cosmetics(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Wallet owner (pode ser diferente do user_id se vendeu externamente)
  wallet_address VARCHAR(100) NOT NULL,
  blockchain VARCHAR(20) NOT NULL,
  token_id VARCHAR(100) NOT NULL,

  -- Metadata
  acquired_at TIMESTAMPTZ DEFAULT NOW(),
  last_verified_at TIMESTAMPTZ DEFAULT NOW(),

  -- Status
  is_listed_external BOOLEAN DEFAULT false, -- Listado em marketplace externo?
  external_listing_url TEXT,

  UNIQUE(nft_cosmetic_id, token_id)
);

-- Tabela nft_royalties_earned (tracking de royalties ganhos)
CREATE TABLE IF NOT EXISTS nft_royalties_earned (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nft_cosmetic_id UUID NOT NULL REFERENCES nft_cosmetics(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES nft_transactions(id) ON DELETE SET NULL,

  -- Valor do royalty
  amount_crypto DECIMAL(20, 8), -- Em ETH/MATIC
  amount_usd DECIMAL(20, 2),

  -- Recipient
  recipient_address VARCHAR(100) NOT NULL,
  recipient_user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Metadata
  blockchain VARCHAR(20) NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_nft_cosmetics_cosmetic ON nft_cosmetics(cosmetic_id);
CREATE INDEX IF NOT EXISTS idx_nft_cosmetics_blockchain ON nft_cosmetics(blockchain);
CREATE INDEX IF NOT EXISTS idx_nft_cosmetics_mintable ON nft_cosmetics(is_mintable);

CREATE INDEX IF NOT EXISTS idx_nft_mint_requests_user ON nft_mint_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_nft_mint_requests_status ON nft_mint_requests(status);
CREATE INDEX IF NOT EXISTS idx_nft_mint_requests_wallet ON nft_mint_requests(wallet_address);
CREATE INDEX IF NOT EXISTS idx_nft_mint_requests_created_at ON nft_mint_requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_nft_transactions_nft ON nft_transactions(nft_cosmetic_id);
CREATE INDEX IF NOT EXISTS idx_nft_transactions_hash ON nft_transactions(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_nft_transactions_type ON nft_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_nft_transactions_addresses ON nft_transactions(from_address, to_address);

CREATE INDEX IF NOT EXISTS idx_nft_ownership_wallet ON nft_ownership(wallet_address);
CREATE INDEX IF NOT EXISTS idx_nft_ownership_user ON nft_ownership(user_id);
CREATE INDEX IF NOT EXISTS idx_nft_ownership_nft ON nft_ownership(nft_cosmetic_id);

CREATE INDEX IF NOT EXISTS idx_nft_royalties_user ON nft_royalties_earned(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_nft_royalties_earned_at ON nft_royalties_earned(earned_at DESC);

-- Trigger: Auto-update updated_at
CREATE OR REPLACE FUNCTION update_nft_cosmetics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_nft_cosmetics_updated_at
BEFORE UPDATE ON nft_cosmetics
FOR EACH ROW
EXECUTE FUNCTION update_nft_cosmetics_updated_at();

-- Trigger: Incrementar current_supply ao mintar
CREATE OR REPLACE FUNCTION increment_nft_supply()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE nft_cosmetics
    SET current_supply = current_supply + 1
    WHERE id = NEW.nft_cosmetic_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_nft_supply
AFTER UPDATE ON nft_mint_requests
FOR EACH ROW
EXECUTE FUNCTION increment_nft_supply();

-- Function: Verificar se pode mintar
CREATE OR REPLACE FUNCTION can_mint_nft(
  p_nft_cosmetic_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_nft_cosmetic RECORD;
BEGIN
  SELECT * INTO v_nft_cosmetic
  FROM nft_cosmetics
  WHERE id = p_nft_cosmetic_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF NOT v_nft_cosmetic.is_mintable THEN
    RETURN false;
  END IF;

  IF v_nft_cosmetic.max_supply IS NOT NULL
     AND v_nft_cosmetic.current_supply >= v_nft_cosmetic.max_supply THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE nft_cosmetics ENABLE ROW LEVEL SECURITY;
ALTER TABLE nft_mint_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE nft_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE nft_ownership ENABLE ROW LEVEL SECURITY;
ALTER TABLE nft_royalties_earned ENABLE ROW LEVEL SECURITY;

-- NFT Cosmetics: Todos podem ver cosmetics mintáveis
CREATE POLICY "NFT cosmetics are viewable by everyone"
ON nft_cosmetics FOR SELECT
USING (is_mintable = true);

-- Mint Requests: Usuário pode ver e criar próprias requisições
CREATE POLICY "Users can view own mint requests"
ON nft_mint_requests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create mint requests"
ON nft_mint_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Transactions: Todos podem ver transações (transparência blockchain)
CREATE POLICY "NFT transactions are viewable by everyone"
ON nft_transactions FOR SELECT
USING (true);

-- Ownership: Todos podem ver ownership (transparência blockchain)
CREATE POLICY "NFT ownership is viewable by everyone"
ON nft_ownership FOR SELECT
USING (true);

-- Royalties: Usuário pode ver seus próprios royalties
CREATE POLICY "Users can view own royalties"
ON nft_royalties_earned FOR SELECT
USING (auth.uid() = recipient_user_id);

-- Comentários
COMMENT ON TABLE nft_cosmetics IS 'Cosméticos que podem ser mintados como NFT na blockchain';
COMMENT ON TABLE nft_mint_requests IS 'Requisições de mint de NFT (processamento assíncrono)';
COMMENT ON TABLE nft_transactions IS 'Histórico completo de transações NFT on-chain';
COMMENT ON TABLE nft_ownership IS 'Tracking de ownership atual de NFTs';
COMMENT ON TABLE nft_royalties_earned IS 'Royalties ganhos em vendas secundárias';

COMMENT ON COLUMN nft_cosmetics.royalty_percentage IS 'Porcentagem de royalty em vendas secundárias (padrão 5%)';
COMMENT ON COLUMN nft_cosmetics.metadata_uri IS 'Link IPFS para metadata JSON (padrão ERC-721)';
COMMENT ON COLUMN nft_mint_requests.status IS 'pending: aguardando, processing: mintando, completed: sucesso, failed: erro';
COMMENT ON COLUMN nft_transactions.sale_price IS 'Preço de venda em crypto nativa (ETH, MATIC, SOL)';
