# Phase 12 — Copilot prompts for the monorepo port

Use these inside Copilot Chat (Cursor / VS Code) in your work environment. One prompt per file, in the order listed. Each prompt is self-contained — paste it as-is, then review the diff Copilot produces before accepting.

> **Conventions**
> - `@bofa/data-access-findings` is the placeholder import path for the new data-access lib. Replace globally if your monorepo uses a different alias.
> - File paths use the recommended layout from `MIGRATION.md` §12.3. Adjust to match the actual paths in your monorepo before running each prompt.
> - Always **review Copilot's diff** before accepting — these are surgical changes, not rewrites.

---

## Step 0 — Pre-flight (manual, no Copilot)

1. Confirm the monorepo has phases 2–11 of `MIGRATION.md` applied (the demo UI with mock data).
2. Confirm `axios`, `@tanstack/react-query`, and the host `<QueryClientProvider>` are in place (per the §12 callout).
3. Scaffold the data-access lib if it doesn't exist:
   ```bash
   nx g @nx/react:library data-access-findings \
     --directory=libs/bps-findings-management/data-access/data-access-findings \
     --bundler=none --linter=eslint --unitTestRunner=vitest \
     --tags="scope:findings-management,type:data-access"
   ```
4. Install codegen + formatter at the workspace root:
   ```bash
   npm i -D @hey-api/openapi-ts prettier
   ```

---

## Step 1 — Bucket A: paste the bridge layer verbatim (NO Copilot)

These four files **must land byte-identical** to what's been verified to work. Copilot will get them 80% right and you'll spend the rest of the day debugging the 20%. Just paste.

From this repo's working directory, copy each into the data-access lib:

```bash
SRC=/Users/oscarlagatta/sandbox/new-dashboard
DEST=/path/to/monorepo/libs/bps-findings-management/data-access/data-access-findings/src/lib/api

mkdir -p "$DEST"
cp "$SRC/lib/api/adapters.ts"        "$DEST/adapters.ts"
cp "$SRC/lib/api/responses.ts"       "$DEST/responses.ts"
cp "$SRC/lib/api/hooks.ts"           "$DEST/hooks.ts"
cp "$SRC/lib/api/runtime-config.ts"  "$DEST/runtime-config.ts"
cp "$SRC/openapi-ts.config.ts"       "$DEST/../../openapi-ts.config.ts"
cp -R "$SRC/lib/api/generated"       "$DEST/generated"
```

Then edit `$DEST/runtime-config.ts` per `MIGRATION.md` §12.4 — replace the env-var auth shim with the `setApiAuthToken` pattern wired to your host's `useAuth()`.

Add to the data-access lib's `src/index.ts`:

```ts
export * from './lib/api/hooks';
export * from './lib/api/adapters';
export type * from './lib/api/responses';
export type * from './lib/api/generated/types.gen';
export { setApiAuthToken } from './lib/api/runtime-config';
```

Verify: `nx build data-access-findings` (or `nx typecheck`) — should compile cleanly before moving to Step 2.

---

## Step 2 — Bucket B: surgical edits via Copilot

For each file below: open the file in the editor, then paste the prompt into Copilot Chat. Review the diff carefully before accepting.

---

### 2.1 — `lib/types.ts`

**Why this is first:** every other file in bucket B depends on this type shape.

