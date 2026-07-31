import uuid

from pydantic import BaseModel


class StaffCapacityOut(BaseModel):
    staff_id: uuid.UUID
    sprint_id: uuid.UUID
    effective_capacity: int
    demand: int
    net_available: int
    status: str  # available | tight | over


class PodCapacityOut(BaseModel):
    pod_id: uuid.UUID
    sprint_id: uuid.UUID
    effective_capacity: int
    demand: int
    util_pct: int


class RawCapacityUpdate(BaseModel):
    staff_id: uuid.UUID
    sprint_id: uuid.UUID
    raw_capacity_sp: int
