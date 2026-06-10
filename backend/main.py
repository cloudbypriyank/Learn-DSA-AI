import base64
import json
import logging
import os
import re
import time
from pathlib import Path
from uuid import uuid4
from typing import Any

import edge_tts
import httpx
from aiohttp import WSServerHandshakeError
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


load_dotenv()

# Ensure ALL Dependencies are installed before starting the API, so users don't get partial failures after waiting for the model response.
HF_TOKEN = os.getenv("HF_TOKEN")
HF_MODEL = os.getenv("HF_MODEL", "Qwen/Qwen2.5-7B-Instruct")
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
ALLOWED_ORIGINS = [origin.strip() for origin in FRONTEND_ORIGIN.split(",") if origin.strip()]
HF_API_URL = os.getenv("HF_API_URL", "https://router.huggingface.co/v1/chat/completions")
TTS_VOICE = os.getenv("TTS_VOICE", "en-US-AriaNeural")
TTS_MAX_CHARS = int(os.getenv("TTS_MAX_CHARS", "3000"))
AVAILABLE_TTS_VOICES = {
    "en-US-AriaNeural": "English US - Aria",
    "en-US-GuyNeural": "English US - Guy",
    "en-IN-NeerjaNeural": "English India - Neerja",
    "en-IN-PrabhatNeural": "English India - Prabhat",
    "hi-IN-SwaraNeural": "Hindi - Swara",
    "hi-IN-MadhurNeural": "Hindi - Madhur",
    "mr-IN-AarohiNeural": "Marathi - Aarohi",
    "mr-IN-ManoharNeural": "Marathi - Manohar",
}

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger("dsa-ai-teacher")

