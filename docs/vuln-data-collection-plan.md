# Vuln Data Collection Tool — Gap Closure Plan

## Context

The codebase is a CIO Vulnerability Triage Dashboard built on Next.js 16 + AG Grid Enterprise. It has a working side-panel edit form (`components/vulnerability/detail-sheet.tsx`) with disposition-driven conditional rendering, a comprehensive `Vulnerability` type covering ~100 source fields, and bulk-action UX in the grid.

Compared against the Vuln Data Collection Tool spec, the UI has the right *shape* but the disposition vocabulary, blocker list, patch window generation, and one editable field do not match the spec. Scope of this plan: **UI changes only** — add `obiid` to the type but keep mock data; backend wiring against `vwTableauVulnerabilities` is deferred.

---

## Gap Analysis Summary

| # | Requirement | Status | Action |
|---|---|---|---|
| 1 | CRQ editable | ✅ Present | None |
| 2 | Disposition dropdown | ⚠️ Misaligned vocabulary | Add 9 spec values alongside existing 5 |
| 3 | Expected Remediation Date | ✅ Present | None |
| 4 | Identified Blockers | ⚠️ Missing "Other" | Add 11th option + free-text |
| 5 | Requested Patch Window | ⚠️ Static dates | Replace with rolling generator |
| 6 | RC Managing Team | ❌ Missing entirely | Add field |
| 7 | Conditional fields per disposition | ⚠️ Wrong mapping | Rewire per spec |
| 8 | Read-only display fields | ⚠️ 28 of 30 present | Add Host Last Seen + Host Name to DetailsTab |
| 9 | OBIID primary key | ❌ Missing | Add `obiid: string` to type |
| 10 | vwTableauVulnerabilities source | ❌ Mock data | Out of scope (UI only) |

---

## What the UI shows today vs. spec — field-by-field

The current UI exposes fields in **three surfaces**: the AG Grid columns (table view), the Triage side-panel form (editable), and the side-panel "Details" tab (read-only). The legend below indicates where each spec field actually surfaces.

Legend: **G** = AG Grid column · **F** = Editable form · **D** = Details tab · **H** = Sheet header

### Editable fields (spec § 2)

| Spec field | In UI? | Where | Notes |
|---|---|---|---|
| CRQ | ✅ | F (line 797) | Plain text input — correct |
| Disposition | ⚠️ | F (line 593), G (col 592), bulk action menu | Present as dropdown, but enum values do NOT match spec (Fix/Defer/Mitigate/Accept Risk/False Positive vs. CIO ACTION/INFORM/REVIEW/NO IMMEDIATE ACTION/TEAM 1) |
| Expected Remediation Date | ✅ | F (line 780) | `<Input type="date">` — correct |
| Identified Blockers | ⚠️ | F (line 632) | 10 of 11 options present; **"Other (please provide detail)" missing** + no free-text capture field |
| RC Managing Team | ❌ | — | **Not in type, not in form, not in grid** |
| Requested Patch Window | ⚠️ | F (line 762) | Dropdown present, but uses **11 hard-coded May 2026 dates** — not rolling/dynamic |

### Conditional rendering (spec § 3)

| Spec rule | Current UI behaviour | Status |
|---|---|---|
| "Need Requested Patch Window" → show Patch Window | No such disposition exists today | ❌ Wrong trigger |
| "App Team will Remediate" → show Date + CRQ | Triggered by `Fix`/`Mitigate` instead | ⚠️ Right shape, wrong vocabulary |
| "App Team identify blocker" → show Blockers | Triggered by `Defer`/`Accept Risk` instead | ⚠️ Right shape, wrong vocabulary |
| "Request Self-Service Package" → show Date + CRQ | Doesn't exist | ❌ |
| INFORM / REVIEW / NO IMMEDIATE ACTION / TEAM 1 → no conditional fields | Don't exist | ❌ |

### Identified Blockers options (spec § 4)

All 10 of the 10 listed-in-prose options are present verbatim in `lib/types.ts` lines 59–69. The 11th option **"Other (please provide detail)"** is missing — it was implied by the spec's parenthetical and was confirmed as required.

### Requested Patch Window dynamics (spec § 5)

Current: a hard-coded array of 11 strings frozen at May 9–17 2026 dates (`lib/types.ts` lines 84–96). Today's date is 2026-05-14, so half the list is already in the past. **No rolling/weekly generation exists.**

