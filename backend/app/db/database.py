import os
from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

# Normalize database URL for Neon / PostgreSQL or Serverless SQLite
db_url = settings.DATABASE_URL

# In serverless environments (like Vercel Lambda), local disk is read-only except /tmp
if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
    if db_url.startswith("sqlite:///./") or db_url == "sqlite:///peblo.db":
        db_url = "sqlite:////tmp/peblo.db"

if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

connect_args = {}
if db_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    db_url,
    connect_args=connect_args,
    pool_pre_ping=True,
)

# Enforce foreign key constraints for SQLite
if db_url.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

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
    
    # Ensure SQLite parent directories exist if database is stored in a directory
    if db_url.startswith("sqlite:///"):
        import os
        db_path = db_url.replace("sqlite:///", "")
        db_dir = os.path.dirname(db_path)
        if db_dir and not os.path.exists(db_dir):
            os.makedirs(db_dir, exist_ok=True)
            
    Base.metadata.create_all(bind=engine)

    # Auto-migrate SQLite columns if missing
    if db_url.startswith("sqlite"):
        from sqlalchemy import text
        try:
            with engine.connect() as conn:
                res = conn.execute(text("PRAGMA table_info(notes);")).fetchall()
                col_names = [r[1] for r in res]
                if col_names and "is_pinned" not in col_names:
                    conn.execute(text("ALTER TABLE notes ADD COLUMN is_pinned BOOLEAN DEFAULT 0;"))
                    conn.commit()
                if col_names and "version" not in col_names:
                    conn.execute(text("ALTER TABLE notes ADD COLUMN version INTEGER DEFAULT 1;"))
                    conn.commit()
        except Exception:
            pass
