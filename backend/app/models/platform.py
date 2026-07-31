import uuid

from sqlalchemy import String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Platform(Base):
    __tablename__ = "platform"

    # gen_random_uuid() is built into Postgres 13+, no pgcrypto extension needed
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    color_hex: Mapped[str] = mapped_column(String, nullable=False)
