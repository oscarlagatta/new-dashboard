// Vulnerability Triage Dashboard Types
// AG Grid Enterprise v32.3.0 + AG Charts Enterprise v10.0.0
//
// The `Vulnerability` shape is the FE projection of the
// `GetVulnerabilityCM` API row. Fields the API does not return have been
// removed — don't reintroduce one without a backend contract for it.

export type TriageStatus =
  | "Awaiting Disposition"
  | "In Progress"
  | "Pending Clear Scan"
  | "Resolved";

export type SeverityRisk =
  | "Priority 1"
  | "Priority 2"
  | "Priority 3"
  | "Priority 4";

export type SourceStatus = "Open" | "Closed";

export type Disposition =
  // Spec values
  | "CIO ACTION – Need Requested Patch Window"
  | "CIO ACTION – App Team will Remediate"
  | "CIO ACTION – App Team identify blocker"
  | "CIO ACTION – Request Self-Service Package (Not Automatically Pushed by PCC)"
  | "CIO INFORM – LLE force patch on Midweek at 10PM ET for AMRS (APAC 10AM ET, EMEA 8PM ET)"
  | "CIO REVIEW – PCC will patch under established RMW"
  | "NO IMMEDIATE ACTION – No Patch Available, waiting for patch"
  | "NO IMMEDIATE ACTION – CTI AIT"
  | "TEAM 1 ACTION – Baseline ESM-OS Remediation Team"
  // Legacy values (preserved)
  | "Fix"
  | "Defer"
  | "Mitigate"
  | "Accept Risk"
  | "False Positive"
  // Catch-all — selecting this reveals a free-text "please provide detail" input.
  | "Other (please provide detail)"
  | "";

export type OperatingEnvironment = "In Production" | "Pre-Prod" | "Contingency";

export type Workstream =
  | "MiddlewarePatch"
  | "NonQualysCVE"
  | "ADSF"
  | "CloudConfigCompliance";

export type Source =
  | "ADSF"
  | "MiddlewarePatch"
  | "ESM"
  | "BDNA"
  | "Bladelogic patch"
  | "CTI Manual Ingestion"
  | "Cloud Config Compliance"
  | "Nextgen BMP";

// Authoritative remediation lever — kept as a type but no longer a field on
// Vulnerability (the API does not return it). The CIO/CIO-1 cascade API
// update may bring it back.
export type Lever =
  | "CTI/APS&E/EET-Managed Remediation"
  | "Assessment Underway"
  | "CIO E2E"
  | "CIO/CTI Engagement";

export const LEVERS: Lever[] = [
  "CTI/APS&E/EET-Managed Remediation",
  "Assessment Underway",
  "CIO E2E",
  "CIO/CTI Engagement",
];

export type Blocker =
  | "Vendor / internal package availability"
  | "Testing and partner / peer team dependencies"
  | "Limited central (bulk) remediation capabilities"
  | "Third-party dependencies"
  | "Hardware dependencies"
  | "Application re-design / re-architecture required"
  | "Hosting Capacity"
  | "No patch available"
  | "False positives in Vulnerability and FOSS data"
  | "Data and reporting limitations"
  | "Other (please provide detail)";

export const BLOCKERS: Blocker[] = [
  "Vendor / internal package availability",
  "Testing and partner / peer team dependencies",
  "Limited central (bulk) remediation capabilities",
  "Third-party dependencies",
  "Hardware dependencies",
  "Application re-design / re-architecture required",
  "Hosting Capacity",
  "No patch available",
  "False positives in Vulnerability and FOSS data",
  "Data and reporting limitations",
  "Other (please provide detail)",
];

export const DISPOSITIONS: { label: string; value: Disposition; group: "spec" | "legacy" }[] = [
  { label: "CIO ACTION – Need Requested Patch Window", value: "CIO ACTION – Need Requested Patch Window", group: "spec" },
  { label: "CIO ACTION – App Team will Remediate", value: "CIO ACTION – App Team will Remediate", group: "spec" },
  { label: "CIO ACTION – App Team identify blocker", value: "CIO ACTION – App Team identify blocker", group: "spec" },
  { label: "CIO ACTION – Request Self-Service Package (Not Automatically Pushed by PCC)", value: "CIO ACTION – Request Self-Service Package (Not Automatically Pushed by PCC)", group: "spec" },
  { label: "CIO INFORM – LLE force patch on Midweek at 10PM ET for AMRS (APAC 10AM ET, EMEA 8PM ET)", value: "CIO INFORM – LLE force patch on Midweek at 10PM ET for AMRS (APAC 10AM ET, EMEA 8PM ET)", group: "spec" },
  { label: "CIO REVIEW – PCC will patch under established RMW", value: "CIO REVIEW – PCC will patch under established RMW", group: "spec" },
  { label: "NO IMMEDIATE ACTION – No Patch Available, waiting for patch", value: "NO IMMEDIATE ACTION – No Patch Available, waiting for patch", group: "spec" },
  { label: "NO IMMEDIATE ACTION – CTI AIT", value: "NO IMMEDIATE ACTION – CTI AIT", group: "spec" },
  { label: "TEAM 1 ACTION – Baseline ESM-OS Remediation Team", value: "TEAM 1 ACTION – Baseline ESM-OS Remediation Team", group: "spec" },
  { label: "Other (please provide detail)", value: "Other (please provide detail)", group: "spec" },
];

// FE projection of one VulnerabilityCm record. Every field below corresponds
// to a key on the wire response (see `lib/api/responses.ts` ApiVulnerabilityRow);
// the adapter in `lib/api/adapters.ts` performs the casing / type / format
// normalization.
export interface Vulnerability {
  // Identity & report metadata
  id: string; // sourced from API `gisid`
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
}

export interface CioTeam {
  id: string;
  name: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  initials: string;
}

// Sparkline data for stat cards
export interface SparklineDataPoint {
  day: number;
  value: number;
}
