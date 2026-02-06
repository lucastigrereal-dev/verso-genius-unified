# 🚀 EXECUTAR DEPLOY AGORA

✅ Git preparado: Commit criado
✅ Railway CLI: Instalado
✅ Vercel CLI: Instalado

---

## 📍 VOCÊ ESTÁ AQUI

Execute os comandos abaixo NA ORDEM.

---

## PASSO 1: GitHub (OPCIONAL mas recomendado)

Se quiser backup e auto-deploy:

```bash
# 1. Criar repo no GitHub: https://github.com/new
#    Nome: verso-genius-unified
#    Público ou Privado

# 2. Adicionar remote (substitua SEU_USER)
git remote add origin https://github.com/SEU_USER/verso-genius-unified.git

# 3. Push
git push -u origin master
```

**OU pule para o Passo 2 se não quiser GitHub agora**

---

## PASSO 2: Deploy Backend (Railway)

Abra um **PowerShell** ou **Terminal** e execute:

### 2.1 Login Railway

```bash
railway login
```

Uma janela do navegador abrirá. Faça login com:
- GitHub
- Ou Email

### 2.2 Criar Projeto Railway

```bash
cd C:\Users\lucas\verso-genius-unified
railway init
```

Quando perguntar:
- **Project name?** verso-genius-backend
- **Empty project or starter?** Empty project

### 2.3 Adicionar Redis

```bash
railway add
```

Selecione: **Redis**

### 2.4 Configurar Variáveis

```bash
railway variables set SUPABASE_URL="https://cxuethubwfvqolsppfst.supabase.co"

railway variables set SUPABASE_SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWV0aHVid2Z2cW9sc3BwZnN0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTk1MjM1NCwiZXhwIjoyMDg1NTI4MzU0fQ.exKab4S_Ge760AqfkZNS2mKTYNwPsBC1QmknoUk_giQ"

railway variables set NODE_ENV="production"

railway variables set PORT="12345"
```

Se tiver OpenAI:
```bash
railway variables set OPENAI_API_KEY="sk-proj-SEU_KEY_AQUI"
```

### 2.5 Deploy Backend

```bash
railway up
```

Aguarde 2-3 minutos. Você verá:
```
✓ Build successful
✓ Deployment successful
```

### 2.6 Obter URL do Backend

```bash
railway domain
```

**ANOTE ESTA URL!** Exemplo: `https://verso-genius-backend-production.up.railway.app`

### 2.7 Testar Backend

```bash
# Substitua pela sua URL
curl https://sua-url-railway.app/health
```

Deve retornar:
```json
{"status":"ok","timestamp":"..."}
```

---

## PASSO 3: Deploy Frontend (Vercel)

### 3.1 Login Vercel

```bash
vercel login
```

Escolha o método de login:
- GitHub (recomendado)
- Email

### 3.2 Deploy Vercel

```bash
cd C:\Users\lucas\verso-genius-unified
vercel --prod
```

Responda as perguntas:
- **Set up and deploy?** `Y` (Yes)
- **Which scope?** Escolha seu username
- **Link to existing project?** `N` (No)
- **What's your project's name?** `verso-genius-unified`
- **In which directory?** `.` (Enter para raiz)
- **Want to override settings?** `N` (No)

Aguarde 1-2 minutos.

### 3.3 URL do Frontend

Vercel mostrará:
```
✓ Production: https://verso-genius-unified.vercel.app
```

**ANOTE ESTA URL!**

---

## PASSO 4: Configurar Variáveis Vercel

### Via CLI (Rápido):

Pegue o ANON KEY do Supabase:
1. https://supabase.com/dashboard
2. Project: cxuethubwfvqolsppfst
3. Settings > API
4. Copie: `anon` `public` key (NÃO o service_role!)

```bash
# Substitua ANON_KEY pela chave que você copiou
vercel env add VITE_SUPABASE_URL production
# Cole: https://cxuethubwfvqolsppfst.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY production
# Cole: eyJhbGciOi... (anon key)

vercel env add VITE_API_URL production
# Cole: https://sua-url-railway.app
```

