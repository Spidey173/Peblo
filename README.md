# 🔥 Peblo — AI Markdown Workspace

> **A full-stack AI markdown workspace featuring Hybrid Semantic RAG, real-time SSE token streaming, and Optimistic Concurrency Control (OCC).**

[![Live Demo](https://img.shields.io/badge/Live_Demo-peblo17.vercel.app-FF3815?style=for-the-badge&logo=vercel&logoColor=white)](https://peblo17.vercel.app)
[![CI Pipeline](https://img.shields.io/badge/CI_Build-Passing-22c55e?style=for-the-badge&logo=githubactions&logoColor=white)](https://github.com/Spidey173/Peblo)
[![Database](https://img.shields.io/badge/Database-PostgreSQL_%2B_pgvector-00e599?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

---

## Overview

**Peblo** is an AI-native note-taking workspace built with React, FastAPI, and PostgreSQL + `pgvector`:

- **Hybrid Semantic RAG:** Combines 384-dimensional `pgvector` HNSW cosine similarity with lexical BM25 scoring to answer questions across your notes with source citations.
- **Real-Time SSE Streaming:** Streams tokens from Groq LPUs directly to the editor over Server-Sent Events (`EventSourceResponse` / `ReadableStream`).
- **Optimistic Concurrency Control (OCC):** Atomic `version` checks on note updates return `HTTP 409 Conflict` on parallel edits, with an interactive diff/merge modal on the client.
- **Multi-Tenant Security:** JWT authentication (`python-jose`, `bcrypt`) with user-scoped queries and public share-token links.

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, TanStack React Query, React Router, Axios, Recharts, Lucide Icons |
| **Backend** | Python 3.11, FastAPI, Uvicorn, Pydantic v2, SQLAlchemy 2.x, Alembic, HTTPX |
| **Database** | PostgreSQL 16 + `pgvector` (HNSW cosine index), `psycopg` v3 |
| **AI / RAG** | Groq API (Qwen / Llama fallback chain), 384-d embeddings, BM25 lexical fusion |
| **Tooling & CI** | Pytest, Ruff, ESLint, Pre-commit, Docker Compose, GitHub Actions, Vercel |

---

## Architecture

```mermaid
flowchart TD
    Client["React 18 SPA (Vite + Tailwind + React Query)"]
    API["FastAPI Backend (Auth, Notes, Tags, Dashboard, AI)"]
    OCC["Optimistic Concurrency Control (version check -> 409)"]
    RAG["Hybrid RAG Service (pgvector HNSW + BM25)"]
    Groq["Groq LPU Inference (REST + SSE Streaming)"]
    DB[("PostgreSQL 16 + pgvector")]

    Client -- "HTTPS / REST / SSE" --> API
    API --> OCC
    API --> RAG
    API --> Groq
    OCC --> DB
    RAG --> DB
```

---

## Folder Structure

```text
Peblo/
├── .github/workflows/ci.yml       # GitHub Actions CI (Postgres + pgvector, Ruff, Pytest, Vite build)
├── .env.example                   # Root environment variables template
├── .pre-commit-config.yaml        # Ruff & hygiene pre-commit hooks
├── Makefile                       # Common dev, test, lint, and build commands
├── pyproject.toml                 # Ruff lint & format configuration
├── vercel.json                    # Vercel rewrites (/api/* -> api/index.py)
├── api/
│   ├── index.py                   # Vercel serverless FastAPI entrypoint
│   └── requirements.txt           # Serverless runtime dependencies
├── backend/
│   ├── Dockerfile
│   ├── alembic/                   # Alembic schema migrations (pgvector)
│   ├── alembic.ini
│   ├── requirements.txt
│   ├── app/
│   │   ├── main.py                # FastAPI app factory & router registration
│   │   ├── api/                   # Route handlers (auth, notes, tags, ai, dashboard)
│   │   ├── core/                  # Config, JWT security, FastAPI dependencies
│   │   ├── db/                    # SQLAlchemy engine, pooling, session lifecycle
│   │   ├── models/                # ORM models (User, Note, Tag, AIGeneration, NoteEmbedding)
│   │   ├── schemas/               # Pydantic v2 request/response schemas
│   │   └── services/              # Groq AI service & Hybrid RAG engine
│   └── tests/                     # Pytest suite (auth, notes, OCC, RAG, AI resilience)
├── frontend/
│   ├── .eslintrc.cjs              # ESLint config for React 18 + Vite
│   ├── .env.example               # Frontend env template (VITE_API_URL)
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── components/            # UI, notes, AI copilot drawer, shared components
│       ├── context/               # AuthContext, ThemeContext
│       ├── hooks/                 # React Query & debounce hooks
│       ├── layouts/               # AppLayout, AuthLayout
│       ├── pages/                 # Route pages
│       ├── services/              # Axios client & SSE streaming helper
│       └── utils/                 # Shared frontend utilities (markdown export)
└── scripts/
    └── migrate_sqlite_to_postgres.py
```

---

## Setup & Environment Variables

### 1. Configure Environment

```bash
cp .env.example .env
```

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `SECRET_KEY` | JWT signing secret (min 32 chars in production) | `change-me-in-production` |
| `ALGORITHM` | JWT signing algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT expiration in minutes | `10080` |
| `DATABASE_URL` | Pooled PostgreSQL URL (`psycopg` driver) | `postgresql+psycopg://peblo:peblo@localhost:5432/peblo` |
| `DIRECT_URL` | Direct (unpooled) PostgreSQL URL for Alembic | `postgresql+psycopg://peblo:peblo@localhost:5432/peblo` |
| `GROQ_API_KEY` | Groq API key ([console.groq.com](https://console.groq.com)) | — |
| `GROQ_MODEL` | Primary Groq model | `qwen/qwen3.8-27b` |
| `CORS_ORIGINS` | JSON array of allowed origins | `["http://localhost:5173","http://localhost:3000"]` |
| `VITE_API_URL` | Optional API base URL for `frontend/` | `""` (uses Vite proxy `/api`) |

---

## How to Run

### Docker Compose (Recommended)

```bash
make up
```

Backend API and interactive OpenAPI docs will be available at:
- **Swagger UI:** [http://localhost:8000/api/docs](http://localhost:8000/api/docs)
- **ReDoc:** [http://localhost:8000/api/redoc](http://localhost:8000/api/redoc)

### Manual Local Development

**Backend:**
```bash
docker compose up -d db
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173).

---

## Testing & Linting

```bash
# Run full backend pytest suite against Docker Postgres + pgvector
make test

# Lint backend (Ruff) and frontend (ESLint)
make lint
make lint-frontend

# Format Python code
make format

# Production frontend build
make build-frontend
```

---

## License

MIT License — crafted by [Pruthvi R](https://github.com/Spidey173).
