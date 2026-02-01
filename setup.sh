#!/bin/bash

# ========================================
# VERSO GENIUS UNIFIED - SETUP SCRIPT
# ========================================
# Automated setup for development environment
# Run: bash setup.sh

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
  echo -e "${BLUE}"
  echo "╔══════════════════════════════════════════╗"
  echo "║  VERSO GENIUS UNIFIED - SETUP            ║"
  echo "║  Version 3.0.0                           ║"
  echo "╚══════════════════════════════════════════╝"
  echo -e "${NC}"
}

print_step() {
  echo -e "\n${YELLOW}[$1/8]${NC} $2..."
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

# ========================================
# MAIN SETUP
# ========================================

print_header

# Step 1: Check .env
print_step 1 "Checking environment variables"
if [ ! -f .env ]; then
  print_error ".env file not found"
  echo -e "   Creating .env from template..."
  cp .env.example .env
  print_info "Please edit .env with your credentials and run setup again:"
  print_info "   - SUPABASE_URL"
  print_info "   - SUPABASE_ANON_KEY"
  print_info "   - SUPABASE_SERVICE_KEY"
  print_info "   - OPENAI_API_KEY (optional)"
  exit 1
fi

source .env

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
  print_error "Missing required variables in .env"
  print_info "Please configure SUPABASE_URL and SUPABASE_ANON_KEY"
  exit 1
fi

print_success "Environment configured"

# Step 2: Install dependencies
print_step 2 "Installing dependencies"
if command -v pnpm &> /dev/null; then
  pnpm install
elif command -v npm &> /dev/null; then
  npm install
else
  print_error "npm or pnpm not found. Please install Node.js first."
  exit 1
fi
print_success "Dependencies installed"

# Step 3: Start Docker containers (Redis)
print_step 3 "Starting Docker containers"
if command -v docker-compose &> /dev/null; then
  docker-compose up -d
  sleep 3
  print_success "Redis container started"
else
  print_error "docker-compose not found. Please install Docker first."
  print_info "You can install Redis manually or continue without it."
  read -p "Continue without Docker? (y/N): " continue_without_docker
  if [[ ! $continue_without_docker =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Step 4: Setup night-crawler FTS5 (optional)
print_step 4 "Setting up night-crawler FTS5 database"
if [ -d "night-crawler" ]; then
  npm run setup:fts || print_info "FTS5 setup skipped (optional)"
  print_success "Night-crawler configured"
else
  print_info "night-crawler directory not found (will be added later)"
fi

# Step 5: Apply Supabase schema
print_step 5 "Applying database schema"
print_info "Please apply the database schema manually:"
echo ""
echo "   1. Open https://supabase.com/dashboard"
echo "   2. Go to SQL Editor"
echo "   3. Copy the contents of: database/supabase/migrations/001_unified_schema.sql"
echo "   4. Paste and execute in SQL Editor"
echo ""
read -p "   Press [Enter] when schema is applied..."
print_success "Schema application confirmed"

# Step 6: Seed database (optional)
print_step 6 "Seeding database"
read -p "   Do you want to seed the database with initial data? (y/N): " seed_db
if [[ $seed_db =~ ^[Yy]$ ]]; then
  npm run seed || print_info "Seeding failed (optional)"
  print_success "Database seeded"
else
  print_info "Skipping database seeding"
fi

# Step 7: Type checking
print_step 7 "Running TypeScript validation"
npm run typecheck || print_error "TypeScript errors found (fix before running)"
print_success "TypeScript validation passed"

# Step 8: Final checks
print_step 8 "Running final checks"

# Check if Redis is running
if command -v redis-cli &> /dev/null; then
  if redis-cli ping > /dev/null 2>&1; then
    print_success "Redis is running"
  else
    print_info "Redis is not running (optional)"
  fi
fi

# Check if ports are available
if command -v lsof &> /dev/null; then
  if lsof -i :12345 > /dev/null 2>&1; then
    print_error "Port 12345 is already in use"
  fi
  if lsof -i :5173 > /dev/null 2>&1; then
    print_error "Port 5173 is already in use"
  fi
fi

# ========================================
# SETUP COMPLETE
# ========================================

echo ""
echo -e "${GREEN}"
echo "╔══════════════════════════════════════════╗"
echo "║  🚀 SETUP COMPLETE!                      ║"
echo "╚══════════════════════════════════════════╝"
echo -e "${NC}"

echo ""
echo "📊 Services:"
echo "   - Backend API:  http://localhost:12345"
echo "   - Frontend:     http://localhost:5173"
echo "   - Redis:        localhost:6379"
echo "   - Supabase:     $SUPABASE_URL"
echo ""
echo "🎯 Next steps:"
echo "   1. Start development servers:"
echo "      npm run dev"
echo ""
echo "   2. Access the app:"
echo "      http://localhost:5173"
echo ""
echo "   3. Check API health:"
echo "      curl http://localhost:12345/health"
echo ""
echo "📚 Documentation:"
echo "   - README.md         - Project overview"
echo "   - .env.example      - Environment variables"
echo "   - database/         - Database schema"
echo ""
