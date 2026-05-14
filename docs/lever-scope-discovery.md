# Lever Scope — Discovery (Phase 1)

> **Status:** discovery only. Implementation paused pending review.
> **Branch:** `feature/migration-for-demo` (the pre-migration Next.js demo).
> **Date:** 2026-05-13.

> **⚠ Correction (2026-05-13, after first draft).** The original prompt said
> *"This is NOT a change to the existing CIO dropdown — that stays as-is.
> The two scope filters compose (CIO AND Lever)."* That has been overridden:
> the existing CIO dropdown is **replaced** by the Lever dropdown. Same widget,
> same header position, same single-select pattern — only the options change.
> Sections below have been revised to reflect this. Side-effects of removing the
> CIO selector (department label, inner-header text) are now Open Questions
> #2 and #3.

---

## 0. Discovery context — branch state vs prompt assumptions

The prompt describes the Nx host's stack: **TanStack Query**, **nuqs** for URL state, and "every TanStack Query hook that takes a `cio` param." None of that is true on this branch. This is a single-app Next.js 16 demo that ships with static mock data and is in flight for migration into `apps/bps-hub` (see `MIGRATION.md`). What is true here:

| Assumed by prompt | Reality on this branch |
|---|---|
| Nx monorepo workspace `@bofa` | Single-app Next.js 16 (`my-project`) |
| TanStack Query | **Not installed** (no `@tanstack/react-query` in `package.json`) |
| nuqs URL state | **Not installed**; zero `useSearchParams` / `useRouter` references |
| Backend on the wire (Roger's data share) | **None.** All data is static mock in `lib/mock-data.ts` and `lib/executive-data.ts` |
| CIO dropdown scopes "every query hook" | The CIO dropdown is **cosmetic** today — see §1 |
| `Lever From VMART` / `Levers` field | **Absent** from `lib/types.ts` and from every mock record |
| AG Grid v32.3.0, shadcn/ui, React + TS | ✓ confirmed |

**Implication.** Three options:

- **A — Replace the dropdown's options in the demo with cosmetic scoping only.** Faithfully matches today's CIO dropdown (which is cosmetic, see §1.3), but adds nothing real. Not recommended.
- **B — Replace the dropdown in the demo with client-side filtering of `mockVulnerabilities`.** Wires real scoping for the first time. Sets a precedent that survives the lift-and-shift if we keep the constants/utility layer portable.
- **C — Defer until after the Nx migration lands.** Build directly against the host's TanStack Query hooks and nuqs URL state. Matches the prompt's assumed stack exactly, but pushes the deliverable past the migration window.

A decision on A/B/C is **the first open question** below. The rest of this document assumes **Option B** since that is the only path that lets us deliver in this branch without violating the literal-migration rule that governs the in-flight Nx move.

---

## 1. The existing CIO scope dropdown — structure to repurpose

We are not mirroring this pattern alongside; we are **replacing** the CIO dropdown's options, state, and label with the Lever equivalents. This section enumerates exactly what gets repurposed so the diff in Phase 2 is mechanical.

### 1.1 Where it lives

| Concern | Location |
|---|---|
| Render | `app/page.tsx:628-708` — inside `HeaderCard`, a Radix `Popover` over a button styled `vrd-header-cio-btn`. |
| Item list | `app/page.tsx:671-696` — maps `CIO_TEAMS` (from `lib/mock-data.ts:17-25`), each row is `Avatar + name + Check (if selected)`. |
| Trigger label | `app/page.tsx:673` — literal `CIO: {selectedCio.name}`. |
| Open state | `useState(false)` in `HeaderCard`, local to the component. |

### 1.2 How its state is stored

- **State container:** plain React `useState` at the top of the `App` component.
  - `app/page.tsx:1642` → `const [selectedCio, setSelectedCio] = useState(CIO_TEAMS[0]!);`
- **Default:** the first item in `CIO_TEAMS` — i.e. there is **no "All CIOs" sentinel today**. The current dropdown cannot be "unscoped". This is a notable divergence from the proposed Lever pattern (`All Levers` is required).
- **Persistence:** none. The selection is lost on refresh.
- **Storage container:** there is no Zustand, no React context, no localStorage write. Single source of truth is `App`'s local state.

### 1.3 What it scopes today — **nothing**

Tracing the consumer side reveals that the CIO selection only feeds **display strings**, never data filtering:

| Consumer | What it does with `selectedCio` |
|---|---|
| `HeaderCard` (`app/page.tsx:519-708`) | Renders `CIO: {selectedCio.name}` in the trigger; looks up `CIO_DEPARTMENTS[selectedCio.name]` for the meta-row department label. |
| `MetaRow` (`app/page.tsx:776-829`) | Receives `department` derived from `selectedCio`, displays it next to the totals. |
| `VulnerabilitiesPage` (`app/page.tsx:1538-1626`) | Renders `{selectedCio.name} · {department} · {formatCount(stats.total)} records total` in the inner header (`app/page.tsx:1603`). |
| `DashboardPage` | Does **not** receive `selectedCio` at all. |

Critically:

- The vulnerabilities list passed to both pages is `mockVulnerabilities` **in full** (`app/page.tsx:1741`, `1746`). It is never filtered by `selectedCio.name`.
- The dashboard stats and chart series are imported from `lib/executive-data.ts` as **static constants** (`DASHBOARD_STATS`, `SOURCE_CHART_OPEN`, `APPLICATION_CHART_OPEN`, `OWNER_CHART_OPEN`, `DAYS_OPEN_DATA`, etc.). They are not parameterised by CIO.
- The grid does render a hidden `cioDisplayName` column (`components/executive/ag-grid-table.tsx:639`), but that is a column toggle, not a filter.
- Side-panel prev/next (`components/vulnerability/detail-sheet.tsx`) walks the full `allVulnerabilities` array passed by the page — again, unfiltered.

**Net:** switching CIO today changes two pieces of text. The grid, the dashboard KPIs, the charts, and the side-panel pager are all unaffected.

### 1.4 The prop-drilling map (if we keep this pattern)

```
App (useState selectedCio)
 ├─ HeaderCard
 │   ├─ MetaRow (department only)
 │   └─ Popover trigger + item list
 ├─ DashboardPage          ← does not receive selectedCio
 └─ VulnerabilitiesPage
     └─ AgGridTriageTable  ← does not receive selectedCio either
         └─ DetailSheet    ← does not receive selectedCio either
```

### 1.5 Query hooks that take a `cio` param today

**None.** No `useQuery`, no `useMutation`, no `react-query`, no SWR, no fetch wrapper. Every "fetch" today is `import { mockVulnerabilities } from "@/lib/mock-data";`.

### 1.6 Replacement plan — concrete diff

| Slot | Before (CIO) | After (Lever) |
|---|---|---|
| State (`app/page.tsx:1642`) | `useState(CIO_TEAMS[0]!)` — first CIO is default | `useState<LeverScopeValue>("all")` — `All Levers` is default |
| State type | `CioTeam` (object with `id`, `name`) | `LeverScopeValue` (string literal union, see §3.2) |
| `HeaderCard` prop | `selectedCio` + `onSelectCio` | `selectedLever` + `onSelectLever` |
| Trigger label (`app/page.tsx:673`) | `CIO: {selectedCio.name}` | `Lever: {leverLabelFor(selectedLever)}` (truncate per prompt) |
| Popover items (`app/page.tsx:671-696`) | `CIO_TEAMS.map(...)` | `[All Levers] + LEVER_OPTIONS + [Unclassified if count > 0]` with two-line layout (label + description) and a divider below `All Levers` |
| Trigger avatar (`app/page.tsx:670`) | Initials avatar | Drop the avatar — levers have no avatar concept. The trigger becomes a plain pill matching the rest of the header chips. |
| Department lookup (`CIO_DEPARTMENTS`, `app/page.tsx:163-171`) | Used to compute the meta-row department label | **Decision required (Open Q #2).** Remove the lookup, or repurpose it to map a Lever to a description shown elsewhere. Recommendation: remove. |
| Meta-row "department" text (`app/page.tsx:816`) | `<span>{department}</span>` | **Decision required (Open Q #2).** Recommendation: drop the trailing department slot from the meta-row; keep totals/overdue/Priority 1. |
| Findings inner-header line (`app/page.tsx:1603`) | `{selectedCio.name} · {department} · {formatCount(stats.total)} records total` | **Decision required (Open Q #3).** Recommendation: simplify to `{leverLabelFor(selectedLever)} · {formatCount(stats.total)} records total`, with the lever part hidden when scope is `all`. |

**What stays unchanged** (these are CIO concepts that are *not* tied to the dropdown):

- `CIO_TEAMS` constant in `lib/mock-data.ts:17-25` — still useful as the master list of CIOs.
- `Vulnerability.cioDisplayName` field on every record — stays in the type, stays in mock data, stays as the hidden grid column at `components/executive/ag-grid-table.tsx:639`.
- Per-CIO mock-data assignment in `lib/mock-data.ts:319` (`cioName = CIO_NAMES[i % CIO_NAMES.length]`) — stays.

---

## 2. Backend integration points

### 2.1 Field on the wire

- The `Vulnerability` interface in `lib/types.ts:103-217` enumerates **88 fields**. None matches `lever`, `leverFromVmart`, or any case variant. Confirmed by `grep -i 'lever|vmart'` across the project — only matches are in unrelated Claude skill markdown.
- `lib/mock-data.ts:288-482` populates every field literally. Adding a `lever` field today means amending both the interface and the mock factory; there is no schema drift risk because both are co-located in `lib/`.

### 2.2 Sampling raw values in mock data

- Count of records: **50** (`lib/mock-data.ts:305` — `Array.from({ length: 50 }, ...)`).
- Count of records with a `lever` value: **0** (the field does not exist).
- Distinct raw lever values seen: **none**.

When we add the field, we need to seed deterministic test values across the 50 rows so the dropdown's `Unclassified` bucket logic, record-count badge, and degradation path are all exercisable. Proposed distribution (deterministic via `i % N`):

| Internal scope | Approx % | Mock record assignment rule |
|---|---|---|
| `lever-1` | 25% | `i % 4 === 0` |
| `lever-2` | 20% | `i % 5 === 1` |
| `lever-3` | 25% | `i % 4 === 2` |
| `lever-4` | 15% | `i % 7 === 3` |
| `unclassified` | ~15% | remainder, plus a couple seeded as empty string and one as a typo (`"Lever1"` no space) to exercise the mapping function |

### 2.3 Server-side vs client-side filtering

**Client-side is the only option on this branch.** There is no server. Mark the filter site with the convention from the prompt:

```ts
// TODO(backend): server-side lever filter — currently client-side only because
// the demo has no API. Migrate to a `lever` query-param on the findings endpoint
// when the host's TanStack Query hooks land.
```

This comment goes on the `select`/`filter` callsite in the (proposed) `useScopedFindings` helper introduced in Phase 2. When the migration lands and the host wires TanStack Query, this comment is the single place to find and remove.

### 2.4 Existing AG Grid filter precedent

The grid already supports an "external filter" mechanism via `isExternalFilterPresent` / `doesExternalFilterPass` (`components/executive/ag-grid-table.tsx:414-422`). The Lever scope predicate plugs into the existing `matchesFilters` callback at `ag-grid-table.tsx:391-411` without changing AG Grid's column model. This means **no AG Grid-specific work** is needed in Phase 2 — confirms part E of the build spec.

---

## 3. Mapping strategy — `lib/constants/levers.ts`

### 3.1 Proposed location

`lib/constants/levers.ts` — sits beside `lib/dashboard-settings.ts` and `lib/filter-presets.ts`. After the Nx migration this moves to `src/lib/constants/levers.ts` per `MIGRATION.md` §2.2.

### 3.2 Proposed types

```ts
// Internal scope IDs — these are what state and URL store.
export type LeverScopeValue =
  | "all"
  | "lever-1"
  | "lever-2"
  | "lever-3"
  | "lever-4"
  | "unclassified";

export const LEVER_SCOPE_ALL: LeverScopeValue = "all";
export const LEVER_UNCLASSIFIED: LeverScopeValue = "unclassified";

export interface LeverOption {
  value: LeverScopeValue;
  label: string;        // Jordan's authoritative short label
  description: string;  // Secondary line in the dropdown
}
```

### 3.3 Proposed option list (Jordan's labels, verbatim)

```ts
export const LEVER_OPTIONS: LeverOption[] = [
  {
    value: "lever-1",
    label: "Lever 1 — CTI, APS&E or EET Managed",
    description: "CTO Initiated, Engage CIO if needed",
  },
  {
    value: "lever-2",
    label: "Lever 2 — Assessment Underway",
    description: "New Titles without Responsibility Party Classification or Engagement Instructions",
  },
  {
    value: "lever-3",
    label: "Lever 3 — CIO Managed (E2E)",
    description: "CIO Initiated, drives testing in LLE and managed through Prod CRQs",
  },
  {
    value: "lever-4",
    label: "Lever 4 — CIO / CTI or APS&E Engagement",
    description: "CIO Initiated, CTI remediates in LLE, Application dependent configuration level changes",
  },
];
```

`All Levers` (the sentinel) and `Unclassified` (the conditional last option) are rendered by the dropdown component itself, not stored in `LEVER_OPTIONS`. This keeps `LEVER_OPTIONS.length === 4` so the conditional-rendering rule is `dataset has ≥1 unclassified record → render Unclassified row` without a special case for "the All sentinel".

### 3.4 Proposed mapping function

```ts
/**
 * Map a raw backend value to an internal scope. Centralising every known and
 * unknown raw spelling here is the whole point of this module — components
 * and hooks must never compare against raw strings.
 *
 * When Roger confirms the field's authoritative values, update the
 * `RAW_TO_SCOPE` map below.
 */
const RAW_TO_SCOPE: Record<string, LeverScopeValue> = {
  // Canonical spellings (placeholder until Roger confirms)
  "Lever 1": "lever-1",
  "Lever 2": "lever-2",
  "Lever 3": "lever-3",
  "Lever 4": "lever-4",
  // Defensive aliases — drop or extend after confirmation
  "lever1": "lever-1",
  "lever2": "lever-2",
  "lever3": "lever-3",
  "lever4": "lever-4",
  "L1": "lever-1",
  "L2": "lever-2",
  "L3": "lever-3",
  "L4": "lever-4",
};

export function mapRawLeverToScope(raw: string | null | undefined): LeverScopeValue {
  if (raw == null) return LEVER_UNCLASSIFIED;
  const trimmed = raw.trim();
  if (trimmed === "") return LEVER_UNCLASSIFIED;
  return RAW_TO_SCOPE[trimmed] ?? LEVER_UNCLASSIFIED;
}
```

Notes:

- `mapRawLeverToScope` is the **only** place that knows about raw values. Components, hooks, and the URL serialiser all speak in `LeverScopeValue`.
- The defensive aliases (`L1`, `lever1`, etc.) are a safety net while Roger confirms the canonical spelling; trim them down once the schema is known.
- `LEVER_UNCLASSIFIED` is the fallback for null, empty, and unrecognised strings. This is what powers the "degrade gracefully" behaviour required by the prompt.

### 3.5 Where the helpers fit downstream

- The dropdown component reads `LEVER_OPTIONS` directly for its main item list.
- A new derived value `unclassifiedCount = findings.filter(f => mapRawLeverToScope(f.lever) === LEVER_UNCLASSIFIED).length` decides whether the `Unclassified` row appears and shows its badge count.
- A new `findingMatchesLeverScope(finding, scope)` helper (also in `lib/constants/levers.ts`) is the predicate consumed by the AG Grid external filter, the dashboard stats reducer, the chart-data filter, and the side-panel pager.

---

## 4. Open questions

1. **Build target.** Should the Lever scope be built in this demo (Option B above), or held until after the Nx migration (Option C)? *Owner: project lead.* This blocks Phase 2.
2. **Meta-row department text.** Removing the CIO selector removes the per-CIO department lookup (`CIO_DEPARTMENTS`). The meta-row in the header currently ends with `… · {department}`. *Owner: Jordan.* Recommendation: drop the trailing department text entirely; totals / overdue / Priority 1 are the only metrics worth keeping in the meta-row.
3. **Findings inner-header line.** Currently reads `{selectedCio.name} · {department} · {N} records total`. With the CIO dropdown gone, the leading two parts have no source. *Owner: Jordan.* Recommendation: simplify to `{leverLabelFor(selectedLever)} · {N} records total`, hiding the lever prefix when the scope is `All Levers`. If Jordan wants the CIO context to remain, we would have to add a *display-only* CIO label somewhere else in the header — flag this as a follow-up rather than scope creep on this PR.
4. **Single-select trade-off.** Analysts cannot view two levers side by side. *Owner: Jordan.* Confirm single-select is the right call for now; a multi-select or compare-mode follow-up is feasible later.
5. **Field name on the wire.** Roger's schema mentions both `Lever From VMART` and `Levers`. Which one is authoritative on the data share, and what is the JSON key in the response payload? *Owner: Roger.*
6. **Raw values.** Are Jordan's four labels (`Lever 1 — CTI, APS&E or EET Managed`, etc.) the full literal raw values, or only the display labels with a different raw form (`L1`, `1`, `lever-1`, etc.)? *Owner: Roger.* The mapping function in §3.4 keeps space for either.
7. **Unclassified threshold.** The prompt says `Unclassified` only appears when ≥1 record in the current CIO scope has an unknown value. With CIO removed from the header, "current CIO scope" no longer exists. Confirm: appear when ≥1 record in the **entire dataset** has an unknown value? *Owner: Jordan.* Recommendation: yes, dataset-wide — the simpler rule now that there is no second scope.
8. **Refresh-safe URL on the demo.** The demo has no URL state today. Adding `?lever=lever-1` requires importing `useSearchParams` from `next/navigation` (Next.js owns this; no new dependency). Confirm we are OK adding URL state to the demo, or whether we should defer URL sync until the Nx host. *Owner: project lead.* Recommendation: ship URL sync now via `next/navigation` — the swap to nuqs in the host is a one-file change, and the constants/helpers all survive.
9. **`MIGRATION.md` follow-up.** If we build in the demo (Option B), `MIGRATION.md` needs a Phase-8-style note documenting the `lib/constants/levers.ts` move and the `useScopedFindings` hook destination. Confirm we will write that follow-up when Phase 2 lands. *Owner: me.*

---

## Phase 1 deliverable — done

This document is the only artifact for Phase 1. **Implementation is paused** until the open questions above (at minimum #1, #2, #4, and #5) are resolved.
