# Viral Content Reverse-Engineering, Adaptation & Content Calendar Engine

An autonomous, full-stack intelligence and distribution engine that ingests viral social content (YouTube Shorts, Instagram Reels, TikTok, LinkedIn posts, or direct video file uploads), deconstructs the underlying psychology, pacing, narrative arc, and visual storytelling, adapts that pattern into high-conversion content customized for any client company profile, and manages the entire publishing lifecycle via an integrated **Content Calendar**.

---

## What's New: Content Calendar & Multi-Channel Distribution Engine

The engine now features a complete **Content Calendar & Workflow System** designed around the multi-platform nature of adapted concepts:

```
Viral Video / Post Ingestion
        ↓
Multimodal AI Psychology Extraction & Brand QA Gate (80+ Score)
        ↓
3-Platform Ideation (LinkedIn Post, Instagram Reel Script, WhatsApp Broadcast)
        ↓
📅 Content Calendar & Strategy Engine (Month Grid, Weekly Timeline, Kanban Pipeline)
        ↓
Export to CSV / iCalendar (.ics) Feed / Direct Social Publishing
```

### 1. 1-to-Many Concept-to-Calendar Scheduling
- **1-Click Publishing Bridge**: Schedule independent platform outputs from a single concept directly to different dates and times.
- **Dedicated Platform Hand-offs**:
  - **LinkedIn Post Tab** $\to$ Click *"Schedule to Calendar"* (pre-fills high-authority text, CTA, and QA score).
  - **Video Scenes Tab** $\to$ Click *"Schedule Reel"* (pre-fills scene-by-scene script, visual cues, and overlays).
  - **WhatsApp Tab** $\to$ Click *"Schedule Drop"* (pre-fills conversational VIP message).
  - **Concept Card Shortcut** $\to$ Hover on any card in the Library and click the 📅 calendar icon.

### 2. Triple Interactive Calendar Views
- **Month Grid View (`MonthView`)**:
  - 30-day bird's-eye view of publishing frequency, channel balance, and density.
  - **Interactive Drag-and-Drop**: Drag any post card from one day to another to reschedule in real-time.
  - Color-coded platform identity: 🟦 LinkedIn, 🟣 Instagram/Video, 🟩 WhatsApp, 🟨 Newsletter/Custom.
- **Weekly Timeline View (`WeekView`)**:
  - Detailed daily planner with full copy previews, character & word counters, QA score badges, and one-click copy buttons.
- **Workflow Kanban Board (`KanbanView`)**:
  - Production pipeline columns: `Drafts & Ideas` $\to$ `In Production` $\to$ `QA Approved` $\to$ `Scheduled` $\to$ `Published`.
  - Drag cards across columns to advance their publishing status.

### 3. Strategy Analytics & Cadence Health
- **Cadence Meter**: Real-time stats showing total scheduled assets, published count, and pipeline distribution.
- **Visual Channel Proportion Bar**: Proportional breakdown of content across LinkedIn, Instagram Reels, and WhatsApp.
- **QA Score Tracking**: Average Brand QA audit score calculated across scheduled content.

### 4. Enterprise Export & Sync Tools
- **Export to CSV**: Download scheduled posts formatted for Buffer, Hootsuite, Sprout Social, or Notion.
- **Sync iCal (`.ics`)**: Live calendar feed compatible with Google Calendar, Apple Calendar, and Outlook.

---

## Core Engine Architecture & Highlights

- **Dynamic Company Profile Engine**: No hardcoded context. Configurable via UI/API with custom ICP, pain points, offerings, and brand voice guidelines.
- **Layer 0 LinkedIn OpenGraph Bypass**: Solves `yt-dlp` photo/carousel post failures using `User-Agent: Twitterbot/1.0`. Extracts `og:image` and `og:description`, renders a 5-second silent MP4 via FFmpeg, and saves `transcript_override.txt`.
- **Social Video Waterfall**: Instagram RapidAPI $\to$ Cobalt API $\to$ `yt-dlp` (`bestvideo+bestaudio` mp4) + direct video upload.
- **FFmpeg Frame & Audio Sampling**: Extracts `-q:a 4` MP3 audio and 5–7 representative frames evenly sampled across video duration.
- **Resilient Two-Layer Transcription**: Groq Whisper (`whisper-large-v3`) primary with seamless fallback to Gemini multimodal audio transcription.
- **In-Memory PIL Processing**: Video frames passed directly as in-memory `PIL.Image` objects to `gemini-flash-lite-latest` (strictly avoiding deprecated models and `upload_file` permission errors).
- **Anti-AI Polish & Strict Zero-Emoji Constraint**: Enforced both at system prompt level and deterministically via Unicode emoji regex sanitation.
- **Automated Brand QA Evaluator**: Scores hook strength, voice alignment, specificity, and anti-AI tone out of 100. If score is below 80, auto-regenerates once with critique notes.
- **Dual-Mode Persistence**: PostgreSQL / Neon with automatic local SQLite fallback for instant zero-friction development.

---

## API Reference

### Content Calendar Endpoints (`/api/v1/calendar`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/calendar` | List scheduled posts (supports `client_id`, `month`, `start_date`, `end_date`, `status`, `platform` filters) |
| `POST` | `/api/v1/calendar` | Schedule a new post (linked to a concept or standalone) |
| `GET` | `/api/v1/calendar/{id}` | Get single calendar event details |
| `PUT` | `/api/v1/calendar/{id}` | Update title, copy, date, time, status, or notes |
| `PATCH` | `/api/v1/calendar/{id}/reschedule` | Quick reschedule date & time (used by drag-and-drop) |
| `PATCH` | `/api/v1/calendar/{id}/status` | Quick update workflow status (used by Kanban board) |
| `DELETE` | `/api/v1/calendar/{id}` | Remove a post from the calendar |
| `GET` | `/api/v1/calendar/export/csv` | Download calendar as `.csv` file |
| `GET` | `/api/v1/calendar/export/ics` | Download calendar as `.ics` iCalendar feed |

### Ingestion & Dashboard Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/ingest/url` | Ingest viral URL (YouTube, Instagram, TikTok, LinkedIn) |
| `POST` | `/api/v1/ingest/file` | Ingest uploaded MP4/MOV video file |
| `GET` | `/api/v1/ingest/queue/{id}` | Polling status of async ingestion pipeline |
| `GET` | `/api/v1/dashboard/concepts` | Fetch adapted concepts library (filterable by `client_id`) |
| `GET` | `/api/v1/dashboard/concepts/{id}` | Fetch concept with full extracted intelligence & analysis |
| `DELETE` | `/api/v1/dashboard/concepts/{id}` | Cascading delete of concept and associated analysis |
| `GET` | `/api/v1/profiles` | List company/client brand profiles |
| `POST` | `/api/v1/profiles` | Create or update company ICP and brand voice guidelines |

---

## Quick Start

### 1. Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate      # On Windows (or source venv/bin/activate on Linux/Mac)
pip install -r requirements.txt
cp .env.example .env       # Add GEMINI_API_KEY and GROQ_API_KEY
python -m uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Visit **`http://localhost:5173`** in your browser to start reverse-engineering content and planning your editorial calendar!
