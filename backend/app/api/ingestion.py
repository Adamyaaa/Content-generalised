import os
import uuid
from pathlib import Path
from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, BackgroundTasks, UploadFile, File, Form

from app.core.config import settings
from app.core.database import db
from app.models.queue import TrendQueueItem, QueueStatus
from app.services.pipeline_orchestrator import pipeline_orchestrator

router = APIRouter(prefix="/ingest", tags=["Content Ingestion"])


class IngestUrlRequest(BaseModel):
    url: str
    client_id: str


@router.post("/url")
async def ingest_url(payload: IngestUrlRequest, background_tasks: BackgroundTasks):
    profile = db.get_profile(payload.client_id)
    if not profile:
        raise HTTPException(status_code=400, detail="Invalid client_id. Company profile does not exist.")

    queue_id = str(uuid.uuid4())
    item = TrendQueueItem(
        id=queue_id,
        client_id=payload.client_id,
        source_type="url",
        source_url=payload.url,
        status=QueueStatus.PENDING,
        progress_message="Enqueued for ingestion"
    )
    db.create_queue_item(item)

    # Launch autonomous pipeline worker in background
    background_tasks.add_task(pipeline_orchestrator.process_queue_item, queue_id)

    return {
        "status": "enqueued",
        "queue_id": queue_id,
        "message": "Content enqueued for autonomous processing"
    }


@router.post("/file")
async def ingest_file(
    background_tasks: BackgroundTasks,
    client_id: str = Form(...),
    file: UploadFile = File(...)
):
    profile = db.get_profile(client_id)
    if not profile:
        raise HTTPException(status_code=400, detail="Invalid client_id. Company profile does not exist.")

    queue_id = str(uuid.uuid4())
    upload_dir = Path(settings.STORAGE_DIR) / "uploads" / queue_id
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    file_ext = Path(file.filename).suffix or ".mp4"
    dest_path = upload_dir / f"uploaded_video{file_ext}"

    content = await file.read()
    dest_path.write_bytes(content)

    item = TrendQueueItem(
        id=queue_id,
        client_id=client_id,
        source_type="upload",
        file_path=str(dest_path),
        status=QueueStatus.PENDING,
        progress_message="Uploaded file enqueued for processing"
    )
    db.create_queue_item(item)

    background_tasks.add_task(pipeline_orchestrator.process_queue_item, queue_id)

    return {
        "status": "enqueued",
        "queue_id": queue_id,
        "filename": file.filename,
        "message": "File uploaded and enqueued for autonomous processing"
    }


@router.get("/queue/{queue_id}")
async def get_queue_status(queue_id: str):
    item = db.get_queue_item(queue_id)
    if not item:
        raise HTTPException(status_code=404, detail="Queue item not found")
    
    # Check if concept already created
    concept_id = None
    if item.status == QueueStatus.GENERATED:
        concepts = db.get_concepts(client_id=item.client_id)
        for c in concepts:
            if c.queue_id == queue_id:
                concept_id = c.id
                break

    return {
        "id": item.id,
        "client_id": item.client_id,
        "status": item.status,
        "progress_message": item.progress_message,
        "error_message": item.error_message,
        "concept_id": concept_id,
        "created_at": item.created_at,
        "updated_at": item.updated_at
    }
