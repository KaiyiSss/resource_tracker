from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.holiday import Holiday
from app.models.jira_issue import JiraIssue
from app.models.staff import Staff, StaffCapacity
from app.models.sprint import Sprint


def get_status(net_available: int) -> str:
    if net_available >= 2:
        return "available"
    if net_available >= 0:
        return "tight"
    return "over"


def get_demand(db: Session, staff_id: str, sprint_id: str) -> int:
    total = (
        db.query(func.coalesce(func.sum(JiraIssue.story_points), 0))
        .filter(JiraIssue.assignee_staff_id == staff_id, JiraIssue.sprint_id == sprint_id)
        .scalar()
    )
    return int(total or 0)


def get_effective_capacity(db: Session, staff_id: str, sprint_id: str) -> int:
    capacity_row = (
        db.query(StaffCapacity)
        .filter(StaffCapacity.staff_id == staff_id, StaffCapacity.sprint_id == sprint_id)
        .first()
    )
    raw_capacity = capacity_row.raw_capacity_sp if capacity_row else 0

    sprint = db.get(Sprint, sprint_id)
    working_days = {d.work_date for d in sprint.working_days} if sprint else set()

    holiday_count = (
        db.query(Holiday)
        .filter(Holiday.staff_id == staff_id, Holiday.holiday_date.in_(working_days))
        .count()
        if working_days
        else 0
    )
    return raw_capacity - holiday_count


def get_staff_capacity(db: Session, staff_id: str, sprint_id: str) -> dict:
    effective_capacity = get_effective_capacity(db, staff_id, sprint_id)
    demand = get_demand(db, staff_id, sprint_id)
    net_available = effective_capacity - demand
    return {
        "staff_id": staff_id,
        "sprint_id": sprint_id,
        "effective_capacity": effective_capacity,
        "demand": demand,
        "net_available": net_available,
        "status": get_status(net_available),
    }


def get_pod_capacity(db: Session, pod_id: str, sprint_id: str) -> dict:
    staff_ids = [s.id for s in db.query(Staff.id).filter(Staff.pod_id == pod_id).all()]
    effective_capacity = sum(get_effective_capacity(db, sid, sprint_id) for sid in staff_ids)
    demand = sum(get_demand(db, sid, sprint_id) for sid in staff_ids)
    util_pct = round(demand / effective_capacity * 100) if effective_capacity > 0 else 0
    return {
        "pod_id": pod_id,
        "sprint_id": sprint_id,
        "effective_capacity": effective_capacity,
        "demand": demand,
        "util_pct": util_pct,
    }
