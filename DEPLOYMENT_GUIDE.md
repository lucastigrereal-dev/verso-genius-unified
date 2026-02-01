# 🚀 Guia de Deploy - Verso Genius Unified

Deploy completo: **Vercel** (Frontend) + **Railway** (Backend + Redis)

---

## 📋 Pré-requisitos

- [x] Conta GitHub
- [x] Conta Vercel (gratuita)
- [x] Conta Railway (gratuita)
- [x] Supabase configurado (já está)
- [x] Git instalado

---

## 🎯 Arquitetura de Deploy

```
┌─────────────────────────────────────────────────┐
│  Frontend (Vercel)                              │
│  - React + Vite                                 │
│  - Static hosting                               │
│  - CDN global                                   │
│  - https://verso-genius.vercel.app              │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  Backend (Railway)                              │
│  - Hono.js API                                  │
│  - Node.js 20                                   │
│  - Docker container                             │
│  - https://verso-genius-api.railway.app         │
└─────────────────┬───────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
┌──────────────┐    ┌──────────────┐
│ Redis        │    │ Supabase     │
│ (Railway)    │    │ (Cloud)      │
└──────────────┘    └──────────────┘
```

---

## 📦 PASSO 1: Preparar Repositório GitHub

### 1.1 Criar Repositório

```bash
cd C:\Users\lucas\verso-genius-unified

# Inicializar Git (se não estiver)
git init

# Adicionar remote
git remote add origin https://github.com/SEU_USER/verso-genius-unified.git

# Commit inicial
git add .
git commit -m "feat: initial commit - verso genius unified v3.0"
git branch -M main
git push -u origin main
```

### 1.2 Criar .gitignore

Verificar se `.gitignore` está correto:

```gitignore
# Dependencies
node_modules/
.pnp
.pnp.js

# Production
dist/
build/
out/

# Environment
.env
.env.local
.env.*.local

# Logs
*.log
npm-debug.log*

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp

# Testing
coverage/

# Misc
.next/
.cache/
```

---

## 🚂 PASSO 2: Deploy Backend (Railway)

### 2.1 Instalar Railway CLI

```bash
# Windows (PowerShell)
iwr https://railway.app/install.ps1 | iex

# Ou via npm
npm install -g @railway/cli
```

### 2.2 Login Railway

```bash
railway login
```

### 2.3 Criar Projeto

```bash
cd C:\Users\lucas\verso-genius-unified

# Inicializar Railway
railway init

# Nome do projeto: verso-genius-backend
```

### 2.4 Adicionar Redis

```bash
# Adicionar plugin Redis
railway add --plugin redis

# Railway vai criar automaticamente:
# - REDIS_URL
# - REDIS_HOST
# - REDIS_PORT
```

### 2.5 Configurar Variáveis de Ambiente

```bash
railway variables set SUPABASE_URL="https://cxuethubwfvqolsppfst.supabase.co"
railway variables set SUPABASE_SERVICE_KEY="eyJhbGciOi..."
railway variables set OPENAI_API_KEY="sk-proj-..."
railway variables set NODE_ENV="production"
railway variables set PORT="12345"
```

**Ou via Railway Dashboard:**
1. Acesse https://railway.app/dashboard
2. Selecione o projeto `verso-genius-backend`
3. Aba **Variables**
4. Adicionar cada variável

### 2.6 Deploy

```bash
# Deploy via CLI
railway up

# Ou conectar ao GitHub
# 1. Railway Dashboard > Settings > Connect to GitHub
# 2. Selecionar repo verso-genius-unified
# 3. Auto-deploy on push
```

### 2.7 Verificar Deploy

```bash
# Ver logs
railway logs

# Obter URL
railway domain

# Exemplo: https://verso-genius-backend.up.railway.app
```

### 2.8 Testar API

```bash
# Health check
curl https://verso-genius-backend.up.railway.app/health

# Deve retornar:
# {"status":"ok","timestamp":"...","redis":"connected","supabase":"connected"}
```

---

## ▲ PASSO 3: Deploy Frontend (Vercel)

### 3.1 Instalar Vercel CLI

```bash
npm install -g vercel
```

### 3.2 Login Vercel

```bash
vercel login
```

### 3.3 Conectar ao GitHub

**Recomendado:** Usar Vercel Dashboard para importar do GitHub

1. Acesse https://vercel.com/new
2. **Import Git Repository**
3. Selecione `verso-genius-unified`
4. **Framework Preset:** Vite
5. **Root Directory:** `./` (raiz)
6. **Build Command:** `npm run build:ui`
7. **Output Directory:** `dist`

### 3.4 Configurar Variáveis de Ambiente

No Vercel Dashboard > Settings > Environment Variables:

```env
# Supabase (público)
VITE_SUPABASE_URL=https://cxuethubwfvqolsppfst.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# API Backend (Railway URL)
VITE_API_URL=https://verso-genius-backend.up.railway.app

# Opcional
VITE_ENABLE_ANALYTICS=true
```

### 3.5 Atualizar vercel.json

Edite `vercel.json` e substitua a URL do backend:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://verso-genius-backend.up.railway.app/api/:path*"
    }
  ]
}
```

### 3.6 Deploy

```bash
cd C:\Users\lucas\verso-genius-unified

