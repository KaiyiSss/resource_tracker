import uuid
from datetime import date

from pydantic import BaseModel, ConfigDict


class HolidayOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    staff_id: uuid.UUID
    holiday_date: date
    reason: str | None = None
    status: str
    source: str
