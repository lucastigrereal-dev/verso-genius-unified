# 🚀 EXECUTAR MONETIZAÇÃO AGORA

Passos rápidos para ativar o sistema de monetização.

---

## ⚡ QUICK START (15 minutos)

### PASSO 1: Aplicar Schema no Supabase (5 min)

1. **Abrir Supabase SQL Editor:**
   ```
   https://supabase.com/dashboard/project/cxuethubwfvqolsppfst/sql/new
   ```

2. **Copiar o SQL:**
   - Arquivo: `database/supabase/migrations/002_monetization_schema.sql`
   - Ctrl+A → Ctrl+C

3. **Colar e Executar:**
   - Colar no editor
   - Clicar em "RUN" (canto inferior direito)
   - Aguardar: "Schema de monetização criado com sucesso!"

4. **Verificar Tabelas:**
   ```sql
   SELECT tablename FROM pg_tables
   WHERE schemaname = 'public'
   AND (tablename LIKE '%currency%'
        OR tablename LIKE '%cosmetic%'
        OR tablename LIKE '%loot%'
        OR tablename LIKE '%battle%');
   ```

   Deve retornar 16 tabelas.

---

### PASSO 2: Testar Backend Localmente (5 min)

```powershell
cd C:\Users\lucas\verso-genius-unified

# 1. Instalar dependências (se ainda não fez)
npm install

# 2. Criar .env (se não existe)
# Copie de .env.example e preencha:
cp .env.example .env

# 3. Iniciar servidor
npm run dev:api
```

**Output esperado:**
```
╔══════════════════════════════════════════╗
║  VERSO GENIUS UNIFIED API SERVER         ║
║  Version: 3.0.0                          ║
╚══════════════════════════════════════════╝

🚀 Server running on http://localhost:12345
```

---

### PASSO 3: Testar API Endpoints (5 min)

**Abrir outro terminal:**

```powershell
# Teste 1: Health Check
curl http://localhost:12345/health

# Deve retornar:
# {"status":"healthy","services":{"redis":"connected","supabase":"connected"}}
```

**Testar endpoints de monetização:**

```powershell
# Você precisa de um token válido
# Para conseguir, faça login primeiro (ou use token de teste)

# Teste 2: Ver produtos da loja
curl http://localhost:12345/api/v1/shop/products

# Teste 3: Ver loot boxes
curl http://localhost:12345/api/v1/shop/loot-boxes
```

---

## 🎯 O QUE FOI IMPLEMENTADO

### ✅ Backend Completo

1. **Database Schema** (16 tabelas)
   - user_currency
   - currency_transactions
   - user_subscriptions
   - loot_boxes
   - user_loot_box_inventory
   - cosmetics
   - user_cosmetics
   - daily_challenges
   - user_daily_challenges
   - battle_passes
   - battle_pass_tiers
   - user_battle_passes
   - referrals
   - achievements
   - crews
   - marketplace_items

2. **Services**
   - CurrencyService (add, spend, transfer, rewards)
   - ShopService (cosmetics, loot boxes, purchases)

