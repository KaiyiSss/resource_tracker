# Data Model — Detailed Reference

> Companion to [`backend-requirements.md`](../backend-requirements.md) (section 9 has the high-level ER diagram).
> This document is the detailed reference for whoever builds/reviews the actual Postgres schema — full column definitions, constraints, indexes, and raw DDL matching the SQLAlchemy models in `backend/app/models/`.

---

## 1. Conventions

- **Primary keys**: Postgres native `UUID`, generated server-side via `gen_random_uuid()` (built into Postgres 13+, no `pgcrypto` extension needed).
- **Naming**: `snake_case` table and column names, singular table names (`staff`, `pod`, not `staffs`/`pods`).
- **Timestamps**: not yet modeled — add `created_at` / `updated_at` (`timestamptz default now()`) if audit history is needed later.
- **Soft delete**: not modeled — all deletes are hard deletes today (see section 7, "Open Questions").
- **Money/points**: story points and capacity are plain `integer` (SP granularity is whole numbers in the current frontend mock data).

---

## 2. Tables

### 2.1 `platform`

Reference/lookup table for cloud platforms (AWS, Azure, GCP, etc).

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `name` | `varchar` | `UNIQUE NOT NULL` — e.g. `AWS`, `Azure`, `GCP`, `On-Prem`, `Hybrid`, `Edge`, `Multi-Cloud` |
| `color_hex` | `varchar` | `NOT NULL` — hex color for UI badges |

```sql
CREATE TABLE platform (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name       varchar NOT NULL UNIQUE,
    color_hex  varchar NOT NULL
);
```

### 2.2 `pod`

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `name` | `varchar` | `UNIQUE NOT NULL` — e.g. `Griffin`, `Phoenix`, `Titan` |
| `color_hex` | `varchar` | `NOT NULL` |

```sql
CREATE TABLE pod (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name       varchar NOT NULL UNIQUE,
    color_hex  varchar NOT NULL
);
```

### 2.3 `pod_platform` (join table)

A pod can bind **any number** of platforms — no min/max limit (previous 1–3 constraint was removed).

| Column | Type | Constraints |
|---|---|---|
| `pod_id` | `uuid` | PK (composite), FK → `pod.id` `ON DELETE CASCADE` |
| `platform_id` | `uuid` | PK (composite), FK → `platform.id` `ON DELETE RESTRICT` |

```sql
CREATE TABLE pod_platform (
    pod_id       uuid NOT NULL REFERENCES pod(id) ON DELETE CASCADE,
    platform_id  uuid NOT NULL REFERENCES platform(id) ON DELETE RESTRICT,
    PRIMARY KEY (pod_id, platform_id)
);

CREATE INDEX idx_pod_platform_platform_id ON pod_platform(platform_id);
```

### 2.4 `staff`

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `name` | `varchar` | `NOT NULL` |
| `initials` | `varchar` | `NOT NULL` — e.g. `GK` for Grace Kim |
| `avatar_color` | `varchar` | `NOT NULL` — hex color for avatar background |
| `role` | `varchar` | `NOT NULL` — e.g. `Lead Developer`, `Senior Developer` |
| `email` | `varchar` | `UNIQUE NOT NULL` — used to match JIRA/Teambook identities |
| `pod_id` | `uuid` | `NOT NULL`, FK → `pod.id` `ON DELETE RESTRICT` — **single pod only** (business rule) |
| `jira_account_id` | `varchar` | nullable — JIRA `accountId` mapping |
| `teambook_user_id` | `varchar` | nullable — Teambook user ID mapping |

```sql
CREATE TABLE staff (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name               varchar NOT NULL,
    initials           varchar NOT NULL,
    avatar_color       varchar NOT NULL,
    role               varchar NOT NULL,
    email              varchar NOT NULL UNIQUE,
    pod_id             uuid NOT NULL REFERENCES pod(id) ON DELETE RESTRICT,
    jira_account_id    varchar,
    teambook_user_id   varchar
);

CREATE INDEX idx_staff_pod_id ON staff(pod_id);
CREATE INDEX idx_staff_jira_account_id ON staff(jira_account_id) WHERE jira_account_id IS NOT NULL;
CREATE INDEX idx_staff_teambook_user_id ON staff(teambook_user_id) WHERE teambook_user_id IS NOT NULL;
```

