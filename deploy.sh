#!/bin/bash
# 🚀 Deploy Automatizado - Verso Genius Unified
# Executa: bash deploy.sh

set -e

echo "🚀 Verso Genius Unified - Deploy Automation"
echo "==========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}📋 $1${NC}"
}

# Check if commands exist
check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "$1 não encontrado. Instale: npm install -g $1"
        exit 1
    fi
}

# ===================================
# 1. Verificações
# ===================================
print_info "Verificando dependências..."

check_command "git"
check_command "node"
check_command "npm"

# Check if in correct directory
if [ ! -f "package.json" ]; then
    print_error "Execute este script na raiz do projeto (verso-genius-unified)"
    exit 1
fi

print_success "Dependências OK"
echo ""

# ===================================
# 2. Perguntar o que fazer
# ===================================
echo "O que você deseja fazer?"
echo "  1) Deploy Frontend (Vercel)"
echo "  2) Deploy Backend (Railway)"
echo "  3) Deploy Completo (ambos)"
echo "  4) Apenas commit + push GitHub"
echo "  5) Verificar status"
read -p "Escolha (1-5): " CHOICE
echo ""

# ===================================
# 3. Build & Test
# ===================================
if [ "$CHOICE" != "4" ] && [ "$CHOICE" != "5" ]; then
    print_info "Executando typecheck..."
    npm run typecheck || {
        print_error "TypeScript errors encontrados"
        exit 1
    }
    print_success "Typecheck OK"
    echo ""
fi

# ===================================
# 4. Git Commit & Push
# ===================================
if [ "$CHOICE" != "5" ]; then
    print_info "Preparando commit..."

    # Check if there are changes
    if [ -n "$(git status --porcelain)" ]; then
        git add .

        # Ask for commit message
        read -p "📝 Mensagem do commit: " COMMIT_MSG

        if [ -z "$COMMIT_MSG" ]; then
            COMMIT_MSG="chore: deploy updates"
        fi

        git commit -m "$COMMIT_MSG"
        print_success "Commit criado"

        # Push
        print_info "Pushing para GitHub..."
        git push origin main || git push origin master
        print_success "Push concluído"
    else
        print_info "Nenhuma mudança para commit"
    fi
    echo ""
fi

# ===================================
# 5. Deploy
# ===================================

case $CHOICE in
    1)
        print_info "🔵 Deploying Frontend (Vercel)..."
        echo ""

        if command -v vercel &> /dev/null; then
            vercel --prod
            print_success "Frontend deployed!"
        else
            print_error "Vercel CLI não encontrado"
            print_info "Instale: npm install -g vercel"
            print_info "Ou use: https://vercel.com/dashboard (GitHub auto-deploy)"
        fi
        ;;

    2)
        print_info "🚂 Deploying Backend (Railway)..."
        echo ""

        if command -v railway &> /dev/null; then
            railway up
            print_success "Backend deployed!"

            # Show URL
            print_info "Obtendo URL..."
            railway domain
        else
            print_error "Railway CLI não encontrado"
            print_info "Instale: npm install -g @railway/cli"
            print_info "Ou use: https://railway.app/dashboard (GitHub auto-deploy)"
        fi
        ;;

    3)
        print_info "🚀 Deploy Completo..."
        echo ""

        # Backend first
        if command -v railway &> /dev/null; then
            print_info "🚂 Deploying Backend..."
            railway up
            print_success "Backend deployed!"
        else
            print_error "Railway CLI não encontrado (backend skip)"
        fi

        echo ""

        # Frontend
        if command -v vercel &> /dev/null; then
            print_info "🔵 Deploying Frontend..."
            vercel --prod
            print_success "Frontend deployed!"
        else
            print_error "Vercel CLI não encontrado (frontend skip)"
        fi

        echo ""
        print_success "Deploy completo!"
        ;;

    4)
        print_success "Código pushed para GitHub!"
        print_info "Se auto-deploy estiver ativo, aguarde Railway/Vercel fazer deploy"
        ;;

    5)
        print_info "📊 Status dos Deploys"
        echo ""

        # Check Railway
        if command -v railway &> /dev/null; then
            echo "🚂 Railway Status:"
            railway status || echo "   (não conectado ou sem projeto)"
            echo ""
        fi

        # Check Vercel
        if command -v vercel &> /dev/null; then
            echo "🔵 Vercel Status:"
            vercel ls || echo "   (não conectado)"
            echo ""
        fi

        # Git status
        echo "📦 Git Status:"
        git status --short
        echo ""

        print_success "Status verificado"
        ;;

    *)
        print_error "Opção inválida"
        exit 1
        ;;
esac

echo ""
echo "==========================================="
print_success "Processo concluído!"
echo ""

# Show URLs
print_info "URLs esperadas:"
echo "   Frontend: https://verso-genius-unified.vercel.app"
echo "   Backend:  https://verso-genius-backend.up.railway.app"
echo ""

print_info "Próximos passos:"
echo "   1. Verifique os deploys nos dashboards"
echo "   2. Teste a aplicação"
echo "   3. Monitore logs se necessário"
echo ""
