# Resource Tracker Backend

FastAPI + PostgreSQL backend implementing the data model and API surface described in
[`../backend-requirements.md`](../backend-requirements.md).

## Tech Stack

| Layer | Choice |
|---|---|
| Language | Python 3.12 |
| Framework | FastAPI |
| ORM | SQLAlchemy 2.0 (typed models) |
| Database | PostgreSQL 13+ |
| Migrations | Alembic |
| Validation | Pydantic v2 |
| Server | Uvicorn |

## Project Structure

```
backend/
  app/
    main.py            # FastAPI app, CORS, router registration
    config.py          # Settings loaded from .env (pydantic-settings)
    database.py         # SQLAlchemy engine/session setup
    models/              # ORM models: staff, pod, platform, sprint, holiday, jira_issue
    schemas/              # Pydantic request/response models, one file per resource
    routers/               # FastAPI route handlers, one file per resource
    services/              # Business logic (capacity/demand/net-available calculation)
  alembic/                # Database migration scripts
    env.py
    versions/
  requirements.txt
  .env.example
  alembic.ini
```

## Prerequisites

- Python 3.12 (`py -3.12 --version` to check on Windows)
- PostgreSQL 13+ running locally or reachable via network
- `pip`

## Setup

```powershell
cd backend
py -3.12 -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
```

Then edit `.env`:

```
DATABASE_URL=postgresql+psycopg2://<user>:<password>@<host>:5432/resource_tracker
JIRA_BASE_URL=...
JIRA_EMAIL=...
JIRA_API_TOKEN=...
TEAMBOOK_BASE_URL=...
TEAMBOOK_API_TOKEN=...
SECRET_KEY=...
```

### VS Code interpreter

If Pylance shows "Unable to import" errors, select the venv interpreter:
`Ctrl+Shift+P` → `Python: Select Interpreter` → `backend\.venv\Scripts\python.exe`.

## Database & Migrations

Create the Postgres database first (`resource_tracker` or whatever you set in `DATABASE_URL`), then:

```powershell
alembic revision --autogenerate -m "init schema"
alembic upgrade head
```

Re-run `alembic revision --autogenerate` whenever a model in `app/models/` changes, then `alembic upgrade head` to apply it.

## Run

```powershell
uvicorn app.main:app --reload --port 8000
```

- API docs (Swagger UI): `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`
- CORS is currently allowed only for `http://localhost:5173` (the Vite frontend); update `app/main.py` if the frontend origin changes.

## API Overview

| Resource | Router | Notes |
|---|---|---|
| `/api/staff` | `routers/staff.py` | List/get/create/update staff, reassign pod, update platform skills, update JIRA/Teambook IDs |
| `/api/pods` | `routers/pods.py` | List/get/create/update pods, manage bound platforms, assign/list staff |
| `/api/sprints` | `routers/sprints.py` | List/get/create/update sprints |
| `/api/jira` | `routers/jira.py` | CRUD on JIRA issues, trigger sync |
| `/api/teambook` | `routers/holidays.py` | Read-only holiday list, trigger sync |
| `/api/capacity` | `routers/capacity.py` | Computed effective capacity / demand / net available, per staff, pod, or sprint range |
| `/api/me` | `routers/auth.py` | Stub current-user endpoint |

## Data Model Notes

- A pod may bind any number of platforms (no limit).
- A staff member may have multiple platform skills but belongs to exactly one pod (`staff.pod_id` is a single FK).
- Holidays are read-only from the API's perspective — only `/api/teambook/sync` writes them.
- Demand, effective capacity, net available, and status are computed on read in `app/services/capacity_service.py`, not stored as columns.
- Primary keys use Postgres' native `UUID` type with `gen_random_uuid()` as the server-side default (built into Postgres 13+, no `pgcrypto` extension required).

## TODO / Not Yet Implemented

- `/api/jira/sync` and `/api/teambook/sync` are stubs (`501 Not Implemented`) — need real JIRA REST API and Teambook API integration.
- `/api/me` returns a hardcoded stub user — real auth/SSO is not wired up yet.
- No automated tests yet.

