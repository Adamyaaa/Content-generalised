from typing import List, Optional
import io
import csv
from datetime import datetime
from fastapi import APIRouter, HTTPException, Query, Response
from fastapi.responses import StreamingResponse

from app.core.database import db
from app.models.calendar import (
    CalendarEvent,
    CalendarEventCreate,
    CalendarEventUpdate,
    CalendarEventReschedule,
    CalendarEventStatusUpdate,
    PostStatus,
    PlatformType
)

router = APIRouter(prefix="/calendar", tags=["Content Calendar"])


@router.get("", response_model=List[CalendarEvent])
async def list_calendar_events(
    client_id: Optional[str] = Query(None, description="Filter by client profile ID"),
    start_date: Optional[str] = Query(None, description="Start date filter (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date filter (YYYY-MM-DD)"),
    month: Optional[str] = Query(None, description="Filter by month string (YYYY-MM)"),
    status: Optional[str] = Query(None, description="Filter by status (draft, scheduled, published, etc.)"),
    platform: Optional[str] = Query(None, description="Filter by platform")
):
    # If month is provided (e.g., '2026-09'), set start_date and end_date if not explicitly given
    if month and not start_date and not end_date:
        start_date = f"{month}-01"
        end_date = f"{month}-31"

    return db.get_calendar_events(
        client_id=client_id,
        start_date=start_date,
        end_date=end_date,
        status=status,
        platform=platform
    )


@router.post("", response_model=CalendarEvent)
async def create_calendar_event(payload: CalendarEventCreate):
    event = CalendarEvent(
        client_id=payload.client_id,
        client_name=payload.client_name,
        concept_id=payload.concept_id,
        platform=payload.platform,
        title=payload.title,
        content=payload.content,
        scheduled_date=payload.scheduled_date,
        scheduled_time=payload.scheduled_time or "09:00",
        status=payload.status or PostStatus.SCHEDULED,
        qa_score=payload.qa_score,
        source_formula=payload.source_formula,
        notes=payload.notes,
        published_url=payload.published_url
    )
    return db.create_calendar_event(event)


@router.get("/{event_id}", response_model=CalendarEvent)
async def get_calendar_event(event_id: str):
    event = db.get_calendar_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Calendar event not found")
    return event


@router.put("/{event_id}", response_model=CalendarEvent)
async def update_calendar_event(event_id: str, payload: CalendarEventUpdate):
    updates = payload.model_dump(exclude_unset=True)
    updated = db.update_calendar_event(event_id, updates)
    if not updated:
        raise HTTPException(status_code=404, detail="Calendar event not found")
    return updated


@router.patch("/{event_id}/reschedule", response_model=CalendarEvent)
async def reschedule_calendar_event(event_id: str, payload: CalendarEventReschedule):
    updates = {"scheduled_date": payload.scheduled_date}
    if payload.scheduled_time is not None:
        updates["scheduled_time"] = payload.scheduled_time
    updated = db.update_calendar_event(event_id, updates)
    if not updated:
        raise HTTPException(status_code=404, detail="Calendar event not found")
    return updated


@router.patch("/{event_id}/status", response_model=CalendarEvent)
async def update_calendar_event_status(event_id: str, payload: CalendarEventStatusUpdate):
    updated = db.update_calendar_event(event_id, {"status": payload.status})
    if not updated:
        raise HTTPException(status_code=404, detail="Calendar event not found")
    return updated


@router.delete("/{event_id}")
async def delete_calendar_event(event_id: str):
    success = db.delete_calendar_event(event_id)
    if not success:
        raise HTTPException(status_code=404, detail="Calendar event not found")
    return {"status": "success", "message": f"Calendar event {event_id} removed."}


@router.get("/export/csv")
async def export_calendar_csv(
    client_id: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None)
):
    events = db.get_calendar_events(client_id=client_id, start_date=start_date, end_date=end_date)
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID", "Brand", "Platform", "Title", "Scheduled Date", "Scheduled Time",
        "Status", "QA Score", "Formula", "Content", "Notes"
    ])
    for e in events:
        writer.writerow([
            e.id,
            e.client_name,
            e.platform.value if hasattr(e.platform, 'value') else str(e.platform),
            e.title,
            e.scheduled_date,
            e.scheduled_time or "09:00",
            e.status.value if hasattr(e.status, 'value') else str(e.status),
            e.qa_score or "",
            e.source_formula or "",
            e.content,
            e.notes or ""
        ])
    
    output.seek(0)
    filename = f"content_calendar_{datetime.now().strftime('%Y%m%d')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/export/ics")
async def export_calendar_ics(
    client_id: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None)
):
    events = db.get_calendar_events(client_id=client_id, start_date=start_date, end_date=end_date)
    
    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//ContentEngine//Content Calendar//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH"
    ]

    for e in events:
        date_clean = e.scheduled_date.replace("-", "")
        time_clean = (e.scheduled_time or "09:00").replace(":", "") + "00"
        dtstart = f"{date_clean}T{time_clean}"
        dtstamp = datetime.now().strftime("%Y%m%dT%H%M%SZ")
        
        platform_name = e.platform.value.capitalize() if hasattr(e.platform, 'value') else str(e.platform)
        summary = f"[{platform_name}] {e.title} ({e.client_name})"
        description = (e.content[:300] + '...' if len(e.content) > 300 else e.content).replace("\n", "\\n")

        lines.extend([
            "BEGIN:VEVENT",
            f"UID:{e.id}@contentengine.internal",
            f"DTSTAMP:{dtstamp}",
            f"DTSTART:{dtstart}",
            f"SUMMARY:{summary}",
            f"DESCRIPTION:{description}",
            f"STATUS:{e.status.value.upper() if hasattr(e.status, 'value') else 'CONFIRMED'}",
            "END:VEVENT"
        ])

    lines.append("END:VCALENDAR")
    ics_content = "\r\n".join(lines)
    filename = f"content_calendar_{datetime.now().strftime('%Y%m%d')}.ics"
    return Response(
        content=ics_content,
        media_type="text/calendar",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
