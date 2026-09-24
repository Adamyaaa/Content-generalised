import os
import logging
from pathlib import Path
from typing import Optional

from app.core.config import settings
from app.core.database import db
from app.models.queue import QueueStatus
from app.services.ingestion_service import ingestion_service
from app.services.media_processor import media_processor
from app.services.transcription_service import transcription_service
from app.services.reverse_engineer import reverse_engineer
from app.services.adaptation_service import adaptation_service
from app.services.qa_evaluator import qa_evaluator

logger = logging.getLogger(__name__)


class PipelineOrchestrator:
    async def process_queue_item(
        self,
        queue_id: str,
        gemini_key: Optional[str] = None,
        groq_key: Optional[str] = None,
        rapidapi_key: Optional[str] = None,
        cobalt_url: Optional[str] = None,
    ):
        """
        Full autonomous pipeline with user-specific BYOK keys:
        1. Ingest (LinkedIn Layer 0 Twitterbot bypass -> RapidAPI -> Cobalt -> yt-dlp -> File Upload)
        2. Media extraction (FFmpeg -q:a 4 audio & 5-7 evenly spaced frames)
        3. Two-layer transcription (transcript_override -> Groq Whisper -> Gemini multimodal audio)
        4. Reverse-engineering (Gemini Flash with inline PIL Image frames)
        5. Single-pass brand adaptation (PlatformIdeations: LinkedIn, IG Reel, WhatsApp)
        6. Brand QA Evaluator (Hook, Voice, Actionable, Anti-AI >= 80, regenerate once if needed)
        """
        queue_item = db.get_queue_item(queue_id)
        if not queue_item:
            logger.error(f"Queue item {queue_id} not found.")
            return

        work_dir = Path(settings.STORAGE_DIR) / "processed" / queue_id
        work_dir.mkdir(parents=True, exist_ok=True)

        try:
            # 1. Ingestion
            db.update_queue_status(queue_id, QueueStatus.INGESTING, "Ingesting source media...")
            video_path = None
            transcript_override_path = None

            if queue_item.source_type == "url":
                video_path, transcript_override_path = await ingestion_service.ingest_url(
                    queue_item.source_url,
                    session_id=queue_id,
                    rapidapi_key=rapidapi_key,
                    cobalt_url=cobalt_url,
                )
            else:
                video_path = queue_item.file_path
                # Check for existing transcript override if uploaded alongside
                potential_override = work_dir / "transcript_override.txt"
                if potential_override.exists():
                    transcript_override_path = str(potential_override)

            if not video_path or not os.path.exists(video_path):
                raise RuntimeError("Failed to obtain valid video file from ingestion source.")

            # 2. Extract Frames and Audio
            db.update_queue_status(queue_id, QueueStatus.EXTRACTING, "Extracting audio and representative video frames...")
            audio_path = str(work_dir / "audio.mp3")
            media_processor.extract_audio(video_path, audio_path)

            frames_dir = str(work_dir / "frames")
            frame_paths = media_processor.extract_frames(video_path, frames_dir, num_frames=6)
            duration_seconds = media_processor.get_duration(video_path)

            # 3. Transcription & Reverse-Engineering
            db.update_queue_status(queue_id, QueueStatus.ANALYZING, "Transcribing and reverse-engineering viral psychology...")
            transcript = await transcription_service.transcribe(
                audio_path,
                transcript_override_path,
                groq_key=groq_key,
                gemini_key=gemini_key,
            )

            # Generate static web URLs for video and extracted frames
            try:
                rel_video = os.path.relpath(video_path, str(Path(settings.STORAGE_DIR))).replace("\\", "/")
                video_web_url = f"/static/{rel_video}"
            except Exception:
                video_web_url = None

            frame_web_urls = []
            for fp in frame_paths:
                try:
                    rel_f = os.path.relpath(fp, str(Path(settings.STORAGE_DIR))).replace("\\", "/")
                    frame_web_urls.append(f"/static/{rel_f}")
                except Exception:
                    pass

            analysis = await reverse_engineer.analyze(
                queue_id=queue_id,
                source_url_or_file=queue_item.source_url or os.path.basename(video_path),
                transcript=transcript,
                frame_paths=frame_paths,
                duration_seconds=duration_seconds,
                video_url=video_web_url,
                frame_urls=frame_web_urls,
                gemini_key=gemini_key,
            )
            db.create_analysis(analysis)

            # 4. Fetch Client Profile for Brand Adaptation
            db.update_queue_status(queue_id, QueueStatus.GENERATING, "Adapting viral structure to brand profile (single-pass)...")
            profile = db.get_profile(queue_item.client_id)
            if not profile:
                profiles = db.get_profiles()
                profile = profiles[0] if profiles else None

            if not profile:
                raise RuntimeError(f"No company profile found for client_id {queue_item.client_id}")

            # 5. Brand Adaptation
            concept = await adaptation_service.adapt_concept(
                queue_id,
                analysis,
                profile,
                gemini_key=gemini_key,
            )

            # 6. Brand QA Evaluation
            db.update_queue_status(queue_id, QueueStatus.EVALUATING, "Running Brand QA Evaluator...")
            qa = await qa_evaluator.evaluate(concept, profile, gemini_key=gemini_key)

            # If score < 80, regenerate once with critique feedback
            if not qa.passed or qa.total_score < 80:
                logger.warning(f"QA score {qa.total_score} < 80. Triggering single revision pass with critique...")
                concept = await adaptation_service.adapt_concept(
                    queue_id,
                    analysis,
                    profile,
                    revision_critique=qa.feedback,
                    gemini_key=gemini_key,
                )
                qa = await qa_evaluator.evaluate(concept, profile, gemini_key=gemini_key)

            concept.qa_evaluation = qa
            db.create_concept(concept)

            db.update_queue_status(queue_id, QueueStatus.GENERATED, "Concept generated successfully and ready in library!")
            logger.info(f"Pipeline finished for queue item {queue_id}. Final QA score: {qa.total_score}")

        except Exception as e:
            logger.exception(f"Pipeline failed for queue item {queue_id}: {e}")
            db.update_queue_status(queue_id, QueueStatus.FAILED, "Pipeline processing failed", str(e))


pipeline_orchestrator = PipelineOrchestrator()