### Read-only display fields (spec § 6) — 30 fields

| # | Spec field | Vulnerability prop | In UI? | Where |
|---|---|---|---|---|
| 1 | Report Date | `reportDate` | ✅ | G (618), D (1203) |
| 2 | Status | `status` | ✅ | G (490), D (1085) |
| 3 | CIO Display Name | `cioDisplayName` | ✅ | G (657), D (1119) |
| 4 | Workstream / Observation Type | `workstream` | ✅ | G (516), D (1205) |
| 5 | Scorecard Source | `scorecardSource` | ✅ | D (1208) |
| 6 | Due Date | `dueDate` | ✅ | G (575), H (371) |
| 7 | ESM Type | `esmType` | ✅ | G (671), D (1206) |
| 8 | Application Manager Contact Name | `applicationManagerContactName` | ✅ | G (645), D (1110) |
| 9 | Application ID | `applicationId` | ✅ | D (1103) |
| 10 | Application Full Name | `applicationFullName` | ✅ | G (639), D (1102) |
| 11 | Severity Risk | `severityRisk` | ✅ | G (479), H (346) |
| 12 | GIS External Flag | `gisExternalFlag` | ✅ | D (1209) |
| 13 | Financial Hierarchy | `financialHierarchy` | ✅ | D (1219) |
| 14 | ERP Scorecard Status | `erpScorecardStatus` | ✅ | D (1140) |
| 15 | ERP Exception Request Status | `erpExceptionRequestStatus` | ✅ | G (766), D (1147) |
| 16 | Acceptable Use Status | `acceptableUseStatus` | ✅ | D (1170) |
| 17 | Date Observed | `dateObserved` | ✅ | D (1092) |
| 18 | **Host Last Seen** | `hostLastSeen` | ❌ | **In type, never rendered** |
| 19 | Date Last Seen | `dateLastSeen` | ✅ | D (1093) |
| 20 | Qualys ID | `qualysId` | ✅ | G (631), D (1024) |
| 21 | CVE | `cve` | ✅ | G (499), D (1025) |
| 22 | Patch Category | `patchCategory` | ✅ | D (1104) |
| 23 | Title | `title` | ✅ | G (507), H (1556) |
| 24 | Technical Detail | `technicalDetail` | ✅ | D (1073) |
| 25 | Technical Description | `technicalDescription` | ✅ | D (1072) |
| 26 | **Host Name / Server** | `hostName` | ⚠️ | **G (547) only — missing from Details tab** |
| 27 | IP Address | `ipAddresses` | ✅ | G (735), D (1050) |
| 28 | Device Type | `deviceType` | ✅ | D (1052) |
| 29 | OS Name | `osName` | ✅ | G (779), D (1051) |
| 30 | Operating Environment | `operatingEnvironment` | ✅ | G (556) |

**Net read-only gap:** 2 fields. `hostLastSeen` is defined in the type but rendered nowhere; `hostName` is in the grid but not in the Details tab — add both to the "Asset & Exposure → Identity" sub-block in `DetailsTab` so users opening the side panel can see them without scrolling the grid.

### Fields the UI shows that spec doesn't list (informational)

The UI also surfaces ~50 additional fields not in the spec read-only list — FQDN, Hosting Platform, Runbook Owner, Operational CTO, GIS Asset Category, ERP sub-blocks (Pending ID/Status/Expiry, BISO status, Risk Decision, Consequence dates), Acceptable Use ID/Expiry, Decommission Request, Cloud Account ID/Resource ID, Lever, Source, EVM, TPPE, Domain, Third Party Name, etc. **No action — these are additive and harmless.**

---

## Three-way schema alignment: vwTableauVulnerabilities ↔ Full SQL ↔ Frontend type

