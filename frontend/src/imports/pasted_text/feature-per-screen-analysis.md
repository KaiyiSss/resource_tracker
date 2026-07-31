Why "feature-per-screen" fails for delivery leads
Your 3 existing capabilities (sprint capacity/demand, holidays, home pod) map naturally to 3 separate screens/APIs — but a delivery lead's actual question is always cross-cutting: "Who can I put on this work, in this sprint, from this pod/platform?" If the wireframe shows 3 disconnected tables, the customer will still have to do the mental join themselves, which defeats the purpose of the tool.

Recommended structure: one "Answer" per screen, not one screen per data source
1. Landing screen — "Sprint Cockpit" (global context, always visible)
A persistent filter bar: Sprint(s) · Pod · Platform (Cloud/Azure) — this becomes the lens for everything below it. Every other screen inherits this filter instead of re-asking it.

2. Hero use case — "Staff Availability Finder"
This is the #1 use case, so it should be the first thing a delivery lead sees, not buried in a report:

A table/grid of staff rows, each pre-computed as: Capacity − Demand − Holiday deduction = Available
Columns: Home Pod, Platform, Sprint, Total Capacity, Total Demand (from Jira), Holidays in sprint, Net Available (the number they actually want)
Sortable/filterable by "Available > 0" to instantly answer "who has room this sprint"
Color-coded (over-allocated / tight / available) — this single visual is probably what gets you the sign-off
3. Drill-down drawer (click a staff row)
Instead of a separate "holiday page" and separate "pod page," clicking a person slides out a detail panel combining:

Home pod + platform badge
Demand breakdown by Jira story/epic (so they see why the number is what it is)
Holiday calendar strip overlaid on the sprint dates
Capacity vs demand mini bar chart across the last/next few sprints (trend, not just one snapshot)
4. Aggregate view — "Capacity by Pod/Platform/Sprint"
This satisfies use case 4 as a roll-up of the same underlying data model (not a separate feature): a pivot-style summary (rows = pods or platforms, columns = sprints, cells = capacity vs demand) so leads can spot which pod is over/under-committed at a glance, with click-through back into the Staff Availability Finder pre-filtered.

Key modeling suggestion
Before wireframing, define one unified per-staff-per-sprint record (capacity, demand, holiday days, pod, platform) as your single source of truth for the UI — the 3 backend endpoints just populate different fields of the same row. This keeps the wireframe honest about being "3 use cases," not "3 features bolted together."

For the actual sign-off artifact
I'd build this as a clickable prototype with realistic mock data (not static images) — delivery leads respond much better to something they can filter/click than a Figma-style flat mockup, and it's a much stronger sign-off tool.

---

## Addendum: Entry Page + reconciling with the existing feature-oriented nav

Context: the current production app has a left-side navigator with independent modules — **JIRA**, **Holidays**, **Allocation & Efficiency**. These map 1:1 to backend capabilities, which is great for data maintenance but forces the delivery lead to mentally "join" 3 screens to answer any real question. The system also has two more ambitions beyond insight-viewing:
- (a) being the place where source data gets **input/maintained** (JIRA linkage, holiday entry, pod/allocation assignment)
- (b) **generating reports** with standalone delivery-lead value (exportable/shareable, not just interactive)

So the IA needs to serve 3 jobs at once: **decide** (use-case cockpit), **maintain** (data entry), **report** (shareable output). Trying to cram all of that into one flat left nav of "JIRA / Holidays / Allocation" is what's making it feel disconnected from the primary use case.

### 1. New Entry Page — a "module launcher" tied to primary use cases, not to data sources

On load, show a landing/home screen (not the raw table) with large clickable cards, one per **primary use case**, each showing a live glanceable metric so the entry page is useful on its own, not just a menu:

| Card | Answers | Live preview metric shown on the card |
|---|---|---|
| **Staff Availability Finder** | "Who can I staff this sprint?" | e.g. "9 of 16 staff available this sprint" |
| **Capacity by Pod / Platform** | "Which pod/platform is over- or under-committed?" | e.g. "Griffin pod at 112% demand" |
| **Reports** | "Give me something to share/export" | e.g. "3 reports ready, last generated today" |
| **Manage Data** (secondary, smaller card/strip) | "Fix or enter source data" | e.g. data-health flags (see below) |

A persistent sprint/pod/platform context selector sits above the cards, so clicking a card carries the chosen context straight into that screen (no re-filtering).

Include a **Data Health banner** on the entry page (e.g., "3 staff missing holiday data for Sprint B", "JIRA sync last ran 2h ago") — this nudges whoever's responsible toward the Manage Data area instead of that area needing to be browsed proactively.

### 2. Reconciling the existing left nav — hybrid IA, two zones instead of one flat list

Keep JIRA / Holidays / Allocation & Efficiency screens — they're legitimately separate data-entry workflows with their own forms/validation — but stop presenting them as peers of the use-case views. Split the nav into two visually distinct zones:

**Zone 1 — Insights (primary, top of nav, what a delivery lead opens 90% of the time)**
- Home (entry page above)
- Staff Availability Finder
- Capacity by Pod / Platform
- Reports

**Zone 2 — Manage Data (secondary, bottom of nav or under a collapsed "Data Admin" section, visually de-emphasized)**
- JIRA sync / mapping
- Holidays
- Allocation & Home Pod

This keeps one mental model: **Insights = computed results, Manage Data = where you fix the inputs feeding those results.**

### 3. Cross-linking instead of separation

To stop Manage Data feeling "hard to reach when you need it," every insight screen should deep-link into the relevant admin page, pre-filtered:
- Staff drawer → "Edit holidays for this person" jumps to Holidays admin filtered to that staff + sprint
- Staff drawer → "Edit demand" jumps to JIRA mapping filtered to that staff
- Pod summary cell → "Edit allocation" jumps to Allocation & Home Pod screen filtered to that pod

This avoids duplicating CRUD UI inside the insight screens while keeping the fix-it path one click away.

### 4. Reports as a first-class use case, not an export button bolted onto a table

Treat Reports as generated views over the same unified data model, distinct from ad-hoc interactive filtering:
- Examples: "Sprint Capacity Report", "Pod Utilization Trend", "Over-allocation Risk List"
- Each report = a saved combination of filters + a fixed layout meant for exporting/sharing (PDF/CSV) or scheduling, vs. the Finder/Summary screens which are for live exploration.

### 5. Proposed nav structure (summary)

```
Home (entry page / module launcher)
Staff Availability Finder
Capacity by Pod / Platform
Reports
──────────────
Manage Data
  ├─ JIRA
  ├─ Holidays
  └─ Allocation & Home Pod
```

### Open questions before implementing
1. Should "Manage Data" be role-gated (only Admin/Ops see it) or visible to everyone but visually secondary? - now is open to every user.
2. For the entry page live-preview metrics, is current-sprint-only the right default context, or last-viewed filters?
3. Which reports have the most sign-off value to mock first (pick 1-2 for the prototype)? capacity vs demands in delivery plan (jira epic, jira story, delta in capacity and demands, pod resource allocation distribution)