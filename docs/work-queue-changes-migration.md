# Migration guide — Work Queue rework

How to port this session's changes into the Nx monorepo
(`@bofa/feature-findings-remediation`) without breaking functionality.

## Source of truth

All of it is committed on `feature/migration-for-demo`, commits **`a66c7fa` … `7ea3014`**
(base = `955bcbe`), **plus one new uncommitted file** — `lib/disposition-fields.ts`.

| Commit | Scope |
|---|---|
| `a66c7fa` | Sidebar nav restructure + default landing page |
| `360f45d` | MIGRATION.md Phase 10 (doc only) |
| `6b5d291` | Work Queue filter pills (CIO / CIO-1 Down / Internal vs. External) |
| `e16f011` | Lever filter added to the filter pills |
| `7ea3014` | Column restructure, Closed-row filter, bulk-update toolbar, shared disposition logic, legacy-disposition removal, "Other" disposition |

Get the exact lines for any file with `git show <commit> -- <path>` or
`git diff 955bcbe HEAD -- <path>`. This guide is the **inventory + order**; copy the
actual code from the committed files in this repo.

## Apply in this order (dependency order)

1. `lib/types.ts`
2. `lib/disposition-fields.ts`  ← **new file**
3. `components/vulnerability/detail-sheet.tsx`
4. `components/executive/ag-grid-table.tsx`
5. `app/page.tsx`

(2 and 3 are independent of each other; both only need 1.)

## Import-path rewrites for the Nx lib

Every file below moves under `src/lib/...`. Rewrite the demo's `@/` aliases per the
existing MIGRATION.md Phase 3 rules. New/relevant ones for this batch:

| Demo import | Nx lib import |
|---|---|
| `@/lib/disposition-fields` | `../disposition-fields` (place the new file beside the other `lib/` modules) |
| `@/lib/patch-windows` | `../patch-windows` (or `../utils/patch-windows`) |
| `@/components/ui/tooltip` | host shadcn path (e.g. `@bofa/ui`) — `tooltip` must be on the shadcn list |
| `@/lib/types`, `@/lib/mock-data`, etc. | as already mapped in MIGRATION.md |

shadcn primitive newly used: **`tooltip`** — confirm the host ships it.

---

## 1. `lib/types.ts`  (commit `7ea3014`)

Three small edits to the `Disposition` type and `Vulnerability` interface.

**Added** — `Disposition` union gets a catch-all member (before the `""` member):

```ts
  | "False Positive"
  // Catch-all — selecting this reveals a free-text "please provide detail" input.
  | "Other (please provide detail)"
  | "";
```

**Changed** — `DISPOSITIONS` array: the 5 legacy entries (`Fix`, `Defer`, `Mitigate`,
`Accept Risk`, `False Positive`) are **removed** from the list, and `Other` is appended
as the final entry:

```ts
  { label: "TEAM 1 ACTION – Baseline ESM-OS Remediation Team", value: "TEAM 1 ACTION – Baseline ESM-OS Remediation Team", group: "spec" },
  { label: "Other (please provide detail)", value: "Other (please provide detail)", group: "spec" },
];
```

> The legacy values are removed from the **dropdown list** only — they remain in the
> `Disposition` **type** so historical/mock records that still hold them stay valid.
> Do **not** remove them from the union.

**Added** — `Vulnerability` interface gets an optional field (after `disposition`):

```ts
  disposition: Disposition;
  /** Free-text detail shown when disposition is "Other (please provide detail)". */
  dispositionDetail?: string;
```

---

## 2. `lib/disposition-fields.ts`  — NEW FILE (uncommitted)

This file is **not in any commit** — create it. It is the single source of truth for
the per-disposition conditional-field rules, consumed by the bulk-update toolbar.
Full content:

```ts
// Per-disposition conditional-field rules — the single source of truth.
//
// Selecting a Disposition makes certain dependent fields visible AND required.
// Spec values drive the CIO ACTION/INFORM/REVIEW flow; legacy values preserve
// the original Fix/Defer/Mitigate/Accept Risk/False Positive UX.
//
// Consumed by the per-row triage form (detail-sheet) and the bulk-update
// toolbar (ag-grid-table) so both enforce the same rule.

import type { Disposition } from "./types";

/** Which conditional fields a Disposition reveals / requires. */
export interface DispositionFieldRules {
  patchWindow?: boolean;
  remediationDate?: boolean;
  crq?: boolean;
  blockers?: boolean;
  justification?: boolean;
  /** Shows the false-positive reason field — visibility only, not required. */
  falsePositive?: boolean;
}

export const dispositionFields: Record<Disposition, DispositionFieldRules> = {
  "CIO ACTION – Need Requested Patch Window": { patchWindow: true },
  "CIO ACTION – App Team will Remediate": { remediationDate: true, crq: true },
  "CIO ACTION – App Team identify blocker": { blockers: true },
  "CIO ACTION – Request Self-Service Package (Not Automatically Pushed by PCC)": { remediationDate: true, crq: true },
  "CIO INFORM – LLE force patch on Midweek at 10PM ET for AMRS (APAC 10AM ET, EMEA 8PM ET)": {},
  "CIO REVIEW – PCC will patch under established RMW": {},
  "NO IMMEDIATE ACTION – No Patch Available, waiting for patch": {},
  "NO IMMEDIATE ACTION – CTI AIT": {},
  "TEAM 1 ACTION – Baseline ESM-OS Remediation Team": {},
  // Legacy — preserve existing behaviour
  "Fix": { patchWindow: true, remediationDate: true },
  "Mitigate": { patchWindow: true, remediationDate: true },
  "Defer": { blockers: true, justification: true },
  "Accept Risk": { blockers: true, justification: true },
  "False Positive": { falsePositive: true },
  // Catch-all — its detail text is collected separately; no rule-gated fields.
  "Other (please provide detail)": {},
  "": {},
};
```

