from typing import List, Optional
import uuid
from pydantic import BaseModel, Field


class ProductService(BaseModel):
    name: str = Field(..., description="Product or service name")
    core_value_prop: str = Field(..., description="Core value proposition")
    pain_points_solved: List[str] = Field(default_factory=list, description="List of pain points solved")


class TargetAudience(BaseModel):
    icp_description: str = Field(..., description="Description of ideal customer profile")
    primary_frustrations: List[str] = Field(default_factory=list, description="Key frustrations of the target audience")
    aspirations_and_goals: List[str] = Field(default_factory=list, description="Goals and aspirations of target audience")
    cultural_or_market_context: str = Field(..., description="Cultural or market specific context")


class BrandVoiceGuidelines(BaseModel):
    tone: str = Field(..., description="Brand tone: authoritative, contrarian, empathetic, educational, etc.")
    prohibited_elements: List[str] = Field(
        default_factory=lambda: ["No emojis", "No buzzword salad", "No generic motivational cliches"],
        description="Elements strictly prohibited in content generation"
    )
    signature_angles: List[str] = Field(
        default_factory=list,
        description="Signature content angles: real numbers, teardowns, workflow breakdowns, etc."
    )
    primary_cta: str = Field(..., description="Primary call-to-action")


class CompanyProfile(BaseModel):
    client_id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique UUID for the client")
    company_name: str = Field(..., description="Company name")
    industry: str = Field(..., description="Industry domain")
    tagline_or_mission: str = Field(..., description="Tagline or mission statement")
    products_and_services: List[ProductService] = Field(default_factory=list)
    target_audience: TargetAudience
    brand_voice_guidelines: BrandVoiceGuidelines


class CompanyProfileCreate(BaseModel):
    company_name: str
    industry: str
    tagline_or_mission: str
    products_and_services: List[ProductService]
    target_audience: TargetAudience
    brand_voice_guidelines: BrandVoiceGuidelines
