/**
 * Seed Database Script
 * Popular database com dados iniciais
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
)

// ========================================
// COSMÉTICOS
// ========================================

const COSMETICS_SEED = [
  // LEGENDARY (5)
  {
    name: 'Coroa de Fogo',
    description: 'Coroa flamejante dos grandes MCs',
    type: 'hat',
    rarity: 'legendary',
    image_url: 'https://placehold.co/400x400/ff6b35/ffffff?text=Coroa+Fogo',
    price_coins: 0,
    price_gems: 500,
    is_purchasable: true
  },
  {
    name: 'Microfone de Ouro',
    description: 'Lendário microfone dos campeões',
    type: 'item',
    rarity: 'legendary',
    image_url: 'https://placehold.co/400x400/ffd700/000000?text=Mic+Ouro',
    price_coins: 0,
    price_gems: 500,
    is_purchasable: true
  },
  {
    name: 'Jaqueta Cyberpunk',
    description: 'Jaqueta neon futurista',
    type: 'outfit',
    rarity: 'legendary',
    image_url: 'https://placehold.co/400x400/9d4edd/ffffff?text=Cyberpunk',
    price_coins: 0,
    price_gems: 500,
    is_purchasable: false // Apenas loot box
  },
  {
    name: 'Óculos Holográficos',
    description: 'Óculos com display holográfico',
    type: 'accessory',
    rarity: 'legendary',
    image_url: 'https://placehold.co/400x400/00f5d4/000000?text=Holo+Glass',
    price_coins: 0,
    price_gems: 500,
    is_purchasable: false
  },
  {
    name: 'Corrente de Diamante',
    description: 'Corrente brilhante exclusiva',
    type: 'accessory',
    rarity: 'legendary',
    image_url: 'https://placehold.co/400x400/ffffff/000000?text=Diamond',
    price_coins: 0,
    price_gems: 500,
    is_purchasable: false
  },

  // EPIC (10)
  {
    name: 'Boné Streetwear',
    description: 'Boné estiloso das ruas',
    type: 'hat',
    rarity: 'epic',
    image_url: 'https://placehold.co/400x400/7209b7/ffffff?text=Street+Cap',
    price_coins: 0,
    price_gems: 150,
    is_purchasable: true
  },
  {
    name: 'Tênis Air Max',
    description: 'Tênis clássico de hip hop',
    type: 'shoes',
    rarity: 'epic',
    image_url: 'https://placehold.co/400x400/f72585/ffffff?text=Air+Max',
    price_coins: 5000,
    price_gems: 150,
    is_purchasable: true
  },
  {
    name: 'Moletom Grafite',
    description: 'Moletom com arte grafite',
    type: 'outfit',
    rarity: 'epic',
    image_url: 'https://placehold.co/400x400/4361ee/ffffff?text=Grafite',
    price_coins: 5000,
    price_gems: 150,
    is_purchasable: true
  },
  {
    name: 'Relógio de Ouro',
    description: 'Relógio dourado chamativo',
    type: 'accessory',
    rarity: 'epic',
    image_url: 'https://placehold.co/400x400/ffbe0b/000000?text=Gold+Watch',
    price_coins: 5000,
    price_gems: 150,
    is_purchasable: true
  },
  {
    name: 'Bandana Vermelha',
    description: 'Bandana clássica',
    type: 'accessory',
    rarity: 'epic',
    image_url: 'https://placehold.co/400x400/e63946/ffffff?text=Bandana',
    price_coins: 4000,
    price_gems: 0,
    is_purchasable: true
  },
  {
    name: 'Mochila Vintage',
    description: 'Mochila retrô estilosa',
    type: 'item',
    rarity: 'epic',
    image_url: 'https://placehold.co/400x400/06ffa5/000000?text=Vintage',
    price_coins: 4000,
    price_gems: 0,
    is_purchasable: true
  },
  {
    name: 'Camiseta Supreme',
    description: 'Camiseta streetwear premium',
    type: 'outfit',
    rarity: 'epic',
    image_url: 'https://placehold.co/400x400/d00000/ffffff?text=Supreme',
    price_coins: 4500,
    price_gems: 0,
    is_purchasable: true
  },
  {
    name: 'Luvas Sem Dedos',
    description: 'Luvas táticas street',
    type: 'accessory',
    rarity: 'epic',
    image_url: 'https://placehold.co/400x400/2b2d42/ffffff?text=Gloves',
    price_coins: 3500,
    price_gems: 0,
    is_purchasable: true
  },
  {
    name: 'Corrente Prateada',
    description: 'Corrente grossa de prata',
    type: 'accessory',
    rarity: 'epic',
    image_url: 'https://placehold.co/400x400/c0c0c0/000000?text=Silver',
    price_coins: 3500,
    price_gems: 0,
    is_purchasable: true
  },
  {
    name: 'Anel de Prata',
    description: 'Anel estiloso de prata',
    type: 'accessory',
    rarity: 'epic',
    image_url: 'https://placehold.co/400x400/a0a0a0/000000?text=Ring',
    price_coins: 3000,
    price_gems: 0,
    is_purchasable: true
  },

  // RARE (15)
  {
    name: 'Boné Básico',
    description: 'Boné simples e estiloso',
    type: 'hat',
    rarity: 'rare',
    image_url: 'https://placehold.co/400x400/0077b6/ffffff?text=Basic+Cap',
    price_coins: 1000,
    price_gems: 0,
    is_purchasable: true
  },
  {
    name: 'Camiseta Branca',
    description: 'Camiseta básica branca',
    type: 'outfit',
    rarity: 'rare',
    image_url: 'https://placehold.co/400x400/ffffff/000000?text=White+Tee',
    price_coins: 800,
    price_gems: 0,
    is_purchasable: true
  },
  {
    name: 'Calça Jeans',
    description: 'Calça jeans clássica',
    type: 'outfit',
    rarity: 'rare',
    image_url: 'https://placehold.co/400x400/023e8a/ffffff?text=Jeans',
    price_coins: 1200,
    price_gems: 0,
    is_purchasable: true
  },
  {
    name: 'Tênis Converse',
    description: 'Tênis all star clássico',
    type: 'shoes',
    rarity: 'rare',
    image_url: 'https://placehold.co/400x400/000000/ffffff?text=Converse',
    price_coins: 1500,
    price_gems: 0,
    is_purchasable: true
  },
  {
    name: 'Óculos de Sol',
    description: 'Óculos escuros estilosos',
    type: 'accessory',
    rarity: 'rare',
    image_url: 'https://placehold.co/400x400/370617/ffffff?text=Sunglasses',
    price_coins: 1000,
    price_gems: 0,
    is_purchasable: true
  },
  {
    name: 'Pulseira de Couro',
    description: 'Pulseira de couro simples',
    type: 'accessory',
    rarity: 'rare',
    image_url: 'https://placehold.co/400x400/6a4c93/ffffff?text=Leather',
    price_coins: 500,
    price_gems: 0,
    is_purchasable: true
  },
  {
    name: 'Colar Simples',
    description: 'Colar básico estiloso',
    type: 'accessory',
    rarity: 'rare',
    image_url: 'https://placehold.co/400x400/f77f00/ffffff?text=Necklace',
    price_coins: 600,
    price_gems: 0,
    is_purchasable: true
  },
  {
    name: 'Brinco de Argola',
    description: 'Brinco de argola clássico',
    type: 'accessory',
    rarity: 'rare',
    image_url: 'https://placehold.co/400x400/fcbf49/000000?text=Earring',
    price_coins: 400,
    price_gems: 0,
    is_purchasable: true
  },
  {
    name: 'Mochila Escolar',
    description: 'Mochila básica funcional',
    type: 'item',
    rarity: 'rare',
    image_url: 'https://placehold.co/400x400/457b9d/ffffff?text=Backpack',
    price_coins: 1000,
    price_gems: 0,
    is_purchasable: true
  },
  {
    name: 'Headphone Básico',
    description: 'Fone de ouvido simples',
    type: 'item',
    rarity: 'rare',
    image_url: 'https://placehold.co/400x400/1d3557/ffffff?text=Headphone',
    price_coins: 1200,
    price_gems: 0,
    is_purchasable: true
  },
  {
    name: 'Cinto de Lona',
    description: 'Cinto casual básico',
    type: 'accessory',
    rarity: 'rare',
    image_url: 'https://placehold.co/400x400/588157/ffffff?text=Belt',
    price_coins: 300,
    price_gems: 0,
    is_purchasable: true
  },
  {
    name: 'Cachecol',
    description: 'Cachecol estiloso',
    type: 'accessory',
    rarity: 'rare',
    image_url: 'https://placehold.co/400x400/2a9d8f/ffffff?text=Scarf',
    price_coins: 500,
    price_gems: 0,
    is_purchasable: true
  },
  {
    name: 'Gorro de Lã',
    description: 'Gorro quente e confortável',
    type: 'hat',
    rarity: 'rare',
    image_url: 'https://placehold.co/400x400/264653/ffffff?text=Beanie',
    price_coins: 700,
    price_gems: 0,
    is_purchasable: true
  },
  {
    name: 'Jaqueta Jeans',
    description: 'Jaqueta jeans clássica',
    type: 'outfit',
    rarity: 'rare',
    image_url: 'https://placehold.co/400x400/2a6f97/ffffff?text=Jacket',
    price_coins: 2000,
    price_gems: 0,
    is_purchasable: true
  },
  {
    name: 'Botas de Couro',
    description: 'Botas robustas de couro',
    type: 'shoes',
    rarity: 'rare',
    image_url: 'https://placehold.co/400x400/8b4513/ffffff?text=Boots',
    price_coins: 1800,
    price_gems: 0,
    is_purchasable: true
  }
]

// ========================================
// GACHA BANNERS
// ========================================

async function seedGachaBanners(cosmeticIds: Record<string, string>) {
  console.log('🎰 Seeding gacha banners...')

  const now = new Date()
  const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)

  const banners = [
    {
      name: 'Banner Lendário - Fogo',
      description: 'Rate-up para Coroa de Fogo e Microfone de Ouro!',
      banner_image_url: 'https://placehold.co/1200x400/ff6b35/ffffff?text=Fire+Banner',
      start_date: now.toISOString(),
      end_date: oneWeekFromNow.toISOString(),
      featured_cosmetic_ids: [
        cosmeticIds['Coroa de Fogo'],
        cosmeticIds['Microfone de Ouro']
      ],
      rate_up_multiplier: 2.0,
      pity_threshold: 90,
      guaranteed_rarity: 'legendary',
      cost_gems: 100,
      multi_pull_discount: 10,
      banner_type: 'limited'
    },
    {
      name: 'Banner Streetwear',
      description: 'Especial de roupas streetwear!',
      banner_image_url: 'https://placehold.co/1200x400/7209b7/ffffff?text=Streetwear',
      start_date: now.toISOString(),
      end_date: twoWeeksFromNow.toISOString(),
      featured_cosmetic_ids: [
        cosmeticIds['Boné Streetwear'],
        cosmeticIds['Moletom Grafite']
      ],
      rate_up_multiplier: 2.5,
      pity_threshold: 80,
      guaranteed_rarity: 'epic',
      cost_gems: 80,
      multi_pull_discount: 15,
      banner_type: 'standard'
    },
    {
      name: 'Banner Iniciante',
      description: 'Banner permanente para começar sua coleção!',
      banner_image_url: 'https://placehold.co/1200x400/0077b6/ffffff?text=Starter',
      start_date: now.toISOString(),
      end_date: new Date('2030-01-01').toISOString(), // Permanente
      featured_cosmetic_ids: [],
      rate_up_multiplier: 1.0,
      pity_threshold: 100,
      guaranteed_rarity: 'legendary',
      cost_gems: 100,
      multi_pull_discount: 10,
      banner_type: 'standard'
    }
  ]

  const { data, error } = await supabase
    .from('gacha_banners')
    .insert(banners)
    .select()

  if (error) {
    console.error('Error seeding gacha banners:', error)
  } else {
    console.log(`✅ Created ${data.length} gacha banners`)
  }
}

// ========================================
// EVENTOS
// ========================================

async function seedEvents(cosmeticIds: Record<string, string>) {
  console.log('📅 Seeding events...')

  const now = new Date()
  const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)

  const events = [
    {
      name: 'Desafio de Fogo',
      description: 'Complete objetivos e ganhe a Coroa de Fogo!',
      event_type: 'challenge',
      start_date: now.toISOString(),
      end_date: oneWeekFromNow.toISOString(),
      reward_coins: 5000,
      reward_gems: 100,
      reward_xp: 1000,
      reward_cosmetic_id: cosmeticIds['Coroa de Fogo'],
      is_active: true
    },
    {
      name: 'Torneio Semanal',
      description: 'Compita no ranking e ganhe recompensas exclusivas!',
      event_type: 'tournament',
      start_date: now.toISOString(),
      end_date: oneWeekFromNow.toISOString(),
      reward_coins: 3000,
      reward_gems: 50,
      reward_xp: 500,
      reward_cosmetic_id: cosmeticIds['Microfone de Ouro'],
      is_active: true
    },
    {
      name: 'Maratona de XP',
      description: 'Ganhe XP extra em todos os exercícios!',
      event_type: 'special',
      start_date: now.toISOString(),
      end_date: twoWeeksFromNow.toISOString(),
      reward_coins: 2000,
      reward_gems: 20,
      reward_xp: 2000,
      reward_cosmetic_id: null,
      is_active: true
    },
    {
      name: 'Coleção Streetwear',
      description: 'Colete 5 itens streetwear para ganhar gems!',
      event_type: 'seasonal',
      start_date: now.toISOString(),
      end_date: twoWeeksFromNow.toISOString(),
      reward_coins: 1000,
      reward_gems: 150,
      reward_xp: 300,
      reward_cosmetic_id: cosmeticIds['Jaqueta Cyberpunk'],
      is_active: true
    },
    {
      name: 'Desafio Diário Bônus',
      description: 'Complete todos os desafios diários por 7 dias seguidos!',
      event_type: 'challenge',
      start_date: now.toISOString(),
      end_date: oneWeekFromNow.toISOString(),
      reward_coins: 10000,
      reward_gems: 200,
      reward_xp: 2000,
      reward_cosmetic_id: cosmeticIds['Óculos Holográficos'],
      is_active: true
    }
  ]

  const { data: eventsData, error: eventsError } = await supabase
    .from('events')
    .insert(events)
    .select()

  if (eventsError) {
    console.error('Error seeding events:', eventsError)
    return
  }

  console.log(`✅ Created ${eventsData.length} events`)

  // Criar objetivos para cada evento
  for (const event of eventsData) {
    const objectives = [
      {
        event_id: event.id,
        objective_type: 'rhymes_count',
        target_value: 50,
        reward_coins: 1000,
        reward_gems: 10,
        reward_xp: 100
      },
      {
        event_id: event.id,
        objective_type: 'daily_streak',
        target_value: 7,
        reward_coins: 2000,
        reward_gems: 20,
        reward_xp: 200
      },
      {
        event_id: event.id,
        objective_type: 'xp_earned',
        target_value: 5000,
        reward_coins: 3000,
        reward_gems: 30,
        reward_xp: 300
      }
    ]

    await supabase.from('event_objectives').insert(objectives)
  }

  console.log('✅ Created event objectives')
}

// ========================================
// MAIN SEED FUNCTION
// ========================================

async function seedDatabase() {
  console.log('🌱 Starting database seed...\n')

  try {
    // 1. Seed cosméticos
    console.log('🎨 Seeding cosmetics...')
    const { data: cosmetics, error: cosmeticsError } = await supabase
      .from('cosmetics')
      .insert(COSMETICS_SEED)
      .select()

    if (cosmeticsError) {
      console.error('Error seeding cosmetics:', cosmeticsError)
      throw cosmeticsError
    }

    console.log(`✅ Created ${cosmetics.length} cosmetics\n`)

    // Criar mapa de IDs por nome
    const cosmeticIds: Record<string, string> = {}
    cosmetics.forEach((c) => {
      cosmeticIds[c.name] = c.id
    })

    // 2. Seed gacha banners
    await seedGachaBanners(cosmeticIds)
    console.log('')

    // 3. Seed eventos
    await seedEvents(cosmeticIds)
    console.log('')

    // 4. Marcar alguns cosméticos como NFT mintáveis
    console.log('🖼️  Marking legendary cosmetics as NFT mintable...')
    const legendaryCosmetics = cosmetics.filter((c) => c.rarity === 'legendary')

    for (const cosmetic of legendaryCosmetics) {
      await supabase.from('nft_cosmetics').insert({
        cosmetic_id: cosmetic.id,
        blockchain: 'polygon',
        contract_address: process.env.NFT_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
        royalty_percentage: 5.0,
        royalty_recipient: process.env.ROYALTY_WALLET || '0x0000000000000000000000000000000000000000',
        max_supply: 1000,
        min_rarity: 'legendary',
        is_mintable: true
      })
    }

    console.log(`✅ Marked ${legendaryCosmetics.length} cosmetics as NFT mintable\n`)

    // 5. Criar Battle Pass
    console.log('🎫 Creating Battle Pass...')
    const battlePassStart = new Date()
    const battlePassEnd = new Date(battlePassStart.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 dias

    const { data: battlePass } = await supabase
      .from('battle_passes')
      .insert({
        name: 'Battle Pass Temporada 1',
        description: 'Primeira temporada do Battle Pass!',
        start_date: battlePassStart.toISOString(),
        end_date: battlePassEnd.toISOString(),
        max_tier: 50,
        price_gems: 500,
        is_active: true
      })
      .select()
      .single()

    if (battlePass) {
      // Criar rewards do battle pass
      const rewards = []
      for (let tier = 1; tier <= 50; tier++) {
        // Free track
        rewards.push({
          battle_pass_id: battlePass.id,
          tier,
          is_premium: false,
          reward_type: tier % 5 === 0 ? 'gems' : 'coins',
          reward_value: tier % 5 === 0 ? 10 : 100 * tier
        })

        // Premium track
        if (tier % 10 === 0) {
          // A cada 10 tiers: cosmético
          const randomCosmetic = cosmetics[Math.floor(Math.random() * cosmetics.length)]
          rewards.push({
            battle_pass_id: battlePass.id,
            tier,
            is_premium: true,
            reward_type: 'cosmetic',
            cosmetic_id: randomCosmetic.id
          })
        } else {
          rewards.push({
            battle_pass_id: battlePass.id,
            tier,
            is_premium: true,
            reward_type: tier % 2 === 0 ? 'gems' : 'coins',
            reward_value: tier % 2 === 0 ? 20 : 200 * tier
          })
        }
      }

      await supabase.from('battle_pass_rewards').insert(rewards)
      console.log(`✅ Created Battle Pass with ${rewards.length} rewards\n`)
    }

    console.log('🎉 Database seed completed successfully!')
  } catch (error) {
    console.error('❌ Seed failed:', error)
    process.exit(1)
  }
}

// Run seed
seedDatabase()