# Create FastAPI app and add CORS middleware to allow requests from the frontend origin.
app = FastAPI(title="DSA AI Teacher API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[*ALLOWED_ORIGINS, "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    request_id = uuid4().hex[:8]
    started_at = time.perf_counter()
    logger.info("[%s] HTTP start | method=%s | path=%s", request_id, request.method, request.url.path)

    response = await call_next(request)
    elapsed_ms = round((time.perf_counter() - started_at) * 1000)
    response.headers["X-Request-ID"] = request_id
    logger.info(
        "[%s] HTTP end | status=%s | elapsed_ms=%s",
        request_id,
        response.status_code,
        elapsed_ms,
    )
    return response


class TeachRequest(BaseModel):
    topic: str = Field(..., min_length=2, max_length=80)
    voice: str | None = Field(default=None, max_length=80)


class TeachResponse(BaseModel):
    topic: str
    explanation: str
    video_script: str = ""
    audio_base64: str = ""
    audio_error: str = ""
    model: str = HF_MODEL
    generated_at_ms: int = 0
    voice: str = TTS_VOICE

#Prompt engineering is the process of designing and refining the input prompts given to AI models to elicit desired responses. In this code, the build_prompt function constructs a detailed prompt for a language model, instructing it to generate both a text answer and a video script based on a given topic and voice preference. The prompt includes specific rules for how the text answer and video script should be structured, as well as language guidelines based on the selected voice. This careful crafting of the prompt helps ensure that the AI generates content that is relevant, clear, and appropriately tailored to the user's needs.
def build_prompt(topic: str, voice: str) -> str:
    """Create separate text-answer and visual-video instructions."""
    if voice.startswith("hi-IN"):
        video_language_rule = (
            "CRITICAL: Write video_script mostly in Hindi using Devanagari script because the selected voice is Hindi. "
            "Use simple Hindi/Hinglish. Keep only unavoidable technical terms like array, graph, hash map, node, edge, and time complexity in English. "
            "Do not write the video_script fully in English."
        )
        teacher_tone_example = "Use a friendly teacher tone, for example: 'Chaliye screen par dekhte hain ki data kaise store hota hai.'"
    elif voice.startswith("mr-IN"):
        video_language_rule = (
            "CRITICAL: Write video_script mostly in Marathi using Devanagari script because the selected voice is Marathi. "
            "Use simple Marathi that students can understand. Keep only unavoidable technical terms like array, graph, hash map, node, edge, and time complexity in English. "
            "Do not write the video_script fully in English."
        )
        teacher_tone_example = "Use a friendly teacher tone, for example: 'Chala, screen var baghuya data kasa store hoto.'"
    else:
        video_language_rule = "Write video_script in natural English."
        teacher_tone_example = "Use a friendly teacher tone, for example: 'Hey, let us see what happens on the screen.'"

    return (
        "You are an expert DSA teacher creating content for a beginner-friendly AI learning app.\n"
        "The frontend sends only a short topic. Your job is to expand it into a clear written answer "
        "and a useful visual-video narration.\n\n"
        "Return ONLY valid JSON. Do not add markdown fences, comments, or extra text.\n\n"
        "Required JSON shape:\n"
        "{\n"
        '  "text_answer": "string",\n'
        '  "video_script": "string"\n'
        "}\n\n"
        "TEXT_ANSWER RULES:\n"
        "- Explain like the learner is new to DSA.\n"
        "- Use these plain sections: Intuition, How it works, Example, Time complexity, Space complexity, When to use it.\n"
        "- Keep it practical and simple. Avoid unnecessary theory.\n"
        "- Include one small concrete example.\n\n"
        "VIDEO_SCRIPT RULES:\n"
        "- Make this different from the text answer. It is not a summary.\n"
        "- Write it as spoken narration for a 45 to 75 second visual animation.\n"
        "- Keep it between 650 and 1000 characters.\n"
        f"- {teacher_tone_example}\n"
        "- Describe what the viewer should see being drawn step by step.\n"
        "- Use a concrete visual example with real values, keys, nodes, edges, or cells.\n"
        "- Explain why each visual step matters, not just what it is called.\n"
        "- End with the main takeaway in one simple sentence.\n"
        "- Do not mention that you are an AI model.\n"
        "- Do not include code unless the topic absolutely needs it.\n"
        f"- {video_language_rule}\n\n"
        "VISUAL STYLE TO ASSUME:\n"
        "- The video can draw arrays as boxes, hash maps as buckets, trees as connected nodes, graphs as nodes and edges, "
        "linked lists as boxes with arrows, stacks/queues as moving boxes, and DP as a grid.\n"
        "- The narration should match those drawings so the student can understand the topic even before reading the text answer.\n\n"
        f"Topic: {topic.strip()}"
    )


def get_script_language(voice: str) -> str:
    if voice.startswith("hi-IN"):
        return "Hindi"
    if voice.startswith("mr-IN"):
        return "Marathi"
    return "English"


def has_devanagari(text: str) -> bool:
    return bool(re.search(r"[\u0900-\u097F]", text))


def extract_generated_text(payload: Any) -> str:
    """Handle common Hugging Face Inference API response shapes."""
    if isinstance(payload, dict) and payload.get("choices"):
        message = payload["choices"][0].get("message", {})
        return message.get("content", "")

    if isinstance(payload, list) and payload:
        first = payload[0]
        if isinstance(first, dict):
            return first.get("generated_text") or first.get("summary_text") or ""

    if isinstance(payload, dict):
        if "generated_text" in payload:
            return payload["generated_text"]
        if "error" in payload:
            raise HTTPException(status_code=503, detail=payload["error"])

    return ""


def parse_lesson_content(raw_text: str, topic: str, request_id: str, voice: str) -> dict[str, str]:
    """Parse model JSON and fall back safely if the model adds extra text."""
    cleaned = raw_text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        cleaned = cleaned.replace("json\n", "", 1).replace("JSON\n", "", 1).strip()

    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError:
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start != -1 and end != -1 and end > start:
            try:
                data = json.loads(cleaned[start : end + 1])
            except json.JSONDecodeError:
                data = {}
        else:
            data = {}

    if not isinstance(data, dict):
        data = {}

    text_answer = str(data.get("text_answer") or "").strip()
    video_script = str(data.get("video_script") or "").strip()

    # Some models return JSON-looking text that is not valid JSON. Pull the two
    # fields out before falling back, so video narration never appears as answer text.
    if not text_answer:
        match = re.search(r'"text_answer"\s*:\s*"(?P<value>.*?)"\s*,\s*"video_script"', cleaned, re.DOTALL)
        if match:
            text_answer = match.group("value")

    if not video_script:
        match = re.search(r'"video_script"\s*:\s*"(?P<value>.*?)"\s*}?$', cleaned, re.DOTALL)
        if match:
            video_script = match.group("value")

    if text_answer:
        text_answer = text_answer.replace("\\n", "\n").replace('\\"', '"').strip()
    else:
        text_answer = cleaned

    if video_script:
        video_script = video_script.replace("\\n", "\n").replace('\\"', '"').strip()

    text_answer = re.sub(r'["{,]?\s*video_script\s*["]?\s*:\s*["\']?.*', "", text_answer, flags=re.DOTALL | re.IGNORECASE).strip()
    text_answer = re.sub(r'^\s*["{,]?\s*text_answer\s*["]?\s*:\s*["\']?', "", text_answer, flags=re.IGNORECASE).strip()
    text_answer = text_answer.strip(' "\',{}')

    needs_local_language = voice.startswith(("hi-IN", "mr-IN"))
    if not video_script or (needs_local_language and not has_devanagari(video_script)):
        logger.warning("[%s] Missing or wrong-language video_script from HF response; using fallback script", request_id)
        if voice.startswith("mr-IN"):
            video_script = (
                f"चला, {topic} screen वर सोप्या पद्धतीने समजून घेऊया. आधी structure draw होते. "
                "प्रत्येक box, node किंवा arrow data कुठे ठेवला जातो ते दाखवतो. आता highlighted step बघा, "
                "कारण इथेच main operation होते. शेवटी लक्षात ठेवा: योग्य data structure वापरला की problem जलद आणि सोप्या पद्धतीने solve होतो."
            )
        elif voice.startswith("hi-IN"):
            video_script = (
                f"चलिए, {topic} को screen पर आसान तरीके से समझते हैं. पहले structure draw होता है. "
                "हर box, node या arrow दिखाता है कि data कहां store या connect हो रहा है. अब highlighted step देखिए, "
                "क्योंकि यहीं main operation होता है. Main takeaway यह है कि सही data structure problem को fast और simple बना देता है."
            )
        else:
            video_script = (
                f"Hey, let us understand {topic} visually. First, watch the structure appear on the screen. "
                "Each part shows how data is stored or connected. Now follow the highlighted step, because "
                "that is the main operation. By the end, notice how the structure helps us solve the problem faster."
            )

    if not text_answer:
        logger.warning("[%s] Missing text_answer from HF response; using fallback answer", request_id)
        text_answer = (
            f"Intuition: {topic} is an important DSA concept that helps organize data for efficient problem solving.\n\n"
            "How it works: Break the idea into small operations, understand how data is stored, and track how lookup, insertion, or traversal happens.\n\n"
            "Example: Use a small input and follow each step visually.\n\n"
            "Time complexity: Depends on the operation and structure.\n\n"
            "Space complexity: Depends on how much extra storage is needed.\n\n"
            "When to use it: Use it when the problem pattern matches the structure or operation."
        )

    return {
        "text_answer": text_answer,
        "video_script": video_script[:1200],
    }


async def generate_lesson_content(topic: str, request_id: str, voice: str) -> dict[str, str]:
    if not HF_TOKEN:
        logger.error("[%s] HF_TOKEN missing", request_id)
        raise HTTPException(
            status_code=500,
            detail="HF_TOKEN is missing. Add it to backend/.env before starting the API.",
        )

    script_language = get_script_language(voice)
    logger.info(
        "[%s] HF lesson request started | model=%s | topic=%s | script_language=%s",
        request_id,
        HF_MODEL,
        topic,
        script_language,
    )
    headers = {
        "Authorization": f"Bearer {HF_TOKEN}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": HF_MODEL,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are a friendly DSA teacher who explains concepts clearly for beginners."
                    "Write video_script as 8 to 12 short narration lines."
                    "Each line should be on a new line."
                    "Each line should describe one visual scene."
                    "Keep each line under 15 words."
                    "Do not write large paragraphs."
                    "Make Sure Whatever user will understand the topic easily and the video script should be in a way that it can be visualized on screen with simple drawings. "
                    "Basically You are the AI behind a DSA learning app that gives students a written explanation and a visual narration for each topic. "
                    "I Trust on you to create engaging and educational content."
                    f"The video_script must be written in {script_language}. "
                    "The text_answer should stay in simple English unless the user explicitly asks otherwise."
                ),
            },
            {"role": "user", "content": build_prompt(topic, voice)},
        ],
        "max_tokens": 900,
        "temperature": 0.6,
        "response_format": {"type": "json_object"},
        
    }

    try:
        async with httpx.AsyncClient(timeout=60) as client:
            
            response = await client.post(HF_API_URL, headers=headers, json=payload)
    except httpx.TimeoutException as exc:
        logger.exception("[%s] HF request timed out", request_id)
        raise HTTPException(status_code=504, detail="Hugging Face request timed out.") from exc
    except httpx.HTTPError as exc:
        logger.exception("[%s] HF request failed before response", request_id)
        raise HTTPException(status_code=502, detail="Could not reach Hugging Face API.") from exc

    logger.info("[%s] HF response received | status=%s", request_id, response.status_code)
    if response.status_code >= 400:
        error_text = response.text
        if "model_not_supported" in error_text:
            error_text = (
                f"The Hugging Face model '{HF_MODEL}' is not available from your enabled "
                "Inference Providers. Change HF_MODEL in backend/.env to a provider-backed "
                "chat model, then restart the backend."
            )
        elif "402" in error_text or "monthly" in error_text.lower() or "credits" in error_text.lower():
            error_text = (
                "Hugging Face usage credits may be exhausted. Check your HF billing/credits page "
                "or switch to a smaller provider-backed model."
            )
        logger.error("[%s] HF error | detail=%s", request_id, error_text)
        raise HTTPException(status_code=response.status_code, detail=error_text)

    raw_text = extract_generated_text(response.json()).strip()
    if not raw_text:
        logger.error("[%s] HF returned empty lesson content", request_id)
        raise HTTPException(status_code=502, detail="Hugging Face returned an empty response.")

    lesson = parse_lesson_content(raw_text, topic, request_id, voice)
    logger.info(
        "[%s] Lesson content generated | text_chars=%s | video_script_chars=%s",
        request_id,
        len(lesson["text_answer"]),
        len(lesson["video_script"]),
    )
    return lesson


