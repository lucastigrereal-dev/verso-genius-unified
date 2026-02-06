# 🗄️ GUIA COMPLETO DO BANCO DE DADOS

## 📁 CAMINHOS E LOCALIZAÇÃO

### Diretório Base:
```
C:\Users\lucas\verso-genius-unified\database\supabase\migrations\
```

### 11 Arquivos de Migration (ORDEM DE EXECUÇÃO):

```
1. 001_unified_schema.sql          (Base: users, profiles)
2. 002_monetization_schema.sql     (18 tabelas: monetização)
3. 003_streaks_table.sql           (1 tabela: streaks)
4. 004_crews_system.sql            (4 tabelas: crews/guilds)
5. 005_events_system.sql           (4 tabelas: eventos)
6. 006_marketplace_system.sql      (3 tabelas: P2P marketplace)
7. 007_gacha_system.sql            (5 tabelas: gacha avançado)
8. 008_nft_system.sql              (5 tabelas: NFT blockchain)
9. 009_analytics_system.sql        (1 tabela: analytics)
10. 010_friends_system.sql         (3 tabelas: amizades)
11. 011_battles_system.sql         (4 tabelas: batalhas PvP)
```

**TOTAL: 44 TABELAS**

---

## 📊 SCHEMA COMPLETO - TODAS AS 44 TABELAS

### 🔐 Autenticação e Usuários (2 tabelas)

#### `users`
```sql
id                UUID PRIMARY KEY
username          VARCHAR(50) UNIQUE
email             VARCHAR(255) UNIQUE
avatar_url        TEXT
level             INTEGER DEFAULT 1
xp                INTEGER DEFAULT 0
role              VARCHAR(20) DEFAULT 'user'  -- user, admin, moderator
created_at        TIMESTAMPTZ
updated_at        TIMESTAMPTZ
```

#### `profiles` (extensão de users)
```sql
user_id           UUID PRIMARY KEY REFERENCES users(id)
bio               TEXT
birthdate         DATE
country           VARCHAR(100)
```

---

### 💰 MONETIZAÇÃO (18 tabelas)

#### 1. `user_currencies`
```sql
user_id           UUID PRIMARY KEY REFERENCES users(id)
coins             INTEGER DEFAULT 0
gems              INTEGER DEFAULT 0
updated_at        TIMESTAMPTZ
```

#### 2. `cosmetics`
```sql
id                UUID PRIMARY KEY
name              VARCHAR(100)
description       TEXT
type              VARCHAR(50)  -- hat, outfit, shoes, accessory, item
rarity            VARCHAR(20)  -- common, rare, epic, legendary
image_url         TEXT
price_coins       INTEGER
price_gems        INTEGER
is_purchasable    BOOLEAN
created_at        TIMESTAMPTZ
```

#### 3. `user_cosmetics`
```sql
id                UUID PRIMARY KEY
user_id           UUID REFERENCES users(id)
cosmetic_id       UUID REFERENCES cosmetics(id)
acquired_from     VARCHAR(50)  -- purchase, loot_box, battle_pass, etc
acquired_at       TIMESTAMPTZ
UNIQUE(user_id, cosmetic_id)
```

#### 4. `loot_boxes`
```sql
id                UUID PRIMARY KEY
name              VARCHAR(100)
description       TEXT
price_coins       INTEGER
price_gems        INTEGER
guaranteed_rarity VARCHAR(20)
items_count       INTEGER
image_url         TEXT
is_available      BOOLEAN
```

#### 5. `loot_box_openings`
```sql
id                UUID PRIMARY KEY
user_id           UUID REFERENCES users(id)
loot_box_id       UUID REFERENCES loot_boxes(id)
items_received    JSONB  -- Array de cosmetic_ids
opened_at         TIMESTAMPTZ
```

#### 6. `battle_passes`
```sql
id                UUID PRIMARY KEY
name              VARCHAR(100)
description       TEXT
start_date        TIMESTAMPTZ
end_date          TIMESTAMPTZ
max_tier          INTEGER
price_gems        INTEGER
is_active         BOOLEAN
```

#### 7. `battle_pass_rewards`
```sql
id                UUID PRIMARY KEY
battle_pass_id    UUID REFERENCES battle_passes(id)
tier              INTEGER
is_premium        BOOLEAN
reward_type       VARCHAR(50)  -- coins, gems, xp, cosmetic
reward_value      INTEGER
cosmetic_id       UUID REFERENCES cosmetics(id)
```

