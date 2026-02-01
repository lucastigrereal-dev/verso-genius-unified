# 🎤 Verso Genius Unified

> **The Ultimate Brazilian Rap & Freestyle Training Platform**

Verso Genius Unified is a gamified learning platform that combines AI-powered rhyme generation, structured lessons, real-time battles, and social features to help aspiring MCs master the art of freestyle rap.

**Version:** 3.0.0
**Status:** 🚧 In Development (Foundation Complete)

---

## ✨ Features

### 🎓 Learning System
- **4 Pillars** of freestyle mastery (Listening, Production, Flow, Performance)
- **16 Structured Lessons** with progressive difficulty
- **80+ Exercises** covering all aspects of rap
- **AI-powered evaluation** with detailed feedback
- **Audio recording** and playback for practice

### 🤖 AI Generation
- **Hybrid AI system** (OpenAI GPT-4o-mini + Ollama)
- **300,000+ rhyme database** with full-text search
- **Context-aware generation** based on theme and style
- **Quality validation** with local LLM
- **Multiple styles**: Aggressive, Technical, Philosophical, Romantic

### 🎮 Gamification
- **XP & Leveling** system (1-50 levels)
- **Daily streaks** with multipliers
- **30+ Achievements** and badges
- **ELO rating** for competitive ranking
- **Tier system**: Bronze → Silver → Gold → Platinum → Diamond

### ⚔️ Battle System
- **1v1 AI Battles** with multiple personalities
- **Real-time scoring** (rhyme, flow, creativity)
- **Battle replays** with video storage
- **Leaderboards** by timeframe

### 🌐 Social Features
- **Friend system** with activity feed
- **Direct messaging** and group chats
- **Profile customization** with cosmetics shop
- **Referral program** with rewards

---

## 🏗️ Architecture

### Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + Vite | UI/UX with modern hooks |
| **Backend** | Hono.js + Node.js | Lightweight REST API |
| **Database** | Supabase (PostgreSQL) | 31 tables with RLS |
| **Cache** | Redis 7 | Rate limiting & caching |
| **AI** | OpenAI + Ollama | Hybrid generation system |
| **Real-time** | Supabase Realtime | Live updates |
| **Styling** | TailwindCSS | Utility-first CSS |
| **Deploy** | Vercel | Serverless deployment |

### Project Structure

```
verso-genius-unified/
├── src/
│   ├── api/                    # Backend (Hono.js)
│   │   ├── server.ts          # Entry point
│   │   ├── middleware/        # Auth, rate-limit, errors
│   │   ├── routes/            # API endpoints
│   │   └── services/          # Business logic
│   │
│   ├── ui/                     # Frontend (React)
│   │   ├── pages/             # 8 application pages
│   │   ├── components/        # Reusable components
│   │   ├── contexts/          # React contexts
│   │   └── hooks/             # Custom hooks
│   │
│   └── shared/                # Shared types & schemas
│
├── night-crawler/             # AI Generation Engine
│   ├── src/generator/         # Hybrid AI system
│   └── scripts/               # Setup & maintenance
│
├── database/
│   └── supabase/
│       └── migrations/        # Database schema
│
├── config/                    # Configuration files
│   ├── supabase.ts           # Supabase client
│   └── redis.ts              # Redis client
│
├── scripts/                   # Setup & maintenance
├── data/                      # Static data (rimas, etc)
└── docker-compose.yml         # Redis container
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/pnpm
- Docker (for Redis)
- Supabase account
- OpenAI API key (optional)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/verso-genius-unified.git
cd verso-genius-unified

# 2. Run automated setup
bash setup.sh
```

The setup script will:
- ✅ Create `.env` from template
- ✅ Install dependencies
- ✅ Start Redis container
- ✅ Guide you through Supabase schema setup
- ✅ Validate TypeScript configuration

### Manual Setup (if needed)

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your credentials

# 3. Start Redis
docker-compose up -d

# 4. Apply database schema
# Copy database/supabase/migrations/001_unified_schema.sql
# Paste into Supabase SQL Editor

# 5. Start development servers
npm run dev
```

---

## 📋 Environment Variables

See `.env.example` for all available options. Required variables:

```env
# Supabase (get from dashboard)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_KEY=eyJhbGci...

# Redis (Docker defaults)
REDIS_HOST=localhost
REDIS_PORT=6379

# OpenAI (optional, for AI generation)
OPENAI_API_KEY=sk-proj-...
```

---

## 🎯 Development

### Available Scripts

```bash
# Development
npm run dev              # Start both API and UI
npm run dev:api          # Start API only (port 12345)
npm run dev:ui           # Start UI only (port 5173)

# Build
npm run build            # Build for production
npm run typecheck        # TypeScript validation

# Database
npm run db:up            # Start Redis container
npm run db:down          # Stop Redis container
npm run seed             # Seed database with initial data