```
In src/lib/types.ts (the feature lib's types file), align the Vulnerability interface with the API contract by making the following changes:

1. Add a leading comment block to the file:
   "The Vulnerability shape is the FE projection of the GetVulnerabilityCM API row. Fields the API does not return have been removed — don't reintroduce one without a backend contract for it."

2. Above the `Lever` type, replace the existing comment with:
   "Authoritative remediation lever — kept as a type but no longer a field on Vulnerability (the API does not return it). The CIO/CIO-1 cascade API update may bring it back."

3. DELETE the entire `ActivityLogEntry` interface — the API doesn't return an activity log.

4. REWRITE the `Vulnerability` interface to contain ONLY these fields, in this order, with a one-line section header comment before each group. All fields are required strings unless marked otherwise:

   // Identity & report metadata
   id: string;            // sourced from API `gisid`
   reportDate: string;
   qualysId: number;
   cve: string;
   title: string;

   // Categorization
   severityRisk: SeverityRisk;
   status: SourceStatus;
   workstream: Workstream;
   source: Source;
   scorecardSource: string;
   operatingEnvironment: OperatingEnvironment;
   esmType: string;
   patchCategory: string;

   // Host / asset
   hostName: string;
   ipAddresses: string;
   osName: string;
   deviceType: string;

   // Application
   applicationFullName: string;
   applicationId: string;
   applicationManagerContactName: string;
   cioDisplayName: string;
   financialHierarchy: string;

   // Descriptive
   technicalDescription: string;
   technicalDetail: string;

   // Dates
   dueDate: string;
   dateObserved: string;
   dateLastSeen: string;
   hostLastSeen: string;

   // GIS / ERP flags
   gisExternalFlag: string;
   erpScorecardStatus: string;
   erpExceptionRequestStatus: string;
   acceptableUseStatus: string;

   // Triage state — written by this UI, round-trips via BulkUpdateVCMExtra
   disposition: Disposition;
   rcManagingTeam: string;
   requestedPatchWindow: string;
   expectedRemediationDate: string;
   crqNumber: string;
   identifiedBlockers: Blocker[];

   // Audit trail (from createdUserId/createdDateTime/updatedUserId/updatedDateTime)
   createdBy: string;
   createdAt: string;
   lastSavedBy: string;
   lastSavedAt: string;

5. Do NOT remove the `TriageStatus`, `SeverityRisk`, `SourceStatus`, `Workstream`, `Source`, `Lever`, `OperatingEnvironment`, `Disposition`, `Blocker`, `DISPOSITIONS`, `CioTeam`, `User`, or `SparklineDataPoint` types/exports. Only `ActivityLogEntry` is removed and `Vulnerability` is reshaped.

6. After the changes, scan the file for any remaining reference to `triageStatus`, `lever`, `daysOpen`, `pastDue`, `vulnOwner`, `technology`, `technologyVersion`, `fqdn`, `hostingPlatform`, `remediationPendingClearScan`, `activityLog`, `dispositionDetail` on the Vulnerability interface and remove them if any survived.

Show the full diff before applying.
```

---

### 2.2 — `lib/filter-presets.ts`

```
In src/lib/constants/filter-presets.ts (or wherever filter-presets.ts lives in the feature lib):

1. Update the file's leading comment to:
   "External-filter presets driven by dashboard cards / Action Required rows.
    Applied via AG Grid's `isExternalFilterPresent` + `doesExternalFilterPass`
    hooks rather than the column filter model, so they don't conflict with the
    user's own column filters or the Saved Views state.

    Several presets that relied on FE-only fields (triageStatus, daysOpen,
    remediationPendingClearScan) were removed when the FE type was aligned
    with the GetVulnerabilityCM API response. The cards consuming the removed
    IDs (Validation Pending, Awaiting Scan, Pending Clear Scan) are pruned in
    the dashboard layer."

2. REMOVE these IDs from the `FilterPresetId` union and from the `FILTER_PRESETS` record:
   - validationPendingOverThreshold
   - awaitingScan
   - pendingClearScan

3. The final union is exactly:
   "noRemediationDate" | "riskAccepted" | "awaitingDisposition" | "inProgress" | "resolved"

4. In `matchesPreset`, rename the second parameter from `settings: DashboardSettings` to `_settings: DashboardSettings` (underscore prefix — still needed by the signature, no longer read). REMOVE the three case branches for the deleted IDs.

5. Rewrite the remaining case branches to derive triage state from `status` + `disposition` instead of reading the removed `triageStatus` / `daysOpen` / `remediationPendingClearScan` fields:

   case "noRemediationDate":
     // SLA deadline missing → "No Remediation Date" dashboard card.
     return !v.dueDate || v.dueDate.trim() === "";
   case "riskAccepted":
     return v.disposition === "Accept Risk";
   case "awaitingDisposition":
     // Derived: no disposition has been chosen yet.
     return !v.disposition;
   case "inProgress":
     // Derived: disposition chosen, source-system status still Open.
     return !!v.disposition && v.status === "Open";
   case "resolved":
     // Derived: source-system has closed the finding.
     return v.status === "Closed";

Show the full diff before applying.
```

---

### 2.3 — `lib/mock-data.ts`