def get_voice_or_default(voice: str | None) -> str:
    """Use only known Edge TTS voices so the frontend cannot pass random values."""
    if voice and voice in AVAILABLE_TTS_VOICES:
        return voice
    return TTS_VOICE


async def generate_audio_base64(text: str, request_id: str, voice: str) -> str:
    """Generate a small MP3 with edge-tts and return it as a base64 data payload."""
    tts_text = text[:TTS_MAX_CHARS]
    logger.info(
        "[%s] TTS started | voice=%s | chars=%s",
        request_id,
        voice,
        len(tts_text),
    )

    communicate = edge_tts.Communicate(text=tts_text, voice=voice)
    audio_chunks: list[bytes] = []

    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_chunks.append(chunk["data"])

    audio_bytes = b"".join(audio_chunks)
    if not audio_bytes:
        raise RuntimeError("edge-tts returned no audio bytes.")

    logger.info("[%s] TTS completed | bytes=%s", request_id, len(audio_bytes))
    return base64.b64encode(audio_bytes).decode("utf-8")


@app.get("/health")
async def health() -> dict[str, str | bool]:
    return {
        "status": "ok",
        "model": HF_MODEL,
        "tts_voice": TTS_VOICE,
        "hf_token_configured": bool(HF_TOKEN),
    }


