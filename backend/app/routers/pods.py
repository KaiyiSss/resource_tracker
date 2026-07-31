import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.pod import Pod, PodPlatform
from app.models.staff import Staff
from app.schemas.pod import PodCreate, PodOut, PodPlatformsUpdate, PodUpdate
from app.schemas.staff import StaffOut

router = APIRouter(prefix="/api/pods", tags=["pods"])


@router.get("", response_model=list[PodOut])
def list_pods(db: Session = Depends(get_db)):
    return db.query(Pod).all()


@router.get("/{pod_id}", response_model=PodOut)
def get_pod(pod_id: uuid.UUID, db: Session = Depends(get_db)):
    pod = db.get(Pod, pod_id)
    if not pod:
        raise HTTPException(status_code=404, detail="Pod not found")
    return pod


@router.get("/{pod_id}/staff", response_model=list[StaffOut])
def get_pod_staff(pod_id: uuid.UUID, db: Session = Depends(get_db)):
    return db.query(Staff).filter(Staff.pod_id == pod_id).all()


@router.post("", response_model=PodOut, status_code=201)
def create_pod(payload: PodCreate, db: Session = Depends(get_db)):
    pod = Pod(name=payload.name, color_hex=payload.color_hex)
    db.add(pod)
    db.flush()
    for platform_id in payload.platform_ids:
        db.add(PodPlatform(pod_id=pod.id, platform_id=platform_id))
    db.commit()
    db.refresh(pod)
    return pod


@router.put("/{pod_id}", response_model=PodOut)
def update_pod(pod_id: uuid.UUID, payload: PodUpdate, db: Session = Depends(get_db)):
    pod = db.get(Pod, pod_id)
    if not pod:
        raise HTTPException(status_code=404, detail="Pod not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(pod, field, value)
    db.commit()
    db.refresh(pod)
    return pod


@router.put("/{pod_id}/platforms", response_model=PodOut)
def update_pod_platforms(pod_id: uuid.UUID, payload: PodPlatformsUpdate, db: Session = Depends(get_db)):
    """A pod may bind any number of platforms — no count limit."""
    pod = db.get(Pod, pod_id)
    if not pod:
        raise HTTPException(status_code=404, detail="Pod not found")
    db.query(PodPlatform).filter(PodPlatform.pod_id == pod_id).delete()
    for platform_id in payload.platform_ids:
        db.add(PodPlatform(pod_id=pod_id, platform_id=platform_id))
    db.commit()
    db.refresh(pod)
    return pod


@router.post("/{pod_id}/staff", status_code=204)
def assign_staff_to_pod(pod_id: uuid.UUID, staff_ids: list[uuid.UUID], db: Session = Depends(get_db)):
    """Batch-assign staff to a pod (each staff member still belongs to only one pod)."""
    db.query(Staff).filter(Staff.id.in_(staff_ids)).update({Staff.pod_id: pod_id}, synchronize_session=False)
    db.commit()


@router.delete("/{pod_id}/staff/{staff_id}", status_code=404)
def remove_staff_from_pod(pod_id: uuid.UUID, staff_id: uuid.UUID):
    # A staff member must always belong to a pod; reassign instead of deleting the link.
    raise HTTPException(status_code=404, detail="Use PUT /api/staff/{staff_id}/pod to reassign instead")


@router.delete("/{pod_id}", status_code=204)
def delete_pod(pod_id: uuid.UUID, db: Session = Depends(get_db)):
    pod = db.get(Pod, pod_id)
    if not pod:
        raise HTTPException(status_code=404, detail="Pod not found")
    has_staff = db.query(Staff).filter(Staff.pod_id == pod_id).count() > 0
    if has_staff:
        raise HTTPException(status_code=409, detail="Pod still has staff assigned")
    db.delete(pod)
    db.commit()