# Deploy
vercel --prod

# Ou via GitHub (auto-deploy)
git push origin main
```

### 3.7 Verificar Deploy

Acesse: https://verso-genius-unified.vercel.app

---

## 🔧 PASSO 4: Configurações Finais

### 4.1 CORS no Backend

Verificar que `src/api/server.ts` permite o domínio Vercel:

```typescript
app.use('*', cors({
  origin: [
    'http://localhost:5173',
    'https://verso-genius-unified.vercel.app',
    'https://*.vercel.app'
  ],
  credentials: true
}))
```

### 4.2 Supabase Auth URLs

No Supabase Dashboard > Authentication > URL Configuration:

```
Site URL: https://verso-genius-unified.vercel.app
Redirect URLs:
  - https://verso-genius-unified.vercel.app/auth/callback
  - http://localhost:5173/auth/callback (dev)
```

### 4.3 Domínio Customizado (Opcional)

**Vercel:**
1. Settings > Domains
2. Adicionar `versogenius.com.br`
3. Seguir instruções de DNS

**Railway:**
1. Settings > Networking > Custom Domain
2. Adicionar `api.versogenius.com.br`

---

## 🧪 PASSO 5: Testar Integração Completa

### 5.1 Health Checks

```bash
# Backend
curl https://verso-genius-backend.up.railway.app/health

# Frontend (deve carregar)
curl https://verso-genius-unified.vercel.app
```

### 5.2 Fluxo Completo

1. Acesse https://verso-genius-unified.vercel.app
2. Crie uma conta
3. Faça login
4. Navegue para Dashboard
5. Teste um exercício
6. Verifique se XP é atualizado
7. Teste gerador de rimas (se integrado)

### 5.3 Monitoramento

**Railway Logs:**
```bash
railway logs --tail
```

**Vercel Logs:**
- Dashboard > Logs
- Ou: `vercel logs`

---

## 📊 PASSO 6: Métricas e Monitoramento

### 6.1 Railway Metrics

- CPU Usage
- Memory Usage
- Network I/O
- Redis Connection Pool

### 6.2 Vercel Analytics

Ativar em: Settings > Analytics

### 6.3 Supabase Monitoring

- Dashboard > Database > Connection Pooling
- Monitorar queries lentas

---

## 🔐 Segurança

### Checklist de Segurança

- [x] Service keys NÃO commitadas no GitHub
- [x] HTTPS em ambos (Vercel + Railway)
- [x] CORS configurado corretamente
- [x] Rate limiting ativo (Redis)
- [x] Row Level Security (Supabase)
- [x] JWT com expiração
- [x] Headers de segurança (vercel.json)

---

## 💰 Custos Estimados

| Serviço | Plano | Custo/mês |
|---------|-------|-----------|
| **Vercel** | Hobby | $0 |
| **Railway** | Free Tier | $0 (500h) |
| **Railway Redis** | Incluído | $0 |
| **Supabase** | Free Tier | $0 |
| **Total** | | **$0/mês** 🎉 |

**Limites Free Tier:**
- Vercel: 100GB bandwidth, 100 builds/month
- Railway: 500h/month (suficiente para 1 projeto)
- Supabase: 500MB database, 1GB file storage

---

## 🚨 Troubleshooting

### Erro: "Build failed"

```bash
# Verificar logs
railway logs

# Rebuild
railway up --detach

# Forçar rebuild
railway up --force
```

### Erro: "Redis connection failed"

```bash
# Verificar variáveis
railway variables

# Reiniciar Redis
railway restart --service redis
```

### Erro: "CORS blocked"

- Verificar `src/api/server.ts` > origem permitida
- Adicionar URL Vercel na whitelist
- Rebuild backend: `railway up`

### Erro: "502 Bad Gateway"

- Railway: Verificar se `PORT` está correto (12345)
- Verificar health check: `/health` retorna 200
- Ver logs: `railway logs`

---

## 🎯 Scripts Úteis

### Deploy Rápido (após setup inicial)

```bash
# Backend (Railway via GitHub)
git add .
git commit -m "feat: update backend"
git push origin main
# Auto-deploy ativado ✅

# Frontend (Vercel via GitHub)
git push origin main
# Auto-deploy ativado ✅
```

### Rollback

```bash
# Railway
railway rollback

# Vercel
vercel rollback
```

### Ver Variáveis

```bash
# Railway
railway variables

# Vercel
vercel env ls
```

---

## ✅ Checklist de Deploy

- [ ] GitHub repo criado e pushed
- [ ] Railway projeto criado
- [ ] Railway Redis adicionado
- [ ] Railway variáveis configuradas
- [ ] Railway deploy concluído (backend rodando)
- [ ] Vercel projeto importado
- [ ] Vercel variáveis configuradas
- [ ] Vercel deploy concluído (frontend rodando)
- [ ] CORS configurado
- [ ] Supabase Auth URLs atualizadas
- [ ] Health checks passando
- [ ] Login/Register funcionando
- [ ] API integração testada
- [ ] Domínio customizado (opcional)

---

## 📞 Suporte

**Railway:** https://railway.app/help
**Vercel:** https://vercel.com/support
**Supabase:** https://supabase.com/support

---

✅ **Deploy Completo!** Seu app está no ar! 🚀
