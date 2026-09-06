from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.database import init_db
from app.api import auth, notes, tags, ai, dashboard

app = FastAPI(
    title="Peblo API",
    description="AI-powered collaborative notes workspace",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router, prefix="/api")
app.include_router(notes.router, prefix="/api")
app.include_router(tags.router, prefix="/api")
app.include_router(ai.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "peblo-api"}
