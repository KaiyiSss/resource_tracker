import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.staff import Staff, StaffCapacity
from app.models.sprint import Sprint
from app.schemas.capacity import PodCapacityOut, RawCapacityUpdate, StaffCapacityOut
from app.services import capacity_service

router = APIRouter(prefix="/api/capacity", tags=["capacity"])


@router.get("", response_model=list[StaffCapacityOut])
def get_capacity_for_sprint(sprint: uuid.UUID, db: Session = Depends(get_db)):
    staff_ids = [s.id for s in db.query(Staff.id).all()]
    return [capacity_service.get_staff_capacity(db, sid, sprint) for sid in staff_ids]


@router.get("/range", response_model=list[StaffCapacityOut])
def get_capacity_for_range(from_: uuid.UUID, to: uuid.UUID, db: Session = Depends(get_db)):
    sprint_ids = [
        s.id
        for s in db.query(Sprint.id)
        .filter(Sprint.start_date >= db.get(Sprint, from_).start_date, Sprint.end_date <= db.get(Sprint, to).end_date)
        .all()
    ]
    staff_ids = [s.id for s in db.query(Staff.id).all()]
    return [
        capacity_service.get_staff_capacity(db, sid, sprint_id)
        for sid in staff_ids
        for sprint_id in sprint_ids
    ]


@router.get("/pod/{pod_id}", response_model=PodCapacityOut)
def get_pod_capacity(pod_id: uuid.UUID, sprint: uuid.UUID, db: Session = Depends(get_db)):
    return capacity_service.get_pod_capacity(db, pod_id, sprint)


@router.get("/raw", response_model=list[dict])
def get_raw_capacity(sprint: uuid.UUID, db: Session = Depends(get_db)):
    rows = db.query(StaffCapacity).filter(StaffCapacity.sprint_id == sprint).all()
    return [{"staffId": r.staff_id, "sprintId": r.sprint_id, "rawCapacitySp": r.raw_capacity_sp} for r in rows]


@router.put("/raw", status_code=204)
def update_raw_capacity(updates: list[RawCapacityUpdate], db: Session = Depends(get_db)):
    for update in updates:
        row = (
            db.query(StaffCapacity)
            .filter(StaffCapacity.staff_id == update.staff_id, StaffCapacity.sprint_id == update.sprint_id)
            .first()
        )
        if row:
            row.raw_capacity_sp = update.raw_capacity_sp
        else:
            db.add(
                StaffCapacity(
                    staff_id=update.staff_id,
                    sprint_id=update.sprint_id,
                    raw_capacity_sp=update.raw_capacity_sp,
                )
            )
    db.commit()
