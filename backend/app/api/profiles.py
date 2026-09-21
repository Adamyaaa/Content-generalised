import uuid
from typing import List
from fastapi import APIRouter, HTTPException

from app.core.database import db
from app.models.profile import CompanyProfile, CompanyProfileCreate

router = APIRouter(prefix="/profiles", tags=["Company Profiles"])


@router.get("", response_model=List[CompanyProfile])
async def get_profiles():
    return db.get_profiles()


@router.get("/{client_id}", response_model=CompanyProfile)
async def get_profile(client_id: str):
    profile = db.get_profile(client_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Company profile not found")
    return profile


@router.post("", response_model=CompanyProfile)
async def create_profile(payload: CompanyProfileCreate):
    profile = CompanyProfile(
        client_id=str(uuid.uuid4()),
        **payload.model_dump()
    )
    return db.create_profile(profile)


@router.put("/{client_id}", response_model=CompanyProfile)
async def update_profile(client_id: str, payload: CompanyProfileCreate):
    profile = CompanyProfile(
        client_id=client_id,
        **payload.model_dump()
    )
    return db.update_profile(client_id, profile)


@router.delete("/{client_id}")
async def delete_profile(client_id: str):
    success = db.delete_profile(client_id)
    if not success:
        raise HTTPException(status_code=404, detail="Company profile not found")
    return {"status": "success", "message": f"Deleted profile {client_id}"}
