# 🚀 GUIA DE DEPLOY - Verso Genius Unified

## 📋 PRÉ-REQUISITOS

Antes de iniciar, você precisa ter:

- ✅ Conta no [Supabase](https://supabase.com) (free tier ok)
- ✅ Conta no [Railway](https://railway.app) (trial de $5 grátis)
- ✅ Conta no [Vercel](https://vercel.com) (free tier ok)
- ✅ Conta no [Stripe](https://stripe.com) (modo teste grátis)
- ✅ Conta no [Upstash](https://upstash.com) (Redis free tier)

---

## PASSO 1: SETUP SUPABASE (15 min)

### 1.1 Criar Projeto

1. Acesse https://supabase.com/dashboard
2. Clique em **"New Project"**
3. Preencha:
   - **Name:** verso-genius-prod
   - **Database Password:** (anote em local seguro!)
   - **Region:** South America (São Paulo)
4. Aguarde ~2 minutos para provisionar

### 1.2 Aplicar Migrations

1. No dashboard do Supabase, vá em **SQL Editor** (ícone `</>` na sidebar)
2. Clique em **"New Query"**
3. Abra cada arquivo de migration e execute **NA ORDEM**:

**Migration 1:** `database/supabase/migrations/002_monetization_schema.sql`
- Copie TODO o conteúdo
- Cole no SQL Editor
- Clique em **"Run"**
- ✅ Deve retornar "Success. No rows returned"

**Migration 2:** `database/supabase/migrations/003_streaks_table.sql`
- Mesmo processo

**Migration 3:** `database/supabase/migrations/004_crews_system.sql`
- Mesmo processo

**Migration 4:** `database/supabase/migrations/005_events_system.sql`
- Mesmo processo

**Migration 5:** `database/supabase/migrations/006_marketplace_system.sql`
- Mesmo processo

### 1.3 Verificar Tabelas

1. Vá em **Table Editor** (ícone de tabela na sidebar)
2. Verifique se as seguintes tabelas foram criadas:
   - ✅ user_currencies
   - ✅ cosmetics
   - ✅ user_cosmetics
   - ✅ loot_boxes
   - ✅ battle_passes
   - ✅ achievements
   - ✅ user_achievements
   - ✅ daily_challenges
   - ✅ referrals
   - ✅ daily_rewards
   - ✅ gem_packages
   - ✅ leaderboard_cache
   - ✅ user_streaks
   - ✅ crews
   - ✅ crew_members
   - ✅ crew_invites
   - ✅ crew_chat_messages
   - ✅ events
   - ✅ event_objectives
   - ✅ user_event_progress
   - ✅ event_leaderboard
   - ✅ marketplace_listings
   - ✅ marketplace_transactions
   - ✅ marketplace_offers

**Total esperado:** 28 tabelas

### 1.4 Copiar Credenciais

1. Vá em **Settings** → **API**
2. Copie e anote:
   - **Project URL:** `https://xxxxx.supabase.co`
   - **anon public key:** `eyJhbGc...` (começa com eyJ)
   - **service_role key:** `eyJhbGc...` (diferente da anon!)

---

## PASSO 2: SETUP STRIPE (10 min)

### 2.1 Criar Produtos

1. Acesse https://dashboard.stripe.com/test/products
2. Clique em **"Add Product"**

**Criar 3 produtos:**

**Produto 1: Assinatura Pro**
- Name: `Verso Genius Pro`
- Description: `Assinatura mensal com +50% XP e sem anúncios`
- Price: `R$ 19.90` / month
- Copie o **Price ID** (começa com `price_`)

**Produto 2: Assinatura Elite**
- Name: `Verso Genius Elite`
- Description: `Assinatura mensal com +100% XP, sem anúncios e 200 gems/mês`
- Price: `R$ 39.90` / month
- Copie o **Price ID**

**Produto 3: Battle Pass**
- Name: `Battle Pass Premium`
- Description: `Acesso a recompensas premium do Battle Pass`
- Price: `R$ 9.90` (one-time payment)
- Copie o **Price ID**

### 2.2 Copiar API Keys

1. Vá em **Developers** → **API Keys**
2. Copie:
   - **Publishable key:** `pk_test_...`
   - **Secret key:** `sk_test_...` (clique em "Reveal")

### 2.3 Webhook (fazer depois do deploy Railway)

⚠️ **NÃO FAÇA AGORA** - Faremos no Passo 5 após deploy

---

## PASSO 3: SETUP UPSTASH REDIS (5 min)

### 3.1 Criar Database

1. Acesse https://console.upstash.com/redis
2. Clique em **"Create Database"**
3. Preencha:
   - **Name:** verso-genius-cache
   - **Type:** Regional
   - **Region:** São Paulo (sa-east-1)
4. Clique em **"Create"**

### 3.2 Copiar Credenciais

1. Na página do database criado, vá em **Details**
2. Copie:
   - **Endpoint:** `xxx.upstash.io`
   - **Port:** `6379`
   - **Password:** (clique em "Show" e copie)

---

## PASSO 4: DEPLOY BACKEND (RAILWAY) (10 min)

### 4.1 Criar Projeto Railway

1. Acesse https://railway.app/new
2. Clique em **"Deploy from GitHub repo"**
3. Conecte sua conta GitHub
4. Selecione o repositório: `verso-genius-unified`
5. Railway irá detectar automaticamente

### 4.2 Configurar Variáveis de Ambiente

1. No dashboard do Railway, clique no serviço criado
2. Vá em **Variables**
3. Clique em **"Raw Editor"**
4. Cole as seguintes variáveis (substitua pelos valores reais):

```env
NODE_ENV=production
PORT=3000

# Supabase (cole os valores do Passo 1.4)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...

# Stripe (cole os valores do Passo 2.2)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Stripe Price IDs (cole os valores do Passo 2.1)
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_ELITE=price_...
STRIPE_PRICE_BATTLE_PASS=price_...

# Redis (cole os valores do Passo 3.2)
REDIS_HOST=xxx.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=xxx

# Outros
FRONTEND_URL=https://verso-genius.vercel.app
```

5. Clique em **"Update Variables"**

### 4.3 Deploy

1. Railway irá fazer deploy automaticamente
2. Aguarde ~2-3 minutos
3. Quando o status ficar **"Active"**, clique em **"Settings"**
4. Em **"Domains"**, clique em **"Generate Domain"**
5. Copie a URL gerada: `https://verso-genius-production.up.railway.app`

### 4.4 Testar API

Abra o terminal e teste:

```bash
curl https://verso-genius-production.up.railway.app/health
```

✅ Deve retornar: `{"status":"ok","timestamp":"..."}`

---

## PASSO 5: CONFIGURAR STRIPE WEBHOOK (5 min)

### 5.1 Criar Webhook Endpoint

1. Volte ao Stripe Dashboard: https://dashboard.stripe.com/test/webhooks
2. Clique em **"Add endpoint"**
3. Preencha:
   - **Endpoint URL:** `https://verso-genius-production.up.railway.app/api/v1/webhooks/stripe`
   - **Description:** Verso Genius Backend
4. Em **"Select events to listen to"**, escolha:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.paid`
   - ✅ `invoice.payment_failed`
5. Clique em **"Add endpoint"**

### 5.2 Copiar Webhook Secret

1. Na página do webhook criado, clique em **"Reveal"** no campo **Signing secret**
2. Copie o valor (começa com `whsec_`)
3. Volte ao Railway → Variables
4. Adicione a variável:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```
5. Railway irá redeploy automaticamente

---

## PASSO 6: DEPLOY FRONTEND (VERCEL) (5 min)

### 6.1 Criar Projeto Vercel

1. Acesse https://vercel.com/new
2. Clique em **"Import Git Repository"**
3. Conecte sua conta GitHub
4. Selecione o repositório: `verso-genius-unified`
5. Preencha:
   - **Framework Preset:** Vite
   - **Root Directory:** `./` (deixe vazio)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

### 6.2 Configurar Variáveis de Ambiente

1. Em **"Environment Variables"**, adicione:

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_API_URL=https://verso-genius-production.up.railway.app
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

2. Clique em **"Deploy"**

### 6.3 Deploy

1. Vercel irá fazer build e deploy (~2-3 min)
2. Quando finalizar, copie a URL: `https://verso-genius.vercel.app`

### 6.4 Configurar Domínio Customizado (Opcional)

Se você tem um domínio:

1. Vá em **Settings** → **Domains**
2. Adicione seu domínio (ex: `app.versogenius.com`)
3. Siga as instruções para configurar DNS

---

## PASSO 7: ATUALIZAR VARIÁVEIS (5 min)

### 7.1 Atualizar Railway

Agora que temos a URL do Vercel, atualize a variável no Railway:

1. Railway → Variables
2. Edite `FRONTEND_URL` para a URL real:
   ```
   FRONTEND_URL=https://verso-genius.vercel.app
   ```

### 7.2 Atualizar Supabase (URLs permitidas)

1. Supabase Dashboard → **Authentication** → **URL Configuration**
2. Em **Site URL**, cole: `https://verso-genius.vercel.app`
3. Em **Redirect URLs**, adicione:
   ```
   https://verso-genius.vercel.app
   https://verso-genius.vercel.app/auth/callback
   http://localhost:5173
   http://localhost:5173/auth/callback
   ```
4. Clique em **"Save"**

---

## PASSO 8: TESTE COMPLETO (30 min)

### 8.1 Criar Conta

1. Acesse `https://verso-genius.vercel.app`
2. Clique em **"Criar Conta"**
3. Preencha:
   - Username: `testuser`
   - Email: `seu-email@gmail.com`
   - Password: `Test1234!`
4. Confirme email (verifique inbox)
5. Faça login

### 8.2 Testar Funcionalidades Core

**Teste 1: Dashboard**
- ✅ Deve carregar dashboard com XP bar
- ✅ Deve mostrar level atual
- ✅ Deve mostrar streak indicator

**Teste 2: Daily Check-in**
- ✅ Clique no ícone de streak
- ✅ Faça check-in diário
- ✅ Verifique se ganhou coins

**Teste 3: Loja de Gems**
- ✅ Vá em "Loja"
- ✅ Clique em um pacote de gems
- ✅ Stripe checkout deve abrir
- ⚠️ **NÃO COMPLETE A COMPRA** (a menos que queira gastar $ real)
- ✅ Use o cartão de teste do Stripe:
  - Number: `4242 4242 4242 4242`
  - Expiry: `12/34`
  - CVC: `123`
- ✅ Complete a compra
- ✅ Verifique se gems foram creditadas

**Teste 4: Loot Box**
- ✅ Vá em "Loot Boxes"
- ✅ Abra uma caixa (se tiver coins)
- ✅ Animação deve aparecer
- ✅ Cosmético deve ser adicionado ao inventário

**Teste 5: Leaderboard**
- ✅ Vá em "Leaderboard"
- ✅ Verifique se carrega rankings
- ✅ Seu usuário deve aparecer na lista

**Teste 6: Crews**
- ✅ Vá em "Crews"
- ✅ Crie uma crew (nome, tag, descrição)
- ✅ Verifique se aparece na lista
- ✅ Abra o chat da crew
- ✅ Envie uma mensagem

**Teste 7: Events**
- ✅ Vá em "Events"
- ✅ Participe de um evento
- ✅ Verifique se progresso é registrado

**Teste 8: Marketplace**
- ✅ Vá em "Marketplace"
- ✅ Liste um cosmético para venda
- ✅ Verifique se aparece na lista

### 8.3 Verificar Logs

**Railway Logs:**
1. Railway → Seu serviço → **Deployments**
2. Clique no deployment ativo
3. Vá em **View Logs**
4. ✅ NÃO deve ter erros 500
5. ✅ Logs devem mostrar requisições sendo processadas

**Vercel Logs:**
1. Vercel → Seu projeto → **Deployments**
2. Clique no deployment ativo
3. Vá em **Function Logs**
4. ✅ NÃO deve ter erros

---

## PASSO 9: MONITORAMENTO (Opcional)

### 9.1 Setup Sentry (Error Tracking)

1. Crie conta em https://sentry.io
2. Crie novo projeto (React + Node.js)
3. Adicione DSN nas env vars:
   ```
   VITE_SENTRY_DSN=https://xxx@sentry.io/xxx
   SENTRY_DSN=https://xxx@sentry.io/xxx
   ```

### 9.2 Setup Upstash (Redis Monitoring)

1. Upstash Console → Seu database → **Metrics**
2. Monitore:
   - Commands/sec
   - Memory usage
   - Hit rate

---

## 🎉 DEPLOY COMPLETO!

Seu app está no ar em:

- **Frontend:** https://verso-genius.vercel.app
- **Backend:** https://verso-genius-production.up.railway.app
- **Database:** Supabase (28 tabelas)
- **Cache:** Upstash Redis
- **Payments:** Stripe

---

## 📊 PRÓXIMOS PASSOS

### Curto Prazo (1 semana)

1. **Criar dados seed:**
   - Popular cosmetics table com cosméticos iniciais
   - Criar eventos temporários
   - Configurar daily challenges

2. **Marketing:**
   - Landing page
   - Social media (Instagram, TikTok)
   - Comunidade Discord/Telegram

3. **Onboarding:**
   - Tutorial interativo
   - Welcome rewards (50 coins, 5 gems)

### Médio Prazo (1 mês)

4. **Analytics:**
   - Google Analytics
   - Mixpanel/Amplitude
   - Funnel de conversão

5. **Otimizações:**
   - SEO (meta tags, sitemap)
   - Performance (lazy loading, code splitting)
   - PWA (service worker, offline mode)

6. **Features Adicionais:**
   - Sistema de amizades
   - Batalhas em tempo real
   - Sistema de badges

### Longo Prazo (3 meses)

7. **Escala:**
   - CDN (Cloudflare)
   - Database read replicas
   - Horizontal scaling (Railway)

8. **Monetização Avançada:**
   - Gacha system completo
   - NFT integration (opcional)
   - Affiliate program

---

## 🆘 TROUBLESHOOTING

### "Cannot connect to Supabase"

**Solução:**
- Verifique se SUPABASE_URL está correto (deve incluir https://)
- Verifique se SUPABASE_ANON_KEY está correto
- Teste a conexão: `curl https://xxxxx.supabase.co/rest/v1/`

### "Stripe webhook failed"

**Solução:**
- Verifique se STRIPE_WEBHOOK_SECRET está correto
- Teste o endpoint: `curl -X POST https://your-api.railway.app/api/v1/webhooks/stripe`
- Veja logs do Railway para detalhes do erro

### "Redis connection timeout"

**Solução:**
- Verifique se REDIS_HOST, REDIS_PORT, REDIS_PASSWORD estão corretos
- Teste conexão via Upstash Console → **CLI**
- Verifique se IP do Railway está permitido (Upstash permite todos por padrão)

### "Build failed on Vercel"

**Solução:**
- Verifique se todas as VITE_ env vars foram adicionadas
- Rode `npm run build` localmente para reproduzir o erro
- Veja logs completos em Vercel → Deployment → **Build Logs**

### "502 Bad Gateway no Railway"

**Solução:**
- Verifique se PORT=3000 está nas env vars
- Verifique se server.ts usa `process.env.PORT`
- Veja logs: Railway → Deployments → **View Logs**

---

## 📞 SUPORTE

Se encontrar problemas:

1. **Logs Railway:** https://railway.app/project/xxx/deployments
2. **Logs Vercel:** https://vercel.com/xxx/deployments
3. **Supabase Logs:** Dashboard → Project → Logs
4. **Stripe Events:** Dashboard → Developers → Events

---

## ✅ CHECKLIST FINAL

Antes de considerar o deploy completo, verifique:

### Database
- [ ] 28 tabelas criadas no Supabase
- [ ] RLS policies ativas
- [ ] Índices criados
- [ ] Triggers funcionando

### Backend (Railway)
- [ ] Deploy ativo (status: Active)
- [ ] Health check respondendo (`/health`)
- [ ] Todas env vars configuradas (13 variáveis)
- [ ] Logs sem erros 500
- [ ] Stripe webhook configurado

### Frontend (Vercel)
- [ ] Deploy ativo
- [ ] Build sucesso (dist/ gerado)
- [ ] Todas VITE_ env vars configuradas (4 variáveis)
- [ ] App carrega sem erros no console

### Integrações
- [ ] Supabase Auth funcionando (login/register)
- [ ] Stripe checkout funcionando (teste com cartão fake)
- [ ] Redis cache ativo (leaderboard loading < 200ms)
- [ ] Webhooks Stripe recebendo eventos

### Testes E2E
- [ ] Criar conta → Login → Dashboard
- [ ] Comprar gems (teste) → Ver saldo atualizado
- [ ] Abrir loot box → Receber cosmético
- [ ] Fazer check-in diário → Ganhar coins
- [ ] Criar crew → Enviar mensagem no chat
- [ ] Participar de evento → Ver progresso

---

**Tempo total estimado:** 1h 30min

**Custo mensal (1k users):**
- Railway: ~$10/mês (trial $5 grátis)
- Vercel: $0 (free tier)
- Supabase: $0 (free tier até 500MB)
- Upstash Redis: $0 (free tier 10k commands/day)
- Stripe: 0% (modo teste), 2.9% + R$0.30 (produção)

**TOTAL: ~$10/mês** (após trial, $5/mês nos primeiros 30 dias)

---

🚀 **BOA SORTE COM O LAUNCH!**
