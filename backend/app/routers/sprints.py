import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.sprint import Sprint, SprintWorkingDay
from app.schemas.sprint import SprintCreate, SprintOut, SprintUpdate

router = APIRouter(prefix="/api/sprints", tags=["sprints"])


@router.get("", response_model=list[SprintOut])
def list_sprints(db: Session = Depends(get_db)):
    return db.query(Sprint).order_by(Sprint.start_date).all()


@router.get("/{sprint_id}", response_model=SprintOut)
def get_sprint(sprint_id: uuid.UUID, db: Session = Depends(get_db)):
    sprint = db.get(Sprint, sprint_id)
    if not sprint:
        raise HTTPException(status_code=404, detail="Sprint not found")
    return sprint


@router.post("", response_model=SprintOut, status_code=201)
def create_sprint(payload: SprintCreate, db: Session = Depends(get_db)):
    sprint = Sprint(
        name=payload.name,
        start_date=payload.start_date,
        end_date=payload.end_date,
        is_current=payload.is_current,
    )
    db.add(sprint)
    db.flush()
    for day in payload.working_days:
        db.add(SprintWorkingDay(sprint_id=sprint.id, work_date=day))
    db.commit()
    db.refresh(sprint)
    return sprint


@router.put("/{sprint_id}", response_model=SprintOut)
def update_sprint(sprint_id: uuid.UUID, payload: SprintUpdate, db: Session = Depends(get_db)):
    sprint = db.get(Sprint, sprint_id)
    if not sprint:
        raise HTTPException(status_code=404, detail="Sprint not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(sprint, field, value)
    db.commit()
    db.refresh(sprint)
    return sprint
