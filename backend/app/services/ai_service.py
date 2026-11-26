import hashlib
import json
import logging
from typing import Optional, List, Dict
from sqlalchemy.orm import Session
import httpx
from app.core.config import settings
from app.models.note import Note
from app.models.ai_generation import AIGeneration

logger = logging.getLogger(__name__)

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

SYSTEM_PROMPT_INSIGHTS = """You are an intelligent note analysis assistant for Peblo, the Obsidian Forge workspace.
Analyze the user's note and return a structured JSON response with exactly these fields:
{
  "summary": "A punchy, clear 2-3 sentence synthesis of the note's core thesis",
  "action_items": ["Array of concise, highly actionable directives extracted from the note"],
  "suggested_title": "A sharp, descriptive title for this note (max 60 chars)"
}
Return only valid JSON. Do not include markdown code block wrappers if possible."""

SYSTEM_PROMPT_FORMAT = """You are an expert markdown editor.
Transform the given raw notes into clean, beautifully structured Markdown.
Preserve all original information, facts, and intentions. Add appropriate headers (#, ##), bullet points, and task checkboxes (- [ ]) where logical.
Return a structured JSON object:
{
  "summary": "Brief summary of the edits made",
  "action_items": ["Key next steps identified in the note"],
  "suggested_title": "Clean, polished title for the note",
  "formatted_content": "The full formatted markdown text"
}
Return only valid JSON."""

SYSTEM_PROMPT_CHECKLIST = """You are a tactical directive extraction specialist.
Read the user's note and extract every explicit or implied action item, task, or deliverable.
Return a structured JSON object:
{
  "summary": "Quick one-sentence summary of the task plan",
  "action_items": ["Specific, executable action item 1", "Specific, executable action item 2"],
  "suggested_title": "Title reflecting the mission or project"
}
Return only valid JSON."""

SYSTEM_PROMPT_CUSTOM = """You are an intelligent AI co-pilot for the user's notes in Peblo.
The user provides their note along with a specific directive or question.
Execute the user's directive accurately, concisely, and thoughtfully.
Return a structured JSON object:
{
  "summary": "Direct, structured response answering the directive (clear, informative)",
  "action_items": ["Extracted actionable next steps if applicable, else empty array"],
  "suggested_title": "Descriptive title or label for this response"
}
Return only valid JSON."""


def _content_hash(content: str, mode: str = "insights") -> str:
    return hashlib.sha256(f"{mode}:{content}".encode()).hexdigest()[:16]


def _groq_headers() -> Dict[str, str]:
    return {
        "Authorization": f"Bearer {settings.GROQ_API_KEY}",
        "Content-Type": "application/json",
        "User-Agent": "Peblo-Forge/2.0",
    }


def _groq_model_candidates(model_name: str) -> List[str]:
    models = [model_name]
    for fallback in ("llama-3.3-70b-versatile", "llama-3.1-8b-instant"):
        if fallback not in models:
            models.append(fallback)
    return models


def _build_note_messages(
    note: Note,
    system_prompt: str,
    mode: str = "insights",
    custom_prompt: Optional[str] = None,
) -> List[Dict[str, str]]:
    user_text = f"Note Title: {note.title or 'Untitled Fragment'}\n\nNote Content:\n{note.content or ''}"
    if mode == "custom" and custom_prompt:
        user_text += f"\n\nUser Directive: {custom_prompt.strip()}"
    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_text},
    ]


async def _call_groq_api(messages: List[Dict[str, str]], model_name: str) -> dict:
    if not settings.GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY is not configured in backend/.env")

    headers = _groq_headers()
    models_to_try = _groq_model_candidates(model_name)

    last_error = None
    async with httpx.AsyncClient(timeout=35.0) as client:
        for model in models_to_try:
            payload = {
                "model": model,
                "messages": messages,
                "temperature": 0.2,
                "response_format": {"type": "json_object"},
            }
            try:
                response = await client.post(GROQ_API_URL, headers=headers, json=payload)
                if response.status_code == 200:
                    data = response.json()
                    content = data["choices"][0]["message"]["content"]
                    return json.loads(content)
                elif response.status_code in (400, 404):
                    # Model might not be supported or recognized; try fallback
                    last_error = response.text
                    logger.warning(f"Groq model {model} failed ({response.status_code}): {response.text}. Trying fallback.")
                    continue
                else:
                    response.raise_for_status()
            except httpx.HTTPStatusError as e:
                last_error = f"HTTP {e.response.status_code}: {e.response.text}"
                continue
            except json.JSONDecodeError:
                # If model returned text wrapped in markdown, clean it
                cleaned = content.strip()
                if "```" in cleaned:
                    parts = cleaned.split("```")
                    for p in parts[1:]:
                        candidate = p.strip()
                        if candidate.startswith("json"):
                            candidate = candidate[4:].strip()
                        try:
                            return json.loads(candidate)
                        except json.JSONDecodeError:
                            continue
                raise RuntimeError("Failed to parse JSON response from Groq")
            except Exception as e:
                last_error = str(e)
                continue

    raise RuntimeError(f"Groq inference failed: {last_error or 'Unknown error'}")


