import 'dotenv/config'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serve } from '@hono/node-server'

// Middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler'
import { moderateRateLimit } from './middleware/rateLimit'
import { supabaseAuthMiddleware, optionalAuthMiddleware } from './middleware/auth'

// Config
import { redis } from '../../config/redis'
import { supabase } from '../../config/supabase'

const app = new Hono()

// ========================================
// GLOBAL MIDDLEWARE
// ========================================

// CORS
app.use('*', cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
  credentials: true
}))

// Rate limiting (aplicado a todas as rotas /api/*)
app.use('/api/*', moderateRateLimit)

// ========================================
// HEALTH CHECK (sem auth)
// ========================================

app.get('/health', async (c) => {
  try {
    // Check Redis
    await redis.ping()

    // Check Supabase
    const { error } = await supabase.from('users').select('id').limit(1)

    return c.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        redis: 'connected',
        supabase: error ? 'error' : 'connected'
      },
      version: process.env.APP_VERSION || '3.0.0'
    })
  } catch (err: any) {
    return c.json({
      status: 'unhealthy',
      error: err.message
    }, 503)
  }
})

// ========================================
// PUBLIC ROUTES (sem auth obrigatório)
// ========================================

// TODO: Importar rotas quando forem criadas
// import authRoutes from './routes/auth'
// import publicRimasRoutes from './routes/public/rimas'

// app.route('/api/auth', authRoutes)
// app.route('/api/public', publicRimasRoutes)

// Placeholder para rotas públicas
app.get('/api/public/rimas', optionalAuthMiddleware, async (c) => {
  return c.json({ message: 'Public rimas endpoint - TODO: implement' })
})

// ========================================
// PROTECTED ROUTES (auth obrigatório)
// ========================================

app.use('/api/v1/*', supabaseAuthMiddleware)

// Importar rotas
import currencyRoutes from './routes/currency'
import shopRoutes from './routes/shop'
import challengesRoutes from './routes/challenges'
import paymentsRoutes from './routes/payments'
import battlePassRoutes from './routes/battlePass'
import achievementsRoutes from './routes/achievements'
import referralsRoutes from './routes/referrals'
import leaderboardRoutes from './routes/leaderboard'
import streaksRoutes from './routes/streaks'
import crewsRoutes from './routes/crews'
import eventsRoutes from './routes/events'
import gachaRoutes from './routes/gacha'
import nftRoutes from './routes/nft'
import adminRoutes from './routes/admin'
import friendsRoutes from './routes/friends'
import battlesRoutes from './routes/battles'

// TODO: Importar rotas adicionais quando forem criadas
// import exercisesRoutes from './routes/exercises'
// import generatorRoutes from './routes/generator'
// import socialRoutes from './routes/social'
// import profileRoutes from './routes/profile'

// Rotas monetização
app.route('/api/v1/currency', currencyRoutes)
app.route('/api/v1/shop', shopRoutes)
app.route('/api/v1/challenges', challengesRoutes)
app.route('/api/v1/payments', paymentsRoutes)
app.route('/api/v1/battle-pass', battlePassRoutes)
app.route('/api/v1/achievements', achievementsRoutes)
app.route('/api/v1/referrals', referralsRoutes)
app.route('/api/v1/leaderboard', leaderboardRoutes)
app.route('/api/v1/streaks', streaksRoutes)
app.route('/api/v1/crews', crewsRoutes)
app.route('/api/v1/events', eventsRoutes)
app.route('/api/v1/gacha', gachaRoutes)
app.route('/api/v1/nft', nftRoutes)
app.route('/api/v1/admin', adminRoutes)
app.route('/api/v1/friends', friendsRoutes)
app.route('/api/v1/battles', battlesRoutes)

// app.route('/api/v1/exercises', exercisesRoutes)
// app.route('/api/v1/generator', generatorRoutes)
// app.route('/api/v1/leaderboard', leaderboardRoutes)
// app.route('/api/v1/social', socialRoutes)
// app.route('/api/v1/profile', profileRoutes)

// Placeholder para rotas protegidas
app.get('/api/v1/me', async (c) => {
  const profile = c.get('profile')
  return c.json({
    user: profile,
    message: 'Protected endpoint working'
  })
})

// ========================================
// ERROR HANDLING
// ========================================

app.onError(errorHandler)
app.notFound(notFoundHandler)

// ========================================
// START SERVER
// ========================================

const PORT = parseInt(process.env.PORT || '12345')

console.log(`
╔══════════════════════════════════════════╗
║  VERSO GENIUS UNIFIED API SERVER         ║
║  Version: ${process.env.APP_VERSION || '3.0.0'}                           ║
╚══════════════════════════════════════════╝
`)

serve({
  fetch: app.fetch,
  port: PORT
}, (info) => {
  console.log(`
🚀 Server running on http://localhost:${info.port}

📊 Services:
   - API:       http://localhost:${info.port}/api
   - Health:    http://localhost:${info.port}/health
   - Supabase:  ${process.env.SUPABASE_URL}
   - Redis:     ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}

🔧 Environment: ${process.env.NODE_ENV || 'development'}
`)
})

export default app
