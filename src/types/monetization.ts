/**
 * Monetization Types - Verso Genius
 * TypeScript types for all monetization features
 */

// ============================================================================
// VIRTUAL CURRENCY
// ============================================================================

export type CurrencyType = 'coins' | 'gems'

export interface UserCurrency {
  user_id: string
  coins: number
  gems: number
  lifetime_coins_earned: number
  lifetime_gems_earned: number
  created_at: string
  updated_at: string
}

export interface CurrencyTransaction {
  id: string
  user_id: string
  currency_type: CurrencyType
  amount: number
  balance_after: number
  transaction_type: 'purchase' | 'reward' | 'spend' | 'refund'
  source?: string
  metadata?: Record<string, any>
  created_at: string
}

// ============================================================================
// PREMIUM TIERS
// ============================================================================

export type SubscriptionTier = 'free' | 'pro' | 'elite'
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'trial'

export interface UserSubscription {
  id: string
  user_id: string
  tier: SubscriptionTier
  status: SubscriptionStatus
  started_at: string
  expires_at?: string
  cancelled_at?: string
  auto_renew: boolean
  payment_method?: string
  stripe_subscription_id?: string
  created_at: string
  updated_at: string
}

export interface SubscriptionPlan {
  tier: SubscriptionTier
  name: string
  price_monthly: number
  price_annual: number
  features: string[]
  limits: {
    exercises_per_day: number | 'unlimited'
    beats_available: number | 'unlimited'
    recordings: number | 'unlimited'
    ai_feedback: number | 'unlimited'
  }
}

// ============================================================================
// LOOT BOXES
// ============================================================================

export type RarityTier = 'common' | 'rare' | 'epic' | 'legendary'

export interface LootBox {
  id: string
  name: string
  description?: string
  cost_coins?: number
  cost_gems?: number
  rarity_weights: Record<RarityTier, number>
  is_active: boolean
  created_at: string
}

export interface UserLootBoxInventory {
  id: string
  user_id: string
  loot_box_id: string
  opened_at?: string
  rewards?: LootBoxReward[]
  created_at: string
}

export interface LootBoxReward {
  type: 'rhyme' | 'cosmetic' | 'coins' | 'gems' | 'xp'
  id?: string
  amount?: number
  rarity: RarityTier
}

// ============================================================================
// COSMETICS
// ============================================================================

export type CosmeticType = 'avatar_frame' | 'profile_theme' | 'badge' | 'effect'

export interface Cosmetic {
  id: string
  name: string
  description?: string
  type: CosmeticType
  rarity: RarityTier
  cost_coins?: number
  cost_gems?: number
  image_url?: string
  metadata?: Record<string, any>
  is_available: boolean
  limited_edition: boolean
  available_until?: string
  created_at: string
}

export interface UserCosmetic {
  user_id: string
  cosmetic_id: string
  acquired_at: string
  equipped: boolean
}

// ============================================================================
// DAILY CHALLENGES
// ============================================================================

export type ChallengeDifficulty = 'easy' | 'medium' | 'hard'

export interface DailyChallenge {
  id: string
  title: string
  description: string
  difficulty: ChallengeDifficulty
  reward_coins: number
  reward_xp: number
  requirements: ChallengeRequirements
  active_date: string
  created_at: string
}

export interface ChallengeRequirements {
  type: 'rhyme_count' | 'freestyle_duration' | 'high_score_count' | 'streak_days'
  target: number
  min_score?: number
}

export interface UserDailyChallenge {
  user_id: string
  challenge_id: string
  completed_at?: string
  progress: Record<string, any>
}

// ============================================================================
// BATTLE PASS
// ============================================================================

export interface BattlePass {
  id: string
  season_number: number
  name: string
  start_date: string
  end_date: string
  cost_gems: number
  max_tier: number
  is_active: boolean
  created_at: string
}

export interface BattlePassTier {
  id: string
  battle_pass_id: string
  tier_number: number
  xp_required: number
  free_rewards?: Reward[]
  premium_rewards?: Reward[]
}

export interface UserBattlePass {
  user_id: string
  battle_pass_id: string
  is_premium: boolean
  current_tier: number
  current_xp: number
  purchased_at?: string
}

export interface Reward {
  type: 'coins' | 'gems' | 'cosmetic' | 'loot_box' | 'rhyme_pack'
  id?: string
  amount?: number
}

// ============================================================================
// LEADERBOARDS
// ============================================================================

export type LeaderboardType = 'weekly' | 'monthly' | 'all_time'

export interface Leaderboard {
  id: string
  name: string
  type: LeaderboardType
  metric: 'most_freestyles' | 'highest_score' | 'longest_streak'
  start_date: string
  end_date?: string
  prize_pool_gems?: number
  entry_fee_gems?: number
  is_active: boolean
  created_at: string
}

export interface LeaderboardEntry {
  leaderboard_id: string
  user_id: string
  score: number
  rank?: number
  metadata?: Record<string, any>
  updated_at: string
}

// ============================================================================
// REFERRALS
// ============================================================================

export interface Referral {
  id: string
  referrer_id: string
  referee_id: string
  referral_code: string
  status: 'pending' | 'completed'
  reward_claimed: boolean
  created_at: string
  completed_at?: string
}

