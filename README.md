# 🔥 PEBLO // THE OBSIDIAN FORGE 2.0

> **A high-performance, full-stack AI markdown workspace with Hybrid Semantic RAG, Real-time SSE Inference, and Optimistic Concurrency Control.**

[![Live Demo](https://img.shields.io/badge/Live_Demo-peblo17.vercel.app-FF3815?style=for-the-badge&logo=vercel&logoColor=white)](https://peblo17.vercel.app)
[![CI Pipeline](https://img.shields.io/badge/CI_Build-Passing-22c55e?style=for-the-badge&logo=githubactions&logoColor=white)](https://github.com/Spidey173/Peblo)
[![Pytest Suite](https://img.shields.io/badge/Tests-34_Passed-3b82f6?style=for-the-badge&logo=pytest&logoColor=white)](https://github.com/Spidey173/Peblo)
[![Groq LPUs](https://img.shields.io/badge/AI_Engine-Groq_Qwen_3.8-orange?style=for-the-badge&logo=fastapi&logoColor=white)](https://groq.com)
[![Database](https://img.shields.io/badge/Database-SQLite_%2F_Neon_PostgreSQL-00e599?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

---

## 💡 About The Project

**Peblo** is a modern, production-grade AI note-taking canvas inspired by Obsidian and tactile cyberpunk design aesthetics. Unlike standard note apps or basic AI wrappers, Peblo is engineered from the ground up to solve real distributed systems and AI engineering challenges:

1. **Intelligent Retrieval (RAG)**: Ask questions across your personal knowledge base with sub-second answers backed by dense vector embeddings and lexical BM25 search.
2. **Low Latency Inference**: Real-time token streaming via Server-Sent Events (SSE) with perceived time-to-first-token under 120ms.
3. **Multi-Tab Data Safety**: Atomic versioning with Optimistic Concurrency Control (OCC) preventing silent overwrites and data loss.
4. **Zero-Config Cloud or Local Execution**: Seamlessly runs on local SQLite or cloud Serverless PostgreSQL (Neon) and deploys on Vercel Edge/Serverless.

---

## 🚀 Live Demo

Experience the live production build: **[https://peblo17.vercel.app](https://peblo17.vercel.app)**

> **Test Account**: You can register your own account or test immediately with any sample login.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                CLIENT (React 18 SPA)                            │
│  • Vite + Tailwind CSS (Obsidian Dark Cyberpunk Theme)                          │
│  • Split-Pane Markdown Canvas + Live Preview Rendering                          │
│  • Real-time SSE EventStream Consumer                                           │
│  • Global Shortcut Command Palette (⌘K) & Semantic Copilot (⌘J)                 │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │  HTTPS / REST / SSE
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              FASTAPI BACKEND ENGINE                             │
│  • Asynchronous Request Pipeline (Uvicorn / Starlette)                          │
│  • JWT Auth & Multi-Tenant Row-Level Security                                   │
│  • Optimistic Concurrency Engine (Atomic Version Checks: HTTP 409 Conflict)     │
│  • Streaming Router (EventSourceResponse)                                       │
└──────────────────┬─────────────────────────────┬────────────────────────────────┘
                   │                             │
                   ▼                             ▼
┌─────────────────────────────────────┐   ┌─────────────────────────────────────┐
│       HYBRID RAG RETRIEVAL          │   │         AI INFERENCE ENGINE         │
│  • 384-dimensional Semantic Vectors │   │  • Groq Cloud LPUs                  │
│  • In-Memory / SQLite-Vec Indexing  │   │  • Model: Qwen 3.8 / Llama 3        │
│  • Lexical BM25 Scoring & Fusion    │   │  • Low-Latency Token Streaming      │
└──────────────────┬──────────────────┘   └─────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         PERSISTENCE LAYER (SQLAlchemy)                          │
│  • Local: SQLite (Auto-migrating / Serverless /tmp scratchpad)                  │
│  • Cloud: Neon Serverless PostgreSQL with SSL connection pooling                │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## ⚡ Key Engineering Highlights (What Makes This Stand Out)

### 1. 🧠 Hybrid Semantic RAG ("Ask Your Notes" Copilot)
- **Dense Vectors + Lexical Search**: Combines 384-dimensional dense semantic vectors with BM25 lexical token matching:
  $$\text{Hybrid Score} = 0.6 \cdot \text{VectorSimilarity} + 0.4 \cdot \text{BM25Relevance}$$
- **Chunking Pipeline**: Automatically splits note content into overlapping chunks upon saving and refreshes embedding vectors.
- **Accurate Source Attribution**: Generates answers grounded strictly in note data with interactive source citation pills `[Source: Note Title]`.

### 2. ⚡ Real-Time Streaming via Server-Sent Events (SSE)
- Streams tokens from Groq LPUs straight to the editor using `EventSourceResponse` and `ReadableStream`.
- Features live typewriter animations, eliminating 3–5 second blocking JSON wait times and dropping perceived TTFT to **< 120ms**.

### 3. 🛡️ Optimistic Concurrency Control (OCC)
- Notes maintain an atomic integer column `version: int`.
- Saves execute conditional updates:
  ```sql
  UPDATE notes 
  SET content = :new_content, version = version + 1 
  WHERE id = :id AND version = :expected_version;
  ```
- If another tab or session modified the note in parallel, the server returns an **HTTP 409 Conflict**. The frontend displays an interactive side-by-side diff modal allowing you to:
  1. *Force Overwrite Server*
  2. *Discard Local & Keep Server*
  3. *Merge & Append Both*

### 4. 🧪 Automated 34-Test Pytest Suite
- **100% automated test coverage** across critical paths:
  - `test_auth.py`: JWT signing, bcrypt password verification, expired tokens, input validation.
  - `test_notes.py`: Multi-tenant isolation (User A cannot access User B's notes), soft-delete, tagging.
  - `test_concurrency.py`: Rapid multi-threaded concurrent edits and OCC conflict detection.
  - `test_ai_resilience.py`: Groq rate limit handling, vector cosine similarity, BM25 scoring, and SSE streaming.

---

## 💻 Tech Stack

| Category | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide Icons, Markdown Preview, Axios |
| **Backend** | Python 3.11+, FastAPI, Uvicorn, Pydantic v2, HTTPX |
| **Database** | SQLAlchemy ORM, SQLite, Neon Serverless PostgreSQL |
| **AI / NLP** | Groq LPUs, Qwen 3.8 / Llama 3, 384-d Vector Embeddings, BM25 Ranking |
| **Testing & CI** | Pytest, Pytest-Asyncio, GitHub Actions |
| **Deployment** | Vercel (Edge Functions + Static SPA Hosting) |

---

## 🛠️ Step-by-Step Local Setup Guide

### Prerequisites
- Python 3.10 or higher
- Node.js 18 or higher & npm
- Free Groq API Key ([console.groq.com](https://console.groq.com))

### 1. Clone the Repository
```bash
git clone https://github.com/Spidey173/Peblo.git
cd Peblo
```

### 2. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate    # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Create .env from template
cp .env.example .env
```

Edit `backend/.env` with your settings:
```env
SECRET_KEY=dev-secret-key-minimum-32-characters
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=qwen/qwen3.8-27b
DATABASE_URL=sqlite:///./peblo.db
```

Start the FastAPI backend:
```bash
python3 -m uvicorn app.main:app --reload --port 8000
```
API Documentation will be live at: **[http://localhost:8000/api/docs](http://localhost:8000/api/docs)**

### 3. Frontend Setup
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

### 4. Run the Pytest Test Suite
```bash
cd backend
pytest tests/ -v
# Output: 34 passed in ~8.9s
```

---

## 📂 Project Directory Structure

```
Peblo/
├── .github/
│   └── workflows/
│       └── ci.yml               # Automated GitHub Actions CI workflow
├── api/
│   ├── index.py                 # Vercel Serverless Python entrypoint
│   └── requirements.txt         # Production serverless runtime dependencies
├── backend/
│   ├── app/
│   │   ├── api/                 # REST endpoints (auth, notes, ai, tags, dashboard)
│   │   ├── core/                # JWT security, config, and dependency injection
│   │   ├── db/                  # SQLAlchemy session & dynamic DB URL routing
│   │   ├── models/              # Database models (User, Note, Embedding, Tag)
│   │   ├── schemas/             # Pydantic v2 schemas for request/response validation
│   │   └── services/            # Semantic RAG engine & Groq streaming service
│   ├── tests/                   # 34 comprehensive automated Pytest test cases
│   └── requirements.txt         # Backend Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/          # UI components, ConflictModal, Copilot Drawer
│   │   ├── context/             # AuthContext and ThemeContext state providers
│   │   ├── hooks/               # Custom hooks (useNotes, useAI, useDebounce)
│   │   ├── pages/               # NoteEditor, Dashboard, Notes, Auth pages
│   │   └── services/            # Axios API client and SSE streaming helper
│   ├── package.json             # Frontend dependencies & scripts
│   └── vite.config.js           # Vite development server configuration
├── vercel.json                  # Production deployment & route rewrite config
└── README.md                    # Project documentation
```

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page or submit a PR.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: add some amazing feature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<p align="center">
  Crafted with precision by <a href="https://github.com/Spidey173"><b>Pruthvi R</b></a>
</p>
