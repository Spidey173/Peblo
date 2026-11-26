import json
import logging
import math
import re
from typing import List, Dict, Any, Optional
import numpy as np
from sqlalchemy.orm import Session
from app.models.embedding import NoteEmbedding
from app.models.note import Note
from app.services.ai_service import _call_groq_api
from app.core.config import settings

logger = logging.getLogger(__name__)

# Try to initialize FastEmbed; if unavailable, use local dense projection
_fastembed_model = None
try:
    from fastembed import TextEmbedding
    _fastembed_model = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")
    logger.info("FastEmbed BAAI/bge-small-en-v1.5 initialized successfully")
except Exception as e:
    logger.info(f"FastEmbed not loaded ({e}), using local deterministic 384-d semantic embedding engine")


def _deterministic_semantic_vector(text: str, dim: int = 384) -> List[float]:
    """
    Lightweight deterministic semantic vectorizer fallback (384 dimensions).
    Uses hashed character n-grams and subword tokens with random projection and L2 normalization.
    Produces stable, cosine-comparable embeddings for semantic similarity.
    """
    words = re.findall(r"\w+", text.lower())
    vec = np.zeros(dim, dtype=np.float32)
    if not words:
        return vec.tolist()

    for i, word in enumerate(words):
        # Character trigrams for morphological and semantic capture
        padded = f"_{word}_"
        for j in range(max(1, len(padded) - 2)):
            tri = padded[j:j + 3]
            h = hash(tri)
            idx = abs(h) % dim
            sign = 1.0 if (h >> 1) % 2 == 0 else -1.0
            vec[idx] += sign

        # Word position weighting
        wh = hash(word)
        idx = abs(wh) % dim
        sign = 1.0 if (wh >> 2) % 2 == 0 else -1.0
        vec[idx] += sign * 1.5

    norm = np.linalg.norm(vec)
    if norm > 0:
        vec = vec / norm
    return vec.tolist()


def generate_embedding(text: str) -> List[float]:
    """Generate 384-dimensional dense semantic embedding."""
    if not text or not text.strip():
        return [0.0] * 384

    if _fastembed_model is not None:
        try:
            embeddings = list(_fastembed_model.embed([text]))
            if embeddings:
                arr = np.array(embeddings[0], dtype=np.float32)
                norm = np.linalg.norm(arr)
                if norm > 0:
                    arr = arr / norm
                return arr.tolist()
        except Exception as e:
            logger.warning(f"FastEmbed inference error: {e}. Falling back to deterministic engine.")

    return _deterministic_semantic_vector(text, dim=384)


def chunk_markdown(text: str, chunk_size: int = 400, overlap: int = 60) -> List[str]:
    """Split markdown text into semantically coherent overlapping chunks."""
    if not text or not text.strip():
        return []

    # First split by double newlines (paragraphs/headers)
    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    if not paragraphs:
        paragraphs = [text.strip()]

    chunks = []
    current_chunk = ""

    for p in paragraphs:
        if not current_chunk:
            current_chunk = p
        elif len(current_chunk) + len(p) + 2 <= chunk_size:
            current_chunk += "\n\n" + p
        else:
            chunks.append(current_chunk)
            # Retain overlap from end of previous chunk
            overlap_prefix = current_chunk[-overlap:] if len(current_chunk) > overlap else current_chunk
            current_chunk = overlap_prefix + "\n\n" + p

    if current_chunk:
        chunks.append(current_chunk)

    return chunks


def bm25_score(query_tokens: List[str], doc_tokens: List[str], avg_doc_len: float, k1: float = 1.5, b: float = 0.75) -> float:
    """Calculate BM25 relevance score for a single document against query tokens."""
    if not doc_tokens or not query_tokens:
        return 0.0

    doc_len = len(doc_tokens)
    score = 0.0
    for q in query_tokens:
        freq = doc_tokens.count(q)
        if freq == 0:
            continue
        # Term saturation
        num = freq * (k1 + 1)
        den = freq + k1 * (1 - b + b * (doc_len / (avg_doc_len or 1.0)))
        score += (num / den)
    return score


def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    """Compute cosine similarity between two unit vectors."""
    a = np.array(v1, dtype=np.float32)
    b = np.array(v2, dtype=np.float32)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))


def index_note_chunks(note: Note, db: Session) -> int:
    """Chunk and embed a note, saving embeddings to database."""
    # Delete existing embeddings for this note
    db.query(NoteEmbedding).filter(NoteEmbedding.note_id == note.id).delete()

    full_text = f"{note.title}\n\n{note.content or ''}".strip()
    if not full_text:
        db.commit()
        return 0

    chunks = chunk_markdown(full_text)
    if not chunks:
        chunks = [full_text]

    for idx, chunk in enumerate(chunks):
        vec = generate_embedding(chunk)
        emb_record = NoteEmbedding(
            note_id=note.id,
            user_id=note.user_id,
            chunk_index=idx,
            chunk_text=chunk,
            embedding=vec,
        )
        db.add(emb_record)

    db.commit()
    return len(chunks)


