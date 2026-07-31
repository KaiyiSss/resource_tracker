# API Reference

> Companion to [`backend-requirements.md`](../backend-requirements.md) (section 10 has the summarized endpoint table) and [`data-model.md`](./data-model.md) (full DB schema).
> This document is the detailed request/response reference for every endpoint implemented in `backend/app/routers/`.

Base URL (local dev): `http://localhost:8000`
Interactive docs (auto-generated from the same code): `http://localhost:8000/docs`

All request/response bodies are JSON. All IDs are UUID v4 strings unless noted otherwise (JIRA issue `key` is a plain string like `PROJ-101`).

---

## Conventions

| HTTP status | Meaning |
|---|---|
| `200` | Success (GET/PUT) |
| `201` | Created (POST) |
| `204` | Success, no body (DELETE, batch updates) |
| `404` | Resource not found |
| `409` | Conflict (e.g. deleting a pod that still has staff) |
| `501` | Not implemented yet (JIRA/Teambook sync stubs) |
| `422` | Validation error (FastAPI default, e.g. malformed UUID) |

---

## 1. Auth

### `GET /api/me`

Returns the current logged-in user. **Stub only** — no real auth wired up yet.

**Response `200`**
```json
{ "id": "stub-user", "name": "Delivery Lead", "role": "delivery_lead" }
```

---

## 2. Staff — `/api/staff`

### `GET /api/staff`
List all staff members.

**Response `200`**
```json
[
  {
    "id": "b3f1...-uuid",
    "name": "Grace Kim",
    "initials": "GK",
    "avatar_color": "#3b82f6",
    "role": "Lead Developer",
    "email": "grace.kim@example.com",
    "pod_id": "a1c2...-uuid",
    "jira_account_id": null,
    "teambook_user_id": null,
    "platforms": [
      { "id": "d4e5...-uuid", "name": "Azure", "color_hex": "#0078D4" }
    ]
  }
]
```

### `GET /api/staff/{staff_id}`
Get one staff member. `404` if not found.

### `POST /api/staff`
Create a staff member.

**Request body**
```json
{
  "name": "Iris Taylor",
  "initials": "IT",
  "avatar_color": "#8b5cf6",
  "role": "Senior Developer",
  "email": "iris.taylor@example.com",
  "pod_id": "a1c2...-uuid",
  "platform_ids": ["d4e5...-uuid"]
}
```

**Response `201`** — full `StaffOut` object (id generated server-side via `gen_random_uuid()`).

### `PUT /api/staff/{staff_id}`
Update name/role/avatar. All fields optional (partial update).

**Request body**
```json
{ "role": "Staff Engineer" }
```

**Response `200`** — updated `StaffOut`. `404` if not found.

### `PUT /api/staff/{staff_id}/pod`
Reassign a staff member to a different pod. **A staff member belongs to exactly one pod** — this replaces the current assignment, it does not add one.

**Request body**
```json
{ "pod_id": "f6a7...-uuid" }
```

**Response `200`** — updated `StaffOut`.

### `PUT /api/staff/{staff_id}/platforms`
Replace the full set of platform skills for a staff member (no count limit).

**Request body**
```json
{ "platform_ids": ["d4e5...-uuid", "e6f7...-uuid"] }
```

**Response `200`** — updated `StaffOut`.

### `PUT /api/staff/{staff_id}/external-ids`
Update JIRA/Teambook identity mapping. Fields optional.

**Request body**
```json
{ "jira_account_id": "5f1234abcd", "teambook_user_id": "tb-9981" }
```

**Response `200`** — updated `StaffOut`.

---

## 3. Pods — `/api/pods`

### `GET /api/pods`
List all pods with bound platforms.

**Response `200`**
```json
[
  {
    "id": "a1c2...-uuid",
    "name": "Griffin",
    "color_hex": "#6366f1",
    "platforms": [
      { "id": "d4e5...-uuid", "name": "AWS", "color_hex": "#FF9900" },
      { "id": "e6f7...-uuid", "name": "Azure", "color_hex": "#0078D4" }
    ]
  }
]
```