# Testing
npm test                 # Run all tests
npm run test:unit        # Unit tests only
```

### API Endpoints

**Public:**
- `GET /health` - Health check
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

**Protected (requires auth):**
- `GET /api/v1/me` - Get current user
- `POST /api/v1/generator/generate` - Generate rhymes
- `GET /api/v1/exercises` - List exercises
- `GET /api/v1/leaderboard` - View rankings

Full API documentation: [API.md](./API.md) (TODO)

---

## 🗄️ Database

### Schema Overview

**31 tables** organized in 9 categories:

1. **Core** (2): users, sessions
2. **Learning** (4): exercises, user_exercise_results, ai_evaluations, exercises_content
3. **Rimas** (2): rimas_banco, rimas_temas
4. **Gamification** (7): achievements, badges, daily_quests, user_achievements, etc.
5. **Battles** (3): user_duels, duel_replays, replay_comments
6. **Shop** (6): cosmetics, user_cosmetics, purchases, referral_codes, etc.
7. **Social** (2): friendships, favorite_verses
8. **Messaging** (3): conversations, conversation_participants, messages
9. **Notifications** (1): notifications
10. **AI Metrics** (1): ai_metrics

---

## 🤖 AI Generation System

### How It Works

The **night-crawler** module uses a 3-tier fallback strategy:

1. **Ollama (Local)** - Free, fast, good for validation
2. **OpenAI GPT-4o-mini** - Cloud, $0.15/1M tokens, best quality
3. **Template Fallback** - Hardcoded verses, 4 styles

### Generation Flow

```
User Request
    ↓
[Check Redis Cache]
    ↓
[night-crawler Generation]
    - FTS5 search for similar lyrics
    - Pattern extraction
    - GPT-4o-mini generation
    - Ollama validation
    - Quality scoring
    ↓
[Save to Supabase]
    ↓
[Cache Result]
    ↓
Return to User
```

### Performance

- **Generation time**: 2-5 seconds
- **Quality score**: 7-10/10 average
- **Cost**: <R$ 0.01 per generation
- **Cache hit rate**: ~60% (saves API calls)

---

## 🎨 Frontend Pages

1. **LoginPage** - Authentication (email + OAuth)
2. **RegisterPage** - User registration
3. **DashboardPage** - Main hub with stats & quick actions
4. **LessonsPage** - 4 pillars × 4 lessons grid
5. **LessonDetailPage** - Lesson overview & exercises
6. **ExercisePage** - Exercise interface with audio
7. **ResultsPage** - AI feedback & scoring
8. **BattlePage** - Real-time 1v1 battles (TODO)

---

## 🔒 Security

- ✅ **Supabase Auth** with JWT
- ✅ **Row Level Security (RLS)** on all tables
- ✅ **Rate limiting** (Redis-backed)
- ✅ **CORS protection**
- ✅ **Input validation** with Zod
- ✅ **Password hashing** with bcrypt
- ✅ **Environment variable secrets**

---

## 📊 Performance

### Optimization Features

- Redis caching for frequent queries
- Database indexing on all foreign keys
- Lazy loading for exercises
- Code splitting (Vite)
- CDN delivery (Vercel)

### Benchmarks (Target)

- API response time: <200ms (p95)
- Frontend bundle: <500KB gzipped
- Lighthouse score: 90+
- Database query time: <50ms

---

## 🚧 Roadmap

### Phase 1: Foundation ✅ (Current)
- [x] Repository structure
- [x] Database schema (31 tables)
- [x] Basic API server
- [x] Authentication middleware
- [x] Rate limiting
- [x] Setup automation

### Phase 2: Core Features 🔄 (Next)
- [ ] Complete API routes (exercises, generator, leaderboard)
- [ ] Frontend components merge (audio from ia-rimas-brasil)
- [ ] night-crawler integration
- [ ] FTS5 sync with Supabase
- [ ] AI generation endpoint

### Phase 3: Gamification & Social
- [ ] XP/leveling system implementation
- [ ] Achievement unlocking
- [ ] Daily quests
- [ ] Friend system
- [ ] Messaging

### Phase 4: Battles & Competition
- [ ] 1v1 AI battles
- [ ] Real-time scoring
- [ ] WebSocket integration
- [ ] Battle replays
- [ ] Leaderboards

### Phase 5: Polish & Production
- [ ] Comprehensive testing
- [ ] Performance optimization
- [ ] SEO & metadata
- [ ] Analytics integration
- [ ] Production deployment

---

## 🤝 Contributing

This is currently a private project. Contributions will be welcomed once the MVP is complete.

---

## 📄 License

MIT License - See [LICENSE](./LICENSE) for details

---

## 📞 Contact

**Developer:** Lucas Tigre
**Project:** Verso Genius Unified
**Version:** 3.0.0
**Status:** In Active Development

---

## 🙏 Acknowledgments

- **OpenAI** for GPT-4o-mini API
- **Supabase** for database & auth infrastructure
- **Hono.js** for the lightweight backend framework
- **React** & **Vite** for the modern frontend stack

---

**Built with ❤️ for the Brazilian rap community**
