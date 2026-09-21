from typing import List, Optional
from pydantic import BaseModel, Field


class HookAnalysis(BaseModel):
    trigger_type: str = Field(description="Curiosity gap, Contrarian take, Pattern interrupt, Pain amplifier, etc.")
    hook_text: str = Field(description="The exact or reconstructed hook line from the source")
    effectiveness_breakdown: str = Field(description="Why this hook grabbed attention in the first 3 seconds")


class NarrativeStructure(BaseModel):
    problem: str = Field(description="The problem identified in the source")
    agitation: str = Field(description="How the problem was amplified or agitated")
    insight: str = Field(description="The breakthrough perspective or core realization")
    solution: str = Field(description="The presented solution or recommendation")
    call_to_action: str = Field(description="The closing CTA or punchline")


class VisualStorytellingAnalysis(BaseModel):
    framing: str = Field(description="Camera framing, subject positioning, lighting")
    text_density: str = Field(description="Density and style of on-screen captions or text overlays")
    b_roll_dynamics: str = Field(description="Visual transitions, b-roll footage, screen shares, or visual props")
    pacing_description: str = Field(description="Rapid cuts vs slow tension building, visual interruption rhythm")


class ContentAnalysis(BaseModel):
    id: Optional[str] = None
    queue_id: str
    source_url_or_file: str
    duration_seconds: Optional[float] = None
    transcript: str = Field(description="Full extracted transcript or text override")
    hook_analysis: HookAnalysis
    narrative_structure: NarrativeStructure
    visual_storytelling: VisualStorytellingAnalysis
    psychological_formula: str = Field(
        description="Repeatable formula (e.g., 'The Exposing Industry Lie Framework: State an uncomfortable truth -> Show proof -> Reveal alternative')"
    )
    created_at: Optional[str] = None