export interface ReferralMilestone {
  user_id: string
  milestone: number
  reward_type: string
  reward_value: any
  claimed: boolean
  claimed_at?: string
}

// ============================================================================
// ACHIEVEMENTS
// ============================================================================

export interface Achievement {
  id: string
  name: string
  description: string
  icon_url?: string
  rarity: RarityTier
  requirements: AchievementRequirements
  reward_coins?: number
  reward_gems?: number
  reward_cosmetic_id?: string
  is_secret: boolean
  created_at: string
}

export interface AchievementRequirements {
  type: 'exercise_count' | 'freestyle_count' | 'rhyme_count' | 'streak_days'
  target: number
}

export interface UserAchievement {
  user_id: string
  achievement_id: string
  progress: Record<string, any>
  completed_at?: string
}

// ============================================================================
// CREWS
// ============================================================================

export interface Crew {
  id: string
  name: string
  description?: string
  tag?: string
  owner_id: string
  max_members: number
  is_premium: boolean
  total_xp: number
  created_at: string
}

export interface CrewMember {
  crew_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member'
  contribution_xp: number
  joined_at: string
}

export interface CrewChallenge {
  id: string
  name: string
  crew1_id: string
  crew2_id: string
  start_date: string
  end_date: string
  winner_id?: string
  prize?: any
  created_at: string
}

// ============================================================================
// MARKETPLACE
// ============================================================================

export interface MarketplaceItem {
  id: string
  creator_id: string
  type: 'rhyme_pack' | 'beat' | 'tutorial'
  name: string
  description?: string
  price_coins: number
  preview_url?: string
  content_url?: string
  downloads: number
  rating: number
  is_approved: boolean
  moderated_at?: string
  created_at: string
}

export interface MarketplacePurchase {
  user_id: string
  item_id: string
  purchased_at: string
}

export interface MarketplaceReview {
  id: string
  item_id: string
  user_id: string
  rating: number
  comment?: string
  created_at: string
}

// ============================================================================
// LIVE BATTLES
// ============================================================================

export type BattleStatus = 'waiting' | 'in_progress' | 'completed' | 'cancelled'

export interface LiveBattle {
  id: string
  player1_id: string
  player2_id: string
  entry_fee_gems: number
  prize_gems: number
  status: BattleStatus
  winner_id?: string
  rounds_data?: BattleRound[]
  started_at?: string
  completed_at?: string
  created_at: string
}

export interface BattleRound {
  round: number
  p1_score: number
  p2_score: number
  p1_freestyle?: string
  p2_freestyle?: string
}

export interface BattleSpectator {
  battle_id: string
  user_id: string
  bet_on_player_id?: string
  bet_amount_gems?: number
  joined_at: string
}

// ============================================================================
// TIME-LIMITED EVENTS
// ============================================================================

export interface TimeLimitedEvent {
  id: string
  name: string
  description?: string
  event_type: 'flash_sale' | 'exclusive_drop' | 'tournament'
  start_date: string
  end_date: string
  rewards?: any
  requirements?: any
  is_active: boolean
  created_at: string
}

export interface UserEventParticipation {
  user_id: string
  event_id: string
  progress: Record<string, any>
  rewards_claimed: any[]
}

// ============================================================================
// MC PARTNERSHIPS
// ============================================================================

export interface MCPartnership {
  id: string
  mc_name: string
  pack_name: string
  description?: string
  price_gems: number
  content_ids: any
  image_url?: string
  revenue_share_percent?: number
  total_sales: number
  is_active: boolean
  created_at: string
}

export interface UserMCPack {
  user_id: string
  pack_id: string
  purchased_at: string
}

// ============================================================================
// PURCHASES
// ============================================================================

export interface Purchase {
  id: string
  user_id: string
  product_type: 'subscription' | 'gems' | 'loot_box' | 'cosmetic'
  product_id?: string
  amount_brl: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  payment_method?: string
  stripe_payment_id?: string
  metadata?: Record<string, any>
  created_at: string
  completed_at?: string
}

// ============================================================================
// AD VIEWS
// ============================================================================

export interface AdView {
  id: string
  user_id: string
  ad_type: 'video' | 'banner' | 'rewarded'
  reward_coins?: number
  watched_seconds?: number
  completed: boolean
  created_at: string
}

// ============================================================================
// SHOP PRODUCTS
// ============================================================================

export interface ShopProduct {
  id: string
  name: string
  description: string
  type: 'gems' | 'subscription' | 'loot_box' | 'cosmetic'
  price_brl: number
  gems_amount?: number
  discount_percent?: number
  is_featured: boolean
  image_url?: string
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface PurchaseRequest {
  product_type: string
  product_id?: string
  payment_method: 'stripe' | 'mercado_pago'
}

export interface PurchaseResponse {
  success: boolean
  purchase_id: string
  payment_url?: string
  error?: string
}

export interface OpenLootBoxRequest {
  loot_box_id: string
}

export interface OpenLootBoxResponse {
  success: boolean
  rewards: LootBoxReward[]
  new_balance: {
    coins: number
    gems: number
  }
}

export interface ClaimDailyChallengeRequest {
  challenge_id: string
}

export interface ClaimDailyChallengeResponse {
  success: boolean
  rewards: {
    coins: number
    xp: number
  }
  new_balance: UserCurrency
}
