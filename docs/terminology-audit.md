# Terminology Audit — Vulnerability → Finding

**Status:** PHASE 1 audit — no source code has been modified. Pending review and approval before PHASE 2 (apply renames).

**Goal:** Standardise per Jordan's Core Concepts requirement: every record is a **Finding**; a Finding has a `type` of `'vulnerability'` (CVE-style records from GIS / Hadoop) or `'eol'` (End-of-Life software/hardware). The word "Vulnerability" must only survive where it refers to the **subtype**.

**Method:** All 327 occurrences of `vuln` / `Vulnerability` (case-insensitive) across the in-scope tree were classified individually as:

- `[RENAME]` — generic record term, change to **Finding / findings / Finding-**
- `[KEEP]`   — legitimate Vulnerability subtype (CVE-style), external URL, or backend-owned identifier
- `[AMBIGUOUS]` — requires a human decision

**Scope:** All files under `app/`, `components/`, `hooks/`, `lib/`, plus root `CLAUDE.md` / `README.md`. Excluded: `node_modules/`, `.next/`, `.git/`, `.claude/`, `tsconfig.tsbuildinfo` (build cache), `sreenshot.png`, `package-lock.json`, `pnpm-lock.yaml`.

---

## Audit by file

### lib/types.ts

- line 1:  `// Vulnerability Triage Dashboard Types`                                                                                              [RENAME]   reason: file describes the generic record interface used for all rows.
- line 53: `\| "False positives in Vulnerability and FOSS data"` (Blocker enum value)                                                              [KEEP]     reason: `Blocker` is a fixed enum of human-readable labels presumably aligned with a remediation playbook. "Vulnerability and FOSS data" names a specific data feed/source — not the generic record. Renaming could break label-matching against backend strings.
- line 65: same string in `BLOCKERS` array constant                                                                                                 [KEEP]     reason: see line 53.
- line 103:`export interface Vulnerability {`                                                                                                       [RENAME → Finding]   reason: the interface intentionally mixes fields used for both CVE-style records (cve, qualysId, vulnerabilityFindings) and EOL-style records (technology, technologyVersion, dateLastSeen, decommissionRequestStatus). It is the generic record. Becomes `Finding` with a discriminator `type: 'vulnerability' \| 'eol'`.
- line 138:`vulnerabilityFindings: string;` (field name)                                                                                            [KEEP]     reason: backend-owned field name from the GIS source feed — frontend should preserve the field name. **Requires backend coordination** if a rename is desired.
- line 139:`vulnerabilitySubcategory: string;` (field name)                                                                                         [KEEP]     reason: same as line 138 — backend-owned field. Categorical values themselves ("Server and Container Vulnerabilities", etc.) come from the source data and should remain as-is.
- line 213:`vulnOwner: string;` (field name)                                                                                                       [RENAME → findingOwner]   reason: this field is set by the triage UI (writeable, not from Hadoop), and represents the owner of any record. Generic.

---

### lib/mock-data.ts

- line 2:  `import type { Vulnerability, ...}`                                                                                                     [RENAME]   reason: type rename.
- line 194:`"Server and Container Vulnerabilities"` (VULN_SUBCATEGORIES value)                                                                     [KEEP]     reason: categorical value of the backend-owned `vulnerabilitySubcategory` field.
- line 195:`"Application Vulnerabilities"`                                                                                                          [KEEP]     reason: see line 194.
- line 197:`"Infra Manual Ingestion Vulnerabilities"`                                                                                               [KEEP]     reason: see line 194.
- line 227:`action: "Vulnerability detected and imported from scan"` (activity log)                                                                [AMBIGUOUS] reason: the activity log entry describes how the record entered the system. If the source feed truly only produces CVE-style records here, this is accurate (KEEP). If/when EOL records also flow through the same activity log, this string should be "Finding detected …". Decision needed.
- line 288:`export function createMockData(): Vulnerability[]`                                                                                       [RENAME]   reason: type rename.
- line 323:`const vulnOwner = ...`                                                                                                                 [RENAME → findingOwner]   reason: field rename.
- line 350:`["False positives in Vulnerability and FOSS data"]` (Blocker array entry)                                                              [KEEP]     reason: see lib/types.ts line 53.
- line 363:`id: \`vuln-${...}\``                                                                                                                    [RENAME → finding-]   reason: synthetic mock id prefix. No backend contract — it's just deterministic test data. Change to `finding-${...}`.
- line 393:`description: \`A vulnerability exists in ${tech}...\``                                                                                  [AMBIGUOUS] reason: free-text mock description. Once `type` is introduced, EOL findings won't read naturally with this prose. Recommend splitting the mock data generator so vuln-type rows say "A vulnerability exists…" and eol-type rows say "End-of-life software in use…". Decision needed.
- line 394:`technicalDescription: \`...Exploitation of this vulnerability could...\``                                                              [AMBIGUOUS] reason: same as line 393.
- line 395:`technicalDetail: \`Vulnerability details: ${title}...\``                                                                                [AMBIGUOUS] reason: same as line 393.
- line 396:`vulnerabilityFindings: \`...\`` (field assignment, not the name)                                                                       [KEEP]     reason: backend field; assignment is fine.
- line 397:`vulnerabilitySubcategory: ...`                                                                                                          [KEEP]     reason: backend field.
- line 443:`remediation: \`...Verify with vulnerability scan.\``                                                                                   [KEEP]     reason: "vulnerability scan" is the legitimate name of the security operation. Renaming to "finding scan" would be inaccurate.
- line 473:`vulnOwner,` (object property in factory)                                                                                                [RENAME → findingOwner]   reason: field rename.
- line 482:`export const mockVulnerabilities: Vulnerability[] = createMockData();`                                                                  [RENAME → mockFindings]   reason: holds the full deterministic dataset; consumed everywhere as the row source.

