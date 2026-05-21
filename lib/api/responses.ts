// Hand-rolled response types for the VulnerabilityCm endpoints.
//
// The generated `openapi.json` declares 200 responses as `unknown`, so these
// shapes are the FE's working contract until backend refines the spec. They
// reflect the actual responses observed against bpsportal-dev3.

// GET /api/v2/VulnerabilityCm/VulnerabilityFilterOption
export interface VulnerabilityFilterOptionsResponse {
  // Key is the stringified numeric application ID (e.g. "5"), value is the
  // application's display name. The empty-string entry ("0" -> "") is a
  // placeholder for "All".
  applicationIds: Record<string, string>;
  cioDisplayNames: string[];
  workstreamObservationTypes: string[];
  severityRisks: string[];
  scorecardSources: string[];
  deviceTypes: string[];
  operatingEnvironments: string[];
}

// POST /api/v2/VulnerabilityCm/GetVulnerabilityCM
export interface GetVulnerabilityCmResponse {
  records: ApiVulnerabilityRow[];
  totalRecords: number;
  pageNumber: number;
  pageSize: number;
}

// One row from /GetVulnerabilityCM. Field casing matches the wire format
// verbatim — the adapter layer normalizes to FE camelCase.
export interface ApiVulnerabilityRow {
  // Numeric primary key — NOT the gisid. FE `Vulnerability.id` is sourced
  // from `gisid` below.
  id: number;
  reportDate: string; // "YYYY-MM-DD"
  gisid: string;
  status: string;
  ciodisplayName: string;
  workstreamObservationType: string;
  scorecardSource: string;
  dueDate: string; // .NET datetime, e.g. "2025-09-14T00:00:00"
  esmtype: string;
  applicationManagerContactName: string;
  applicationId: number;
  applicationFullName: string;
  financialHierarchy: string;
  severityRisk: string;
  gisexternalFlag: string;
  erpscorecardStatus: string;
  erpexceptionRequestStatus: string;
  acceptableUseStatus: string;
  dateObserved: string;
  hostLastSeen: string; // "1900-01-01T00:00:00" is a sentinel for "never"
  dateLastSeen: string;
  qualysId: number | null;
  cve: string;
  patchCategory: string;
  title: string;
  technicalDetail: string;
  technicalDescription: string;
  hostNameServer: string;
  ipaddress: string;
  deviceType: string;
  osname: string;
  operatingEnvironment: string;
  // Triage / editable fields — null when never set
  crq: string | null;
  disposition: string | null;
  expectedRemediationDate: string | null;
  identifiedBlockers: string | null; // delimited string, joined with "; "
  rcmanagingTeam: string | null;
  requestedPatchWindow: string | null;
  createdUserId: number | null;
  createdDateTime: string | null;
  updatedUserId: number | null;
  updatedDateTime: string | null;
}

// POST /api/v2/VulnerabilityCm/BulkUpdateVCMExtra — empty 200 body
export type BulkUpdateVcmExtraResponse = void;
