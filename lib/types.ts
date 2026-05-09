// Vulnerability Triage Dashboard Types
// AG Grid Enterprise v32.3.0 + AG Charts Enterprise v10.0.0

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
  | "Fix"
  | "Defer"
  | "Mitigate"
  | "Accept Risk"
  | "False Positive"
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
  | "Data and reporting limitations";

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
];

export const PATCH_WINDOWS = [
  "Sat 5/9 00:00–08:00 ET",
  "Sat 5/9 08:00–16:00 ET",
  "Sat 5/9 16:00–23:59 ET",
  "Sun 5/10 00:00–08:00 ET",
  "Sun 5/10 08:00–16:00 ET",
  "Sun 5/10 16:00–23:59 ET",
  "Mon 5/11 00:00–08:00 ET",
  "Sat 5/16 00:00–08:00 ET",
  "Sat 5/16 08:00–16:00 ET",
  "Sun 5/17 00:00–08:00 ET",
  "Sun 5/17 08:00–16:00 ET",
];

export const DISPOSITIONS: Disposition[] = [
  "Fix",
  "Defer",
  "Mitigate",
  "Accept Risk",
  "False Positive",
];

export interface ActivityLogEntry {
  id: string;
  userId: string;
  userName: string;
  userInitials: string;
  action: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  timestamp: string; // ISO string — deterministic for SSR
}

export interface Vulnerability {
  // Source data (read-only from Hadoop/Roger's DB)
  id: string;
  qualysId: number;
  cve: string;
  title: string;
  severityRisk: SeverityRisk;
  status: SourceStatus;
  workstream: Workstream;
  source: Source;
  operatingEnvironment: OperatingEnvironment;
  hostName: string;
  fqdn: string;
  ipAddresses: string;
  osName: string;
  deviceType: string;
  hostingPlatform: string;
  technology: string;
  technologyVersion: string;
  applicationFullName: string;
  applicationId: string;
  applicationManagerContactName: string;
  applicationManagerContactNetwork: string;
  applicationSupportContactName: string;
  applicationSupportContactNetwork: string;
  technicalExecutiveContactName: string;
  technicalExecutiveContactNetwork: string;
  cioDisplayName: string;
  operationalCto: string;
  runbookOwner: string;
  financialHierarchy: string;
  patchCategory: string;
  description: string;
  technicalDescription: string;
  technicalDetail: string;
  vulnerabilityFindings: string;
  vulnerabilitySubcategory: string;
  consequenceModel: string;
  verificationStatus: string;
  pastDue: "Y" | "N";
  daysOpen: number;
  dueDate: string;
  scheduledFixDate: string;
  resolvedDate: string;
  reportDate: string;
  freshnessDate: string;
  firstConsequenceDate: string;
  secondConsequenceDate: string;
  thirdConsequenceDate: string;
  erpScorecardStatus: string;
  scorecardErpStatusDetails: string;
  erpExceptionId: string;
  erpExceptionRequestStatus: string;
  erpExceptionExpirationDate: string;
  erpExceptionRiskDecision: string;
  erpExceptionBisoRequestStatus: string;
  associatedErpExceptions: string;
  erpScorecardPendingId: string;
  erpScorecardPendingStatus: string;
  erpScorecardPendingExpirationDate: string;
  isDmz: "Y" | "N";
  isPublicInternetAccessible: "Y" | "N";
  isCisa: "Y" | "N";
  isOnSite: string;
  securityZone: string;
  gisAssetCategory: string;
  gisMetricAlignment: string;
  gisExternalFlag: string;
  gisThirdPartyScope: string;
  port: string;
  assessmentArea: string;
  assessmentScope: string;
  scorecardSource: string;
  sigAlgorithm: string;
  issuerName: string;
  cloudAccountId: string;
  resourceId: string;
  resourceType: string;
  policyName: string;
  nonBauReason: string;
  domain: string;
  thirdPartyName: string;
  remediation: string;
  scorecardErpDays: string;
  evm: string;
  tppe: string;
  acceptableUseId: string;
  acceptableUseExpirationDate: string;
  acceptableUseStatus: string;
  decommissionRequestNumber: string;
  decommissionRequestStatus: string;
  esmType: string;
  dateObserved: string;
  dateLastSeen: string;
  hostLastSeen: string;
  classificationDate: string;
  // Triage state (written by this UI)
  triageStatus: TriageStatus;
  disposition: Disposition;
  ctiRemediation: "Yes" | "No" | "";
  requestedPatchWindow: string;
  expectedRemediationDate: string;
  crqNumber: string;
  remediationPendingClearScan: "Yes" | "No" | "";
  healthCheckTime: string;
  healthCheckComplete: "Yes" | "No" | "";
  identifiedBlockers: Blocker[];
  falsePositiveReason: string;
  vulnOwner: string;
  lastSavedBy: string;
  lastSavedAt: string;
  activityLog: ActivityLogEntry[];
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
