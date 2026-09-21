from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query

from app.core.database import db
from app.models.concept import ContentConcept
from app.models.analysis import ContentAnalysis

router = APIRouter(prefix="/dashboard", tags=["Dashboard & Concepts"])


@router.get("/concepts", response_model=List[ContentConcept])
async def list_concepts(client_id: Optional[str] = Query(None, description="Filter by client profile ID")):
    return db.get_concepts(client_id=client_id)


@router.get("/concepts/{concept_id}")
async def get_concept_details(concept_id: str):
    concept = db.get_concept(concept_id)
    if not concept:
        raise HTTPException(status_code=404, detail="Concept not found")
    
    # Also fetch the underlying viral reverse-engineering analysis
    analysis = db.get_analysis_by_queue(concept.queue_id)

    return {
        "concept": concept,
        "analysis": analysis
    }


@router.delete("/concepts/{concept_id}")
async def delete_concept(concept_id: str):
    success = db.delete_concept(concept_id)
    if not success:
        raise HTTPException(status_code=404, detail="Concept not found")
    return {
        "status": "success",
        "message": f"Concept {concept_id} and associated analysis records removed safely."
    }
