# Viral Content Reverse-Engineering & Multi-Platform Adaptation Engine

An autonomous, full-stack engine that ingests viral social content (YouTube Shorts, Instagram Reels, TikTok, LinkedIn video/photo posts, or direct video file uploads), deconstructs the psychology, pacing, narrative arc, and visual storytelling, and adapts that underlying structural pattern into high-conversion content customized for any specific company profile without hardcoding or AI tropes.

---

## Key Architectural Solutions & Highlights

- **Dynamic Client/Company Profile Engine**: No hardcoded brand context. Configurable via UI/API with custom ICP, pain points, offerings, and brand voice guidelines.
- **Layer 0 LinkedIn OpenGraph Bypass**: Solves `yt-dlp` photo/carousel post failures using `User-Agent: Twitterbot/1.0`. Extracts `og:image` and `og:description`, renders a 5-second silent MP4 via FFmpeg, and saves `transcript_override.txt`.
- **Social Video Waterfall**: Instagram RapidAPI $\to$ Cobalt API $\to$ `yt-dlp` (`bestvideo+bestaudio` mp4) + direct video upload.
- **FFmpeg Frame & Audio Sampling**: Extracts `-q:a 4` MP3 audio and 5–7 representative frames evenly sampled across the video duration using dynamic `imageio_ffmpeg` executable resolution.
- **Resilient Two-Layer Transcription**: Tries Groq Whisper (`whisper-large-v3`) primary, with seamless fallback to Gemini multimodal audio transcription.
- **In-Memory PIL Processing**: Video frames passed directly as in-memory `PIL.Image` objects to `gemini-flash-lite-latest` (strictly avoiding deprecated models and `upload_file` permission errors).
- **Single-Pass Structured Ideation**: Generates LinkedIn posts, Instagram Reel scripts, WhatsApp broadcasts, and scene-by-scene video breakdowns in ONE pass using `PlatformIdeations`.
- **Anti-AI Polish & Strict Zero-Emoji Constraint**: Enforced both at system prompt level and deterministically via Unicode emoji regex sanitation.
- **Automated Brand QA Evaluator**: Scores hook strength, voice alignment, specificity, and anti-AI tone out of 100. If score is below 80, auto-regenerates once with critique notes.
- **Dual-Mode Persistence**: Supabase PostgreSQL with automatic SQLite fallback for instant zero-friction local development. Safe cascading concept deletion (`DELETE /api/v1/dashboard/concepts/{id}`).

---

## Quick Start

### 1. Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate      # On Windows
pip install -r requirements.txt
cp .env.example .env       # Add your GEMINI_API_KEY and GROQ_API_KEY
python -m uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` in your browser.