> **Note on duplication:** `detail-sheet.tsx` still has its *own* local copy of a
> `dispositionFields` map. Only `ag-grid-table.tsx` imports this shared module. When
> you reconcile the detail-sheet work, point its copy here too — for now they must
> stay in sync (the keys must match the `Disposition` union exactly).

---

## 3. `components/vulnerability/detail-sheet.tsx`  (commit `7ea3014`)

Small, ~5 spots — all in `TriageForm`. The "Other" disposition + its detail field.

- **Changed** — local `dispositionFields` map: add the key `"Other (please provide detail)": {}` (a `Record<Disposition>` — required once the type has the new member).
- **Added** — form state: `dispositionDetail: vuln.dispositionDetail ?? ""`.
- **Added** — validation: in the `errors` block, require detail when disposition is "Other":
  ```ts
  if (form.disposition === "Other (please provide detail)" && !form.dispositionDetail?.trim()) {
    errors.dispositionDetail = "Please provide detail";
  }
  ```
- **Added** — audit diff: `["Disposition Detail", "dispositionDetail", vuln.dispositionDetail ?? "", form.dispositionDetail]` in `diffSpecs`.
- **Changed** — the disposition `<Select>`: the spec/separator/legacy rendering collapses to a plain `{DISPOSITIONS.map(...)}` (the legacy group and the `──────────` separator item are removed). After `</Select>`, a conditional **"Please provide detail"** `<Textarea>` renders when `form.disposition === "Other (please provide detail)"`.

Use `?? ""` / `?.trim()` on `dispositionDetail` (it is optional). `DISPOSITION_SEPARATOR` is now unused by the render but still referenced by the `onValueChange` guard — leave it.

---

## 4. `components/executive/ag-grid-table.tsx`  (commits `6b5d291`, `e16f011`, `7ea3014`)

The bulk of the work (~960 lines). Port feature-by-feature.

### 4a. Imports
Add: `Check` (lucide); `Tooltip, TooltipContent, TooltipTrigger` (`@/components/ui/tooltip`);
`getPatchWindows` (`@/lib/patch-windows`); `BLOCKERS` + `Blocker` (`@/lib/types`);
`dispositionFields` (`@/lib/disposition-fields`).

### 4b. Work Queue filter bar  (`6b5d291` + `e16f011`)
New module-level components: **`FilterPillOption`**, **`FilterPill`** (a wide single-select
pill dropdown with an implicit "All", and an optional `disabled` mode).
Inside `AgGridTriageTable`:
- New state: `cioFilter`, `leverFilter`, `connectivityFilter` (all `useState("")`).
- New memo: `cioOptions` (distinct `cioDisplayName` values).
- `matchesFilters` — adds `cioFilter` (`cioDisplayName`), `leverFilter` (`lever`),
  `connectivityFilter` (`gisExternalFlag` → Internal/External) checks; add all three to its deps.
- `isExternalFilterPresent` — add the three to the condition and deps.
- The `onFilterChanged` notify `useEffect` — add the three to deps.
- `clearAllFilters` — reset the three.
- JSX: a `role="group"` filter-bar `<div>` is the **first child** of the root flex column —
  4 `<FilterPill>`s in order **CIO · CIO-1 Down (disabled) · Lever · Internal vs. External**.
- The active-filter chip strip gains chips for `cioFilter` / `leverFilter` / `connectivityFilter`.

> CIO-1 Down is a deliberately **disabled** placeholder — no AIT-hierarchy data exists yet.