This file is *drastically* slimmed — most of its 484-line dataset moved into a mock-API layer that doesn't ship to the monorepo. In the monorepo, you only need it as a thin shim while consumers transition to `useVulnerabilities()`.

```
In src/lib/constants/mock-data.ts (or wherever mock-data.ts lives in the feature lib), drastically reduce the file:

1. KEEP these exports unchanged at the top of the file:
   - CIO_TEAMS
   - CURRENT_USER
   - any other static lookup tables (User lists, etc.) that are still imported elsewhere in the lib

2. KEEP the `generateSparklineData` function unchanged.

3. DELETE the following constant arrays and any code that uses them to build mock vulnerability rows:
   TITLES, CVE_IDS, HOST_NAMES, IP_POOL, APP_NAMES, TECHNOLOGIES,
   CRQ_NUMBERS, VULN_OWNERS, CIO_NAMES, LEVER_DISTRIBUTION, CTO_NAMES,
   CONSEQUENCE_MODELS, SCORECARD_DETAILS, VULN_SUBCATEGORIES,
   HOSTING_PLATFORMS, and any other `const X = […]` table used only to
   generate mock Vulnerability rows.

4. DELETE the `mockVulnerabilities` array export entirely. Consumers should be using `useVulnerabilities()` from `@bofa/data-access-findings` after this PR.

5. Replace the file's leading comment with:
   "Legacy synchronous mock-data export removed. Vulnerability rows now come from useVulnerabilities() in @bofa/data-access-findings. This file retains only the static lookup tables (CIO_TEAMS, CURRENT_USER, etc.) that the UI still imports at compile time."

6. Compact the import statement at the top — only import the types still referenced by the remaining exports.

After the diff is applied, scan the feature lib for any file still importing `mockVulnerabilities` from this path. Each one needs to be rewired to use `useVulnerabilities()` instead — flag them in the diff comment but do not edit them in this prompt.
```

---

### 2.4 — `components/dashboard/blockers-strip.tsx`

Tiny change — one line.

```
In src/lib/components/dashboard/blockers-strip.tsx, inside the `aggregate` function, locate this line:

   if (v.triageStatus === "Resolved") continue;

Replace it with:

   // Skip closed findings — they're no longer blocking anything.
   if (v.status === "Closed") continue;

The Vulnerability type no longer carries `triageStatus`; this preserves the same semantic (exclude completed records from the blocker totals) using the API's `status` field.
```

---

### 2.5 — `components/executive/vulnerability-card.tsx`

```
In src/lib/components/executive/vulnerability-card.tsx, make these changes:

1. REMOVE the import of Avatar / AvatarFallback (no longer rendered):
   import { Avatar, AvatarFallback } from "@/components/ui/avatar";

2. CHANGE the import of types from `@/lib/types` to also import TriageStatus:
   import type { TriageStatus, Vulnerability } from "@/lib/types";

3. ADD this helper function above the `Props` interface:

   // Derived triage state for display — the API no longer carries a
   // triageStatus field, so we infer one from `status` + `disposition`.
   // Mirrors the logic in `lib/filter-presets.ts`.
   function deriveTriageStatus(v: Vulnerability): TriageStatus {
     if (v.status === "Closed") return "Resolved";
     if (!v.disposition) return "Awaiting Disposition";
     return "In Progress";
   }

4. Inside `VulnerabilityCard`, REMOVE these two local variables (they read removed Vulnerability fields):

   const tech = v.technologyVersion ? `${v.technology} ${v.technologyVersion}` : v.technology;
   const ownerInitials = v.vulnOwner
     ? v.vulnOwner.split(" ").map((n) => n[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()
     : "—";

5. In the "Host · Tech" row, REMOVE the `${tech ? " · " + tech : ""}` suffix so it only renders `{v.hostName}`. Update the comment from "Host · Tech" to "Host".

6. In the bottom row ("Triage · Due · Owner"):
   - Update the comment from "Triage · Due · Owner" to "Triage · Due".
   - Replace `TriageStatusBadgeCellRenderer(cellParams(v.triageStatus))` with `TriageStatusBadgeCellRenderer(cellParams(deriveTriageStatus(v)))`.
   - REMOVE the entire `<Avatar>...<AvatarFallback>...{ownerInitials}</AvatarFallback></Avatar>` block.
   - Change the container `<div className="flex items-center gap-2 flex-shrink-0">` to `<div className="flex-shrink-0">` (no longer needs flex layout since avatar is gone).

Show the full diff before applying.
```

