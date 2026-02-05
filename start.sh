#!/bin/sh
echo "=== VERSO GENIUS BACKEND STARTING ==="
echo "Node version: $(node --version)"
echo "Checking environment variables..."

# Hardcoded fallbacks para produção
export SUPABASE_URL="${SUPABASE_URL:-https://cxuethubwfvqolsppfst.supabase.co}"
export SUPABASE_SERVICE_KEY="${SUPABASE_SERVICE_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4dWV0aHVid2Z2cW9sc3BwZnN0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTk1MjM1NCwiZXhwIjoyMDg1NTI4MzU0fQ.exKab4S_Ge760AqfkZNS2mKTYNwPsBC1QmknoUk_giQ}"
export REDIS_HOST="${REDIS_HOST:-redis.railway.internal}"
export REDIS_PORT="${REDIS_PORT:-6379}"
export REDIS_PASSWORD="${REDIS_PASSWORD:-MUqfEnxowjcOGzAjCqAiRZEqhqbhKzvg}"
export REDIS_DB="${REDIS_DB:-0}"
export NODE_ENV="${NODE_ENV:-production}"
export PORT="${PORT:-12345}"

echo "✅ SUPABASE_URL: $SUPABASE_URL"
echo "✅ REDIS_HOST: $REDIS_HOST"
echo "✅ PORT: $PORT"
echo "=================================="
echo "Starting server with tsx..."

exec npx tsx src/api/server.ts
