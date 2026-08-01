# Resource Tracker

Full-stack resource capacity tracker for delivery teams: a React frontend plus a FastAPI + PostgreSQL backend.

## Repository Layout

```
resource_tracker/
  frontend/   # React + Vite + TypeScript + Tailwind CSS
  backend/    # FastAPI + PostgreSQL + SQLAlchemy
  docs/       # Design docs, data model, and API reference
```

- [`frontend/README.md`](frontend/README.md) — how to run the UI prototype
- [`backend/README.md`](backend/README.md) — how to run the API, connect Postgres, and run migrations
- [`docs/backend-requirements.md`](docs/backend-requirements.md) — backend/API integration specification
- [`docs/data-model.md`](docs/data-model.md) — detailed database schema and DDL for the team building the database
- [`docs/api.md`](docs/api.md) — detailed request/response reference for every endpoint

## What This Project Does

- Tracks staff availability across sprints per pod and platform.
- Models real-world delivery constraints: pods can bind any number of platforms; staff can have multiple platform skills but belong to only one pod.
- Pulls demand from JIRA issues and holidays from Teambook; computes effective capacity and net availability on the fly.

## Quick Start

### Frontend

```powershell
cd frontend
npm install
npm run dev        # http://localhost:5173
```

The frontend currently runs on mocked data; it will switch to real backend APIs once they are ready.

### Backend

```powershell
cd backend
py -3.12 -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
# edit .env with your Postgres URL, JIRA and Teambook credentials
alembic revision --autogenerate -m "init schema"
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

API docs are available at `http://localhost:8000/docs`.

## Key Business Rules

| Rule | Details |
|---|---|
| Pod platforms | A pod can bind to any number of platforms (no 1–3 limit). |
| Staff platforms | A staff member can have multiple platform skills. |
| Staff pod | A staff member belongs to exactly one pod at a time. |
| Holidays | Read-only from the UI; written only by the Teambook sync job. |
| Demand | Computed as the sum of story points on assigned JIRA issues per sprint. |
| Capacity | Computed as raw capacity minus approved holidays within a sprint's working days. |

## Status

- Frontend: working prototype, UI iteration ongoing.
- Backend: scaffold complete; models, routers, schemas, and docs in place. JIRA/Teambook sync and authentication are still stubs (`501`).