---

### 2.6 — `app/page.tsx` (probably named `src/lib/pages/App.tsx` in the monorepo)

```
In the feature lib's main page (the file that exports the App / FindingsRemediationPage default), make these changes:

1. Remove these imports (the components were deleted in this phase):
   - AwaitingScanCard from "@/components/executive/awaiting-scan-card"
   - ActionRequiredPanel from "@/components/executive/action-required-panel"

2. Replace the import of mockVulnerabilities:
   FROM: import { mockVulnerabilities } from "@/lib/mock-data";
   TO:   import { useVulnerabilities, useBulkUpdate } from "@bofa/data-access-findings";

3. Find the constant `TRIAGE_STATUS_TO_PRESET: Record<TriageStatus, FilterPresetId>` and:
   - Change the type to `Partial<Record<TriageStatus, FilterPresetId>>`
   - Remove the `"Pending Clear Scan": "pendingClearScan",` entry

4. In the `DashboardPage` component's stat cards array, REMOVE the entire object literal whose `label` is `"Pending Clear Scan"` (the one with `Icon: ScanSearch`, `accentColor: "#3B82F6"`, `triageStatus: "Pending Clear Scan"`).

5. In `DashboardPage`'s render output, REMOVE the entire `<AwaitingScanCard ... />` element from the secondary cards section.

6. In `DashboardPage`'s render output, REMOVE the entire `<section ... aria-label="Action required">...<ActionRequiredPanel .../>...</section>` block.

7. In the default-exported `App` component, ADD this block right after `const stats = DASHBOARD_STATS;`:

   // Real data from the heyAPI client. Empty filters / large page size pulls
   // everything; the grid does its own client-side filtering. Replace with
   // server-side pagination once row counts justify it.
   const { data: vulnsData } = useVulnerabilities({ filters: {}, pageSize: 5000 });
   const vulnerabilities = vulnsData?.rows ?? [];
   const bulkUpdate = useBulkUpdate();

8. REPLACE the simple `onSave` callback:

   FROM:
   const onSave = useCallback((v: Vulnerability) => setSelectedVuln(v), []);

   TO:
   const onSave = useCallback(
     (v: Vulnerability) => {
       setSelectedVuln(v);
       // Persist via BulkUpdateVCMExtra (single-item payload). The mutation
       // invalidates the vulnerabilities query on success so the grid refetches.
       bulkUpdate.mutate({
         rows: [{ id: v.id }],
         patch: {
           disposition: v.disposition,
           requestedPatchWindow: v.requestedPatchWindow,
           expectedRemediationDate: v.expectedRemediationDate,
           crqNumber: v.crqNumber,
           identifiedBlockers: v.identifiedBlockers,
         },
       });
     },
     [bulkUpdate]
   );

9. In BOTH places where `vulnerabilities={mockVulnerabilities}` appears (inside `<DashboardPage>` and `<VulnerabilitiesPage>`), replace with `vulnerabilities={vulnerabilities}` (the new local variable).

Show the full diff before applying.
```

---

### 2.7 — `components/executive/ag-grid-table.tsx`

Largest of the surgical-edit files — break the prompt into three sub-prompts so Copilot doesn't lose state mid-way.

#### 2.7.a — Imports + bulk-update wiring

