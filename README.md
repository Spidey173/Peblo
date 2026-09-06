# 🔥 PEBLO // THE OBSIDIAN FORGE

> **Forge raw thought into tempered intellect.**  
> A high-heat, tactile AI notes workspace engineered with **React**, **FastAPI**, and **Google Gemini Flash AI**.

---

## ⚡ Quick Start (No Docker Required)

### 1. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # Set your GEMINI_API_KEY
python3 -m uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 🛠️ Stack & Architecture

- **Frontend**: React 18, Vite, TailwindCSS (Obsidian Forge Theme), Lucide Icons
- **Backend**: FastAPI, SQLAlchemy, SQLite, PyJWT, Bcrypt
- **AI Intelligence**: Google Gemini 1.5 Flash (`google-generativeai`)

```
┌───────────────────┐        ┌───────────────────┐        ┌──────────────────┐
│    React 18 SPA   │ ─────> │  FastAPI Backend  │ ─────> │ SQLite Database  │
│   (Port 5173)     │ <───── │    (Port 8000)    │ <───── │   (peblo.db)     │
└───────────────────┘        └─────────┬─────────┘        └──────────────────┘
                                       │
                                       ▼
                             ┌──────────────────┐
                             │ Gemini 1.5 Flash │
                             └──────────────────┘
```

---

## ✨ Features

- 🔑 **Foundry Authentication**: JWT auth with secure `bcrypt` hashing.
- 📝 **The Crucible Canvas**: Auto-saving workspace with real-time tempering indicator.
- 🌋 **Catalyst AI Chamber**: Extract core thesis summaries, tactical action directives, and forged titles.
- 🔍 **Deep Recall Vault (⌘K)**: Instant command-palette search across fragments and thermal tags.
- 🔗 **Public Slate Casting**: Generate read-only share links (`/share/:token`).
- 📊 **Forge Telemetry Control**: Activity charts, note metrics, and thermal tag distribution.

---

## 🔑 Environment Variables (`backend/.env`)

```env
SECRET_KEY=super-secret-key-32chars-min-change-this
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
DATABASE_URL=sqlite:///./peblo.db
GEMINI_API_KEY=your_gemini_api_key_here
CORS_ORIGINS=["http://localhost:5173"]
```
