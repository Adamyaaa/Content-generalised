import os
import sys
import asyncio
from pathlib import Path

# Ensure backend directory is on sys.path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.config import settings
from app.core.database import db
from app.core.ffmpeg_utils import get_ffmpeg_executable, run_ffmpeg
from app.models.profile import CompanyProfile, TargetAudience, BrandVoiceGuidelines, ProductService
from app.models.concept import PlatformIdeations, SceneBreakdown, ContentConcept, QAEvaluation
from app.models.analysis import ContentAnalysis, HookAnalysis, NarrativeStructure, VisualStorytellingAnalysis
from app.services.media_processor import media_processor
from app.services.adaptation_service import adaptation_service, strip_emojis, EMOJI_REGEX
from app.services.qa_evaluator import qa_evaluator


async def run_tests():
    print("=== 1. Testing Database & Profiles Initialization ===")
    db.init_db()
    profiles = db.get_profiles()
    assert len(profiles) >= 2, f"Expected seeded profiles, got {len(profiles)}"
    print(f"[OK] Found {len(profiles)} seeded profiles. Active profile: {profiles[0].company_name}")

    print("\n=== 2. Testing FFmpeg Resolution & Media Processing ===")
    ffmpeg_exe = get_ffmpeg_executable()
    print(f"[OK] Resolved FFmpeg executable: {ffmpeg_exe}")

    test_dir = Path(settings.STORAGE_DIR) / "test_scratch"
    test_dir.mkdir(parents=True, exist_ok=True)
    test_video = test_dir / "synthetic_test.mp4"

    # Generate a 3-second synthetic test video using FFmpeg
    run_ffmpeg([
        "-y",
        "-f", "lavfi",
        "-i", "testsrc=duration=3:size=640x360:rate=24",
        "-f", "lavfi",
        "-i", "sine=frequency=1000:duration=3",
        "-c:v", "libx264",
        "-c:a", "aac",
        str(test_video)
    ])
    assert test_video.exists(), "Synthetic test video failed to generate."
    print("[OK] Synthetic test video generated successfully.")

    duration = media_processor.get_duration(str(test_video))
    print(f"[OK] Detected duration: {duration:.2f}s")
    assert duration > 2.0, "Duration detection failed."

    # Audio extraction
    audio_file = test_dir / "audio.mp3"
    media_processor.extract_audio(str(test_video), str(audio_file))
    assert audio_file.exists() and audio_file.stat().st_size > 0, "Audio extraction failed."
    print(f"[OK] Extracted audio file: {audio_file.stat().st_size} bytes")

    # Frame extraction (6 frames)
    frames_dir = test_dir / "frames"
    frames = media_processor.extract_frames(str(test_video), str(frames_dir), num_frames=6)
    print(f"[OK] Extracted {len(frames)} frames.")
    assert len(frames) >= 3, "Frame extraction failed."

    print("\n=== 3. Testing Dynamic Adaptation & Zero-Emoji Anti-AI Polish ===")
    mock_analysis = ContentAnalysis(
        queue_id="test-queue-001",
        source_url_or_file="https://youtube.com/shorts/sample",
        duration_seconds=3.0,
        transcript="Why most engineering teams fail to scale velocity past 20 developers.",
        hook_analysis=HookAnalysis(
            trigger_type="Contrarian take",
            hook_text="Stop doing manual pull request reviews.",
            effectiveness_breakdown="Attacks conventional wisdom instantly."
        ),
        narrative_structure=NarrativeStructure(
            problem="Manual reviews burn 15+ hours per senior engineer weekly.",
            agitation="Velocity drops by 60% as pull requests sit stagnant.",
            insight="Bottleneck is human latency on routine boilerplate.",
            solution="Deploy deterministic automated CI guardrails.",
            call_to_action="Deploy the benchmark sandbox."
        ),
        visual_storytelling=VisualStorytellingAnalysis(
            framing="Medium close up",
            text_density="High kinetic captioning",
            b_roll_dynamics="Terminal code diffs and performance dashboards",
            pacing_description="Fast 1.5s cuts"
        ),
        psychological_formula="The 'Exposing Costly Bottlenecks' Framework: State the hidden waste -> Calculate the monthly payroll loss -> Reveal the automated pipeline fix -> CTA"
    )

    concept = await adaptation_service.adapt_concept("test-queue-001", mock_analysis, profiles[0])
    assert concept.title, "Concept title missing."
    assert concept.platform_ideations.linkedin_post, "LinkedIn post missing."
    assert concept.platform_ideations.instagram_reel_script, "IG script missing."
    assert concept.platform_ideations.whatsapp_broadcast, "WhatsApp broadcast missing."

    # Verify ZERO EMOJIS in all outputs
    full_text = f"{concept.title} {concept.platform_ideations.linkedin_post} {concept.platform_ideations.instagram_reel_script} {concept.platform_ideations.whatsapp_broadcast}"
    emojis = EMOJI_REGEX.findall(full_text)
    assert len(emojis) == 0, f"Found prohibited emojis in generated concept: {emojis}"
    print("[OK] Deterministic Zero-Emoji Anti-AI check passed (0 emojis found).")

    print("\n=== 4. Testing Brand QA Evaluator ===")
    qa = await qa_evaluator.evaluate(concept, profiles[0])
    print(f"[OK] QA Total Score: {qa.total_score}/100 (Passed: {qa.passed})")
    print(f"  - Hook: {qa.hook_strength}/10")
    print(f"  - Brand Voice: {qa.brand_voice_alignment}/10")
    print(f"  - Value & Specificity: {qa.specificity_and_value}/10")
    print(f"  - Anti-AI Score: {qa.anti_ai_score}/10")
    assert qa.total_score >= 80, f"QA score was {qa.total_score}, expected >= 80"

    print("\n=== 5. Testing Persistence & Safe Deletion Cascade ===")
    concept.qa_evaluation = qa
    created_concept = db.create_concept(concept)
    retrieved = db.get_concept(created_concept.id)
    assert retrieved is not None, "Failed to retrieve saved concept."
    print(f"[OK] Concept stored and retrieved successfully: '{retrieved.title}'")

    # Test safe deletion
    deleted = db.delete_concept(created_concept.id)
    assert deleted is True, "Concept deletion failed."
    assert db.get_concept(created_concept.id) is None, "Concept still exists after deletion."
    print("[OK] Safe cascading deletion verified.")

    print("\n==========================================")
    print("ALL TEST SUITES PASSED WITH 100% SUCCESS!")
    print("==========================================")


if __name__ == "__main__":
    asyncio.run(run_tests())
