import uuid

from sqlalchemy import Boolean, Date, ForeignKey, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Sprint(Base):
    __tablename__ = "sprint"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    start_date: Mapped[str] = mapped_column(Date, nullable=False)
    end_date: Mapped[str] = mapped_column(Date, nullable=False)
    is_current: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    working_days: Mapped[list["SprintWorkingDay"]] = relationship(back_populates="sprint", cascade="all, delete-orphan")
    capacities: Mapped[list["StaffCapacity"]] = relationship(back_populates="sprint", cascade="all, delete-orphan")


class SprintWorkingDay(Base):
    __tablename__ = "sprint_working_day"

    sprint_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("sprint.id"), primary_key=True)
    work_date: Mapped[str] = mapped_column(Date, primary_key=True)

    sprint: Mapped["Sprint"] = relationship(back_populates="working_days")
