# DSA AI Teacher

An AI-powered data structures and algorithms tutor that turns a topic into a written explanation, a short visual lesson, and voice narration.

## Highlights

- React + Vite frontend with a modern AI studio interface
- FastAPI backend with clean request logging and health checks
- Hugging Face Inference Providers for cloud LLM generation
- No local LLM inference, GPU, or heavy model downloads
- Separate AI outputs for written answer and visual-video narration
- Canvas-based animated lessons for arrays, hash maps, trees, graphs, stacks, queues, linked lists, and DP tables
- Edge TTS narration with graceful fallback when speech generation is unavailable
- Deployment-friendly environment variable setup

## Tech Stack

- Frontend: React, Vite, Axios, Canvas API
- Backend: FastAPI, httpx, Hugging Face router API, edge-tts
- Runtime goal: lightweight enough for Render/Vercel-style deployments

## Project Structure

```text
dsa-ai-app/
|-- backend/
|   |-- main.py
|   |-- requirements.txt
|   |-- .env.example
|   `-- .env
`-- frontend/
    |-- index.html
    |-- package.json
    |-- vite.config.js
    `-- src/
        |-- main.jsx
        |-- App.jsx
        |-- LessonVideo.jsx
        `-- index.css
```

## Local Setup

### Backend

```powershell
cd E:\dsa-ai-app\backend
python -m venv ..\.venv
E:\dsa-ai-app\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload
```

Create `backend/.env` from `backend/.env.example`:

```env
HF_TOKEN=your_huggingface_token_here
HF_MODEL=Qwen/Qwen2.5-7B-Instruct
HF_API_URL=https://router.huggingface.co/v1/chat/completions
FRONTEND_ORIGIN=http://localhost:5173
TTS_VOICE=en-US-AriaNeural
TTS_MAX_CHARS=3000
LOG_LEVEL=INFO
```

### Frontend

```powershell
cd E:\dsa-ai-app\frontend
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

## API

### `GET /health`

Returns backend status, selected Hugging Face model, TTS voice, and whether an HF token is configured.

### `POST /api/teach`

Request:

```json
{
  "topic": "HashMap"
}
```

Response:

```json
{
  "topic": "HashMap",
  "explanation": "Written answer...",
  "video_script": "Narration for the animated visual lesson...",
  "audio_base64": "base64-mp3-data",
  "audio_error": "",
  "model": "Qwen/Qwen2.5-7B-Instruct",
  "generated_at_ms": 8000
}
```

## Resume Summary

Built a full-stack AI DSA tutor using React, FastAPI, Hugging Face Inference Providers, and browser Canvas animations. The app generates separate written explanations and visual lesson scripts, produces optional voice narration, avoids local model inference, and includes production-style logging, environment configuration, and graceful error handling.

## Deployment Notes

- Keep `HF_TOKEN` only on the backend.
- Do not expose Hugging Face tokens in frontend environment variables.
- Set `FRONTEND_ORIGIN` to your deployed frontend URL.
- On free Hugging Face accounts, inference credits are limited monthly.
- If Edge TTS is blocked by network/provider issues, the app still returns the written and visual lesson.
