// FE <-> API adapter layer. Keep all field-name, type, and format gaps
// confined to this file so the rest of the app sees clean FE types.

import type {
  Blocker,
  Disposition,
  OperatingEnvironment,
  Source,
  SeverityRisk,
  SourceStatus,
  Vulnerability,
  Workstream,
} from "@/lib/types";
import type {
  VulnerabilityCmExtraUpdateItem,
  VulnerabilityCmFilterRequestModel,
} from "./generated";
import type { ApiVulnerabilityRow } from "./responses";

// "1900-01-01T..." is the .NET DateTime.MinValue sentinel — treat as no date.
const DATE_SENTINEL_PREFIX = "1900-01-01";

function normalizeDate(value: string | null | undefined): string {
  if (!value) return "";
  if (value.startsWith(DATE_SENTINEL_PREFIX)) return "";
  // Drop time component: "2025-09-14T00:00:00" -> "2025-09-14"
  const tIdx = value.indexOf("T");
  return tIdx > 0 ? value.slice(0, tIdx) : value;
}

const BLOCKER_DELIMITER = /;\s*/;

function parseBlockers(value: string | null | undefined): Blocker[] {
  if (!value) return [];
  return value
    .split(BLOCKER_DELIMITER)
    .map((b) => b.trim())
    .filter(Boolean) as Blocker[];
}

// ── API row -> FE Vulnerability ─────────────────────────────────────────────
// Enum-shaped strings are cast through — the FE unions are narrower than
// what the wire data actually delivers and will be widened in a later pass.
export function fromApiRow(row: ApiVulnerabilityRow): Vulnerability {
  return {
    id: row.gisid,
    reportDate: row.reportDate,
    qualysId: row.qualysId ?? 0,
    cve: row.cve,
    title: row.title,

    severityRisk: row.severityRisk as SeverityRisk,
    status: row.status as SourceStatus,
    workstream: row.workstreamObservationType as Workstream,
    source: row.scorecardSource as Source,
    scorecardSource: row.scorecardSource,
    operatingEnvironment: row.operatingEnvironment as OperatingEnvironment,
    esmType: row.esmtype,
    patchCategory: row.patchCategory,

    hostName: row.hostNameServer,
    ipAddresses: row.ipaddress,
    osName: row.osname,
    deviceType: row.deviceType,

    applicationFullName: row.applicationFullName,
    applicationId: String(row.applicationId),
    applicationManagerContactName: row.applicationManagerContactName,
    cioDisplayName: row.ciodisplayName,
    financialHierarchy: row.financialHierarchy,

    technicalDescription: row.technicalDescription,
    technicalDetail: row.technicalDetail,

    dueDate: normalizeDate(row.dueDate),
    dateObserved: normalizeDate(row.dateObserved),
    dateLastSeen: normalizeDate(row.dateLastSeen),
    hostLastSeen: normalizeDate(row.hostLastSeen),

    gisExternalFlag: row.gisexternalFlag,
    erpScorecardStatus: row.erpscorecardStatus,
    erpExceptionRequestStatus: row.erpexceptionRequestStatus,
    acceptableUseStatus: row.acceptableUseStatus,

    disposition: (row.disposition ?? "") as Disposition,
    rcManagingTeam: row.rcmanagingTeam ?? "",
    requestedPatchWindow: row.requestedPatchWindow ?? "",
    expectedRemediationDate: normalizeDate(row.expectedRemediationDate),
    crqNumber: row.crq ?? "",
    identifiedBlockers: parseBlockers(row.identifiedBlockers),

    createdBy: row.createdUserId != null ? String(row.createdUserId) : "",
    createdAt: row.createdDateTime ?? "",
    lastSavedBy: row.updatedUserId != null ? String(row.updatedUserId) : "",
    lastSavedAt: row.updatedDateTime ?? "",
  };
}

// ── FE filter state -> API filter request ───────────────────────────────────
export interface UiVulnerabilityFilters {
  reportDate?: string;
  gisid?: string;
  applicationId?: string | number;
  cioDisplayName?: string;
  workstreamObservationType?: string;
  severityRisk?: string;
  scorecardSource?: string;
  deviceType?: string;
  operatingEnvironment?: string;
}

export function toApiFilter(
  filters: UiVulnerabilityFilters,
  pagination: { pageNumber: number; pageSize: number },
): VulnerabilityCmFilterRequestModel {
  const applicationId =
    filters.applicationId === undefined || filters.applicationId === ""
      ? null
      : typeof filters.applicationId === "number"
        ? filters.applicationId
        : Number(filters.applicationId);

  return {
    reportDate: filters.reportDate || null,
    gisid: filters.gisid || null,
    applicationId: Number.isFinite(applicationId) ? applicationId : null,
    cioDisplayName: filters.cioDisplayName || null,
    workstreamObservationType: filters.workstreamObservationType || null,
    severityRisk: filters.severityRisk || null,
    scorecardSource: filters.scorecardSource || null,
    deviceType: filters.deviceType || null,
    operatingEnvironment: filters.operatingEnvironment || null,
    pageNumber: pagination.pageNumber,
    pageSize: pagination.pageSize,
  };
}

// ── FE patch -> BulkUpdateVCMExtra items[] ──────────────────────────────────
// Mirrors patchToApiItem in ag-grid-table.tsx — moved here so it's testable
// and reusable. Caller supplies the rows being patched (we need each gisid).
export function toBulkUpdateItems(
  rows: Pick<Vulnerability, "id">[],
  patch: Partial<Vulnerability>,
): VulnerabilityCmExtraUpdateItem[] {
  return rows.map((row) => {
    const item: VulnerabilityCmExtraUpdateItem = { gisid: row.id };
    if (patch.disposition !== undefined) item.disposition = patch.disposition;
    if (patch.requestedPatchWindow !== undefined) {
      item.requestedPatchWindow = patch.requestedPatchWindow;
    }
    if (patch.expectedRemediationDate !== undefined) {
      item.expectedRemediationDate = patch.expectedRemediationDate
        ? `${patch.expectedRemediationDate}T00:00:00`
        : "";
    }
    if (patch.crqNumber !== undefined) item.crq = patch.crqNumber;
    if (patch.identifiedBlockers !== undefined) {
      item.identifiedBlockers = patch.identifiedBlockers.join("; ");
    }
    return item;
  });
}