### 4c. Column restructure  (`7ea3014`)
`columnDefs` is rebuilt. Visible columns, left-to-right:
`Stage Status · Age (days) · Lever · Source · CVE · Title · External / Internal ·
Workstream · Technology · AIT Number · AIT Name · Owner · CIO`.
- **Removed**: the `severityRisk` ("Severity Risk") and `triageStatus` ("Triage Status") columns.
- **Added**: `External / Internal` (a `valueGetter` on `gisExternalFlag`, `colId: "externalInternal"`) and `AIT Number` (`field: "applicationId"`).
- **Renamed**: Source Status→`Stage Status`, Days Open→`Age (days)`, Application Full Name→`AIT Name`, Finding Owner→`Owner`, CIO Display Name→`CIO`.
- All other columns set `hide: true` (still reachable via the Columns panel).
- Disposition column's set-filter `values` now `DISPOSITIONS.map((d) => d.value)` (was hardcoded legacy strings).
- `TABLET_VISIBLE_FIELDS` set narrowed to `status, daysOpen, lever, cve, title, vulnOwner`.
- Field mapping note: AIT Number→`applicationId`, AIT Name→`applicationFullName`, Owner→`vulnOwner`, CIO→`cioDisplayName` (existing fields — no schema change).

### 4d. Closed-row pre-filter  (`7ea3014`)
New memo `openVulnerabilities = vulnerabilities.filter(v => v.status !== "Closed")`.
Used as the grid `rowData`, the base of `cardVulns` (mobile), and `<DetailSheet allVulnerabilities>`.

### 4e. Bulk-update toolbar  (`7ea3014`)
New module-level: `bulkUpdateApi` (stub shared handler), `BULK_FIELD_CLASS`,
`DispositionDraft` + `EMPTY_DISPOSITION_DRAFT`, `missingDispositionFields`,
`dispositionDraftToPatch`, **`BulkStageSelect`**, **`BulkDispositionPopover`**, **`BulkUpdateToolbar`**.
Inside `AgGridTriageTable`: `patchWindowOptions` memo and the shared **`applyBulkPatch`** callback.
- The toolbar renders above the grid when ≥1 row is selected; selections are *staged*,
  one **Apply** button commits them via `applyBulkPatch` → `bulkUpdateApi` (stub) + `applyTransaction`.
- `BulkDispositionPopover` mirrors `dispositionFields` — a disposition that needs dependent
  fields reveals + requires them; "Other" reveals a required **Please provide detail** textarea.
- The old bottom **`BulkActionBar`** is no longer rendered. Its component definition is
  left in the file as dead code — **delete `BulkActionBar` + `BulkActionBarProps`** when porting.
- `getContextMenuItems` "Set Disposition" submenu is now `DISPOSITIONS.map(...)` (legacy/separator removed); `bulkSetDisposition` / `bulkAssignOwner` are still used by it — keep them.

### 4f. Tooltips  (`7ea3014`)
The CIO / Lever / Patch Window / Owner / Disposition bulk controls show a black/white
shadcn `Tooltip` on hover with the staged value(s).

> **Defensive note:** `detail` / `dispositionDetail` reads use `?.trim()` / `?? ""` —
> keep those (guards against partially-shaped draft objects).

---

## 5. `app/page.tsx`  (commits `a66c7fa`, `7ea3014`)  → `src/lib/pages/page.tsx`

Two features. The nav restructure is already documented in **MIGRATION.md Phase 10** —
follow that for `a66c7fa`. The new part is the global-dropdown removal (`7ea3014`):

**Removed** from the header (`HeaderCard`):
- The CIO selector `<Popover>` and the Lever scope `<Popover>` and all their wiring.
- App state `selectedCio` / `selectedLever`; derived `cioScope` / `leverScope`;
  `onClearCioScope` / `onClearLeverScope`.
- The CIO/Lever props threaded through `HeaderCard` and `VulnerabilitiesPage`.
- The `CIO_DEPARTMENTS` constant; `MetaRow`'s `department` prop and the department span.
- Now-unused imports: `CIO_TEAMS`, `Lever`, the `@/lib/constants/levers` import, `Check`, `Popover*`.

**Changed**: the "All Findings" sub-header line drops the `"{CIO} · {dept} · "` prefix —
just `{N} records total`.

`ag-grid-table.tsx` is **untouched** by this removal — its `cioScope` / `leverScope` props
are optional, so `VulnerabilitiesPage` simply stops passing them.

---

## Verification

```bash
nx lint feature-findings-remediation
nx test feature-findings-remediation
nx build bps-hub
```

Then in the running host:
- Work Queue shows the 4-pill filter bar; CIO / Lever / Internal-External filter the grid; CIO-1 Down is disabled.
- Grid shows the 13 columns in order; no Severity / Triage Status columns; Closed rows absent.
- Selecting rows reveals the Bulk Update toolbar; staging + Apply works; a disposition needing dependent fields blocks Apply until filled; "Other" requires its detail.
- Disposition dropdowns (bulk + detail panel) show no legacy values and a final "Other (please provide detail)" that reveals a detail input.
- The page header has no CIO / Lever dropdowns.
- No AG Grid console warnings; no `undefined.trim()` runtime error.
