import hashlib
import json
from typing import Optional
from sqlalchemy.orm import Session
import google.generativeai as genai
from app.core.config import settings
from app.models.note import Note
from app.models.ai_generation import AIGeneration


def _content_hash(content: str) -> str:
    return hashlib.sha256(content.encode()).hexdigest()[:16]


def _configure_gemini():
    if not settings.GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not set")
    genai.configure(api_key=settings.GEMINI_API_KEY)
    return genai.GenerativeModel(
        model_name="gemini-1.5-flash",
        generation_config={
            "temperature": 0.4,
            "response_mime_type": "application/json",
        },
    )


SYSTEM_PROMPT = """You are an intelligent note analysis assistant. 
Analyze the given note content and return a structured JSON response with exactly these fields:
{
  "summary": "A concise 2-3 sentence summary of the note",
  "action_items": ["List of specific actionable tasks identified in the note"],
  "suggested_title": "A clear, descriptive title for this note (max 60 chars)"
}
If the note is empty or too short, return reasonable defaults. Always return valid JSON."""


async def generate_ai_insights(
    note: Note,
    db: Session,
    force_regenerate: bool = False,
) -> dict:
    content = note.content or ""
    content_hash = _content_hash(content + note.title)

    # Check cache
    existing = db.query(AIGeneration).filter(AIGeneration.note_id == note.id).first()
    if existing and not force_regenerate and existing.content_hash == content_hash:
        action_items = json.loads(existing.action_items) if existing.action_items else []
        return {
            "summary": existing.summary or "",
            "action_items": action_items,
            "suggested_title": existing.suggested_title or note.title,
            "cached": True,
        }

    # Call Gemini
    try:
        model = _configure_gemini()
        prompt = f"{SYSTEM_PROMPT}\n\nNote Title: {note.title}\n\nNote Content:\n{content}"
        response = model.generate_content(prompt)
        raw = response.text.strip()

        # Parse JSON safely
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        data = json.loads(raw)

        summary = data.get("summary", "")
        action_items = data.get("action_items", [])
        suggested_title = data.get("suggested_title", note.title)

        # Upsert cache
        if existing:
            existing.summary = summary
            existing.action_items = json.dumps(action_items)
            existing.suggested_title = suggested_title
            existing.content_hash = content_hash
        else:
            ai_gen = AIGeneration(
                note_id=note.id,
                summary=summary,
                action_items=json.dumps(action_items),
                suggested_title=suggested_title,
                content_hash=content_hash,
            )
            db.add(ai_gen)
        db.commit()

        return {
            "summary": summary,
            "action_items": action_items,
            "suggested_title": suggested_title,
            "cached": False,
        }
    except Exception as e:
        raise RuntimeError(f"Gemini AI error: {str(e)}")