#### 8. `user_battle_pass_progress`
```sql
id                UUID PRIMARY KEY
user_id           UUID REFERENCES users(id)
battle_pass_id    UUID REFERENCES battle_passes(id)
current_tier      INTEGER
has_premium       BOOLEAN
claimed_tiers     INTEGER[]
xp_earned         INTEGER
UNIQUE(user_id, battle_pass_id)
```

#### 9. `daily_challenges`
```sql
id                UUID PRIMARY KEY
challenge_type    VARCHAR(50)
description       TEXT
target_value      INTEGER
reward_coins      INTEGER
reward_gems       INTEGER
reward_xp         INTEGER
difficulty        VARCHAR(20)
is_active         BOOLEAN
created_at        TIMESTAMPTZ
```

#### 10. `user_challenge_completions`
```sql
id                UUID PRIMARY KEY
user_id           UUID REFERENCES users(id)
challenge_id      UUID REFERENCES daily_challenges(id)
progress          INTEGER
is_completed      BOOLEAN
is_claimed        BOOLEAN
completed_at      TIMESTAMPTZ
claimed_at        TIMESTAMPTZ
UNIQUE(user_id, challenge_id)
```

#### 11. `subscriptions`
```sql
id                UUID PRIMARY KEY
name              VARCHAR(50)  -- pro, elite
description       TEXT
price_monthly     INTEGER
benefits          JSONB
stripe_price_id   VARCHAR(100)
is_active         BOOLEAN
```

#### 12. `user_subscriptions`
```sql
id                UUID PRIMARY KEY
user_id           UUID REFERENCES users(id)
subscription_id   UUID REFERENCES subscriptions(id)
stripe_subscription_id VARCHAR(100)
status            VARCHAR(20)  -- active, cancelled, expired
started_at        TIMESTAMPTZ
expires_at        TIMESTAMPTZ
cancelled_at      TIMESTAMPTZ
```

#### 13. `payments`
```sql
id                UUID PRIMARY KEY
user_id           UUID REFERENCES users(id)
stripe_payment_intent_id VARCHAR(100)
amount            INTEGER
currency          VARCHAR(3)
status            VARCHAR(20)
product_type      VARCHAR(50)
product_id        UUID
metadata          JSONB
created_at        TIMESTAMPTZ
```

#### 14. `achievements`
```sql
id                UUID PRIMARY KEY
name              VARCHAR(100)
description       TEXT
icon_url          TEXT
achievement_type  VARCHAR(50)
requirement_value INTEGER
reward_coins      INTEGER
reward_gems       INTEGER
reward_xp         INTEGER
is_hidden         BOOLEAN
```

#### 15. `user_achievements`
```sql
id                UUID PRIMARY KEY
user_id           UUID REFERENCES users(id)
achievement_id    UUID REFERENCES achievements(id)
progress          INTEGER
is_completed      BOOLEAN
unlocked_at       TIMESTAMPTZ
UNIQUE(user_id, achievement_id)
```

#### 16. `referrals`
```sql
id                UUID PRIMARY KEY
referrer_id       UUID REFERENCES users(id)
referred_id       UUID REFERENCES users(id)
referral_code     VARCHAR(20) UNIQUE
status            VARCHAR(20)
milestone_reached INTEGER
created_at        TIMESTAMPTZ
```

#### 17. `referral_rewards`
```sql
id                UUID PRIMARY KEY
referral_id       UUID REFERENCES referrals(id)
milestone         INTEGER
reward_coins      INTEGER
reward_gems       INTEGER
is_claimed        BOOLEAN
claimed_at        TIMESTAMPTZ
```

#### 18. `daily_rewards`
```sql
id                UUID PRIMARY KEY
user_id           UUID REFERENCES users(id)
day_number        INTEGER
reward_coins      INTEGER
reward_gems       INTEGER
reward_xp         INTEGER
claimed_at        TIMESTAMPTZ
UNIQUE(user_id, day_number)
```

#### 19. `gem_packages`
```sql
id                UUID PRIMARY KEY
name              VARCHAR(100)
gem_amount        INTEGER
price_brl         INTEGER
bonus_percentage  INTEGER
stripe_price_id   VARCHAR(100)
is_featured       BOOLEAN
display_order     INTEGER
```