```
In src/lib/components/executive/ag-grid-table.tsx, make these wiring changes:

1. ADD an import alongside the existing dashboard-settings import:
   import { useBulkUpdate } from "@bofa/data-access-findings";

2. DELETE the entire local `BulkUpdateItem` interface, `BulkUpdatePayload` interface, `patchToApiItem` function, and the stubbed `bulkUpdateApi` function. They've moved to the data-access lib.

3. Replace the bulk-update section header comment with:

   // ── Bulk Update Toolbar ──────────────────────────────────────────
   //
   // Wire shape for BulkUpdateVCMExtra lives in `responses.ts` and the
   // FE→API mapping in `adapters.ts` of the data-access lib. The mutation
   // hook (auto-invalidates the vulnerabilities query on success) is
   // consumed via `useBulkUpdate()`.

4. Inside the `AgGridTriageTable` component, at the top of the function body right after `const gridRef = useRef<AgGridReact>(null);`, ADD:

   // Bulk-update mutation — invalidates the vulnerabilities query on success
   // so the grid refetches with the freshly-persisted values.
   const bulkUpdate = useBulkUpdate();

5. REPLACE the `applyBulkPatch` callback with this version (uses the mutation; FE `id` IS the API `gisid`):

   const applyBulkPatch = useCallback(
     (patch: Partial<Vulnerability>) => {
       const api = gridRef.current?.api;
       if (!api) return;
       const selected = api.getSelectedRows() as Vulnerability[];
       if (selected.length === 0) return;
       bulkUpdate.mutate({ rows: selected, patch });
       api.applyTransaction({
         update: selected.map((row) => ({ ...row, ...patch })),
       });
     },
     [bulkUpdate]
   );

   Add this JSDoc above it:

   /**
    * Shared bulk-update handler — applies a field patch to every selected
    * row via BulkUpdateVCMExtra. Optimistically updates the grid; the
    * mutation's onSuccess invalidates the vulnerabilities query so the next
    * refetch reflects server state.
    *
    * TODO(nx-monorepo): once integrated, pass `updatedUserId` from
    * `useAuth().user.id` through the mutation.
    */

Show the full diff before applying.
```

#### 2.7.b — Remove columns/filters for fields the API doesn't return

```
In src/lib/components/executive/ag-grid-table.tsx, prune column definitions and filter options that reference removed Vulnerability fields:

1. In the top-level `FILTER_OPTIONS` constant, REMOVE the entire `pastDue: ["Y", "N"],` entry.

2. In the visible `columnDefs` array, REMOVE these column objects entirely:
   - "Age (days)" (field: "daysOpen")
   - "Lever" (field: "lever")
   - "Technology" (colId: "technology", with the technologyVersion valueGetter)
   - "Owner" (field: "vulnOwner")

3. In the hidden columns section (objects with `hide: true`), REMOVE these column objects entirely:
   - "Past Due" (field: "pastDue")
   - "Technical Executive" (field: "technicalExecutiveContactName")
   - "Consequence Model" (field: "consequenceModel")
   - "Verification Status" (field: "verificationStatus")
   - "Scorecard ERP Details" (field: "scorecardErpStatusDetails")
   - "Is CISA" (field: "isCisa")
   - "Is DMZ" (field: "isDmz")
   - "Is Public Internet" (field: "isPublicInternetAccessible")
   - "Hosting Platform" (field: "hostingPlatform")
   - "FQDN" (field: "fqdn")
   - "Scheduled Fix Date" (field: "scheduledFixDate")
   - "Resolved Date" (field: "resolvedDate")
   - "Freshness / Version Date" (field: "freshnessDate")
   - "ERP Exception ID" (field: "erpExceptionId")
   - "Vulnerability Subcategory" (field: "vulnerabilitySubcategory")

4. Update the numbered comments in the visible columns (// 1., // 2., // 3., …) so they remain sequential after removals. The new visible order is:
   1. Status (status)
   2. Source (source)
   3. (continues per existing — adjust numbering to be contiguous)

5. In any object that has `filterParams: { values: FILTER_OPTIONS.pastDue }`, remove the whole column (already covered above) — this is a safety check.

Show the full diff before applying.
```

#### 2.7.c — Remove `lever`/`vulnOwner`/`triageStatus` references in callbacks + filter logic