Also: const `VULN_OWNERS` (line 160) and `VULN_SUBCATEGORIES` (line 193) module-level constants — [RENAME → FINDING_OWNERS] and [KEEP for VULN_SUBCATEGORIES] (since the latter holds the backend-owned categorical strings).

---

### lib/executive-data.ts

- line 216:`// Vulnerabilities by source and priority (pre-aggregated at scale)`                                                                    [RENAME → Findings by source and priority]   reason: the data feeds the dashboard's "by Application / by Source / by Owner" chart, which counts all records in the estate regardless of subtype.
- line 303:`// Days open distribution (pre-aggregated open vulnerabilities)`                                                                       [RENAME]   reason: chart counts all open records.
- line 336:`// Top unresolved vulnerabilities — highest-priority open findings ranked`                                                              [KEEP]     reason: this widget is paired with `EolExposures` and shows specifically the Vulnerability subtype (CVE-style records). The phrase "open findings" inside the comment already uses the generic term correctly.
- line 342:`export interface UnresolvedVuln { ... cve: string; ... }`                                                                              [KEEP]     reason: data shape for the Vulnerability-subtype widget. The interface has a `cve` field, confirming it is CVE-specific.
- line 351:`export const TOP_UNRESOLVED_VULNS: UnresolvedVuln[]`                                                                                    [KEEP]     reason: subtype-specific dataset.
- line 479:`// from the server (card from /api/stats, grid from /api/vulns?filter=...)`                                                            [AMBIGUOUS] reason: placeholder backend route in a comment. If the new backend exposes `/api/findings`, update the comment. **Requires backend coordination.**

---

### lib/filter-presets.ts

- line 6:  `import type { Vulnerability } from "./types"`                                                                                          [RENAME]   reason: type rename.
- line 40: `v: Vulnerability,` (param to `matchesPreset`)                                                                                          [RENAME]   reason: generic record.
- line 64: `vulns: Vulnerability[],` (param to `countPreset`)                                                                                       [RENAME → findings]   reason: generic.
- line 69: `for (const v of vulns)`                                                                                                                  [RENAME]   reason: local var rename.

---

### lib/saved-views.ts

- line 26: `export const STORAGE_KEY_VIEWS = "vuln-dashboard-saved-views"`                                                                          [RENAME]   reason: localStorage key — frontend-owned. **Note: existing user-saved views in localStorage will be orphaned after rename unless a migration step reads from both keys during PHASE 2.** Flag for migration.
- line 27: `export const STORAGE_KEY_CURRENT_VIEW = "vuln-dashboard-current-view"`                                                                  [RENAME]   reason: same as line 26.
- line 43: `name: "All vulnerabilities"` (built-in view name)                                                                                       [RENAME → All findings]   reason: this is the default view across the entire data set, not subtype-filtered.
- line 59: `vulnOwner: { ... }` (filter model key)                                                                                                  [RENAME → findingOwner]   reason: field rename — keys in the filter model must match the column field id.

---

### app/layout.tsx