3. **API Routes**
   - /api/v1/currency/*
   - /api/v1/shop/*

---

## 📦 PRÓXIMOS PASSOS

### Curto Prazo (Esta semana)

1. **Criar Frontend Components:**
   ```
   src/ui/components/monetization/
   ├── CurrencyDisplay.tsx
   ├── ShopModal.tsx
   ├── LootBoxOpener.tsx
   ├── DailyChallenges.tsx
   └── BattlePass.tsx
   ```

2. **Integrar Stripe:**
   ```typescript
   // src/api/services/paymentService.ts
   import Stripe from 'stripe'

   const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

   export async function createCheckoutSession(userId, productId) {
     // Create Stripe checkout
   }
   ```

3. **Deploy:**
   ```bash
   # Backend
   railway up

   # Frontend
   vercel --prod
   ```

### Médio Prazo (Próximas 2 semanas)

4. Implementar Daily Challenges Service
5. Implementar Battle Pass System
6. Implementar Achievements
7. Implementar Referral Program

### Longo Prazo (Próximo mês)

8. Leaderboards
9. Crews
10. Live Battles
11. Marketplace UGC
12. AI Feedback Premium

---

## 💰 PRODUTOS CONFIGURADOS

### Gems Packages

| Produto | Preço | Gems | Bônus |
|---------|-------|------|-------|
| Pacote Pequeno | R$ 4,90 | 50 | - |
| Pacote Médio | R$ 19,90 | 250 | +50 |
| Pacote Grande | R$ 49,90 | 700 | +200 |

### Assinaturas

| Tier | Preço/mês | Features |
|------|-----------|----------|
| **Free** | R$ 0 | 5 exercícios/dia, ads |
| **Pro** | R$ 19,90 | Ilimitado, 20 beats, sem ads |
| **Elite** | R$ 39,90 | Tudo + IA + batalhas |

### Loot Boxes

| Nome | Custo | Raridades |
|------|-------|-----------|
| Caixa Básica | 100 coins | Common 60%, Rare 25%, Epic 10%, Legendary 5% |
| Caixa Premium | 250 coins | Common 30%, Rare 40%, Epic 20%, Legendary 10% |

---

## 🧪 TESTAR FLUXO COMPLETO

### Cenário 1: Novo Usuário

1. Criar conta
2. Receber 100 coins + 10 gems iniciais
3. Ver daily challenges
4. Completar 1 challenge
5. Receber reward (coins + XP)
6. Abrir 1 loot box grátis
7. Receber recompensas aleatórias

### Cenário 2: Compra de Gems

1. Usuário clica em "Comprar Gems"
2. Seleciona pacote (ex: R$ 19,90 = 300 gems)
3. Redirect para Stripe Checkout
4. Pagamento aprovado
5. Webhook recebe confirmação
6. Gems adicionadas ao saldo
7. Usuário vê novo saldo

### Cenário 3: Compra de Cosmético

1. Usuário abre Shop
2. Vê cosmético "Moldura Ouro" (500 coins)
3. Clica em "Comprar"
4. Sistema verifica saldo (tem 600 coins)
5. Gasta 500 coins
6. Cosmético adicionado ao inventário
7. Usuário equipa moldura
8. Avatar atualizado visualmente

---

## 📊 ANALYTICS A CONFIGURAR

### Eventos a Trackear

```typescript
// Track purchase
analytics.track('Purchase Completed', {
  product_id: 'gems_250',
  price: 19.90,
  currency: 'BRL',
  gems_amount: 300
})

// Track loot box open
analytics.track('Loot Box Opened', {
  loot_box_id: 'basic_box',
  cost_coins: 100,
  rewards: [...]
})

// Track cosmetic purchase
analytics.track('Cosmetic Purchased', {
  cosmetic_id: 'frame_gold',
  rarity: 'epic',
  cost_coins: 500
})
```

---

## 🔐 SEGURANÇA

### Checklist

- [x] Server-side validation (todas compras)
- [x] Rate limiting (300 req/15min)
- [x] Currency transactions logged
- [x] Atomic operations (SQL functions)
- [ ] RLS policies (TODO: implementar)
- [ ] Webhook signature verification (Stripe)
- [ ] HTTPS only em produção

---

## 🎉 RESULTADO ESPERADO

Após completar:

1. **Usuários podem:**
   - Ver saldo de coins e gems
   - Completar desafios diários e ganhar rewards
   - Abrir loot boxes e receber itens
   - Comprar e equipar cosméticos
   - Assistir ads por coins
   - Comprar gems com dinheiro real
   - Assinar Pro ou Elite

2. **Você terá:**
   - Receita recorrente (assinaturas)
   - Receita por microtransações (gems + cosméticos)
   - Receita por ads
   - Economia virtual funcionando
   - Analytics de conversão

3. **Métricas:**
   - 5% conversão Free → Paid
   - R$ 3,00 ARPU/mês
   - R$ 6.000 MRR com 1.000 users
   - R$ 30.000 MRR com 10.000 users

---

## ⚠️ AVISOS IMPORTANTES

1. **Stripe em Produção:**
   - Usar keys de produção (não test)
   - Configurar webhook endpoint
   - Testar fluxo completo de pagamento

2. **Taxas:**
   - Stripe: 3,99% + R$ 0,39 por transação
   - PIX: 0,99%
   - Boleto: R$ 3,50 fixo

3. **Compliance:**
   - Termos de Serviço
   - Política de Reembolso
   - LGPD (armazenar dados de pagamento via Stripe)

---

✅ **Pronto para executar!**

**Comece agora:**
1. Aplicar schema no Supabase
2. `npm run dev:api`
3. Testar endpoints

**Dúvidas?** Consulte `MONETIZATION_IMPLEMENTATION_STATUS.md`
