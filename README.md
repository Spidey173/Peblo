<div align="center">

# ✨ Peblo

### AI-Powered Collaborative Notes Workspace

*Capture ideas, get AI summaries, track action items, and boost your productivity.*

[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-8E75B2?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev/)

</div>

---

## 📋 Overview

Peblo is a modern, AI-powered notes workspace built for productivity. It combines a clean, minimal writing experience with intelligent AI features powered by Google's Gemini Flash model to help you organize thoughts, extract insights, and stay on top of action items.

**Design Inspiration:** Notion • Linear • Vercel • Supabase

### Key Features

- 🔐 **JWT Authentication** — Secure signup/login with bcrypt password hashing
- 📝 **Notes Workspace** — Create, edit, archive, delete with auto-save
- 🤖 **AI Intelligence** — Summaries, action items, and title suggestions via Gemini
- 🔍 **Smart Search** — Instant debounced search with tag filtering
- 🔗 **Public Sharing** — Generate shareable read-only links
- 📊 **Dashboard** — Activity charts, stats, and usage analytics
- 🌗 **Dark/Light Mode** — System-aware theme switching
- ⌨️ **Keyboard Shortcuts** — ⌘K search, ⌘N new note, ⌘S save
- 📱 **Mobile Responsive** — Full responsive design with mobile sidebar

---

## 🏗️ Architecture

### System Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────┐
│                 │     │                  │     │              │
│   React SPA     │────▶│   FastAPI        │────▶│   SQLite     │
│   (Vite)        │◀────│   Backend        │◀────│   Database   │
│                 │     │                  │     │              │
└─────────────────┘     └────────┬─────────┘     └──────────────┘
                                │
                                ▼
                        ┌──────────────┐
                        │  Gemini AI   │
                        │  (Flash)     │
                        └──────────────┘
```

### Frontend (`/frontend`)

```
src/
├── components/         # Reusable UI components
│   ├── ai/            # AI-related components
│   ├── auth/          # Authentication components
│   ├── dashboard/     # Dashboard widgets
│   ├── layout/        # Sidebar, headers
│   ├── notes/         # NoteCard, editor components
│   ├── shared/        # CommandPalette, modals
│   └── ui/            # Skeleton, EmptyState, ErrorState
├── context/           # React contexts (Auth, Theme)
├── hooks/             # Custom hooks (useNotes, useAI, etc.)
├── layouts/           # App layout with sidebar
├── pages/             # Route-level page components
├── services/          # Centralized API layer (Axios)
├── lib/               # Utility libraries
├── utils/             # Helper functions
└── types/             # TypeScript-like type documentation
```

### Backend (`/backend`)

```
app/
├── api/               # FastAPI route handlers
│   ├── auth.py        # Authentication endpoints
│   ├── notes.py       # CRUD + search + sharing
│   ├── tags.py        # Tag management
│   ├── ai.py          # AI generation endpoint
│   └── dashboard.py   # Analytics & stats
├── core/              # App configuration
│   ├── config.py      # Settings (env-based)
│   ├── deps.py        # Dependency injection
│   └── security.py    # JWT + password hashing
├── db/                # Database setup
│   └── database.py    # SQLAlchemy engine & session
├── models/            # SQLAlchemy ORM models
│   ├── user.py        # User model
│   ├── note.py        # Note model with relationships
│   ├── tag.py         # Tag model + note_tags junction
│   └── ai_generation.py  # Cached AI results
├── schemas/           # Pydantic validation schemas
│   ├── user.py        # Auth request/response models
│   ├── note.py        # Note CRUD schemas
│   └── ai.py          # AI & dashboard schemas
├── services/          # Business logic layer
│   └── ai_service.py  # Gemini API integration
└── utils/             # Shared utilities
```

---

## 🗄️ Database Schema

```sql
┌──────────┐       ┌──────────┐       ┌────────────┐
│  users   │       │  notes   │       │    tags     │
├──────────┤       ├──────────┤       ├────────────┤
│ id (PK)  │◀──────│ user_id  │       │ id (PK)    │
│ email    │       │ id (PK)  │       │ name       │
│ username │       │ title    │       │ color      │
│ hash_pwd │       │ content  │       │ user_id    │
│ full_name│       │ archived │       │ created_at │
│ avatar   │       │ public   │       └────────────┘
│ created  │       │ share_tk │             │
└──────────┘       │ created  │      ┌──────┴───────┐
                   │ updated  │      │  note_tags   │
                   └──────────┘      ├──────────────┤
                        │            │ note_id (FK) │
                   ┌────┴─────┐      │ tag_id  (FK) │
                   │ai_gens   │      └──────────────┘
                   ├──────────┤
                   │ id (PK)  │
                   │ note_id  │
                   │ summary  │
                   │ actions  │
                   │ title    │
                   │ hash     │
                   │ tokens   │
                   └──────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- **Python** 3.10+