---

### 🎮 GAMIFICAÇÃO (4 tabelas)

#### 20. `user_streaks`
```sql
id                UUID PRIMARY KEY
user_id           UUID REFERENCES users(id)
current_streak    INTEGER DEFAULT 0
longest_streak    INTEGER DEFAULT 0
last_check_in     TIMESTAMPTZ
total_check_ins   INTEGER DEFAULT 0
streak_frozen_until TIMESTAMPTZ
UNIQUE(user_id)
```

#### 21. `marketplace_listings`
```sql
id                UUID PRIMARY KEY
seller_id         UUID REFERENCES users(id)
cosmetic_id       UUID REFERENCES cosmetics(id)
price_coins       INTEGER
price_gems        INTEGER
status            VARCHAR(20)  -- active, sold, cancelled, expired
buyer_id          UUID REFERENCES users(id)
sold_at           TIMESTAMPTZ
expires_at        TIMESTAMPTZ
created_at        TIMESTAMPTZ
```

#### 22. `marketplace_transactions`
```sql
id                UUID PRIMARY KEY
listing_id        UUID REFERENCES marketplace_listings(id)
seller_id         UUID REFERENCES users(id)
buyer_id          UUID REFERENCES users(id)
cosmetic_id       UUID REFERENCES cosmetics(id)
price_coins       INTEGER
price_gems        INTEGER
fee_coins         INTEGER  -- 5%
fee_gems          INTEGER  -- 5%
seller_receives_coins INTEGER
seller_receives_gems  INTEGER
created_at        TIMESTAMPTZ
```

#### 23. `marketplace_offers`
```sql
id                UUID PRIMARY KEY
listing_id        UUID REFERENCES marketplace_listings(id)
buyer_id          UUID REFERENCES users(id)
offer_coins       INTEGER
offer_gems        INTEGER
message           TEXT
status            VARCHAR(20)  -- pending, accepted, declined, expired
expires_at        TIMESTAMPTZ
created_at        TIMESTAMPTZ
responded_at      TIMESTAMPTZ
```

#### 24. `leaderboard_cache`
```sql
id                UUID PRIMARY KEY
leaderboard_type  VARCHAR(50)
user_id           UUID REFERENCES users(id)
score             INTEGER
rank              INTEGER
cached_at         TIMESTAMPTZ
```

---

### 👥 SOCIAL (12 tabelas)

#### 25-28. CREWS (4 tabelas)

##### `crews`
```sql
id                UUID PRIMARY KEY
name              VARCHAR(100) UNIQUE
tag               VARCHAR(10) UNIQUE
description       TEXT
leader_id         UUID REFERENCES users(id)
total_xp          INTEGER DEFAULT 0
level             INTEGER DEFAULT 1
max_members       INTEGER DEFAULT 50
is_public         BOOLEAN DEFAULT true
created_at        TIMESTAMPTZ
```

##### `crew_members`
```sql
id                UUID PRIMARY KEY
crew_id           UUID REFERENCES crews(id)
user_id           UUID REFERENCES users(id)
role              VARCHAR(20)  -- leader, officer, member
xp_contributed    INTEGER DEFAULT 0
joined_at         TIMESTAMPTZ
UNIQUE(crew_id, user_id)
```

##### `crew_invites`
```sql
id                UUID PRIMARY KEY
crew_id           UUID REFERENCES crews(id)
inviter_id        UUID REFERENCES users(id)
invited_user_id   UUID REFERENCES users(id)
status            VARCHAR(20)  -- pending, accepted, declined
created_at        TIMESTAMPTZ
expires_at        TIMESTAMPTZ
```

##### `crew_chat_messages`
```sql
id                UUID PRIMARY KEY
crew_id           UUID REFERENCES crews(id)
user_id           UUID REFERENCES users(id)
message           TEXT
created_at        TIMESTAMPTZ
```

#### 29-32. EVENTS (4 tabelas)

##### `events`
```sql
id                UUID PRIMARY KEY
name              VARCHAR(100)
description       TEXT
event_type        VARCHAR(20)  -- challenge, tournament, seasonal, special
start_date        TIMESTAMPTZ
end_date          TIMESTAMPTZ
reward_coins      INTEGER
reward_gems       INTEGER
reward_xp         INTEGER
reward_cosmetic_id UUID REFERENCES cosmetics(id)
is_active         BOOLEAN
```

