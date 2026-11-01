import sys
import os

# Add backend directory to sys.path
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
backend_dir = os.path.join(root_dir, "backend")

if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.main import app
from app.db.database import init_db

# Initialize database schema eagerly for serverless handlers if lifespan is bypassed
try:
    init_db()
except Exception as e:
    print(f"Warning: eager init_db failed: {e}")