> `ON DELETE RESTRICT` on `pod_id` — a pod cannot be deleted while it still has staff (matches the `DELETE /api/pods/{id}` 409 check in the API).

### 2.5 `staff_platform` (join table)

A staff member can have **multiple** platform skills, independent of their pod's platforms.

| Column | Type | Constraints |
|---|---|---|
| `staff_id` | `uuid` | PK (composite), FK → `staff.id` `ON DELETE CASCADE` |
| `platform_id` | `uuid` | PK (composite), FK → `platform.id` `ON DELETE RESTRICT` |

```sql
CREATE TABLE staff_platform (
    staff_id     uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    platform_id  uuid NOT NULL REFERENCES platform(id) ON DELETE RESTRICT,
    PRIMARY KEY (staff_id, platform_id)
);

CREATE INDEX idx_staff_platform_platform_id ON staff_platform(platform_id);
```

### 2.6 `sprint`

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `name` | `varchar` | `UNIQUE NOT NULL` — e.g. `Sprint A` |
| `start_date` | `date` | `NOT NULL` |
| `end_date` | `date` | `NOT NULL`, `CHECK (end_date > start_date)` |
| `is_current` | `boolean` | `NOT NULL DEFAULT false` — only one row should be `true` at a time (see partial unique index below) |

```sql
CREATE TABLE sprint (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name        varchar NOT NULL UNIQUE,
    start_date  date NOT NULL,
    end_date    date NOT NULL,
    is_current  boolean NOT NULL DEFAULT false,
    CHECK (end_date > start_date)
);

-- Enforce "at most one current sprint" at the database level
CREATE UNIQUE INDEX idx_sprint_single_current ON sprint (is_current) WHERE is_current = true;
CREATE INDEX idx_sprint_dates ON sprint(start_date, end_date);
```

### 2.7 `sprint_working_day`

Precomputed working days (Mon–Fri) for each sprint, used for the holiday calendar strip in the UI.

| Column | Type | Constraints |
|---|---|---|
| `sprint_id` | `uuid` | PK (composite), FK → `sprint.id` `ON DELETE CASCADE` |
| `work_date` | `date` | PK (composite) |

```sql
CREATE TABLE sprint_working_day (
    sprint_id  uuid NOT NULL REFERENCES sprint(id) ON DELETE CASCADE,
    work_date  date NOT NULL,
    PRIMARY KEY (sprint_id, work_date)
);

CREATE INDEX idx_sprint_working_day_date ON sprint_working_day(work_date);
```

### 2.8 `staff_capacity`

Raw (pre-holiday) capacity per staff member per sprint, in story points. This is the only *editable* capacity number; holidays are deducted at read time (see section 4).

| Column | Type | Constraints |
|---|---|---|
| `staff_id` | `uuid` | PK (composite), FK → `staff.id` `ON DELETE CASCADE` |
| `sprint_id` | `uuid` | PK (composite), FK → `sprint.id` `ON DELETE CASCADE` |
| `raw_capacity_sp` | `integer` | `NOT NULL DEFAULT 10`, `CHECK (raw_capacity_sp >= 0)` |

```sql
CREATE TABLE staff_capacity (
    staff_id         uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    sprint_id        uuid NOT NULL REFERENCES sprint(id) ON DELETE CASCADE,
    raw_capacity_sp  integer NOT NULL DEFAULT 10 CHECK (raw_capacity_sp >= 0),
    PRIMARY KEY (staff_id, sprint_id)
);

CREATE INDEX idx_staff_capacity_sprint_id ON staff_capacity(sprint_id);
```

### 2.9 `holiday`