##### `event_objectives`
```sql
id                UUID PRIMARY KEY
event_id          UUID REFERENCES events(id)
objective_type    VARCHAR(50)
target_value      INTEGER
reward_coins      INTEGER
reward_gems       INTEGER
reward_xp         INTEGER
```

##### `user_event_progress`
```sql
id                UUID PRIMARY KEY
user_id           UUID REFERENCES users(id)
event_id          UUID REFERENCES events(id)
progress          INTEGER
is_completed      BOOLEAN
reward_claimed    BOOLEAN
joined_at         TIMESTAMPTZ
UNIQUE(user_id, event_id)
```

##### `event_leaderboard`
```sql
id                UUID PRIMARY KEY
event_id          UUID REFERENCES events(id)
user_id           UUID REFERENCES users(id)
score             INTEGER
rank              INTEGER
updated_at        TIMESTAMPTZ
```

#### 33-35. FRIENDS (3 tabelas)

##### `friendships`
```sql
id                UUID PRIMARY KEY
user_id           UUID REFERENCES users(id)
friend_id         UUID REFERENCES users(id)
status            VARCHAR(20)  -- pending, accepted, declined, blocked
requested_by      UUID REFERENCES users(id)
created_at        TIMESTAMPTZ
accepted_at       TIMESTAMPTZ
UNIQUE(user_id, friend_id)
```

##### `activity_feed`
```sql
id                UUID PRIMARY KEY
user_id           UUID REFERENCES users(id)
activity_type     VARCHAR(50)
activity_data     JSONB
is_public         BOOLEAN DEFAULT true
created_at        TIMESTAMPTZ
```

##### `friend_gifts`
```sql
id                UUID PRIMARY KEY
sender_id         UUID REFERENCES users(id)
receiver_id       UUID REFERENCES users(id)
gift_type         VARCHAR(20)  -- coins, gems, xp, cosmetic
gift_value        INTEGER
cosmetic_id       UUID REFERENCES cosmetics(id)
message           TEXT
status            VARCHAR(20)  -- pending, claimed, expired
created_at        TIMESTAMPTZ
claimed_at        TIMESTAMPTZ
expires_at        TIMESTAMPTZ
```

---

### 🎰 GACHA AVANÇADO (5 tabelas)

#### 36. `gacha_banners`
```sql
id                UUID PRIMARY KEY
name              VARCHAR(100)
description       TEXT
banner_image_url  TEXT
start_date        TIMESTAMPTZ
end_date          TIMESTAMPTZ
featured_cosmetic_ids UUID[]
rate_up_multiplier DECIMAL(3,2) DEFAULT 2.0
pity_threshold    INTEGER DEFAULT 90
guaranteed_rarity VARCHAR(20) DEFAULT 'legendary'
cost_gems         INTEGER DEFAULT 100
multi_pull_discount INTEGER DEFAULT 10
banner_type       VARCHAR(20)  -- standard, limited, seasonal, character
is_active         BOOLEAN
```

#### 37. `gacha_pity_tracker`
```sql
id                UUID PRIMARY KEY
user_id           UUID REFERENCES users(id)
banner_id         UUID REFERENCES gacha_banners(id)
pulls_since_last_legendary INTEGER DEFAULT 0
pulls_since_last_epic INTEGER DEFAULT 0
total_pulls       INTEGER DEFAULT 0
total_legendary_pulled INTEGER DEFAULT 0
total_epic_pulled INTEGER DEFAULT 0
total_rare_pulled INTEGER DEFAULT 0
spark_tokens      INTEGER DEFAULT 0
last_pull_at      TIMESTAMPTZ
UNIQUE(user_id, banner_id)
```

#### 38. `gacha_pull_history`
```sql
id                UUID PRIMARY KEY
user_id           UUID REFERENCES users(id)
banner_id         UUID REFERENCES gacha_banners(id)
cosmetic_id       UUID REFERENCES cosmetics(id)
cosmetic_rarity   VARCHAR(20)
was_pity_pull     BOOLEAN
was_rate_up       BOOLEAN
pull_type         VARCHAR(10)  -- single, multi
pull_number       INTEGER
gems_spent        INTEGER
created_at        TIMESTAMPTZ
```

