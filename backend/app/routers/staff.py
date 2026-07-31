import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.staff import Staff, StaffPlatform
from app.schemas.staff import (
    StaffCreate,
    StaffExternalIdsUpdate,
    StaffOut,
    StaffPlatformsUpdate,
    StaffPodUpdate,
    StaffUpdate,
)

router = APIRouter(prefix="/api/staff", tags=["staff"])


@router.get("", response_model=list[StaffOut])
def list_staff(db: Session = Depends(get_db)):
    return db.query(Staff).all()


@router.get("/{staff_id}", response_model=StaffOut)
def get_staff(staff_id: uuid.UUID, db: Session = Depends(get_db)):
    staff = db.get(Staff, staff_id)
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    return staff


@router.post("", response_model=StaffOut, status_code=201)
def create_staff(payload: StaffCreate, db: Session = Depends(get_db)):
    staff = Staff(
        name=payload.name,
        initials=payload.initials,
        avatar_color=payload.avatar_color,
        role=payload.role,
        email=payload.email,
        pod_id=payload.pod_id,
    )
    db.add(staff)
    db.flush()
    for platform_id in payload.platform_ids:
        db.add(StaffPlatform(staff_id=staff.id, platform_id=platform_id))
    db.commit()
    db.refresh(staff)
    return staff


@router.put("/{staff_id}", response_model=StaffOut)
def update_staff(staff_id: uuid.UUID, payload: StaffUpdate, db: Session = Depends(get_db)):
    staff = db.get(Staff, staff_id)
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(staff, field, value)
    db.commit()
    db.refresh(staff)
    return staff


@router.put("/{staff_id}/pod", response_model=StaffOut)
def update_staff_pod(staff_id: uuid.UUID, payload: StaffPodUpdate, db: Session = Depends(get_db)):
    """A staff member may only be assigned to a single pod at a time."""
    staff = db.get(Staff, staff_id)
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    staff.pod_id = payload.pod_id
    db.commit()
    db.refresh(staff)
    return staff


@router.put("/{staff_id}/platforms", response_model=StaffOut)
def update_staff_platforms(staff_id: uuid.UUID, payload: StaffPlatformsUpdate, db: Session = Depends(get_db)):
    """A staff member may have multiple platform skills, unrelated to their pod's platforms."""
    staff = db.get(Staff, staff_id)
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    db.query(StaffPlatform).filter(StaffPlatform.staff_id == staff_id).delete()
    for platform_id in payload.platform_ids:
        db.add(StaffPlatform(staff_id=staff_id, platform_id=platform_id))
    db.commit()
    db.refresh(staff)
    return staff


@router.put("/{staff_id}/external-ids", response_model=StaffOut)
def update_staff_external_ids(staff_id: uuid.UUID, payload: StaffExternalIdsUpdate, db: Session = Depends(get_db)):
    staff = db.get(Staff, staff_id)
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(staff, field, value)
    db.commit()
    db.refresh(staff)
    return staff
