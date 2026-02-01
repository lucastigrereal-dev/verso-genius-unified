# 🚀 Deploy Manual - Passo a Passo

Execute estes comandos um por um.

---

## PASSO 1: Instalar CLIs

```powershell
# Instalar Vercel CLI
npm install -g vercel

# Instalar Railway CLI
npm install -g @railway/cli
```

---

## PASSO 2: Preparar Git

```powershell
cd C:\Users\lucas\verso-genius-unified

# Adicionar tudo
git add .

# Commit
git commit -m "feat: verso genius unified v3.0 - ready for deploy"

# Criar repo no GitHub e adicionar remote
# git remote add origin https://github.com/SEU_USER/verso-genius-unified.git
# git push -u origin main
```

---

## PASSO 3: Deploy Backend (Railway)

```powershell
# Login
railway login

# Criar projeto
railway init

# Adicionar Redis
railway add

# Configurar variáveis
railway variables set SUPABASE_URL="https://cxuethubwfvqolsppfst.supabase.co"
railway variables set SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWV0aHVid2Z2cW9sc3BwZnN0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTk1MjM1NCwiZXhwIjoyMDg1NTI4MzU0fQ.exKab4S_Ge760AqfkZNS2mKTYNwPsBC1QmknoUk_giQ"
railway variables set NODE_ENV="production"
railway variables set PORT="12345"

# Deploy
railway up

# Ver URL
railway domain
```

---

## PASSO 4: Deploy Frontend (Vercel)

```powershell
# Login
vercel login

# Deploy
vercel --prod

# Quando perguntar:
# - Set up and deploy? Yes
# - Which scope? Seu username
# - Link to existing project? No
# - Project name? verso-genius-unified
# - Directory? ./
# - Override settings? No
```

---

## PASSO 5: Configurar Variáveis Vercel

No dashboard Vercel (https://vercel.com):

1. Selecione o projeto `verso-genius-unified`
2. Settings > Environment Variables
3. Adicione:
   ```
   VITE_SUPABASE_URL = https://cxuethubwfvqolsppfst.supabase.co
   VITE_SUPABASE_ANON_KEY = (pegar no Supabase Dashboard > Project Settings > API > anon public)
   VITE_API_URL = (URL do Railway que você obteve)
   ```
4. Redeploy: Deployments > Latest > Redeploy

---

## PASSO 6: Testar

```powershell
# Backend health
curl https://seu-projeto.railway.app/health

# Frontend (abrir no navegador)
# https://verso-genius-unified.vercel.app
```

---

✅ Deploy concluído!
