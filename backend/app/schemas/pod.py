import uuid

from pydantic import BaseModel, ConfigDict


class PlatformOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    color_hex: str


class PodBase(BaseModel):
    name: str
    color_hex: str


class PodCreate(PodBase):
    platform_ids: list[uuid.UUID] = []


class PodUpdate(BaseModel):
    name: str | None = None
    color_hex: str | None = None


class PodPlatformsUpdate(BaseModel):
    platform_ids: list[uuid.UUID]  # no max-count limit


class PodOut(PodBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    platforms: list[PlatformOut] = []