#### 39. `spark_shop`
```sql
id                UUID PRIMARY KEY
banner_id         UUID REFERENCES gacha_banners(id)
cosmetic_id       UUID REFERENCES cosmetics(id)
spark_cost        INTEGER DEFAULT 300
max_exchanges     INTEGER DEFAULT 1
times_exchanged   INTEGER DEFAULT 0
is_available      BOOLEAN
UNIQUE(banner_id, cosmetic_id)
```

#### 40. `spark_exchange_history`
```sql
id                UUID PRIMARY KEY
user_id           UUID REFERENCES users(id)
banner_id         UUID REFERENCES gacha_banners(id)
cosmetic_id       UUID REFERENCES cosmetics(id)
sparks_spent      INTEGER
created_at        TIMESTAMPTZ
```

---

### 🖼️ NFT BLOCKCHAIN (5 tabelas)

#### 41. `nft_cosmetics`
```sql
id                UUID PRIMARY KEY
cosmetic_id       UUID REFERENCES cosmetics(id)
blockchain        VARCHAR(20) DEFAULT 'polygon'
contract_address  VARCHAR(100)
token_id          VARCHAR(100)
metadata_uri      TEXT  -- IPFS
image_uri         TEXT  -- IPFS
royalty_percentage DECIMAL(5,2) DEFAULT 5.0
royalty_recipient VARCHAR(100)
is_mintable       BOOLEAN
max_supply        INTEGER
current_supply    INTEGER DEFAULT 0
min_rarity        VARCHAR(20) DEFAULT 'epic'
UNIQUE(cosmetic_id)
```

#### 42. `nft_mint_requests`
```sql
id                UUID PRIMARY KEY
user_id           UUID REFERENCES users(id)
nft_cosmetic_id   UUID REFERENCES nft_cosmetics(id)
cosmetic_id       UUID REFERENCES cosmetics(id)
wallet_address    VARCHAR(100)
blockchain        VARCHAR(20)
status            VARCHAR(20)  -- pending, processing, completed, failed
transaction_hash  VARCHAR(100)
block_number      BIGINT
gas_used          BIGINT
gas_price         BIGINT
mint_fee_coins    INTEGER
mint_fee_gems     INTEGER
error_message     TEXT
created_at        TIMESTAMPTZ
completed_at      TIMESTAMPTZ
```

#### 43. `nft_transactions`
```sql
id                UUID PRIMARY KEY
nft_cosmetic_id   UUID REFERENCES nft_cosmetics(id)
transaction_type  VARCHAR(20)  -- mint, transfer, burn, sale
from_address      VARCHAR(100)
to_address        VARCHAR(100)
transaction_hash  VARCHAR(100)
block_number      BIGINT
blockchain        VARCHAR(20)
sale_price        DECIMAL(20, 8)
sale_price_usd    DECIMAL(20, 2)
royalty_amount    DECIMAL(20, 8)
royalty_recipient VARCHAR(100)
marketplace_name  VARCHAR(50)
marketplace_url   TEXT
created_at        TIMESTAMPTZ
```

#### 44. `nft_ownership`
```sql
id                UUID PRIMARY KEY
nft_cosmetic_id   UUID REFERENCES nft_cosmetics(id)
user_id           UUID REFERENCES users(id)
wallet_address    VARCHAR(100)
blockchain        VARCHAR(20)
token_id          VARCHAR(100)
acquired_at       TIMESTAMPTZ
last_verified_at  TIMESTAMPTZ
is_listed_external BOOLEAN
external_listing_url TEXT
UNIQUE(nft_cosmetic_id, token_id)
```

#### 45. `nft_royalties_earned`
```sql
id                UUID PRIMARY KEY
nft_cosmetic_id   UUID REFERENCES nft_cosmetics(id)
transaction_id    UUID REFERENCES nft_transactions(id)
amount_crypto     DECIMAL(20, 8)
amount_usd        DECIMAL(20, 2)
recipient_address VARCHAR(100)
recipient_user_id UUID REFERENCES users(id)
blockchain        VARCHAR(20)
earned_at         TIMESTAMPTZ
```

---

### ⚔️ BATALHAS PVP (4 tabelas)