### `GET /api/pods/{pod_id}`
Get one pod. `404` if not found.

### `GET /api/pods/{pod_id}/staff`
List all staff currently assigned to a pod.

**Response `200`** — array of `StaffOut` (see section 2).

### `POST /api/pods`
Create a pod. `platform_ids` accepts **any number** of platforms (no limit).

**Request body**
```json
{ "name": "Nova", "color_hex": "#0ea5e9", "platform_ids": ["d4e5...-uuid"] }
```

**Response `201`** — full `PodOut` object.

### `PUT /api/pods/{pod_id}`
Rename pod / change color. Fields optional.

**Request body**
```json
{ "color_hex": "#f43f5e" }
```

### `PUT /api/pods/{pod_id}/platforms`
Replace the full set of platforms bound to a pod (no count limit).

**Request body**
```json
{ "platform_ids": ["d4e5...-uuid", "e6f7...-uuid", "f8a9...-uuid"] }
```

### `POST /api/pods/{pod_id}/staff`
Batch-assign staff to a pod (each staff member still ends up belonging to only this one pod — this overwrites their previous pod assignment).

**Request body**
```json
["b3f1...-uuid", "c4a2...-uuid"]
```

**Response `204`** — no body.

### `DELETE /api/pods/{pod_id}/staff/{staff_id}`
**Not supported directly** — staff must always belong to a pod. Always returns `404` with a message pointing to `PUT /api/staff/{staff_id}/pod` instead.

### `DELETE /api/pods/{pod_id}`
Delete a pod. Fails with `409` if it still has staff assigned.

**Response `204`** on success, `409` if staff still assigned, `404` if not found.

---

## 4. Sprints — `/api/sprints`

### `GET /api/sprints`
List all sprints, ordered by `start_date`.

**Response `200`**
```json
[
  {
    "id": "s1a2...-uuid",
    "name": "Sprint A",
    "start_date": "2026-06-15",
    "end_date": "2026-06-28",
    "is_current": false,
    "working_days": ["2026-06-15", "2026-06-16", "..."]
  }
]
```

### `GET /api/sprints/{sprint_id}`
Get one sprint. `404` if not found.

### `POST /api/sprints`
Create a sprint.

**Request body**
```json
{
  "name": "Sprint K",
  "start_date": "2026-12-07",
  "end_date": "2026-12-20",
  "is_current": false,
  "working_days": ["2026-12-07", "2026-12-08"]
}
```

### `PUT /api/sprints/{sprint_id}`
Update dates or mark as current. Fields optional.

**Request body**
```json
{ "is_current": true }
```

---

## 5. JIRA — `/api/jira`

### `GET /api/jira/issues?sprint={sprint_id}&assignee={staff_id}`
List issues, optionally filtered by sprint and/or assignee. Both query params optional.

**Response `200`**
```json
[
  {
    "key": "PROJ-101",
    "summary": "Implement OAuth2 login flow",
    "epic": "Auth Revamp",
    "story_points": 3,
    "sprint_id": "s1a2...-uuid",
    "status": "In Progress",
    "assignee_staff_id": "b3f1...-uuid"
  }
]
```

### `POST /api/jira/issues`
Create an issue.

**Request body**
```json
{
  "key": "PROJ-205",
  "summary": "Write integration tests",
  "epic": "API Modernisation",
  "story_points": 2,
  "sprint_id": "s1a2...-uuid",
  "status": "To Do",
  "assignee_staff_id": "b3f1...-uuid"
}
```

**Response `201`**

### `PUT /api/jira/issues/{issue_key}`
Update an issue. Fields optional. `404` if `issue_key` not found.

**Request body**
```json
{ "status": "Done" }
```

### `DELETE /api/jira/issues/{issue_key}`
**Response `204`**. `404` if not found.