Read-only from the frontend/API's perspective — only the Teambook sync job writes rows here.

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `staff_id` | `uuid` | `NOT NULL`, FK → `staff.id` `ON DELETE CASCADE` |
| `holiday_date` | `date` | `NOT NULL` |
| `reason` | `varchar` | nullable — e.g. `Annual leave` |
| `status` | `varchar` | `NOT NULL DEFAULT 'approved'` — `approved` \| `pending` |
| `source` | `varchar` | `NOT NULL DEFAULT 'teambook'` |

```sql
CREATE TABLE holiday (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id      uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    holiday_date  date NOT NULL,
    reason        varchar,
    status        varchar NOT NULL DEFAULT 'approved',
    source        varchar NOT NULL DEFAULT 'teambook',
    UNIQUE (staff_id, holiday_date)
);

CREATE INDEX idx_holiday_staff_id ON holiday(staff_id);
CREATE INDEX idx_holiday_date ON holiday(holiday_date);
```

> `UNIQUE (staff_id, holiday_date)` prevents duplicate holiday rows for the same person/day from repeated sync runs — sync jobs should `UPSERT` (`ON CONFLICT (staff_id, holiday_date) DO UPDATE`).

### 2.10 `jira_issue`

| Column | Type | Constraints |
|---|---|---|
| `key` | `varchar` | **PK** — JIRA's own issue key, e.g. `PROJ-101` (not a UUID) |
| `summary` | `varchar` | `NOT NULL` |
| `epic` | `varchar` | nullable |
| `story_points` | `integer` | `NOT NULL DEFAULT 0`, `CHECK (story_points >= 0)` |
| `sprint_id` | `uuid` | `NOT NULL`, FK → `sprint.id` `ON DELETE RESTRICT` |
| `status` | `varchar` | `NOT NULL` — `Done` \| `In Progress` \| `To Do` |
| `assignee_staff_id` | `uuid` | nullable, FK → `staff.id` `ON DELETE SET NULL` |

```sql
CREATE TABLE jira_issue (
    key                 varchar PRIMARY KEY,
    summary             varchar NOT NULL,
    epic                varchar,
    story_points        integer NOT NULL DEFAULT 0 CHECK (story_points >= 0),
    sprint_id           uuid NOT NULL REFERENCES sprint(id) ON DELETE RESTRICT,
    status              varchar NOT NULL CHECK (status IN ('Done', 'In Progress', 'To Do')),
    assignee_staff_id   uuid REFERENCES staff(id) ON DELETE SET NULL
);

CREATE INDEX idx_jira_issue_sprint_id ON jira_issue(sprint_id);
CREATE INDEX idx_jira_issue_assignee ON jira_issue(assignee_staff_id) WHERE assignee_staff_id IS NOT NULL;
```

> `assignee_staff_id` uses `ON DELETE SET NULL` (not `CASCADE`) — deleting a staff record shouldn't delete JIRA history, just unassign it.

---

## 3. Full DDL (in dependency order)

Run these in order (or let Alembic generate/apply them from `app/models/`):

