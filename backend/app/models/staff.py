import uuid

from sqlalchemy import ForeignKey, Integer, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Staff(Base):
    __tablename__ = "staff"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    name: Mapped[str] = mapped_column(String, nullable=False)
    initials: Mapped[str] = mapped_column(String, nullable=False)
    avatar_color: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)

    # Single pod per staff member (business rule — one pod max)
    pod_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("pod.id"), nullable=False)

    jira_account_id: Mapped[str | None] = mapped_column(String, nullable=True)
    teambook_user_id: Mapped[str | None] = mapped_column(String, nullable=True)

    pod: Mapped["Pod"] = relationship(back_populates="staff")
    platforms: Mapped[list["StaffPlatform"]] = relationship(back_populates="staff", cascade="all, delete-orphan")
    capacities: Mapped[list["StaffCapacity"]] = relationship(back_populates="staff", cascade="all, delete-orphan")


# Many-to-many — a staff member can have multiple platform skills
class StaffPlatform(Base):
    __tablename__ = "staff_platform"

    staff_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("staff.id"), primary_key=True)
    platform_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("platform.id"), primary_key=True)

    staff: Mapped["Staff"] = relationship(back_populates="platforms")
    platform: Mapped["Platform"] = relationship()


class StaffCapacity(Base):
    __tablename__ = "staff_capacity"

    staff_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("staff.id"), primary_key=True)
    sprint_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("sprint.id"), primary_key=True)
    raw_capacity_sp: Mapped[int] = mapped_column(Integer, nullable=False, default=10)

    staff: Mapped["Staff"] = relationship(back_populates="capacities")
    sprint: Mapped["Sprint"] = relationship(back_populates="capacities")
