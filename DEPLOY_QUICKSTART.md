# 🚀 Deploy Quick Start - 5 Minutos

Guia super rápido para colocar o app no ar.

---

## ✅ Opção 1: Deploy Automático (Recomendado)

### 1. Instalar CLIs

```powershell
# No PowerShell (Windows)
npm install -g vercel @railway/cli
```

### 2. Fazer Login

```powershell
# Login Railway
railway login

# Login Vercel
vercel login
```

### 3. Executar Script de Deploy

```powershell
# Windows
.\deploy.ps1

# Escolha opção 3 (Deploy Completo)
```

**Pronto!** 🎉 O script faz tudo automaticamente.

---

## ✅ Opção 2: Via GitHub (Zero CLI)

### 1. Push para GitHub

```bash
cd C:\Users\lucas\verso-genius-unified

git init
git add .
git commit -m "feat: initial commit"
git remote add origin https://github.com/SEU_USER/verso-genius-unified.git
git push -u origin main
```

### 2. Conectar Railway

1. Acesse https://railway.app/
2. **New Project** > **Deploy from GitHub repo**
3. Selecione `verso-genius-unified`
4. Railway detecta Dockerfile automaticamente
5. Adicione plugin **Redis**
6. Configure variáveis:
   ```
   SUPABASE_URL=https://cxuethubwfvqolsppfst.supabase.co
   SUPABASE_SERVICE_KEY=ey...
   NODE_ENV=production
   PORT=12345
   ```
7. Deploy automático ✅

### 3. Conectar Vercel

1. Acesse https://vercel.com/new
2. **Import Project** > GitHub > `verso-genius-unified`
3. Framework: **Vite**
4. Build Command: `npm run build:ui`
5. Output: `dist`
6. Configure variáveis:
   ```
   VITE_SUPABASE_URL=https://cxuethubwfvqolsppfst.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   VITE_API_URL=https://verso-genius-backend.railway.app
   ```
7. Deploy ✅

**Pronto!** App no ar em 5 minutos! 🚀

---

## 🔧 Configurações Importantes

### 1. Atualizar CORS (Backend)

Edite `src/api/server.ts`:

```typescript
app.use('*', cors({
  origin: [
    'https://verso-genius-unified.vercel.app',
    'https://*.vercel.app',
    'http://localhost:5173'
  ]
}))
```

Commit e push para atualizar.

### 2. Atualizar Supabase Auth URLs

Supabase Dashboard > Authentication > URL Configuration:

```
Site URL: https://verso-genius-unified.vercel.app
Redirect URLs:
  - https://verso-genius-unified.vercel.app/auth/callback
  - http://localhost:5173/auth/callback
```

### 3. Atualizar vercel.json

Substitua a URL do Railway:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://SEU-PROJETO.railway.app/api/:path*"
    }
  ]
}
```

---

## ✅ Testar Deploy

### 1. Health Check Backend

```bash
curl https://seu-projeto.railway.app/health
```

Deve retornar:
```json
{
  "status": "ok",
  "redis": "connected",
  "supabase": "connected"
}
```

### 2. Testar Frontend

Acesse: https://verso-genius-unified.vercel.app

- Deve carregar a landing page
- Clicar em "Começar" > Register
- Criar conta de teste
- Login e acessar dashboard

### 3. Testar Integração API

No navegador (DevTools Console):

```javascript
// Testar API
fetch('https://seu-projeto.railway.app/api/v1/profile', {
  headers: {
    'Authorization': 'Bearer SEU_TOKEN'
  }
})
.then(r => r.json())
.then(console.log)
```

---

## 🚨 Troubleshooting Rápido

### ❌ "Build failed" (Railway)

```bash
# Ver logs
railway logs

# Rebuild
railway up --detach
```

### ❌ "502 Bad Gateway"

- Verificar se PORT=12345 está configurado
- Verificar health check: `/health`
- Ver logs: `railway logs`

### ❌ "CORS error" (Frontend)

- Adicionar domínio Vercel no `src/api/server.ts`
- Rebuild backend: `git push`

### ❌ "Supabase auth error"

- Verificar `VITE_SUPABASE_ANON_KEY` no Vercel
- Adicionar redirect URL no Supabase Dashboard

---

## 📊 Monitoramento

### Railway

```bash
# Ver logs em tempo real
railway logs --tail

# Status
railway status

# Abrir dashboard
railway open
```

### Vercel

```bash
# Ver logs
vercel logs

# Status
vercel ls

# Abrir dashboard
vercel
```

---

## 💡 Dicas

1. **Auto-deploy:** Conecte Railway e Vercel ao GitHub para deploy automático a cada push
2. **Preview deploys:** Vercel cria preview para cada PR
3. **Rollback:** `railway rollback` ou `vercel rollback`
4. **Logs:** Sempre verifique logs em caso de erro
5. **Variáveis:** Atualize variáveis nos dashboards, não no código

---

## 📞 Suporte Rápido

- **Railway:** https://railway.app/help
- **Vercel:** https://vercel.com/support
- **Supabase:** https://supabase.com/support

---

✅ **Deploy em 5 minutos!** 🚀

Para guia completo, veja: `DEPLOYMENT_GUIDE.md`
