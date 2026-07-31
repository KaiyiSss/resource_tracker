import uuid
from datetime import date

from pydantic import BaseModel, ConfigDict


class SprintBase(BaseModel):
    name: str
    start_date: date
    end_date: date
    is_current: bool = False


class SprintCreate(SprintBase):
    working_days: list[date] = []


class SprintUpdate(BaseModel):
    start_date: date | None = None
    end_date: date | None = None
    is_current: bool | None = None


class SprintOut(SprintBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    working_days: list[date] = []