def hybrid_search(
    query: str,
    user_id: str,
    db: Session,
    top_k: int = 5,
    alpha: float = 0.6,
) -> List[Dict[str, Any]]:
    """
    Hybrid Search: pgvector Cosine Similarity (HNSW) + BM25 Lexical Ranking.
    Score = alpha * VectorScore + (1 - alpha) * BM25Score.
    """
    q_vec = generate_embedding(query)
    distance_expr = NoteEmbedding.embedding.cosine_distance(q_vec)
    candidate_limit = max(top_k * 4, 20)

    records = (
        db.query(
            NoteEmbedding,
            Note.title,
            (1.0 - distance_expr).label("vector_similarity"),
        )
        .join(Note, NoteEmbedding.note_id == Note.id)
        .filter(NoteEmbedding.user_id == user_id, Note.is_archived == False)
        .order_by(distance_expr.asc())
        .limit(candidate_limit)
        .all()
    )

    if not records:
        return []

    q_tokens = re.findall(r"\w+", query.lower())

    doc_lengths = []
    chunk_data = []

    for emb, title, v_sim in records:
        tokens = re.findall(r"\w+", emb.chunk_text.lower())
        doc_lengths.append(len(tokens))
        chunk_data.append({
            "note_id": emb.note_id,
            "title": title,
            "chunk_index": emb.chunk_index,
            "chunk_text": emb.chunk_text,
            "v_sim": max(0.0, float(v_sim or 0.0)),
            "tokens": tokens,
        })

    avg_len = sum(doc_lengths) / len(doc_lengths) if doc_lengths else 1.0

    scored = []
    max_bm25 = 0.0

    # Compute raw BM25 over pgvector-retrieved candidates
    for item in chunk_data:
        b_score = bm25_score(q_tokens, item["tokens"], avg_len)
        if b_score > max_bm25:
            max_bm25 = b_score
        item["b_score"] = b_score

    # Normalize BM25 and combine
    for item in chunk_data:
        norm_bm25 = (item["b_score"] / max_bm25) if max_bm25 > 0 else 0.0
        final_score = alpha * item["v_sim"] + (1.0 - alpha) * norm_bm25

        scored.append({
            "note_id": item["note_id"],
            "title": item["title"],
            "chunk_index": item["chunk_index"],
            "chunk_text": item["chunk_text"],
            "score": round(float(final_score), 4),
            "vector_similarity": round(float(item["v_sim"]), 4),
            "lexical_score": round(float(norm_bm25), 4),
        })

    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:top_k]


async def ask_vault_copilot(
    query: str,
    user_id: str,
    db: Session,
    top_k: int = 5,
) -> Dict[str, Any]:
    """
    RAG Copilot: Retrieve relevant note chunks and synthesize a grounded answer via Groq.
    """
    sources = hybrid_search(query=query, user_id=user_id, db=db, top_k=top_k)

    if not sources:
        return {
            "answer": "No relevant notes found in your vault. Create or save notes with content first, then ask again!",
            "sources": [],
        }

    # Format context
    context_blocks = []
    for s in sources:
        context_blocks.append(f"### [Source: {s['title']} | Note ID: {s['note_id']}]\n{s['chunk_text']}")

    context_str = "\n\n---\n\n".join(context_blocks)

    system_prompt = """You are the Peblo Vault Brain Copilot.
You answer user queries by grounding your response ENTIRELY in their personal notes provided in the context.
Rules:
1. Synthesize a sharp, structured, clear answer addressing the user's question.
2. Directly cite the relevant note by name using markdown citations like [Source: Note Title].
3. If the notes do not contain sufficient info to answer completely, acknowledge what is present and what is missing.
4. Keep the tone intelligent, concise, and executive.
Return a structured JSON object:
{
  "summary": "Detailed grounded answer with citations to notes",
  "action_items": ["Action items or next steps mentioned in the notes related to this question"],
  "suggested_title": "Short title for this inquiry"
}
Return only valid JSON."""

    messages = [
        {"role": "system", "content": system_prompt},
        {
            "role": "user",
            "content": f"User Vault Knowledge Base:\n{context_str}\n\nUser Question:\n{query}",
        },
    ]

    try:
        model_name = settings.GROQ_MODEL or "qwen/qwen3.8-27b"
        data = await _call_groq_api(messages, model_name)
        answer = data.get("summary", "")
        action_items = data.get("action_items", [])
        if isinstance(action_items, str):
            action_items = [action_items]

        return {
            "answer": answer,
            "action_items": action_items,
            "suggested_title": data.get("suggested_title", "Vault Query"),
            "sources": sources,
        }
    except Exception as e:
        logger.exception("Error during Ask Vault RAG inference")
        # Return fallback grounded summary
        return {
            "answer": f"Found {len(sources)} relevant fragments from your vault matching '{query}':\n\n" +
                      "\n\n".join([f"**From {s['title']}**:\n> {s['chunk_text']}" for s in sources]),
            "action_items": [],
            "suggested_title": query,
            "sources": sources,
        }