### Ou Via Dashboard (Alternativo):

1. Acesse https://vercel.com/dashboard
2. Selecione: `verso-genius-unified`
3. Settings > Environment Variables
4. Add New:
   - `VITE_SUPABASE_URL` = `https://cxuethubwfvqolsppfst.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `(anon key do Supabase)`
   - `VITE_API_URL` = `(URL do Railway)`
5. Save

### 4.1 Redeploy Frontend

```bash
vercel --prod
```

---

## PASSO 5: Atualizar Configurações

### 5.1 Atualizar CORS no Backend

Edite `src/api/server.ts`:

```typescript
app.use('*', cors({
  origin: [
    'https://verso-genius-unified.vercel.app',
    'https://*.vercel.app',
    'http://localhost:5173'
  ],
  credentials: true
}))
```

Commit e push:
```bash
git add src/api/server.ts
git commit -m "fix: update CORS for Vercel"
railway up
```

### 5.2 Atualizar Supabase Auth URLs

1. https://supabase.com/dashboard
2. Project: cxuethubwfvqolsppfst
3. Authentication > URL Configuration
4. Adicionar:
   - **Site URL:** `https://verso-genius-unified.vercel.app`
   - **Redirect URLs:**
     - `https://verso-genius-unified.vercel.app/auth/callback`
     - `http://localhost:5173/auth/callback`
5. Save

---

## PASSO 6: Testar Tudo

### 6.1 Backend

```bash
curl https://sua-url-railway.app/health
```

Deve retornar: `{"status":"ok"}`

### 6.2 Frontend

Abra no navegador:
```
https://verso-genius-unified.vercel.app
```

Deve carregar a landing page.

### 6.3 Criar Conta de Teste

1. Acesse o site
2. Clique em "Começar" ou "Registrar"
3. Crie uma conta
4. Faça login
5. Navegue pelo dashboard

Se funcionar = **DEPLOY COMPLETO!** 🎉

---

## 🚨 Troubleshooting

### Backend não responde

```bash
# Ver logs
railway logs

# Status
railway status

# Restart
railway restart
```

### Frontend não carrega

```bash
# Ver logs
vercel logs

# Redeploy
vercel --prod
```

### CORS Error

- Verifique se URL Vercel está no CORS (`src/api/server.ts`)
- Faça `railway up` após atualizar

### Auth não funciona

- Verifique Redirect URLs no Supabase
- Verifique `VITE_SUPABASE_ANON_KEY` (deve ser ANON, não SERVICE)

---

## ✅ Checklist Final

- [ ] Railway login OK
- [ ] Railway projeto criado
- [ ] Railway Redis adicionado
- [ ] Railway variáveis configuradas
- [ ] Railway deploy concluído
- [ ] Railway URL anotada
- [ ] Railway health check OK
- [ ] Vercel login OK
- [ ] Vercel deploy concluído
- [ ] Vercel URL anotada
- [ ] Vercel variáveis configuradas
- [ ] Vercel redeploy OK
- [ ] CORS atualizado
- [ ] Supabase Auth URLs configuradas
- [ ] Teste E2E (criar conta + login) OK

---

## 📞 Próximos Passos

Após deploy bem-sucedido:

1. **Domínio customizado** (opcional)
   - Vercel: Settings > Domains
   - Railway: Settings > Networking

2. **Monitoramento**
   - Railway: Dashboard > Metrics
   - Vercel: Dashboard > Analytics

3. **CI/CD** (se usou GitHub)
   - Cada push = auto-deploy
   - Pull Requests = preview deploy

---

## 🎯 URLs Finais

Anote aqui suas URLs:

- **Backend:** https://_____________________.railway.app
- **Frontend:** https://_____________________.vercel.app

---

✅ **Pronto para executar!**

Comece pelo Passo 2 (Railway login).