async def generate_ai_insights(
    note: Note,
    db: Session,
    force_regenerate: bool = False,
    mode: str = "insights",
    custom_prompt: Optional[str] = None,
) -> dict:
    content = note.content or ""
    content_hash = _content_hash(content + (note.title or ""), mode)

    # Check cache for standard insights mode
    existing = db.query(AIGeneration).filter(AIGeneration.note_id == note.id).first()
    if mode == "insights" and existing and not force_regenerate and existing.content_hash == content_hash:
        action_items = json.loads(existing.action_items) if existing.action_items else []
        return {
            "summary": existing.summary or "",
            "action_items": action_items,
            "suggested_title": existing.suggested_title or note.title,
            "formatted_content": None,
            "cached": True,
        }

    # Select system prompt based on mode
    prompt_map = {
        "format": SYSTEM_PROMPT_FORMAT,
        "checklist": SYSTEM_PROMPT_CHECKLIST,
        "custom": SYSTEM_PROMPT_CUSTOM,
    }
    system_prompt = prompt_map.get(mode, SYSTEM_PROMPT_INSIGHTS)
    messages = _build_note_messages(note, system_prompt, mode=mode, custom_prompt=custom_prompt)

    try:
        model_name = settings.GROQ_MODEL or "qwen/qwen3.8-27b"
        data = await _call_groq_api(messages, model_name)

        summary = data.get("summary", "")
        action_items = data.get("action_items", [])
        if isinstance(action_items, str):
            action_items = [action_items]
        suggested_title = data.get("suggested_title", note.title or "Tempered Slate")
        formatted_content = data.get("formatted_content", None)

        # Upsert cache only for primary insights mode using Postgres ON CONFLICT
        if mode == "insights":
            from sqlalchemy.dialects.postgresql import insert as pg_insert
            import uuid
            from datetime import datetime, timezone

            stmt = pg_insert(AIGeneration).values(
                id=str(uuid.uuid4()),
                note_id=note.id,
                summary=summary,
                action_items=json.dumps(action_items),
                suggested_title=suggested_title,
                content_hash=content_hash,
            )
            stmt = stmt.on_conflict_do_update(
                index_elements=["note_id"],
                set_={
                    "summary": stmt.excluded.summary,
                    "action_items": stmt.excluded.action_items,
                    "suggested_title": stmt.excluded.suggested_title,
                    "content_hash": stmt.excluded.content_hash,
                    "updated_at": datetime.now(timezone.utc),
                },
            )
            db.execute(stmt)
            db.commit()

        return {
            "summary": summary,
            "action_items": action_items,
            "suggested_title": suggested_title,
            "formatted_content": formatted_content,
            "cached": False,
        }
    except Exception as e:
        logger.exception("AI Generation error")
        raise RuntimeError(f"Groq AI error: {str(e)}")


async def stream_groq_inference(messages: List[Dict[str, str]], model_name: str):
    """
    Streams tokens in real time from Groq API using Server-Sent Events (SSE).
    Yields lines formatted as: data: {"token": "...", "done": false}\n\n
    """
    if not settings.GROQ_API_KEY:
        yield f"data: {json.dumps({'error': 'GROQ_API_KEY is not configured', 'done': True})}\n\n"
        return

    headers = _groq_headers()
    models_to_try = _groq_model_candidates(model_name)

    stream_success = False
    async with httpx.AsyncClient(timeout=45.0) as client:
        for model in models_to_try:
            payload = {
                "model": model,
                "messages": messages,
                "temperature": 0.3,
                "stream": True,
            }
            try:
                async with client.stream("POST", GROQ_API_URL, headers=headers, json=payload) as response:
                    if response.status_code != 200:
                        logger.warning(f"Groq stream model {model} failed ({response.status_code})")
                        continue

                    stream_success = True
                    async for line in response.aiter_lines():
                        if not line:
                            continue
                        if line.startswith("data: "):
                            raw_data = line[6:].strip()
                            if raw_data == "[DONE]":
                                break
                            try:
                                chunk = json.loads(raw_data)
                                choices = chunk.get("choices", [])
                                if choices:
                                    delta = choices[0].get("delta", {})
                                    content = delta.get("content", "")
                                    if content:
                                        event_payload = json.dumps({"token": content, "done": False})
                                        yield f"data: {event_payload}\n\n"
                            except Exception:
                                continue
                    break
            except Exception as e:
                logger.warning(f"Error streaming with model {model}: {e}")
                continue

    if not stream_success:
        yield f"data: {json.dumps({'error': 'Streaming failed across all models', 'done': True})}\n\n"
    else:
        yield f"data: {json.dumps({'token': '', 'done': True})}\n\n"


async def stream_ai_synthesis(note: Note, mode: str = "insights", custom_prompt: Optional[str] = None):
    """Generates prompt and streams tokens for a given note and mode."""
    prompt_map = {
        "format": (
            "You are an expert markdown editor. Transform the given raw notes into clean, beautifully structured Markdown. "
            "Preserve all facts. Use headers (##), bullet points, and task checkboxes (- [ ]). Stream the clean markdown directly."
        ),
        "checklist": (
            "You are a tactical directive extraction specialist. "
            "Extract every action item or deliverable as markdown checkboxes (- [ ] item). Stream the checklist directly."
        ),
        "custom": (
            "You are an intelligent AI co-pilot for the user's notes in Peblo. "
            "Execute the user's directive accurately, concisely, and thoughtfully based on the note. Stream your answer directly."
        ),
    }
    default_prompt = (
        "You are an intelligent note analysis assistant for Peblo. "
        "Synthesize a clear, punchy executive summary and list key takeaways. Stream your response in clean markdown."
    )
    system_prompt = prompt_map.get(mode, default_prompt)
    messages = _build_note_messages(note, system_prompt, mode=mode, custom_prompt=custom_prompt)

    model_name = settings.GROQ_MODEL or "qwen/qwen3.8-27b"
    async for chunk in stream_groq_inference(messages, model_name):
        yield chunk