```sql
CREATE TABLE platform (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name       varchar NOT NULL UNIQUE,
    color_hex  varchar NOT NULL
);

CREATE TABLE pod (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name       varchar NOT NULL UNIQUE,
    color_hex  varchar NOT NULL
);

CREATE TABLE pod_platform (
    pod_id       uuid NOT NULL REFERENCES pod(id) ON DELETE CASCADE,
    platform_id  uuid NOT NULL REFERENCES platform(id) ON DELETE RESTRICT,
    PRIMARY KEY (pod_id, platform_id)
);
CREATE INDEX idx_pod_platform_platform_id ON pod_platform(platform_id);

CREATE TABLE staff (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name               varchar NOT NULL,
    initials           varchar NOT NULL,
    avatar_color       varchar NOT NULL,
    role               varchar NOT NULL,
    email              varchar NOT NULL UNIQUE,
    pod_id             uuid NOT NULL REFERENCES pod(id) ON DELETE RESTRICT,
    jira_account_id    varchar,
    teambook_user_id   varchar
);
CREATE INDEX idx_staff_pod_id ON staff(pod_id);
CREATE INDEX idx_staff_jira_account_id ON staff(jira_account_id) WHERE jira_account_id IS NOT NULL;
CREATE INDEX idx_staff_teambook_user_id ON staff(teambook_user_id) WHERE teambook_user_id IS NOT NULL;

CREATE TABLE staff_platform (
    staff_id     uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    platform_id  uuid NOT NULL REFERENCES platform(id) ON DELETE RESTRICT,
    PRIMARY KEY (staff_id, platform_id)
);
CREATE INDEX idx_staff_platform_platform_id ON staff_platform(platform_id);

CREATE TABLE sprint (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name        varchar NOT NULL UNIQUE,
    start_date  date NOT NULL,
    end_date    date NOT NULL,
    is_current  boolean NOT NULL DEFAULT false,
    CHECK (end_date > start_date)
);
CREATE UNIQUE INDEX idx_sprint_single_current ON sprint (is_current) WHERE is_current = true;
CREATE INDEX idx_sprint_dates ON sprint(start_date, end_date);

CREATE TABLE sprint_working_day (
    sprint_id  uuid NOT NULL REFERENCES sprint(id) ON DELETE CASCADE,
    work_date  date NOT NULL,
    PRIMARY KEY (sprint_id, work_date)
);
CREATE INDEX idx_sprint_working_day_date ON sprint_working_day(work_date);

CREATE TABLE staff_capacity (
    staff_id         uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    sprint_id        uuid NOT NULL REFERENCES sprint(id) ON DELETE CASCADE,
    raw_capacity_sp  integer NOT NULL DEFAULT 10 CHECK (raw_capacity_sp >= 0),
    PRIMARY KEY (staff_id, sprint_id)
);
CREATE INDEX idx_staff_capacity_sprint_id ON staff_capacity(sprint_id);

CREATE TABLE holiday (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id      uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    holiday_date  date NOT NULL,
    reason        varchar,
    status        varchar NOT NULL DEFAULT 'approved',
    source        varchar NOT NULL DEFAULT 'teambook',
    UNIQUE (staff_id, holiday_date)
);
CREATE INDEX idx_holiday_staff_id ON holiday(staff_id);
CREATE INDEX idx_holiday_date ON holiday(holiday_date);

CREATE TABLE jira_issue (
    key                 varchar PRIMARY KEY,
    summary             varchar NOT NULL,
    epic                varchar,
    story_points        integer NOT NULL DEFAULT 0 CHECK (story_points >= 0),
    sprint_id           uuid NOT NULL REFERENCES sprint(id) ON DELETE RESTRICT,
    status              varchar NOT NULL CHECK (status IN ('Done', 'In Progress', 'To Do')),
    assignee_staff_id   uuid REFERENCES staff(id) ON DELETE SET NULL
);
CREATE INDEX idx_jira_issue_sprint_id ON jira_issue(sprint_id);
CREATE INDEX idx_jira_issue_assignee ON jira_issue(assignee_staff_id) WHERE assignee_staff_id IS NOT NULL;
```

---

## 4. Computed Values (not stored — calculated at query time)

These are **not** columns; they are calculated in `app/services/capacity_service.py` and must be recalculated on every read (do not cache them in the database without a clear invalidation strategy):

