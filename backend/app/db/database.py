import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import NullPool
from app.core.config import settings


def normalize_postgres_url(url: str) -> str:
    """Normalize a PostgreSQL URL to use the psycopg (v3) driver."""
    if not url:
        raise ValueError("DATABASE_URL must be set to a PostgreSQL connection string.")
    if url.startswith("sqlite"):
        raise ValueError("SQLite is no longer supported; configure a PostgreSQL DATABASE_URL.")
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg://", 1)
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


db_url = normalize_postgres_url(settings.DATABASE_URL)

# Serverless-safe pooling: NullPool on Vercel/Lambda (paired with provider pooler e.g. Neon/Supabase),
# small bounded pool with pre_ping for containerized/long-running servers.
is_serverless = bool(
    os.environ.get("VERCEL")
    or os.environ.get("AWS_LAMBDA_FUNCTION_NAME")
    or os.environ.get("DB_POOL_MODE") == "null"
)

engine_kwargs = {"pool_pre_ping": True}
if is_serverless:
    engine_kwargs["poolclass"] = NullPool
else:
    engine_kwargs["pool_size"] = 5
    engine_kwargs["max_overflow"] = 5

engine = create_engine(db_url, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    from app.models import user, note, tag, ai_generation, embedding  # noqa: F401

    with engine.begin() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
    Base.metadata.create_all(bind=engine)
