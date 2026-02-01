# 🚀 Deploy Automatizado - Verso Genius Unified (Windows)
# Executa: .\deploy.ps1

$ErrorActionPreference = "Stop"

Write-Host "🚀 Verso Genius Unified - Deploy Automation" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

# Functions
function Print-Success {
    param($message)
    Write-Host "✅ $message" -ForegroundColor Green
}

function Print-Error {
    param($message)
    Write-Host "❌ $message" -ForegroundColor Red
}

function Print-Info {
    param($message)
    Write-Host "📋 $message" -ForegroundColor Yellow
}

# Check command exists
function Test-Command {
    param($command)
    $exists = Get-Command $command -ErrorAction SilentlyContinue
    return $exists -ne $null
}

# ===================================
# 1. Verificações
# ===================================
Print-Info "Verificando dependências..."

if (-not (Test-Command "git")) {
    Print-Error "Git não encontrado. Instale: https://git-scm.com/download/win"
    exit 1
}

if (-not (Test-Command "node")) {
    Print-Error "Node.js não encontrado. Instale: https://nodejs.org/"
    exit 1
}

if (-not (Test-Command "npm")) {
    Print-Error "npm não encontrado"
    exit 1
}

# Check if in correct directory
if (-not (Test-Path "package.json")) {
    Print-Error "Execute este script na raiz do projeto (verso-genius-unified)"
    exit 1
}

Print-Success "Dependências OK"
Write-Host ""

# ===================================
# 2. Perguntar o que fazer
# ===================================
Write-Host "O que você deseja fazer?"
Write-Host "  1) Deploy Frontend (Vercel)"
Write-Host "  2) Deploy Backend (Railway)"
Write-Host "  3) Deploy Completo (ambos)"
Write-Host "  4) Apenas commit + push GitHub"
Write-Host "  5) Verificar status"
Write-Host "  6) Instalar CLIs (Vercel + Railway)"

$choice = Read-Host "Escolha (1-6)"
Write-Host ""

# ===================================
# 6. Instalar CLIs
# ===================================
if ($choice -eq "6") {
    Print-Info "Instalando Vercel CLI..."
    npm install -g vercel

    Print-Info "Instalando Railway CLI..."
    npm install -g @railway/cli

    Print-Success "CLIs instaladas!"
    Write-Host ""
    Write-Host "Agora você pode:"
    Write-Host "  - railway login"
    Write-Host "  - vercel login"
    exit 0
}

# ===================================
# 3. Build & Test
# ===================================
if ($choice -ne "4" -and $choice -ne "5") {
    Print-Info "Executando typecheck..."

    try {
        npm run typecheck
        Print-Success "Typecheck OK"
    }
    catch {
        Print-Error "TypeScript errors encontrados"
        exit 1
    }

    Write-Host ""
}

# ===================================
# 4. Git Commit & Push
# ===================================
if ($choice -ne "5") {
    Print-Info "Preparando commit..."

    # Check if there are changes
    $status = git status --porcelain

    if ($status) {
        git add .

        # Ask for commit message
        $commitMsg = Read-Host "📝 Mensagem do commit (Enter para default)"

        if ([string]::IsNullOrWhiteSpace($commitMsg)) {
            $commitMsg = "chore: deploy updates"
        }

        git commit -m $commitMsg
        Print-Success "Commit criado"

        # Push
        Print-Info "Pushing para GitHub..."
        try {
            git push origin main
        }
        catch {
            try {
                git push origin master
            }
            catch {
                Print-Error "Erro ao fazer push"
                exit 1
            }
        }
        Print-Success "Push concluído"
    }
    else {
        Print-Info "Nenhuma mudança para commit"
    }

    Write-Host ""
}

# ===================================
# 5. Deploy
# ===================================

switch ($choice) {
    "1" {
        Print-Info "🔵 Deploying Frontend (Vercel)..."
        Write-Host ""

        if (Test-Command "vercel") {
            vercel --prod
            Print-Success "Frontend deployed!"
        }
        else {
            Print-Error "Vercel CLI não encontrado"
            Print-Info "Instale: npm install -g vercel"
            Print-Info "Ou use: https://vercel.com/dashboard (GitHub auto-deploy)"
        }
    }

    "2" {
        Print-Info "🚂 Deploying Backend (Railway)..."
        Write-Host ""

        if (Test-Command "railway") {
            railway up
            Print-Success "Backend deployed!"

            # Show URL
            Print-Info "Obtendo URL..."
            railway domain
        }
        else {
            Print-Error "Railway CLI não encontrado"
            Print-Info "Instale: npm install -g @railway/cli"
            Print-Info "Ou use: https://railway.app/dashboard (GitHub auto-deploy)"
        }
    }

    "3" {
        Print-Info "🚀 Deploy Completo..."
        Write-Host ""

        # Backend first
        if (Test-Command "railway") {
            Print-Info "🚂 Deploying Backend..."
            railway up
            Print-Success "Backend deployed!"
        }
        else {
            Print-Error "Railway CLI não encontrado (backend skip)"
        }

        Write-Host ""

        # Frontend
        if (Test-Command "vercel") {
            Print-Info "🔵 Deploying Frontend..."
            vercel --prod
            Print-Success "Frontend deployed!"
        }
        else {
            Print-Error "Vercel CLI não encontrado (frontend skip)"
        }

        Write-Host ""
        Print-Success "Deploy completo!"
    }

    "4" {
        Print-Success "Código pushed para GitHub!"
        Print-Info "Se auto-deploy estiver ativo, aguarde Railway/Vercel fazer deploy"
    }

    "5" {
        Print-Info "📊 Status dos Deploys"
        Write-Host ""

        # Check Railway
        if (Test-Command "railway") {
            Write-Host "🚂 Railway Status:" -ForegroundColor Cyan
            try {
                railway status
            }
            catch {
                Write-Host "   (não conectado ou sem projeto)" -ForegroundColor Gray
            }
            Write-Host ""
        }

        # Check Vercel
        if (Test-Command "vercel") {
            Write-Host "🔵 Vercel Status:" -ForegroundColor Cyan
            try {
                vercel ls
            }
            catch {
                Write-Host "   (não conectado)" -ForegroundColor Gray
            }
            Write-Host ""
        }

        # Git status
        Write-Host "📦 Git Status:" -ForegroundColor Cyan
        git status --short
        Write-Host ""

        Print-Success "Status verificado"
    }

    default {
        Print-Error "Opção inválida"
        exit 1
    }
}

Write-Host ""
Write-Host "==========================================="
Print-Success "Processo concluído!"
Write-Host ""

# Show URLs
Print-Info "URLs esperadas:"
Write-Host "   Frontend: https://verso-genius-unified.vercel.app" -ForegroundColor Cyan
Write-Host "   Backend:  https://verso-genius-backend.up.railway.app" -ForegroundColor Cyan
Write-Host ""

Print-Info "Próximos passos:"
Write-Host "   1. Verifique os deploys nos dashboards"
Write-Host "   2. Teste a aplicação"
Write-Host "   3. Monitore logs se necessário"
Write-Host ""

Print-Info "Comandos úteis:"
Write-Host "   railway logs          # Ver logs do backend"
Write-Host "   vercel logs           # Ver logs do frontend"
Write-Host "   railway open          # Abrir Railway dashboard"
Write-Host "   vercel --prod         # Deploy manual frontend"
Write-Host ""