```
demand(staff, sprint)
    = SUM(jira_issue.story_points)
      WHERE jira_issue.assignee_staff_id = staff.id
        AND jira_issue.sprint_id = sprint.id

effective_capacity(staff, sprint)
    = staff_capacity.raw_capacity_sp
      - COUNT(holiday WHERE holiday.staff_id = staff.id
                        AND holiday.holiday_date IN sprint.working_days)

net_available(staff, sprint)
    = effective_capacity(staff, sprint) - demand(staff, sprint)

status(staff, sprint)
    = 'available'  if net_available >= 2
    = 'tight'      if 0 <= net_available < 2
    = 'over'       if net_available < 0

pod_effective_capacity(pod, sprint) = SUM(effective_capacity) over staff where staff.pod_id = pod.id
pod_demand(pod, sprint)             = SUM(demand)             over staff where staff.pod_id = pod.id
pod_util_pct(pod, sprint)           = ROUND(pod_demand / pod_effective_capacity * 100)  (0 if capacity is 0)
```

---

## 5. Relationship Cardinality Summary

| Relationship | Cardinality | Enforced by |
|---|---|---|
| Pod ↔ Platform | many-to-many, unlimited both ways | `pod_platform` join table, no count constraint |
| Staff → Pod | many-to-one, **exactly one** pod per staff | `staff.pod_id NOT NULL`, single FK column (not a join table) |
| Staff ↔ Platform | many-to-many, unlimited skills | `staff_platform` join table |
| Staff → Holiday | one-to-many | `holiday.staff_id` FK |
| Staff → JiraIssue | one-to-many (as assignee), nullable | `jira_issue.assignee_staff_id` FK, nullable |
| Sprint → JiraIssue | one-to-many | `jira_issue.sprint_id` FK |
| Sprint → StaffCapacity | one-to-many | `staff_capacity.sprint_id` FK |
| Sprint → SprintWorkingDay | one-to-many | `sprint_working_day.sprint_id` FK |
| Staff × Sprint → StaffCapacity | composite PK, one row per pair | `staff_capacity` PK `(staff_id, sprint_id)` |

---

## 6. Sample Seed Data

Useful for local development / smoke testing (matches the shape of `mockData.ts`):

```sql
INSERT INTO platform (name, color_hex) VALUES
  ('AWS', '#FF9900'), ('Azure', '#0078D4'), ('GCP', '#4285F4'),
  ('On-Prem', '#6B7280'), ('Hybrid', '#8B5CF6'), ('Edge', '#10B981'), ('Multi-Cloud', '#F59E0B');

INSERT INTO pod (name, color_hex) VALUES
  ('Griffin', '#6366f1'), ('Phoenix', '#f97316'), ('Titan', '#10b981');

-- Bind platforms to a pod (look up ids first in real usage)
INSERT INTO pod_platform (pod_id, platform_id)
SELECT p.id, pl.id FROM pod p, platform pl
WHERE p.name = 'Griffin' AND pl.name IN ('AWS', 'Azure');

INSERT INTO sprint (name, start_date, end_date, is_current) VALUES
  ('Sprint A', '2026-06-15', '2026-06-28', false),
  ('Sprint B', '2026-06-29', '2026-07-12', true);

INSERT INTO staff (name, initials, avatar_color, role, email, pod_id)
SELECT 'Grace Kim', 'GK', '#3b82f6', 'Lead Developer', 'grace.kim@example.com', p.id
FROM pod p WHERE p.name = 'Griffin';
```

---

## 7. Open Questions for the Team

1. **Soft delete vs hard delete** — should `staff`/`pod` support archiving instead of hard `DELETE`? Current API scaffold hard-deletes.
2. **Audit trail** — do we need `created_at`/`updated_at`/`created_by` columns for compliance? Not modeled yet.
3. **Multiple concurrent "current" sprints** — the partial unique index assumes only one sprint can be `is_current = true` at a time; confirm this matches real sprint cadence (some orgs run overlapping sprints per team).
4. **Historical `staff_capacity`** — if a staff member changes pods mid-sprint, should capacity/demand be split, or does the pod move take effect from the next sprint only? Current model assumes the latter (pod is a point-in-time attribute of staff, not sprint-scoped).
5. **JIRA key immutability** — JIRA issue keys can change if the issue moves projects; if that happens upstream, the sync job needs a strategy (soft-delete old key + insert new key, or handle via a separate stable JIRA `id` column in addition to `key`).