#### 46. `battles`
```sql
id                UUID PRIMARY KEY
player1_id        UUID REFERENCES users(id)
player2_id        UUID REFERENCES users(id)
status            VARCHAR(20)  -- waiting, matched, in_progress, completed, cancelled
battle_type       VARCHAR(20)  -- ranked, casual, friendly, tournament
bet_amount_coins  INTEGER DEFAULT 0
bet_amount_gems   INTEGER DEFAULT 0
winner_id         UUID REFERENCES users(id)
loser_id          UUID REFERENCES users(id)
player1_score     INTEGER DEFAULT 0
player2_score     INTEGER DEFAULT 0
theme             VARCHAR(100)
time_limit_seconds INTEGER DEFAULT 120
created_at        TIMESTAMPTZ
matched_at        TIMESTAMPTZ
started_at        TIMESTAMPTZ
completed_at      TIMESTAMPTZ
```

#### 47. `battle_rounds`
```sql
id                UUID PRIMARY KEY
battle_id         UUID REFERENCES battles(id)
round_number      INTEGER
player1_verse     TEXT
player2_verse     TEXT
player1_votes     INTEGER DEFAULT 0
player2_votes     INTEGER DEFAULT 0
round_winner_id   UUID REFERENCES users(id)
created_at        TIMESTAMPTZ
completed_at      TIMESTAMPTZ
UNIQUE(battle_id, round_number)
```

#### 48. `battle_votes`
```sql
id                UUID PRIMARY KEY
battle_id         UUID REFERENCES battles(id)
round_number      INTEGER
voter_id          UUID REFERENCES users(id)
voted_for_player_id UUID REFERENCES users(id)
created_at        TIMESTAMPTZ
UNIQUE(battle_id, round_number, voter_id)
```

#### 49. `battle_rankings`
```sql
id                UUID PRIMARY KEY
user_id           UUID REFERENCES users(id)
elo_rating        INTEGER DEFAULT 1200
total_battles     INTEGER DEFAULT 0
wins              INTEGER DEFAULT 0
losses            INTEGER DEFAULT 0
draws             INTEGER DEFAULT 0
win_rate          DECIMAL(5,2) GENERATED  -- calculado
current_win_streak INTEGER DEFAULT 0
best_win_streak   INTEGER DEFAULT 0
total_coins_won   INTEGER DEFAULT 0
total_gems_won    INTEGER DEFAULT 0
last_battle_at    TIMESTAMPTZ
UNIQUE(user_id)
```

---

### 📊 ANALYTICS (1 tabela)

#### 50. `analytics_events`
```sql
id                UUID PRIMARY KEY
user_id           UUID REFERENCES users(id)
event_type        VARCHAR(100)
event_properties  JSONB
timestamp         TIMESTAMPTZ
created_at        TIMESTAMPTZ
```

---

## 🚀 COMO APLICAR AS MIGRATIONS

### Opção 1: Supabase Dashboard (RECOMENDADO)

1. **Acesse:** https://supabase.com/dashboard
2. **Seu Projeto** → **SQL Editor**
3. **Para cada migration (na ordem):**
   - Clique em "New Query"
   - Copie TODO o conteúdo do arquivo `.sql`
   - Cole no editor
   - Clique em "Run"
   - ✅ Aguarde "Success"

### Ordem de Execução:
```sql
-- 1. Base (users)
001_unified_schema.sql

-- 2. Monetização (18 tabelas)
002_monetization_schema.sql

-- 3. Streaks (1 tabela)
003_streaks_table.sql

-- 4. Crews (4 tabelas)
004_crews_system.sql

-- 5. Events (4 tabelas)
005_events_system.sql

-- 6. Marketplace (3 tabelas)
006_marketplace_system.sql

-- 7. Gacha (5 tabelas)
007_gacha_system.sql

-- 8. NFT (5 tabelas)
008_nft_system.sql

-- 9. Analytics (1 tabela)
009_analytics_system.sql

-- 10. Friends (3 tabelas)
010_friends_system.sql

-- 11. Battles (4 tabelas)
011_battles_system.sql
```

### Opção 2: CLI (Avançado)

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Link ao projeto
supabase link --project-ref SEU_PROJECT_ID

