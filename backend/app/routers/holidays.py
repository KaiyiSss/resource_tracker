import uuid
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.holiday import Holiday

router = APIRouter(prefix="/api/teambook", tags=["holidays"])


@router.get("/holidays", response_model=list[dict])
def list_holidays(
    from_: date | None = None,
    to: date | None = None,
    staff: uuid.UUID | None = None,
    db: Session = Depends(get_db),
):
    """Read-only — holidays are only ever written by the Teambook sync job."""
    query = db.query(Holiday)
    if from_:
        query = query.filter(Holiday.holiday_date >= from_)
    if to:
        query = query.filter(Holiday.holiday_date <= to)
    if staff:
        query = query.filter(Holiday.staff_id == staff)
    return [
        {
            "id": h.id,
            "staffId": h.staff_id,
            "date": h.holiday_date,
            "reason": h.reason,
            "status": h.status,
        }
        for h in query.all()
    ]


@router.post("/sync", status_code=202)
def sync_from_teambook():
    # TODO: call the Teambook API and upsert holiday records into the database
    raise HTTPException(status_code=501, detail="Not implemented")
