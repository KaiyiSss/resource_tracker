import uuid

from sqlalchemy import Date, ForeignKey, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


# Read-only from the frontend — populated by the Teambook sync job
class Holiday(Base):
    __tablename__ = "holiday"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    staff_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("staff.id"), nullable=False)
    holiday_date: Mapped[str] = mapped_column(Date, nullable=False)
    reason: Mapped[str] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, default="approved", nullable=False)
    source: Mapped[str] = mapped_column(String, default="teambook", nullable=False)

    staff: Mapped["Staff"] = relationship()