Sources compared:
- **View** = `vwTableauVulnerabilities` (Jon Helm's email — the source the UI is meant to bind to). 31 fields.
- **SQL** = `[dbo].[VunerablityData]` (Vipin's CREATE TABLE — the underlying full schema). ~140 fields.
- **FE** = `lib/types.ts` `Vulnerability` interface.

### A. View fields (priority — the UI must support all of these)

| View field (Jon's list) | SQL column | Frontend prop | View | SQL | FE | Notes |
|---|---|---|:--:|:--:|:--:|---|
| **OBIID** (KEY) | — | — | ✅ | ❌ | ❌ | **Primary key missing everywhere except the view.** Add `obiid: string` to FE. Likely a view-only derived column. |
| ReportDate | ReportDate | reportDate | ✅ | ✅ | ✅ | aligned |
| Status | Status | status | ✅ | ✅ | ✅ | aligned (FE uses union `"Open"\|"Closed"`) |
| CIODisplayName | CIODisplayName | cioDisplayName | ✅ | ✅ | ✅ | aligned |
| Workstream/ObservationType | Workstream + WorkstreamObservationType | workstream | ✅ | ✅ | ⚠️ | **SQL has two columns** (`Workstream` and `WorkstreamObservationType`); FE folds to one. May need a second `observationType` field. |
| ScorecardSource | ScorecardSource | scorecardSource | ✅ | ✅ | ✅ | aligned |
| DueDate | DueDate | dueDate | ✅ | ✅ | ✅ | aligned |
| ESMType | ESMType | esmType | ✅ | ✅ | ✅ | aligned |
| ApplicationManagerContactName | ApplicationManagerContactName | applicationManagerContactName | ✅ | ✅ | ✅ | aligned |
| ApplicationID | ApplicationID | applicationId | ✅ | ✅ | ✅ | aligned |
| ApplicationFullName | ApplicationFullName | applicationFullName | ✅ | ✅ | ✅ | aligned |
| SeverityRisk | SeverityRisk | severityRisk | ✅ | ✅ | ✅ | aligned |
| GISExternalFlag | GISExternalFlag | gisExternalFlag | ✅ | ✅ | ✅ | aligned |
| FinancialHierarchy | FinancialHierarchy | financialHierarchy | ✅ | ✅ | ✅ | aligned |
| ERPScorecardStatus | ERPScorecardStatus | erpScorecardStatus | ✅ | ✅ | ✅ | aligned |
| ERPExceptionRequestStatus | ERPExceptionRequestStatus | erpExceptionRequestStatus | ✅ | ✅ | ✅ | aligned |
| AcceptableUseStatus | AcceptableUseStatus | acceptableUseStatus | ✅ | ✅ | ✅ | aligned |
| DateObserved | DateObserved | dateObserved | ✅ | ✅ | ✅ | aligned |
| HostLastSeen | HostLastSeen | hostLastSeen | ✅ | ✅ | ✅ | **defined in FE but never rendered** — see read-only section above |
| DateLastSeen | DateLastSeen | dateLastSeen | ✅ | ✅ | ✅ | aligned |
| QualysID | QualysID | qualysId | ✅ | ✅ | ✅ | aligned (FE is `number`, SQL likely string — confirm) |
| CVE | CVE | cve | ✅ | ✅ | ✅ | aligned |
| PatchCategory | PatchCategory | patchCategory | ✅ | ✅ | ✅ | aligned |
| Title | Title | title | ✅ | ✅ | ✅ | aligned |
| TechnicalDetail | TechnicalDetail | technicalDetail | ✅ | ✅ | ✅ | aligned |
| TechnicalDescription | TechnicalDescription | technicalDescription | ✅ | ✅ | ✅ | aligned |
| HostName/Server | HostNameServer | hostName | ✅ | ✅ | ✅ | name differs across all three — needs mapping at API layer |
| IPAddress | IPAddresses | ipAddresses | ✅ | ✅ | ✅ | **view: singular, SQL: plural, FE: plural** — minor mapping needed |
| DeviceType | DeviceType | deviceType | ✅ | ✅ | ✅ | aligned |
| OSName | OSName (+ OSNameMajor, OSNameMinor) | osName | ✅ | ✅ | ✅ | aligned (FE only uses base) |
| OperatingEnvironment | OperatingEnvironment | operatingEnvironment | ✅ | ✅ | ✅ | aligned |

**View vs FE result: 30 of 31 view fields are in the FE type. Only OBIID is missing.**

### B. Frontend fields backed by SQL but not in the view (informational extras)

These are extras the FE pulls from somewhere beyond the view (most likely a richer endpoint or a joined query). All are present in the SQL schema, so the backend can supply them whenever the API layer is wired up.

| FE prop | SQL column | Used in UI? |
|---|---|---|
| description | Description | Details tab |
| vulnerabilitySubcategory | VulnerabilitySubcategory | Details tab |
| technology / technologyVersion | Technology / TechnologyVersion | Details tab |
| vulnerabilityFindings | VulnerabilityFinding | Details tab (**FE plural, SQL singular**) |
| consequenceModel | ConsequenceModel | grid col |
| verificationStatus | VerificationStatus | grid col |
| pastDue | PastDue | grid col |
| daysOpen | DaysOpen | grid col |
| scheduledFixDate | ScheduledFixDate | Details tab |
| resolvedDate | ClosedOn (?) | Details tab — **assumed mapping** |
| freshnessDate | FreshnessVersionDate | Details tab (**rename**) |
| firstConsequenceDate | FirstConsequenceDate | Details tab |
| secondConsequenceDate | SecondConsequenceDate | Details tab |
| thirdConsequenceDate | ThirdConsequenceDate | Details tab |
| scorecardErpStatusDetails | ScorecardERPStatusDetails | Details tab |
| erpExceptionId | ERPExceptionID | Details tab |
| erpExceptionExpirationDate | ERPExceptionExpirationDate | Details tab |
| erpExceptionRiskDecision | ERPExceptionRiskDecision | Details tab |
| erpExceptionBisoRequestStatus | ERPExceptionBISORequestStatus | Details tab |
| associatedErpExceptions | AssociatedERPExceptionswithStatus | not in DetailsTab — **rename** |
| erpScorecardPendingId / Status / ExpirationDate | ERPScorecardPendingID / Status / ExpirationDate | Details tab |
| isDmz | IsDMZ | Exposure badge |
| isPublicInternetAccessible | IsPublicInternetAccessible | Exposure badge |
| isCisa | IsCISA | grid col |
| isOnSite | IsOnSite | not displayed |
| securityZone | SecurityZone | not displayed |
| gisAssetCategory | GISAssetCategory | Details tab |
| gisMetricAlignment | GISMetricAlignment | Details tab |
| gisThirdPartyScope | GISThirdPartyScope | Details tab |
| port | Portvar | Details tab (**rename**) |
| assessmentArea / assessmentScope | AssessmentArea / AssessmentScope | Details tab |
| sigAlgorithm | SignatureAlgorithm | Details tab (**rename**) |
| issuerName | IssuerName | Details tab |
| cloudAccountId | CloudAccountID | Details tab |
| resourceId / resourceType | ResourceID / ResourceType | Details tab |
| policyName | PolicyName | Details tab |
| nonBauReason | NonBAUReason | Details tab |
| domain | Domain | Details tab |
| thirdPartyName | ThirdPartyName | Details tab |
| remediation | Remediation | Details tab |
| scorecardErpDays | ScorecardERPDays | Details tab |
| evm | EVM | Details tab |
| tppe | TPPE | Details tab |
| acceptableUseId / ExpirationDate | AcceptableUseID / ExpirationDate | Details tab |
| decommissionRequestNumber / Status | DecommissionRequestNumber / Status | Details tab |
| classificationDate | ClassificationDate | not displayed |
| fqdn | FQDNFullyQualifiedDomainName | Details tab (**SQL has verbose name**) |
| operationalCto | OperationalCTO | Details tab |
| runbookOwner | RunbookOwner | Details tab |
| technicalExecutiveContactName | TechnicalExecutiveContactName | Details tab |
| applicationSupportContactName | ApplicationSupportContactName | Details tab |
| source | Source | Details tab (SQL also has `Sources` plural) |
| hostingPlatform | HostingPlatform | Details tab |
| id (display label "GIS ID") | GISID | Details tab (**rename**) |
| lever | Levers | grid col (**FE singular, SQL plural** — semantically a single value, so SQL naming is the oddity) |

### C. Frontend fields NOT in either backend source (review needed)

| FE prop | Likely status | Action |
|---|---|---|
| `applicationManagerContactNetwork` | No corresponding SQL column | **Flag for backend team** — is this an LDAP/NBK id derived from the name? |
| `applicationSupportContactNetwork` | No corresponding SQL column | Same as above |
| `technicalExecutiveContactNetwork` | No corresponding SQL column | Same as above |
| `triageStatus`, `disposition`, `ctiRemediation`, `requestedPatchWindow`, `expectedRemediationDate`, `crqNumber`, `remediationPendingClearScan`, `healthCheckTime`, `healthCheckComplete`, `identifiedBlockers`, `falsePositiveReason`, `deferralJustification`, `reEvaluateBy`, `vulnOwner`, `lastSavedBy`, `lastSavedAt`, `activityLog` | **Triage state — written by this UI, not from source** | Will need its own backing table keyed by `obiid`. Out of scope for this UI iteration. |
| (planned) `rcManagingTeam` | No corresponding SQL column **yet** | **Flag for backend team** — is this a new triage field to persist, or does it map to `VendorNameManaging` / `MWOwner` / `RunbookOwner`? |
| (planned) `otherBlockerDetail` | Triage state | Same bucket as other triage state — out of scope for source |

### D. SQL columns present in the view's surface area or commonly referenced, but NOT used by the FE

These exist in the full SQL schema but are not on the view and not in the FE type. They appear to be operational or analytical fields the executive UI doesn't need. **No action required** unless a future requirement surfaces.

`ActionRequestID, ArchitectName, ASILeadName, AssetType, CFreeGB, CFreeCategory, ClosedOn (if resolvedDate doesn't map here), CreatedOn, CRITICAL_APP, CTODisplayName, EnvironmentCategory, ERP_Count, IngestionDate, InPortfolio, IS_RB_PRODUCTION, IS_VIRTUAL, IsBuiltInHouse, Managed, MetricScope, MWOwner, NextRMW, ON_CALL_GROUP_ID, OSNameMajor, OSNameMinor, PAR_Count, PatchTitle, PDSE, PrimaryDBA, RB_ENTRY_DATE, RealHost, RealHostRBOwner, RecurrenceID, RiskTech, RMW, shrtdom, Sources, SPVulnCat2, TechExecutive, Tier, UpdatedOn, VendorNameManaging, VL, VMRemediationGroupingName, VMRemediationInstructions, VMReportDate, VMTitleGroup`

Two worth highlighting that the UI **might** want eventually:
- `RMW` and `NextRMW` — Regular Maintenance Window. Could enrich the Requested Patch Window UX.
- `MWOwner` / `VendorNameManaging` — possible source for the new **RC Managing Team** field if it's not a free-text input.

### E. Naming-mismatch map (for the API adapter when backend is wired up)

The adapter layer between the view rows and the FE type needs to remap these:

| View / SQL column | FE prop |
|---|---|
| `OBIID` | `obiid` (**add**) |
| `GISID` | `id` |
| `FQDNFullyQualifiedDomainName` | `fqdn` |
| `HostNameServer` (SQL) / `HostName/Server` (view) | `hostName` |
| `IPAddress` (view) / `IPAddresses` (SQL) | `ipAddresses` |
| `Portvar` | `port` |
| `SignatureAlgorithm` | `sigAlgorithm` |
| `FreshnessVersionDate` | `freshnessDate` |
| `ScorecardERPStatusDetails` | `scorecardErpStatusDetails` |
| `AssociatedERPExceptionswithStatus` | `associatedErpExceptions` |
| `VulnerabilityFinding` | `vulnerabilityFindings` |
| `Levers` | `lever` |
| `Workstream` + `WorkstreamObservationType` | `workstream` (consider splitting into two FE props) |
| All other columns | direct PascalCase → camelCase transform |

### F. Action items added by this analysis

The schema review surfaces three items beyond the original spec-vs-UI gap analysis. Adding to the **Changes** section:

1. **Add `obiid: string` to `Vulnerability`** (already in § 7 of Changes) — confirmed as the only view-side field truly missing.
2. **Add `observationType: string`** to `Vulnerability` (new) — SQL has it as a separate column from `Workstream`. The view labels them together as "Workstream/ObservationType" so they likely need to be displayed together but stored separately.
3. **Confirm with backend team** before implementation:
   - Are `applicationManagerContactNetwork`, `applicationSupportContactNetwork`, `technicalExecutiveContactNetwork` real (joined from an identity store) or invented by the FE mock?
   - Does **RC Managing Team** map to an existing SQL column (`VendorNameManaging` / `MWOwner` / `RunbookOwner`) or is it a new triage-state field?
   - Does `resolvedDate` map to `ClosedOn`?

---

## Changes

### 1. Disposition — add spec values alongside existing
**File:** `lib/types.ts`

Extend the `Disposition` union and the `DISPOSITIONS` constant to include all 9 spec values *in addition to* the current 5. Total 14 options. Order them so spec values appear first in the dropdown.

```typescript
export type Disposition =
  // Spec values
  | "CIO ACTION – Need Requested Patch Window"
  | "CIO ACTION – App Team will Remediate"
  | "CIO ACTION – App Team identify blocker"
  | "CIO ACTION – Request Self-Service Package"
  | "CIO INFORM – LLE force patch on Midweek at 10PM ET for AMRS"
  | "CIO REVIEW – PCC will patch under established RMW"
  | "NO IMMEDIATE ACTION – No Patch Available, waiting for patch"
  | "NO IMMEDIATE ACTION – CTI AIT"
  | "TEAM 1 ACTION – Baseline ESM-OS Remediation Team"
  // Legacy values (preserved)
  | "Fix" | "Defer" | "Mitigate" | "Accept Risk" | "False Positive"
  | "";
```

### 2. Disposition conditional logic — rewire to spec
**File:** `components/vulnerability/detail-sheet.tsx` (lines 442–447, 632–697, 755–870)

Replace the current `showBlockers / showPatchFields / showFalsePositiveField` flags with spec-driven flags:

| Disposition | Show |
|---|---|
| `CIO ACTION – Need Requested Patch Window` | Requested Patch Window |
| `CIO ACTION – App Team will Remediate` | Expected Remediation Date + CRQ |
| `CIO ACTION – App Team identify blocker` | Identified Blockers (+ Other detail) |
| `CIO ACTION – Request Self-Service Package` | Expected Remediation Date + CRQ |
| `CIO INFORM – …` / `CIO REVIEW – …` / `NO IMMEDIATE ACTION – …` / `TEAM 1 ACTION – …` | No conditional fields |
| Legacy `Fix` / `Mitigate` | (unchanged: patch fields) |
| Legacy `Defer` / `Accept Risk` | (unchanged: blockers + justification) |
| Legacy `False Positive` | (unchanged: false positive reason) |

Implement as a small lookup map so the form body stays readable:

```typescript
const dispositionFields: Record<Disposition, {
  patchWindow?: boolean;
  remediationDate?: boolean;
  crq?: boolean;
  blockers?: boolean;
  justification?: boolean;
  falsePositive?: boolean;
}> = { /* one entry per disposition */ };
```

### 3. Identified Blockers — add "Other"
**File:** `lib/types.ts` and `components/vulnerability/detail-sheet.tsx`

- Append `"Other (please provide detail)"` to `Blocker` union and `BLOCKERS` array.
- In `detail-sheet.tsx` near line 697 (just below the blocker chips popover), render a `<Textarea>` for `otherBlockerDetail` when that option is selected.
- Add new field `otherBlockerDetail: string` to the `Vulnerability` interface (line 225 area) and to the form state (line 414).
- Include `otherBlockerDetail` in the per-field audit diff spec (line 484).

### 4. Requested Patch Window — rolling generator
**New file:** `lib/patch-windows.ts`

Replace the static `PATCH_WINDOWS` array in `lib/types.ts` with a deterministic generator. Pure function — no `Math.random()`, callable with an explicit reference date for testing.

```typescript
// Generates next ~3 weeks of Fri/Sat/Sun 8-hour patch slots.
// Format: "Fri 5/15 16:00–23:59 ET"
export function getPatchWindows(now: Date = new Date()): string[] { … }
```

Slot template per weekend day:
- 00:00–08:00 ET
- 08:00–16:00 ET
- 16:00–23:59 ET

Friday starts at 16:00 (afternoon cutover), Saturday and Sunday cover all three slots. Generate from the upcoming Friday for 3 consecutive weekends. Format dates as `M/D` (no zero pad) to match the spec example.

Call site: `detail-sheet.tsx` line 770 — `PATCH_WINDOWS.map(...)` becomes `useMemo(() => getPatchWindows(), [])`.

`PATCH_WINDOWS` constant in `lib/types.ts`: remove (no other consumers — confirm with a grep before deleting).

> **Hydration note:** The Sheet/Popover containing the dropdown only renders client-side on user interaction, so calling `new Date()` here is safe and won't trip the project's SSR-determinism rule (see CLAUDE.md).

### 5. RC Managing Team — new editable field
**Files:** `lib/types.ts`, `components/vulnerability/detail-sheet.tsx`, `lib/mock-data.ts`

- Add `rcManagingTeam: string` to the `Vulnerability` interface (group with other triage fields ~line 225).
- Render as a free-text `<Input>` in the form, placed near the disposition section (shown for all dispositions, no conditional).
- Add to the audit diff spec.
- Seed reasonable mock values in `lib/mock-data.ts` (e.g., team names like "Linux Patch Ops", "Windows Endpoint", etc.) so the existing rows render with something.

### 6. Read-only display gaps — Host Name + Host Last Seen
**File:** `components/vulnerability/detail-sheet.tsx` (Asset & Exposure → Identity sub-block, ~line 1047)

Add two `<FieldValue>` rows to the existing Identity grid (currently shows FQDN, IP Addresses, OS Name, Device Type, Hosting Platform, Port):

```tsx
<FieldValue label="Host Name / Server" value={v.hostName} />
<FieldValue label="Host Last Seen" value={v.hostLastSeen} />
```

No type changes needed — both fields already exist on the `Vulnerability` interface (`hostName` line 130, `hostLastSeen` line 213). This closes the only spec read-only gaps.

### 7. OBIID primary key
**File:** `lib/types.ts`, `lib/mock-data.ts`

- Add `obiid: string` to the `Vulnerability` interface near `id` (line 120).
- Generate deterministic OBIID values in mock data (e.g., `OBIID-${rowIndex.toString().padStart(8, "0")}`).
- No display surface required for this iteration — it's the primary key for the eventual backend swap. Optionally surface in the Details tab footer for traceability.

---

## Critical Files

| File | Reason |
|---|---|
| `lib/types.ts` | Disposition union, Blocker union, Vulnerability interface, PATCH_WINDOWS constant |
| `components/vulnerability/detail-sheet.tsx` | TriageForm (413–891), conditional-render logic, audit diff spec |
| `lib/patch-windows.ts` | **NEW** — rolling patch window generator |
| `lib/mock-data.ts` | Seed `obiid`, `rcManagingTeam`, and `otherBlockerDetail` for existing mock rows |
| `components/executive/ag-grid-table.tsx` | `DISPOSITION_OPTIONS` (line 195) — mirror the expanded list for the bulk-action menu |

## Functions / patterns to reuse (already in repo)

- `patch()` mutation helper in TriageForm (line 432) — extend for new fields, don't reinvent.
- Per-field audit log loop (lines 484–542) — append new fields to `diffSpecs`.
- `Popover` + `Checkbox` multi-select pattern (lines 632–697) — already correct for Blockers; "Other" just adds a textarea below.
- `DISPOSITION_OPTIONS` bulk-action menu pattern (`ag-grid-table.tsx` line 195) — mirror expanded list.

---

## Verification

1. **Build & lint:** `npm run build && npm run lint` — must succeed without new TS or lint errors.
2. **Dev server:** `npm run dev`, open `http://localhost:3000`.
3. **Manual flow per disposition** — open the side panel on any row and step through each new disposition value:
   - `CIO ACTION – Need Requested Patch Window` → only the Requested Patch Window dropdown appears, populated with rolling dates starting next Friday.
   - `CIO ACTION – App Team will Remediate` → Expected Remediation Date + CRQ visible; Patch Window and Blockers hidden.
   - `CIO ACTION – App Team identify blocker` → Blockers popover visible; selecting "Other" reveals a textarea.
   - `CIO ACTION – Request Self-Service Package` → Expected Remediation Date + CRQ visible.
   - The four `INFORM` / `REVIEW` / `NO IMMEDIATE ACTION` / `TEAM 1 ACTION` values → no conditional fields beyond the always-on RC Managing Team + Owner.
4. **Audit log:** Change any new field, click Save, switch to the Activity tab — confirm a per-field entry was added for the new field.
5. **Patch window freshness:** Confirm the first slot in the dropdown is a Friday on or after today (2026-05-14 → first slot `Fri 5/15 16:00–23:59 ET`).
6. **Read-only fields:** Open the Details tab — confirm Report Date, CIO Display Name, ERP Scorecard Status, CVE, Qualys ID, Host Name, IP Address, OS Name, etc. all display values and have no edit affordance.
7. **Legacy dispositions still work:** Pick `Fix` — patch fields still render. Pick `Defer` — blockers + justification still render. (Regression check on existing behaviour.)