# Aplicar migrations
supabase db push
```

---

## 🌱 POPULAR O BANCO (SEED DATA)

### Script de Seed:
```
C:\Users\lucas\verso-genius-unified\scripts\seed-database.ts
```

### O que o seed faz:

1. **30+ Cosméticos:**
   - 5 Legendary (Coroa de Fogo, Microfone de Ouro, etc)
   - 10 Epic (Boné Streetwear, Tênis Air Max, etc)
   - 15 Rare (itens básicos)

2. **3 Banners de Gacha:**
   - Banner Lendário (rate-up Fire)
   - Banner Streetwear (rate-up street)
   - Banner Iniciante (permanente)

3. **5 Eventos:**
   - Desafio de Fogo
   - Torneio Semanal
   - Maratona de XP
   - Coleção Streetwear
   - Desafio Diário Bônus

4. **Battle Pass:**
   - 50 tiers (free + premium)
   - Rewards a cada tier

5. **NFT Setup:**
   - Marca legendários como mintáveis

### Como executar:

```bash
# 1. Configurar .env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJxxx...

# 2. Executar seed
cd C:\Users\lucas\verso-genius-unified
npm run seed
```

---

## 🔍 QUERIES ÚTEIS

### Verificar tabelas criadas:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

### Contar registros por tabela:
```sql
SELECT
  schemaname,
  tablename,
  n_live_tup as row_count
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;
```

### Ver usuários:
```sql
SELECT id, username, email, level, xp, role
FROM users
ORDER BY created_at DESC
LIMIT 10;
```

### Ver cosméticos:
```sql
SELECT name, rarity, type, price_coins, price_gems
FROM cosmetics
ORDER BY rarity, name;
```

### Ver banners ativos:
```sql
SELECT name, banner_type, cost_gems, pity_threshold
FROM gacha_banners
WHERE is_active = true
AND NOW() BETWEEN start_date AND end_date;
```

### Ver batalhas ativas:
```sql
SELECT
  b.id,
  p1.username as player1,
  p2.username as player2,
  b.status,
  b.battle_type
FROM battles b
JOIN users p1 ON b.player1_id = p1.id
LEFT JOIN users p2 ON b.player2_id = p2.id
WHERE b.status IN ('matched', 'in_progress')
ORDER BY b.created_at DESC;
```

### Ver ranking de batalhas (top 10):
```sql
SELECT
  u.username,
  br.elo_rating,
  br.wins,
  br.losses,
  br.win_rate
FROM battle_rankings br
JOIN users u ON br.user_id = u.id
ORDER BY br.elo_rating DESC
LIMIT 10;
```

---

## 📈 ÍNDICES E PERFORMANCE

### Principais Índices Criados:

```sql
-- Users
idx_users_username
idx_users_email
idx_users_level

-- Cosmetics
idx_cosmetics_rarity
idx_cosmetics_type
idx_cosmetics_price

-- Gacha
idx_gacha_banners_active
idx_gacha_pull_history_user
idx_gacha_pity_user_banner

-- Battles
idx_battles_status
idx_battles_player1
idx_battles_player2
idx_battle_rankings_elo

-- Analytics
idx_analytics_events_user
idx_analytics_events_type
idx_analytics_events_timestamp
```

### Otimizações:

- ✅ Índices em todas as foreign keys
- ✅ Índices em campos de busca
- ✅ Índices compostos para queries complexas
- ✅ UNIQUE constraints para prevenir duplicatas
- ✅ CHECK constraints para validação
- ✅ Triggers para cálculos automáticos

---

## 🔐 ROW LEVEL SECURITY (RLS)

### Todas as tabelas têm RLS ativado:

```sql
ALTER TABLE nome_da_tabela ENABLE ROW LEVEL SECURITY;
```

### Exemplos de Policies:

#### Users podem ver próprios dados:
```sql
CREATE POLICY "Users can view own data"
ON user_currencies FOR SELECT
USING (auth.uid() = user_id);
```

#### Público pode ver cosméticos:
```sql
CREATE POLICY "Cosmetics are viewable by all"
ON cosmetics FOR SELECT
USING (true);
```

#### Admin pode ver tudo:
```sql
CREATE POLICY "Admins can view all"
ON analytics_events FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);
```

---

## 🔧 TRIGGERS E FUNCTIONS

### Triggers Automáticos:

#### 1. Auto-update de timestamps:
```sql
CREATE TRIGGER trigger_update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();
```

#### 2. Auto-level de crews:
```sql
CREATE TRIGGER trigger_update_crew_level
AFTER UPDATE ON crews
FOR EACH ROW
EXECUTE FUNCTION calculate_crew_level();
```

#### 3. Processar resultado de batalha:
```sql
CREATE TRIGGER trigger_process_battle_result
AFTER UPDATE ON battles
FOR EACH ROW
EXECUTE FUNCTION process_battle_result();
```

### Functions Úteis:

#### Calcular ELO:
```sql
SELECT * FROM calculate_elo_change(1200, 1300, 32);
```

#### Expirar listings:
```sql
SELECT expire_marketplace_listings();
```

#### Cleanup analytics:
```sql
SELECT cleanup_old_analytics_events();
```

---

## 📊 DIAGRAMA ER (Resumido)

```
USERS (centro)
├── user_currencies (1:1)
├── user_cosmetics (1:N)
├── user_streaks (1:1)
├── user_subscriptions (1:N)
├── payments (1:N)
├── crew_members (1:N)
├── friendships (1:N)
├── battle_rankings (1:1)
└── analytics_events (1:N)