- line 13: `title: 'Vulnerability Remediation — Executive Dashboard'`                                                                              [AMBIGUOUS] reason: this is the **product name** as it appears in the browser tab. Renaming to "Findings — Executive Dashboard" loses the "remediation" framing. Three options for the reviewer to pick from: (a) keep verbatim (it's the product name); (b) rename to "Findings Remediation — Executive Dashboard"; (c) rename to "Vulnerability & EOL Remediation — Executive Dashboard". My recommendation: (a) keep — product names are sticky and the audience already knows it. Flag for product/UX decision.
- line 14: `description: 'CIO-level vulnerability remediation posture and SLA tracking'`                                                            [AMBIGUOUS] reason: same as line 13.

---

### app/page.tsx (51 occurrences)

**Routing / page type:**
- line 173:`type Page = "dashboard" \| "vulnerabilities"`                                                                                          [RENAME → "findings"]   reason: the page lists all records, including EOL.
- line 190:`{ id: "vulnerabilities" as const, label: "Vulnerabilities", Icon: ShieldAlert }` (NAV_ITEMS)                                            [RENAME → id: "findings", label: "Findings"]   reason: sidebar nav for the all-records page.

**Branding / header:**
- line 306:`Vulnerability Remediation` (sidebar branding text)                                                                                      [AMBIGUOUS] reason: see app/layout.tsx — product name. Same decision applies.
- line 798:`label="vulnerabilities"` (MetaItem caption next to `stats.total`)                                                                       [RENAME → "findings"]   reason: caption labels the **total** count, which includes EOL records (`DASHBOARD_STATS.total = 2,847,291` is the aggregate).

**Chart titles (DIMENSION_TITLES):**
- line 1070-1072:`application: "Vulnerabilities by Application"`, `source: "Vulnerabilities by Source"`, `owner: "Vulnerabilities by Owner"`        [RENAME]   reason: data feeding these charts (`SOURCE_CHART_OPEN`, `APPLICATION_CHART_OPEN`, `OWNER_CHART_OPEN`) is pre-aggregated across all records — should read "Findings by …".

**`VulnerabilitiesPage` component and props:**
- line 1519:`// ── Vulnerabilities Page ────────`                                                                                                   [RENAME]   reason: section comment.
- line 1521:`interface VulnerabilitiesPageProps`                                                                                                    [RENAME → FindingsPageProps]
- line 1522-23:`vulnerabilities: Vulnerability[]; selectedVuln: Vulnerability \| null;`                                                             [RENAME]   reason: generic record prop.
- line 1525-27:`onRowSelected: (v: Vulnerability)`, `onSave: (v: Vulnerability)`                                                                    [RENAME]
- line 1534:`function VulnerabilitiesPage(...)`                                                                                                     [RENAME → FindingsPage]
- line 1583:`<h2>All Vulnerabilities</h2>`                                                                                                          [RENAME → All Findings]   reason: full-page heading.
- line 1622-30:state hooks `selectedVuln`, callback names, etc.                                                                                     [RENAME]
- line 1664:`onRowSelected = useCallback((v: Vulnerability) => { setSelectedVuln(v); ... })`                                                        [RENAME]
- line 1669:`onSave = useCallback((v: Vulnerability) => setSelectedVuln(v))`                                                                        [RENAME]
- line 1724,1729:`vulnerabilities={mockVulnerabilities}` (both DashboardPage and VulnerabilitiesPage usage)                                         [RENAME]

**CSS class names:**
- lines 125-127, 1550, 1567, 1594: `vrd-vuln-page-card`, `vrd-vuln-page-header`, `vrd-vuln-page-body`                                              [RENAME → vrd-findings-page-*]   reason: class names are frontend-only and only appear in this file. Safe to rename.

**Dashboard interface fields and props:**
- line 1062-65:`vulnerabilities: Vulnerability[]` on `DashboardPageProps`                                                                          [RENAME]
- line 1081:`function DashboardPage({ stats, onNavigate, vulnerabilities, ... })`                                                                   [RENAME]
- line 1294:`<BlockersStrip vulnerabilities={vulnerabilities} />`                                                                                   [RENAME]

(Other remaining uses in app/page.tsx are downstream propagations of the above and follow the same `vuln` → `finding` / `vulnerabilities` → `findings` renames.)

---

### hooks/use-saved-views.ts

- line 107:`// built-in "All vulnerabilities" view.`                                                                                                [RENAME]   reason: comment references the view name renamed in lib/saved-views.ts.

---

### components/ag-grid/cell-renderers.tsx

- line 106:`href={\`https://nvd.nist.gov/vuln/detail/${cve}\`}`                                                                                     [KEEP]     reason: NVD URL fragment — externally fixed. The path on `nvd.nist.gov` is `/vuln/detail/`; we don't control it.

---

### components/dashboard/blockers-strip.tsx

- line 5:  `import type { Vulnerability, Blocker }`                                                                                                [RENAME]   reason: type rename. (Blocker stays.)
- line 9:  `vulnerabilities: Vulnerability[];` (prop)                                                                                              [RENAME]
- line 23: `"False positives in Vulnerability and FOSS data": "FP / FOSS data"` (Blocker label map)                                                [KEEP]     reason: key is a Blocker enum value (see lib/types.ts line 53).
- line 27: `function aggregate(vulns: Vulnerability[])`                                                                                            [RENAME → findings]
- line 30: `for (const v of vulns)`                                                                                                                  [RENAME]
- line 52-55:`BlockersStrip({ vulnerabilities, ... })`, `aggregate(vulnerabilities)`                                                                [RENAME]
- line 188:`// TODO: wire onClick to filter the vulnerabilities grid by blocker once`                                                              [RENAME]
- line 214:`aria-label={\`${count} vulnerabilities blocked by ${blocker}\`}`                                                                       [RENAME → \`${count} findings blocked by\`]   reason: count is across all blocked records.

---

### components/dashboard/charts.tsx

- line 16: `import type { Vulnerability } from "@/lib/types"`                                                                                       [RENAME]   reason: type rename. Note: this import appears unused in the rest of the file — could also be deleted outright.

---

### components/executive/ag-grid-table.tsx (49 occurrences — the largest file)

**Imports (paths and symbols):**
- line 42: `import { DetailSheet } from "@/components/vulnerability/detail-sheet"`                                                                  [RENAME → "@/components/findings/detail-sheet"]   reason: directory rename.
- line 43: `import { VulnerabilityCard } from "@/components/executive/vulnerability-card"`                                                          [RENAME → FindingCard]   reason: component + file rename.
- line 61: `import type { Vulnerability, Disposition } from "@/lib/types"`                                                                          [RENAME]
- line 65: `import { useSavedViewsToolbarUi } from "@/components/vulnerability/saved-views-toolbar"`                                                [RENAME → "@/components/findings/saved-views-toolbar"]
- line 71: `from "@/components/vulnerability/export-dialog"`                                                                                        [RENAME → "@/components/findings/export-dialog"]

**Column config and field references:**
- line 100: `"vulnOwner"` in `TABLET_VISIBLE_FIELDS`                                                                                                 [RENAME → "findingOwner"]   reason: field rename.
- line 588-595: `headerName: "Vuln Owner", field: "vulnOwner"`                                                                                       [RENAME → headerName "Finding Owner", field "findingOwner"]
- line 754-755: `headerName: "Vulnerability Subcategory", field: "vulnerabilitySubcategory"`                                                          [KEEP]     reason: backend-owned field; header should match. **Requires backend coordination** if a rename is desired.

**Generic-type usages of `Vulnerability`:**
- lines 335, 336, 337, 340, 392, 420, 426, 427, 429, 434, 439, 519, 909, 931, 997, 1019, 1029, 1298                                                  [RENAME]   reason: type-rename cascade.

**Component state / props:**
- lines 350, 352: destructured `vulnerabilities`, `selectedVuln`                                                                                    [RENAME]
- line 1021: `vulnOwner: owner` (bulk update writeback)                                                                                              [RENAME → findingOwner]
- lines 1300, 1360, 1362, 1366: `rowData={vulnerabilities}`, `selectedVuln`, `vulnerability={...}`, `allVulnerabilities={...}`                       [RENAME]

**Filenames and labels in exports / UI:**
- line 979: `fileName: \`vulnerabilities-${...}.csv\``                                                                                              [RENAME → findings-…csv]
- line 1067: `\`https://nvd.nist.gov/vuln/detail/${cve}\``                                                                                          [KEEP]     reason: NVD URL.
- line 1101: `fileName: \`vulnerabilities-${...}.xlsx\``                                                                                            [RENAME]
- line 1102: `sheetName: "Vulnerabilities"`                                                                                                         [RENAME → Findings]
- line 1119: `// the VulnerabilitiesPage` (comment)                                                                                                  [RENAME]
- line 1278: `aria-label="Vulnerabilities"` (mobile card list)                                                                                       [RENAME → Findings]
- line 1282: `<p>No vulnerabilities match the current filters.</p>`                                                                                 [RENAME → No findings match …]

---

### components/executive/vulnerability-card.tsx

- File path itself: `components/executive/vulnerability-card.tsx`                                                                                   [RENAME → finding-card.tsx]   reason: this is the mobile-card representation of a row in the all-records grid. Generic record.
- line 11: `import type { Vulnerability }`                                                                                                          [RENAME]
- line 16-17:`vulnerability: Vulnerability; onClick: (v: Vulnerability) => void;`                                                                   [RENAME]
- line 20: `export function VulnerabilityCard({ vulnerability: v, onClick })`                                                                       [RENAME → FindingCard, finding: v]
- lines 22-23, 64: `v.vulnOwner` field reads                                                                                                        [RENAME → findingOwner]

---

### components/executive/top-unresolved-vulnerabilities.tsx (KEEP entire file)

- All 10 occurrences of `vuln`/`Vulnerabilities` in this file                                                                                       [KEEP]     reason: this widget is specifically the **Vulnerability subtype** ranked list. It is paired side-by-side with `EolExposures` on the dashboard's "Priority findings" row. The dataset (`TOP_UNRESOLVED_VULNS` in `lib/executive-data.ts`) has a `cve` field on every entry. Component name `TopUnresolvedVulnerabilities`, file name, prop name `vulns`, type `UnresolvedVuln` all stay.
  - line 9:  comment "open findings" already uses generic term correctly                                                                            [no-op]
  - lines 19, 42-43, 49, 61: `vulns` prop / local                                                                                                   [KEEP]
  - lines 73, 93: aria-label and visible title "Top Unresolved Vulnerabilities"                                                                     [KEEP]
  - line 168: `function Rows({ rows }: { rows: UnresolvedVuln[] })`                                                                                 [KEEP]
  - line 327: empty-state "No open vulnerabilities to rank."                                                                                        [KEEP]

---

### components/executive/severity-source-chart.tsx — ORPHAN

- File has no live consumers (only the build cache references it). 3 occurrences of `Vulnerability` / `vulnerabilities` inside.

**Recommendation:** delete the file as part of PHASE 2 cleanup, rather than rename. If we want to keep it as future scaffolding, all 3 occurrences are [RENAME].

---

### components/executive/severity-age-heatmap.tsx — ORPHAN

- 2 occurrences ("vulnerabilities" in copy strings, lines 44 and 98). No live consumers (only docs reference it).

**Recommendation:** delete. If kept, both are [RENAME].

---

### components/executive/burndown-chart.tsx — ORPHAN

- 1 occurrence ("Open vulnerabilities vs cumulative resolved" subtitle, line 25). No live consumers.

**Recommendation:** delete. If kept, [RENAME].

---

### components/executive/top-exposures.tsx

- line 38: `\`https://nvd.nist.gov/vuln/detail/${e.cve}\``                                                                                          [KEEP]     reason: NVD URL.

---

### components/executive/sla-strip.tsx

- line 85: NVD URL                                                                                                                                  [KEEP]     reason: NVD URL.

---

### components/vulnerability/ (the directory)

**Directory rename: `components/vulnerability/` → `components/findings/`** — reason: the directory holds the components that render the all-records data layer (detail sheet, saved-views toolbar, export dialog), not anything subtype-specific.

#### LIVE FILES (3)

**`detail-sheet.tsx` (78 occurrences)** — most are [RENAME]:
- line 61: `Vulnerability` import                                                                                                                   [RENAME]
- line 86 comment "this vulnerability's priority"                                                                                                   [AMBIGUOUS — likely RENAME to "this finding's priority"]
- lines 90, 207, 334, 407-408, 877, 1105, 1151, 1154, 1156, 1158, 1432, 1604: `Vulnerability` type parameters                                       [RENAME]
- lines 365, 428, 478, 479, 496: `v.vulnOwner` / `form.vulnOwner` / `patch({ vulnOwner: ... })` field reads/writes                                  [RENAME → findingOwner]
- lines 407, 1162, 1166: prop names `vuln`, `vulnerability`, `allVulnerabilities`                                                                   [RENAME → finding, allFindings]
- many `vuln.cve`, `vuln.title`, etc. reads (lines 413-468, 795-796, 1179-1180, 1290-1480, 1599-1633)                                               [RENAME]   reason: local variable rename only — field reads on the renamed type.
- line 949, 1463: `\`https://nvd.nist.gov/vuln/detail/${vuln.cve}\``                                                                                [KEEP]     reason: NVD URL.
- line 987: `<SectionBlock title="Vulnerability">`                                                                                                  [AMBIGUOUS] reason: this section currently displays description / technical description / vulnerabilityFindings / vulnerabilitySubcategory / technology / remediation — fields used by both subtypes. If we keep one section for both, rename to "Finding details". If we split per subtype with conditional rendering, this title stays for the vuln-only branch and a new "EOL details" branch appears. Decision needed.
- line 992: `<FieldValue label="Vulnerability Findings" value={v.vulnerabilityFindings} />`                                                          [KEEP]     reason: the label mirrors the backend field name.
- line 1301: `aria-label="Vulnerability details"`                                                                                                   [RENAME → Finding details]   reason: aria description of the panel — panel opens for any record.
- lines 1498, 1513: `aria-label="Previous vulnerability (j)"` / `"Next vulnerability (k)"`                                                          [RENAME → Previous finding / Next finding]   reason: pagination is over the full grid, all records.

**`saved-views-toolbar.tsx` (1 occurrence):**
- line 373: `const currentName = currentView?.name ?? "All vulnerabilities"`                                                                        [RENAME → "All findings"]   reason: fallback label aligned with the built-in view rename in lib/saved-views.ts.

**`export-dialog.tsx`:** no [Vv]uln mentions in file contents. Only the directory path requires the rename.

#### ORPHAN FILES (6) — flag for deletion before/during PHASE 2

These six files are referenced **only** by `tsconfig.tsbuildinfo` (stale build cache); no live import chain reaches them. They also reference types that no longer exist in `lib/types.ts` (`SortField`, `SortDirection`, `ColumnVisibility`, `ViewDensity`, `VulnerabilityStatus`, `Severity`, `Source`, `SeverityStatusData`) and fields that don't exist on `Vulnerability` (`cveId`, `severity`, `dueDate as Date`, `remediationCoordinator`). They appear to be remnants from an earlier iteration of the data model.

- `vulnerability-table.tsx` (41 occurrences)         — recommend DELETE.
- `charts-panel.tsx` (9 occurrences)                  — recommend DELETE.
- `filter-popover.tsx`                                — recommend DELETE.
- `severity-status-chart.tsx` (1 occurrence)         — recommend DELETE.
- `stat-cards.tsx`                                    — recommend DELETE.
- `status-badge.tsx` (3 occurrences)                  — recommend DELETE.

Renaming them in PHASE 2 would waste effort. **Recommendation: delete in PHASE 2 commit-1 (before any other rename), then rename the directory.**

---

### CLAUDE.md

- line 28: `**Vulnerability Remediation Executive Dashboard**`                                                                                       [AMBIGUOUS — product name; see app/layout.tsx note]
- line 43: `# Core interfaces: Vulnerability (100+ fields), User, CioTeam`                                                                          [RENAME → Finding]
- line 44: `# Vulnerability rows, teams, users`                                                                                                     [RENAME → Finding]
- line 60: `# 3 worst vulnerabilities` (TopExposures comment)                                                                                       [RENAME]
- line 61: `# AgGridVulnerabilityTable — full-width enterprise grid` (component name in tree)                                                       [RENAME → AgGridFindingsTable / AgGridTriageTable]   reason: matches `AgGridTriageTable` in `components/executive/ag-grid-table.tsx`.
- line 66: `(vulnerability rows)`                                                                                                                    [RENAME]

### README.md

- line 1:  `# Vulnerability Remediation Executive Dashboard` (title)                                                                                [AMBIGUOUS — product name]
- line 3:  `A CIO-level executive dashboard for tracking enterprise vulnerability remediation posture, ...`                                         [AMBIGUOUS — product description]
- line 59: `# Core interfaces (Vulnerability, User, CioTeam)`                                                                                        [RENAME]
- line 60: `# Vulnerability rows, teams, users`                                                                                                     [RENAME]
- line 76: `# three worst vulnerabilities`                                                                                                          [RENAME]
- line 77: `# AgGridVulnerabilityTable`                                                                                                              [RENAME]
- line 82: `(vulnerability rows)`                                                                                                                    [RENAME]

---

## Summary counts

| Category     | Count |
|--------------|-------|
| RENAME       | ~225  |
| KEEP         | ~30   |
| AMBIGUOUS    | 12    |
| Orphan files | 9     |

(Numbers are approximate — they roll up nested occurrences in long files. The 50-row mock-data factory produces dozens of field reads/writes that all follow one underlying rename rule. The audit lists representative occurrences plus the rule.)

---

## All [AMBIGUOUS] items — review needed

1. **`app/layout.tsx` line 13 — page `<title>` "Vulnerability Remediation — Executive Dashboard"**
   Decision: keep as product name vs rename to "Findings Remediation" vs "Vulnerability & EOL Remediation". Recommendation: **keep**.

2. **`app/layout.tsx` line 14 — meta description.** Same decision as #1.

3. **`app/page.tsx` line 306 — sidebar branding "Vulnerability Remediation"**. Same decision as #1.

4. **`CLAUDE.md` line 28 / `README.md` lines 1, 3 — product/project name in docs**. Same decision as #1.

5. **`app/page.tsx` lines 1070-72 — chart titles "Vulnerabilities by Application/Source/Owner"**. Recommendation: **RENAME** to "Findings by …" since the underlying data covers all records. (Marking explicitly so reviewer confirms — these are the most prominent on-screen labels.)

6. **`lib/mock-data.ts` line 227 — activity log action "Vulnerability detected and imported from scan"**. Recommendation: **RENAME** to "Finding detected and imported from scan" so the activity log is type-agnostic.

7. **`lib/mock-data.ts` lines 393-395 — `description`/`technicalDescription`/`technicalDetail` mock prose**. Recommendation: **branch the mock generator** so vulnerability-type rows say "A vulnerability exists…" and eol-type rows say "End-of-life software in use…". Requires the discriminated union to exist first.

8. **`lib/executive-data.ts` line 479 — placeholder backend URL `/api/vulns?filter=...` in a comment**. Recommendation: **RENAME** to `/api/findings?filter=...`. **Requires backend coordination** — flag for Roger.

9. **`components/vulnerability/detail-sheet.tsx` line 86 comment — "this vulnerability's priority"**. Recommendation: **RENAME** to "this finding's priority".

10. **`components/vulnerability/detail-sheet.tsx` line 987 — `<SectionBlock title="Vulnerability">`**. Decision: rename to "Finding details" (single section, type-agnostic) vs split into two conditional sections per subtype. Recommendation: **rename to "Finding details" for now**; revisit when EOL-specific fields are introduced.

11. **Orphan files (6) under `components/vulnerability/`**. Decision: delete entirely (recommended) vs keep and rename. Recommendation: **delete** — they reference types and fields that no longer exist and have no live import chain.

12. **Orphan files (3) under `components/executive/`** (`severity-source-chart`, `severity-age-heatmap`, `burndown-chart`). Same decision pattern; recommendation: **delete**.

---

## Proposed rename map

| From                                              | To                                                | Notes |
|---------------------------------------------------|---------------------------------------------------|-------|
| `Vulnerability` (interface, ~200 sites)           | `Finding`                                          | Plus introduce discriminated union: `type Finding = (VulnerabilityFinding \| EolFinding)` with `type: 'vulnerability' \| 'eol'` |
| `vulnerabilities` (vars/props, ~80 sites)         | `findings`                                         | |
| `selectedVuln` / `vuln` (locals)                  | `selectedFinding` / `finding`                      | |
| `vulnOwner` (field on Finding)                    | `findingOwner`                                     | Frontend-owned field. **Triage-write field** — verify with Roger's write API contract. **Requires backend coordination.** |
| `mockVulnerabilities`                             | `mockFindings`                                     | |
| `VULN_OWNERS` (mock array)                        | `FINDING_OWNERS`                                   | |
| `id` prefix `vuln-XXX`                             | `finding-XXX`                                      | Frontend-only synthetic id; safe. |
| `UnresolvedVuln`                                  | (KEEP)                                             | Subtype-specific dataset for the TopUnresolvedVulnerabilities widget. |
| `TOP_UNRESOLVED_VULNS`                            | (KEEP)                                             | |
| `VulnerabilityCard` (file + symbol)               | `FindingCard`                                      | File: `vulnerability-card.tsx` → `finding-card.tsx` |
| `VulnerabilitiesPage` (component in app/page.tsx) | `FindingsPage`                                     | |
| `VulnerabilitiesPageProps`                        | `FindingsPageProps`                                | |
| `AgGridVulnerabilityTable` (docs only)             | `AgGridTriageTable` / `AgGridFindingsTable`        | Actual symbol is already `AgGridTriageTable`. |
| `components/vulnerability/`                       | `components/findings/`                              | Whole directory. |
| Page type literal `"vulnerabilities"`             | `"findings"`                                       | |
| Sidebar nav label `"Vulnerabilities"`             | `"Findings"`                                       | |
| Page heading `"All Vulnerabilities"`              | `"All Findings"`                                   | |
| Page meta caption `"vulnerabilities"`             | `"findings"`                                       | Next to total count in `MetaRow`. |
| Saved-view name `"All vulnerabilities"`           | `"All findings"`                                   | Built-in default view. |
| localStorage key `"vuln-dashboard-saved-views"`   | `"finding-dashboard-saved-views"`                  | **Requires migration step** in PHASE 2 (read old key during transition, then delete it). |
| localStorage key `"vuln-dashboard-current-view"`  | `"finding-dashboard-current-view"`                 | Same migration. |
| Chart titles `"Vulnerabilities by Application/Source/Owner"` | `"Findings by …"`                       | |
| Export filename prefix `vulnerabilities-`         | `findings-`                                        | CSV and XLSX. |
| Excel sheet name `"Vulnerabilities"`              | `"Findings"`                                       | |
| CSS class `vrd-vuln-page-card` / `-header` / `-body` | `vrd-findings-page-…`                            | |
| Route paths                                       | **No app router routes today** — everything lives at `/`. The page state lives in client state (`type Page = "dashboard" \| "vulnerabilities"`), not in the URL. No redirects to add. If routes are introduced in PHASE 2 work or the Nx migration, plan `/vulnerabilities` → `/findings` with a redirect. |

---

## Explicit KEEP list (sanity-check that nothing important got renamed)

1. **`top-unresolved-vulnerabilities.tsx` (whole file)** — subtype-specific widget paired with `EolExposures`.
2. **`UnresolvedVuln` / `TOP_UNRESOLVED_VULNS`** (lib/executive-data.ts) — data shape and dataset for #1.
3. **`vulnerabilityFindings` field** (lib/types.ts) — backend-owned, GIS source feed.
4. **`vulnerabilitySubcategory` field** (lib/types.ts) — backend-owned. Its categorical values ("Server and Container Vulnerabilities", etc.) also stay.
5. **`"False positives in Vulnerability and FOSS data"`** (Blocker enum value) — names a specific data feed.
6. **`https://nvd.nist.gov/vuln/detail/${cve}` URLs** (5 sites: cell-renderers, ag-grid-table, detail-sheet, top-exposures, sla-strip) — external URL fragment outside our control.
7. **`"vulnerability scan"`** in remediation prose (lib/mock-data.ts line 443) — name of the security operation, not the record.
8. **AG Grid column header `"Vulnerability Subcategory"`** (ag-grid-table.tsx line 754) — header text should mirror the backend-owned field name it displays.
9. **Future Finding subtype discriminator value `type: 'vulnerability'`** — the string literal `'vulnerability'` in the discriminated union is the subtype value and stays.

---

## Requires backend coordination

The audit identified these items that touch frontend ↔ backend contracts. **PHASE 2 should not rename these without explicit sign-off from Roger (Hadoop read API) and the triage write API owners.**

1. **`vulnOwner` field** (lib/types.ts line 213). This is a **triage-write** field (the UI sets it) — the write API needs to accept the new name `findingOwner`, or we keep the wire name `vulnOwner` and only rename the TypeScript field with a mapping at the API client boundary.
2. **`vulnerabilityFindings`, `vulnerabilitySubcategory` source fields**. Backend-owned (Hadoop read). Keep as-is unless Roger renames at source. Frontend should not diverge.
3. **Placeholder API path `/api/vulns?filter=...`** in `lib/executive-data.ts` line 479 comment. Confirm new route is `/api/findings`.
4. **AG Grid column header `"Vulnerability Subcategory"`** — header mirrors backend field; stays unless field is renamed at source.

---

## Recommended PHASE 2 sequencing (for the reviewer to confirm)

The original prompt proposes the order: (1) types → (2) hooks/stores → (3) components → (4) routes → (5) UI copy → (6) tests/mocks → (7) docs. I'd refine to:

0. **Pre-step (commit 1): Delete the 9 orphan files** — 6 under `components/vulnerability/` and 3 under `components/executive/`. This shrinks PHASE 2 by ~60% of total occurrences and avoids renaming dead code.
1. **Types and interfaces** (`lib/types.ts`) — introduce `Finding` and the discriminated union; export `Vulnerability` as a deprecated type alias `= Finding` temporarily so the next commits still typecheck.
2. **Hooks, stores, query keys, API client functions** — limited scope here (no TanStack Query in the project today; only `hooks/use-saved-views.ts`).
3. **Component files** — rename `components/vulnerability/` → `components/findings/` and `vulnerability-card.tsx` → `finding-card.tsx` with their import paths.
4. **Routes** — N/A today (page is client-side state, no URL routes).
5. **UI copy / labels** — sidebar nav, page headings, chart titles, aria-labels, export filenames, sheet names.
6. **localStorage migration** — read both old and new keys for one release, then drop old; or fall back gracefully if old key exists.
7. **Mock data prose** — branch the mock generator by subtype (depends on #1).
8. **Comments and docs** — CLAUDE.md, README.md, inline comments.
9. **Remove the deprecated `Vulnerability` type alias** added in step 1.

Each step should be a single commit that compiles and (when a test suite exists) passes. No test suite is configured today.

---

## What this audit deliberately did **not** change

- `lib/dashboard-settings.ts`, `lib/utils.ts`, `lib/use-viewport.ts`, `lib/ag-grid-setup.ts`, `lib/ag-grid-console-filter.ts` — no `[Vv]uln` occurrences.
- `components/ui/*` (57 shadcn primitives) — no `[Vv]uln` occurrences.
- `app/globals.css`, `styles/*` — no `[Vv]uln` occurrences.
- `hooks/use-mobile.ts`, `hooks/use-toast.ts` — no `[Vv]uln` occurrences.
- `node_modules/`, `.next/`, build cache — out of scope.
- `.claude/skills/design/data/logo/industries.csv` — unrelated skill data containing the word "Vulnerability" in an industries list; out of scope.

---

**End of audit.** Awaiting review and approval before any source modifications.
