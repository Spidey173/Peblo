#!/usr/bin/env python3
"""
LEGACY ONE-OFF MIGRATION SCRIPT: SQLite -> PostgreSQL + pgvector.

This script is the ONLY file in the repository permitted to import `sqlite3`.
It reads rows from existing local SQLite database files (peblo.db / backend/peblo.db)
and idempotently loads them into PostgreSQL, converting JSON-serialized embeddings
into pgvector `vector(384)` values.

You may delete this script once you have verified your data in PostgreSQL.

Usage:
    DIRECT_URL="postgresql+psycopg://..." python scripts/migrate_sqlite_to_postgres.py
    # Or specify explicit SQLite paths:
    python scripts/migrate_sqlite_to_postgres.py --sqlite-path backend/peblo.db --sqlite-path peblo.db
"""

import argparse
import json
import os
import sqlite3
import sys
from pathlib import Path
from typing import Any, List, Optional

import psycopg


TABLES_IN_ORDER = [
    "users",
    "tags",
    "notes",
    "note_tags",
    "ai_generations",
    "note_embeddings",
]


def _normalize_psycopg_dsn(raw_url: str) -> str:
    if raw_url.startswith("postgresql+psycopg://"):
        return raw_url.replace("postgresql+psycopg://", "postgresql://", 1)
    if raw_url.startswith("postgres://"):
        return raw_url.replace("postgres://", "postgresql://", 1)
    return raw_url


def _to_bool(val: Any, default: bool = False) -> bool:
    if val is None:
        return default
    return bool(int(val)) if isinstance(val, (int, str)) and str(val).isdigit() else bool(val)


def _format_pgvector(raw_embedding: Any) -> str:
    if isinstance(raw_embedding, str):
        vec = json.loads(raw_embedding)
    elif isinstance(raw_embedding, list):
        vec = raw_embedding
    else:
        raise ValueError(f"Unsupported embedding format: {type(raw_embedding)}")
    if len(vec) != 384:
        raise ValueError(f"Expected 384-d embedding, got {len(vec)}")
    return "[" + ",".join(str(float(x)) for x in vec) + "]"


def _table_exists(sqlite_conn: sqlite3.Connection, table_name: str) -> bool:
    row = sqlite_conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
        (table_name,),
    ).fetchone()
    return row is not None


