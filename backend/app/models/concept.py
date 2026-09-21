from typing import List, Optional
import uuid
from pydantic import BaseModel, Field


class PlatformIdeations(BaseModel):
    linkedin_post: str = Field(
        description="High-authority text breakdown, zero emojis, punchy line breaks, clear hook and CTA"
    )
    instagram_reel_script: str = Field(
        description="Spoken word script with visual and text-overlay cues, no emojis"
    )
    whatsapp_broadcast: str = Field(
        description="Direct, conversational, high-value message formatted for WhatsApp groups/clients, no emojis"
    )


class SceneBreakdown(BaseModel):
    scene_number: int
    timestamp_range: str = Field(description="e.g., '0:00 - 0:03'")
    visual_cue: str = Field(description="Visual action, camera angle, or b-roll scene")
    voiceover_dialogue: str = Field(description="Spoken audio word-for-word, strictly no emojis")
    text_overlay: str = Field(description="On-screen text graphics or caption highlight")


class QAEvaluation(BaseModel):
    hook_strength: int = Field(ge=1, le=10, description="1-10 rating of hook psychology")
    brand_voice_alignment: int = Field(ge=1, le=10, description="1-10 rating of client tone & ICP match")
    specificity_and_value: int = Field(ge=1, le=10, description="1-10 rating of actionable value & real numbers")
    anti_ai_score: int = Field(ge=1, le=10, description="1-10 rating: sounds human, direct, zero emojis, no buzzwords")
    total_score: int = Field(ge=0, le=100, description="Composite score out of 100")
    feedback: str = Field(description="Critique notes and areas of strength/improvement")
    passed: bool = Field(default=True, description="True if total_score >= 80")


class ContentConcept(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    queue_id: str
    client_id: str
    client_name: str
    title: str = Field(description="Punchy title or headline for the adapted concept")
    target_platform: str = Field(default="Multi-Platform (LinkedIn, IG Reel, WhatsApp)")
    scenes: List[SceneBreakdown] = Field(default_factory=list)
    platform_ideations: PlatformIdeations
    qa_evaluation: QAEvaluation
    source_formula: str = Field(description="The psychological formula adapted from source content")
    created_at: Optional[str] = None
