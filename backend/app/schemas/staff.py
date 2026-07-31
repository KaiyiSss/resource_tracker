import uuid

from pydantic import BaseModel, ConfigDict

from app.schemas.pod import PlatformOut


class StaffBase(BaseModel):
    name: str
    initials: str
    avatar_color: str
    role: str
    email: str


class StaffCreate(StaffBase):
    pod_id: uuid.UUID
    platform_ids: list[uuid.UUID] = []


class StaffUpdate(BaseModel):
    name: str | None = None
    role: str | None = None
    avatar_color: str | None = None


class StaffPodUpdate(BaseModel):
    pod_id: uuid.UUID  # a staff member may only belong to one pod


class StaffPlatformsUpdate(BaseModel):
    platform_ids: list[uuid.UUID]  # a staff member may have multiple platform skills


class StaffExternalIdsUpdate(BaseModel):
    jira_account_id: str | None = None
    teambook_user_id: str | None = None


class StaffOut(StaffBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    pod_id: uuid.UUID
    jira_account_id: str | None = None
    teambook_user_id: str | None = None
    platforms: list[PlatformOut] = []
