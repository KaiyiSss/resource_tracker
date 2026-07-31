import uuid

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class JiraIssue(Base):
    __tablename__ = "jira_issue"

    key: Mapped[str] = mapped_column(String, primary_key=True)  # e.g. PROJ-101 (JIRA's own key, not a UUID)
    summary: Mapped[str] = mapped_column(String, nullable=False)
    epic: Mapped[str] = mapped_column(String, nullable=True)
    story_points: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    sprint_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("sprint.id"), nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False)  # Done | In Progress | To Do
    assignee_staff_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("staff.id"), nullable=True)

    sprint: Mapped["Sprint"] = relationship()
    assignee: Mapped["Staff"] = relationship()