@app.get("/api/voices")
async def voices() -> dict[str, str | list[dict[str, str]]]:
    return {
        "default_voice": TTS_VOICE,
        "voices": [{"id": voice_id, "label": label} for voice_id, label in AVAILABLE_TTS_VOICES.items()],
    }


@app.post("/api/teach", response_model=TeachResponse)
async def teach_dsa(request: TeachRequest) -> TeachResponse:
    request_id = uuid4().hex[:8]
    started_at = time.perf_counter()
    topic = request.topic.strip()
    selected_voice = get_voice_or_default(request.voice)
    logger.info("[%s] Request received | topic=%s | voice=%s", request_id, topic, selected_voice)

    lesson = await generate_lesson_content(topic, request_id, selected_voice)
    explanation = lesson["text_answer"]
    video_script = lesson["video_script"]
    audio_base64 = ""
    audio_error = ""

    try:
        audio_base64 = await generate_audio_base64(video_script, request_id, selected_voice)
    except WSServerHandshakeError as exc:
        audio_error = (
            "Explanation is ready, but Microsoft Edge TTS rejected the speech connection. "
            "Update edge-tts with: pip install --upgrade edge-tts"
        )
        logger.exception("[%s] TTS websocket rejected | status=%s | error=%s", request_id, exc.status, exc)
    except Exception as exc:
        audio_error = (
            "Explanation is ready, but voice generation failed. "
            "Check backend logs and internet access for edge-tts."
        )
        logger.exception("[%s] TTS failed | error=%s", request_id, exc)

    elapsed_ms = round((time.perf_counter() - started_at) * 1000)
    logger.info(
        "[%s] Request completed | audio=%s | elapsed_ms=%s",
        request_id,
        bool(audio_base64),
        elapsed_ms,
    )
    return TeachResponse(
        topic=topic,
        explanation=explanation,
        video_script=video_script,
        audio_base64=audio_base64,
        audio_error=audio_error,
        model=HF_MODEL,
        generated_at_ms=elapsed_ms,
        voice=selected_voice,
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
