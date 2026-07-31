import uuid

from sqlalchemy import ForeignKey, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Pod(Base):
    __tablename__ = "pod"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    color_hex: Mapped[str] = mapped_column(String, nullable=False)

    staff: Mapped[list["Staff"]] = relationship(back_populates="pod")
    platforms: Mapped[list["PodPlatform"]] = relationship(back_populates="pod", cascade="all, delete-orphan")


# No count limit — a pod may bind any number of platforms
class PodPlatform(Base):
    __tablename__ = "pod_platform"

    pod_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("pod.id"), primary_key=True)
    platform_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("platform.id"), primary_key=True)

    pod: Mapped["Pod"] = relationship(back_populates="platforms")
    platform: Mapped["Platform"] = relationship()