```
In src/lib/components/executive/ag-grid-table.tsx, clean up remaining references to removed Vulnerability fields in the component's logic:

1. Inside the toolbar `matchesFilters` (or equivalent) closure that builds `fieldMap`, REMOVE the `pastDue: v.pastDue,` entry from the field map.

2. Replace the CIO/Lever scope comment block + lever scope check. FIND:

   // Header CIO and Lever scopes AND with the toolbar filters and preset.
   if (cioScope && v.cioDisplayName !== cioScope) return false;
   if (leverScope && v.lever !== leverScope) return false;

   REPLACE WITH:

   // Header CIO scope ANDs with toolbar filters and preset. Lever scope/
   // filter state still exists in the UI but the API no longer returns a
   // `lever` field — the filter is a no-op until the CIO/CIO-1 cascade
   // API update reintroduces it.
   if (cioScope && v.cioDisplayName !== cioScope) return false;

3. In the Work Queue pill filter section, REMOVE the line:
   if (leverFilter && v.lever !== leverFilter) return false;
   (leave the `cioFilter` and `connectivityFilter` checks intact)

4. In the mobile `cardVulns` memo, the haystack array currently is:
   [v.cve, v.hostName, v.applicationFullName, v.title, v.workstream, v.vulnOwner]
   REMOVE `v.vulnOwner` — final array:
   [v.cve, v.hostName, v.applicationFullName, v.title, v.workstream]

5. In the bulk-disposition handler that builds `updated` rows for `applyTransaction`, REMOVE the `triageStatus:` field assignment:

   FROM:
   const updated = api.getSelectedRows().map((row: Vulnerability) => ({
     ...row,
     disposition: disposition as Disposition,
     triageStatus:
       row.triageStatus === "Awaiting Disposition"
         ? "In Progress"
         : row.triageStatus,
   }));

   TO:
   const updated = api.getSelectedRows().map((row: Vulnerability) => ({
     ...row,
     disposition: disposition as Disposition,
   }));

6. In the `ACTIVE_FILTER_LABELS` (or similarly named) record near the bottom of the file, REMOVE the `pastDue: "Past Due",` entry.

7. Search the file one more time for any remaining reference to `.triageStatus`, `.lever`, `.daysOpen`, `.pastDue`, `.vulnOwner`, `.technology`, `.technologyVersion`, `.fqdn`, `.hostingPlatform`, `.remediationPendingClearScan`, `.activityLog`, `.dispositionDetail` on a Vulnerability value — flag each remaining occurrence in your response but do NOT delete them in this prompt unless they're an obvious leftover from the changes above.

Show the full diff before applying.
```

---

### 2.8 — `components/vulnerability/detail-sheet.tsx` — DO NOT use Copilot

The diff is 488 added / 1313 removed lines — a wholesale rewrite. There is no prompt Copilot will execute reliably across that surface area.

**Just paste:**

```bash
SRC=/Users/oscarlagatta/sandbox/new-dashboard
DEST=/path/to/monorepo/libs/bps-findings-management/features/feature-findings-remediation/src/lib/components/vulnerability

cp "$SRC/components/vulnerability/detail-sheet.tsx" "$DEST/detail-sheet.tsx"
```

Then fix imports manually:
- `@/components/ui/*` → your host's shadcn path
- `@/lib/types` → relative path within the feature lib
- Any reference to mock-data hooks → `@bofa/data-access-findings`

---

## Step 3 — Bucket D: delete legacy components

If any of these files survived the monorepo's Phase-2 paste, delete them now:

```bash
cd /path/to/monorepo/libs/bps-findings-management/features/feature-findings-remediation/src/lib/components

rm -f executive/action-required-panel.tsx
rm -f executive/awaiting-scan-card.tsx
rm -f vulnerability/charts-panel.tsx
rm -f vulnerability/severity-status-chart.tsx
rm -f vulnerability/status-badge.tsx
rm -f vulnerability/vulnerability-table.tsx
```

After deletion: `nx lint feature-findings-remediation` will flag any surviving imports of these files — fix each one (most should already be gone after Step 2's edits to `page.tsx`).

---

## Step 4 — Verify

Run in order:

```bash
nx typecheck data-access-findings
nx typecheck feature-findings-remediation
nx lint     feature-findings-remediation
nx serve    bps-hub
```

Then open the host app, navigate to the findings feature, and confirm:

- [ ] Grid renders with rows from the real backend (Network tab → request hits `VITE_API_BASE_URL` / `NEXT_PUBLIC_API_BASE_URL`)
- [ ] Authorization header is populated by the `setApiAuthToken` bridge
- [ ] React Query Devtools (mounted by the host) shows the `vulnerabilities` and `filter-options` queries
- [ ] No console errors about `triageStatus`, `lever`, `vulnOwner`, `technology` etc. being undefined
- [ ] Bulk-update toolbar still works: select rows → change disposition → grid refetches after success

If any step fails, the prompt or the paste in the corresponding section is the suspect — review against the original file in this repo before debugging deeper.