def migrate_file(sqlite_path: Path, pg_conn: psycopg.Connection) -> None:
    print(f"\n--- Reading SQLite source: {sqlite_path} ---")
    s_conn = sqlite3.connect(str(sqlite_path))
    s_conn.row_factory = sqlite3.Row

    try:
        with pg_conn.cursor() as cur:
            # 1. users
            if _table_exists(s_conn, "users"):
                rows = s_conn.execute("SELECT * FROM users").fetchall()
                print(f"  users: {len(rows)} source rows")
                for r in rows:
                    cur.execute(
                        """
                        INSERT INTO users (id, email, username, hashed_password, full_name, avatar_color, is_active, created_at, updated_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (id) DO NOTHING
                        """,
                        (
                            r["id"],
                            r["email"],
                            r["username"],
                            r["hashed_password"],
                            r["full_name"],
                            r["avatar_color"],
                            _to_bool(r["is_active"], True),
                            r["created_at"],
                            r["updated_at"],
                        ),
                    )

            # 2. tags
            if _table_exists(s_conn, "tags"):
                rows = s_conn.execute("SELECT * FROM tags").fetchall()
                print(f"  tags: {len(rows)} source rows")
                for r in rows:
                    cur.execute(
                        """
                        INSERT INTO tags (id, name, color, user_id, created_at)
                        VALUES (%s, %s, %s, %s, %s)
                        ON CONFLICT (id) DO NOTHING
                        """,
                        (r["id"], r["name"], r["color"], r["user_id"], r["created_at"]),
                    )

            # 3. notes
            if _table_exists(s_conn, "notes"):
                rows = s_conn.execute("SELECT * FROM notes").fetchall()
                print(f"  notes: {len(rows)} source rows")
                cols = set(rows[0].keys()) if rows else set()
                for r in rows:
                    cur.execute(
                        """
                        INSERT INTO notes (id, title, content, version, is_pinned, is_archived, is_public, share_token, user_id, created_at, updated_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (id) DO NOTHING
                        """,
                        (
                            r["id"],
                            r["title"],
                            r["content"],
                            r["version"] if "version" in cols and r["version"] is not None else 1,
                            _to_bool(r["is_pinned"], False) if "is_pinned" in cols else False,
                            _to_bool(r["is_archived"], False),
                            _to_bool(r["is_public"], False),
                            r["share_token"],
                            r["user_id"],
                            r["created_at"],
                            r["updated_at"],
                        ),
                    )

            # 4. note_tags
            if _table_exists(s_conn, "note_tags"):
                rows = s_conn.execute("SELECT * FROM note_tags").fetchall()
                print(f"  note_tags: {len(rows)} source rows")
                for r in rows:
                    cur.execute(
                        """
                        INSERT INTO note_tags (note_id, tag_id)
                        VALUES (%s, %s)
                        ON CONFLICT (note_id, tag_id) DO NOTHING
                        """,
                        (r["note_id"], r["tag_id"]),
                    )

            # 5. ai_generations
            if _table_exists(s_conn, "ai_generations"):
                rows = s_conn.execute("SELECT * FROM ai_generations").fetchall()
                print(f"  ai_generations: {len(rows)} source rows")
                for r in rows:
                    cur.execute(
                        """
                        INSERT INTO ai_generations (id, note_id, summary, action_items, suggested_title, content_hash, token_count, created_at, updated_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (note_id) DO NOTHING
                        """,
                        (
                            r["id"],
                            r["note_id"],
                            r["summary"],
                            r["action_items"],
                            r["suggested_title"],
                            r["content_hash"],
                            r["token_count"] or 0,
                            r["created_at"],
                            r["updated_at"],
                        ),
                    )

            # 6. note_embeddings
            if _table_exists(s_conn, "note_embeddings"):
                rows = s_conn.execute("SELECT * FROM note_embeddings").fetchall()
                print(f"  note_embeddings: {len(rows)} source rows")
                for r in rows:
                    vec_literal = _format_pgvector(r["embedding"])
                    cur.execute(
                        """
                        INSERT INTO note_embeddings (id, note_id, user_id, chunk_index, chunk_text, embedding, created_at)
                        VALUES (%s, %s, %s, %s, %s, %s::vector, %s)
                        ON CONFLICT (id) DO NOTHING
                        """,
                        (
                            r["id"],
                            r["note_id"],
                            r["user_id"],
                            r["chunk_index"],
                            r["chunk_text"],
                            vec_literal,
                            r["created_at"],
                        ),
                    )
        pg_conn.commit()
    finally:
        s_conn.close()


def print_postgres_counts(pg_conn: psycopg.Connection) -> None:
    print("\n=== PostgreSQL Destination Row Counts ===")
    with pg_conn.cursor() as cur:
        for table in TABLES_IN_ORDER:
            cnt = cur.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
            print(f"  {table}: {cnt} rows")


def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="Migrate legacy SQLite peblo.db files to PostgreSQL + pgvector.")
    parser.add_argument(
        "--sqlite-path",
        action="append",
        dest="sqlite_paths",
        help="Path to SQLite .db file (can be passed multiple times). Defaults to peblo.db and backend/peblo.db if present.",
    )
    args = parser.parse_args(argv)

    raw_pg_url = os.environ.get("DIRECT_URL") or os.environ.get("DATABASE_URL")
    if not raw_pg_url:
        print("Error: Set DIRECT_URL or DATABASE_URL to your PostgreSQL connection string.", file=sys.stderr)
        return 1

    dsn = _normalize_psycopg_dsn(raw_pg_url)

    paths = [Path(p) for p in args.sqlite_paths] if args.sqlite_paths else [Path("peblo.db"), Path("backend/peblo.db")]
    existing_paths = [p for p in paths if p.exists()]
    if not existing_paths:
        print("No SQLite .db files found to migrate.")
        return 0

    with psycopg.connect(dsn) as pg_conn:
        with pg_conn.cursor() as cur:
            cur.execute("CREATE EXTENSION IF NOT EXISTS vector")
        pg_conn.commit()

        for path in existing_paths:
            migrate_file(path, pg_conn)

        print_postgres_counts(pg_conn)

    print("\nMigration completed. Verify counts above, then you may delete this script and the .db files.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

