import uuid

from pydantic import BaseModel, ConfigDict


class JiraIssueBase(BaseModel):
    summary: str
    epic: str | None = None
    story_points: int = 0
    sprint_id: uuid.UUID
    status: str  # Done | In Progress | To Do
    assignee_staff_id: uuid.UUID | None = None


class JiraIssueCreate(JiraIssueBase):
    key: str  # JIRA's own key (e.g. PROJ-101), not a UUID


class JiraIssueUpdate(BaseModel):
    summary: str | None = None
    epic: str | None = None
    story_points: int | None = None
    sprint_id: uuid.UUID | None = None
    status: str | None = None
    assignee_staff_id: uuid.UUID | None = None


class JiraIssueOut(JiraIssueBase):
    model_config = ConfigDict(from_attributes=True)

    key: str