### `POST /api/jira/sync`
Trigger a sync from the real JIRA REST API. **Not implemented yet** — returns `501`.

---

## 6. Holidays (Teambook) — `/api/teambook`

Read-only from the API's perspective — the only writer is the sync job.

### `GET /api/teambook/holidays?from_={date}&to={date}&staff={staff_id}`
All query params optional.

**Response `200`**
```json
[
  {
    "id": "h1a2...-uuid",
    "staffId": "b3f1...-uuid",
    "date": "2026-07-03",
    "reason": "Annual leave",
    "status": "approved"
  }
]
```

### `POST /api/teambook/sync`
Trigger a sync from the Teambook API. **Not implemented yet** — returns `501`.

---

## 7. Capacity (computed aggregates) — `/api/capacity`

All values here are **computed on read** (see `app/services/capacity_service.py`), not stored columns.

### `GET /api/capacity?sprint={sprint_id}`
Per-staff effective capacity, demand, net available, and status for one sprint.

**Response `200`**
```json
[
  {
    "staff_id": "b3f1...-uuid",
    "sprint_id": "s1a2...-uuid",
    "effective_capacity": 9,
    "demand": 11,
    "net_available": -2,
    "status": "over"
  }
]
```

`status` is one of `available` (`net_available >= 2`), `tight` (`0 <= net_available < 2`), `over` (`net_available < 0`).

### `GET /api/capacity/range?from_={sprint_id}&to={sprint_id}`
Same shape as above, but one row per staff **per sprint** across the date range spanned by the two given sprints (inclusive).

### `GET /api/capacity/pod/{pod_id}?sprint={sprint_id}`
Per-pod aggregate for one sprint.

**Response `200`**
```json
{
  "pod_id": "a1c2...-uuid",
  "sprint_id": "s1a2...-uuid",
  "effective_capacity": 91,
  "demand": 83,
  "util_pct": 91
}
```

### `GET /api/capacity/raw?sprint={sprint_id}`
List the editable raw (pre-holiday) capacity per staff for a sprint.

**Response `200`**
```json
[{ "staffId": "b3f1...-uuid", "sprintId": "s1a2...-uuid", "rawCapacitySp": 10 }]
```

### `PUT /api/capacity/raw`
Bulk-update raw capacity per staff per sprint. Upserts (creates the row if missing).

**Request body**
```json
[
  { "staff_id": "b3f1...-uuid", "sprint_id": "s1a2...-uuid", "raw_capacity_sp": 8 },
  { "staff_id": "c4a2...-uuid", "sprint_id": "s1a2...-uuid", "raw_capacity_sp": 10 }
]
```

**Response `204`** — no body.

---

## 8. Not Yet Implemented

| Endpoint | Status |
|---|---|
| `POST /api/jira/sync` | `501` stub — needs real JIRA REST API call + upsert logic |
| `POST /api/teambook/sync` | `501` stub — needs real Teambook API call + upsert logic |
| `GET /api/me` | Hardcoded stub — needs real auth/SSO |
| `/api/reports/summary` | Mentioned in `backend-requirements.md` but no router yet |

---

## 9. Frontend Integration Checklist

Once the backend is live, replace the frontend's mock data reads (see `docs/backend-requirements.md` section 7) with calls to:

1. `GET /api/capacity?sprint=...` → replaces `getEffectiveCapacity`/`getNetAvailable`/`getStatus` local computation
2. `GET /api/capacity/range?from_=...&to=...` → replaces cross-sprint mock aggregation
3. `GET /api/jira/issues?sprint=...` → replaces `StaffMember.jiraStories`
4. `GET /api/teambook/holidays?...` → replaces `sprintData.holidays`/`holidayDates`
5. `GET /api/pods`, `GET /api/staff`, `GET /api/sprints` → replace `POD_CONFIGS`, `STAFF`, `SPRINTS` constants
