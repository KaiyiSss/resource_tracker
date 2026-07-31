import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.jira_issue import JiraIssue
from app.schemas.jira_issue import JiraIssueCreate, JiraIssueOut, JiraIssueUpdate

router = APIRouter(prefix="/api/jira", tags=["jira"])


@router.get("/issues", response_model=list[JiraIssueOut])
def list_issues(
    sprint: uuid.UUID | None = None,
    assignee: uuid.UUID | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(JiraIssue)
    if sprint:
        query = query.filter(JiraIssue.sprint_id == sprint)
    if assignee:
        query = query.filter(JiraIssue.assignee_staff_id == assignee)
    return query.all()


@router.post("/issues", response_model=JiraIssueOut, status_code=201)
def create_issue(payload: JiraIssueCreate, db: Session = Depends(get_db)):
    issue = JiraIssue(**payload.model_dump())
    db.add(issue)
    db.commit()
    db.refresh(issue)
    return issue


@router.put("/issues/{issue_key}", response_model=JiraIssueOut)
def update_issue(issue_key: str, payload: JiraIssueUpdate, db: Session = Depends(get_db)):
    issue = db.get(JiraIssue, issue_key)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(issue, field, value)
    db.commit()
    db.refresh(issue)
    return issue


@router.delete("/issues/{issue_key}", status_code=204)
def delete_issue(issue_key: str, db: Session = Depends(get_db)):
    issue = db.get(JiraIssue, issue_key)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    db.delete(issue)
    db.commit()


@router.post("/sync", status_code=202)
def sync_from_jira():
    # TODO: call the JIRA REST API and upsert issues into the database
    raise HTTPException(status_code=501, detail="Not implemented")
