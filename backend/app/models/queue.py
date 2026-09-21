from typing import Optional
from enum import Enum
from pydantic import BaseModel, Field


class QueueStatus(str, Enum):
    PENDING = "pending"
    INGESTING = "ingesting"
    EXTRACTING = "extracting"
    ANALYZING = "analyzing"
    GENERATING = "generating"
    EVALUATING = "evaluating"
    GENERATED = "generated"
    REJECTED = "rejected"
    FAILED = "failed"


class TrendQueueItem(BaseModel):
    id: str
    client_id: str
    source_type: str = Field(description="'url' or 'upload'")
    source_url: Optional[str] = None
    file_path: Optional[str] = None
    status: QueueStatus = QueueStatus.PENDING
    progress_message: str = "In queue"
    error_message: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