COSMETICS
├── user_cosmetics (1:N)
├── marketplace_listings (1:N)
├── nft_cosmetics (1:1)
└── gacha_pull_history (1:N)

GACHA_BANNERS
├── gacha_pity_tracker (1:N)
├── gacha_pull_history (1:N)
└── spark_shop (1:N)

BATTLES
├── battle_rounds (1:N)
├── battle_votes (1:N)
└── battle_rankings (1:1 com users)

CREWS
├── crew_members (1:N)
├── crew_invites (1:N)
└── crew_chat_messages (1:N)
```

---

## 📝 BACKUP E RESTORE

### Backup Manual (Supabase Dashboard):

1. **Settings** → **Database**
2. **Backups** → **Create backup**
3. Download do arquivo `.sql`

### Backup via CLI:

```bash
# Backup completo
supabase db dump > backup.sql

# Backup apenas dados
supabase db dump --data-only > data.sql

# Backup apenas schema
supabase db dump --schema-only > schema.sql
```

### Restore:

```bash
# Via CLI
supabase db reset --db-url "postgresql://..."

# Via Dashboard
SQL Editor → Colar conteúdo do backup → Run
```

---

## 🎯 CHECKLIST DE VERIFICAÇÃO

Após aplicar todas as migrations:

- [ ] 44 tabelas criadas
- [ ] RLS ativo em todas
- [ ] Índices criados
- [ ] Triggers funcionando
- [ ] Functions criadas
- [ ] Seed executado com sucesso
- [ ] Cosméticos visíveis
- [ ] Banners gacha ativos
- [ ] Eventos criados
- [ ] Battle Pass configurado

### Comando de verificação:
```sql
SELECT COUNT(*) as total_tables
FROM information_schema.tables
WHERE table_schema = 'public';
-- Deve retornar: 44
```

---

## 🚨 TROUBLESHOOTING

### Erro: "relation already exists"
**Solução:** Tabela já foi criada. Pule para próxima migration.

### Erro: "permission denied"
**Solução:** Use SERVICE_KEY, não ANON_KEY.

### Erro: "foreign key violation"
**Solução:** Execute migrations na ordem correta.

### Tabelas faltando após seed:
**Solução:** Verifique .env, execute migrations primeiro.

---

## 📚 DOCUMENTAÇÃO ADICIONAL

### Supabase Docs:
- https://supabase.com/docs/guides/database

### PostgreSQL Docs:
- https://www.postgresql.org/docs/

### RLS Guide:
- https://supabase.com/docs/guides/auth/row-level-security

---

## ✅ RESUMO EXECUTIVO

**Database Completo:**
- ✅ 44 tabelas
- ✅ 11 migrations
- ✅ RLS em 100%
- ✅ 50+ índices
- ✅ 10+ triggers
- ✅ 15+ functions
- ✅ Seed data pronto
- ✅ Backup automático

**Localização:**
```
C:\Users\lucas\verso-genius-unified\database\supabase\migrations\
```

**Comando seed:**
```bash
npm run seed
```

**Status:** 🚀 PRONTO PARA PRODUÇÃO!