- **Node.js** 18+
- **Gemini API Key** — [Get one free](https://aistudio.google.com/app/apikey)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # macOS/Linux
# .venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Start server
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Start dev server
npm run dev
```

The app will be available at `http://localhost:5173`

---

## 📡 API Documentation

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/signup` | Create new account |
| `POST` | `/api/auth/login` | Login with credentials |
| `GET` | `/api/auth/me` | Get current user profile |

### Notes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/notes` | List notes (search, filter, sort) |
| `POST` | `/api/notes` | Create a new note |
| `GET` | `/api/notes/{id}` | Get note details |
| `PATCH` | `/api/notes/{id}` | Update note |
| `DELETE` | `/api/notes/{id}` | Delete note |
| `POST` | `/api/notes/{id}/share` | Toggle public sharing |
| `GET` | `/api/notes/public/{token}` | Get public note (no auth) |

### Tags

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tags` | List user's tags |
| `POST` | `/api/tags` | Create a tag |
| `DELETE` | `/api/tags/{id}` | Delete a tag |

### AI

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/ai/generate` | Generate AI insights |

### Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/dashboard/stats` | Get workspace analytics |

> 📖 Interactive docs available at `/api/docs` (Swagger) and `/api/redoc` (ReDoc)

---

## 🤖 AI Workflow

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  User edits  │     │  Check cache  │     │  Call Gemini  │
│  note content│────▶│  (hash match?)│────▶│  Flash API    │
└─────────────┘     └──────┬───────┘     └──────┬───────┘
                           │                     │
                    ┌──────┴──────┐        ┌─────┴──────┐
                    │ Cache hit → │        │ Parse JSON │
                    │ Return fast │        │ response   │
                    └─────────────┘        └─────┬──────┘
                                                 │
                                           ┌─────┴──────┐
                                           │ Upsert to  │
                                           │ ai_gens DB │
                                           └────────────┘
```

### Structured Output

Gemini is configured to return `application/json` responses:

```json
{
  "summary": "A concise 2-3 sentence summary",
  "action_items": ["Task 1", "Task 2", "Task 3"],
  "suggested_title": "Descriptive title for the note"
}
```

### Key Design Decisions

- **Content hashing** — SHA-256 hash of note content detects stale caches
- **Upsert pattern** — AI results are updated in-place, not duplicated
- **Force regenerate** — Users can force fresh generation when needed
- **Minimum content** — 20-character minimum prevents wasteful API calls
- **Response caching** — DB-level caching reduces API usage and latency

---

## 🔧 Environment Variables

### Backend (`.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `SECRET_KEY` | JWT signing key | (required) |
| `ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token TTL | `10080` (7 days) |
| `DATABASE_URL` | SQLite connection | `sqlite:///./peblo.db` |
| `GEMINI_API_KEY` | Google AI API key | (required) |
| `CORS_ORIGINS` | Allowed origins | `["http://localhost:5173"]` |

### Frontend (`.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | API base URL | (empty for proxy) |

---

## 🚢 Deployment

### Frontend → Vercel

```bash
cd frontend
npm run build

# Deploy via Vercel CLI
npx vercel --prod
```

**Vercel Settings:**
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment: Set `VITE_API_URL` to your backend URL

### Backend → Render

1. Create a new **Web Service** on Render
2. Connect your repo, set root directory to `backend`
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables in Render dashboard

### Docker

```bash
docker compose up --build
```

---

## ⚡ Performance Optimizations

| Optimization | Implementation |
|-------------|---------------|
| Debounced autosave | 1200ms debounce on title/content changes |
| Optimistic updates | React Query cache updates before server confirm |
| Query caching | 2-min stale time on React Query |
| AI response caching | DB-level cache with content hash validation |
| Lazy loading | Components loaded on route entry |
| Memoized callbacks | `useCallback` on event handlers |
| CSS animations | GPU-accelerated transforms only |
| Scrollbar optimization | Custom thin scrollbars with `scrollbar-hide` |

---

## 🎨 Design System

| Element | Value |
|---------|-------|
| **Primary Font** | Inter (300-800) |
| **Mono Font** | JetBrains Mono |
| **Brand Color** | `#6366f1` (Indigo) |
| **Border Radius** | `0.75rem` (cards), `0.5rem` (buttons) |
| **Shadows** | Soft glow effects on brand elements |
| **Animations** | `fade-in`, `slide-up`, `shimmer` |
| **Dark Mode** | `gray-950` background, `gray-100` text |
| **Light Mode** | `gray-50` background, `gray-900` text |

---

## 🔮 Future Improvements

- [ ] Rich text editor (Tiptap/ProseMirror)
- [ ] Real-time collaboration (WebSocket)
- [ ] Note versioning & history
- [ ] Folder/workspace organization
- [ ] Export to PDF/Markdown
- [ ] Bulk operations
- [ ] Full-text search with SQLite FTS5
- [ ] Mobile PWA with offline support
- [ ] OAuth (Google/GitHub) login
- [ ] File attachments & image embeds
- [ ] Rate limiting on AI endpoints
- [ ] E2E tests with Playwright

---

## ⚖️ Tradeoffs

| Decision | Rationale |
|----------|-----------|
| **SQLite over PostgreSQL** | Zero-config for development; easy to swap via SQLAlchemy |
| **Synchronous endpoints** | SQLite doesn't benefit from async; simpler code |
| **JWT in localStorage** | Simpler than httpOnly cookies; trade: XSS vulnerability |
| **JSON in ai_generations.action_items** | SQLite lacks native JSON arrays; serialized as string |
| **Tailwind `@apply`** | Component classes for consistency vs utility-first purity |
| **Content hash for AI cache** | Simple cache invalidation without timestamp tracking |

---

## 📄 License

MIT

---

<div align="center">

Built with ❤️ using React, FastAPI, and Gemini AI

**[Try Peblo →](http://localhost:5173)**

</div>
