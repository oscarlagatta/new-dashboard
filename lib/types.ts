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

// Authoritative remediation lever — every finding belongs to exactly one.
// See docs/lever-scope-discovery.md for context on the four-value taxonomy.
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
  obiid: string;
  id: string;
  qualysId: number;
  cve: string;
  title: string;
  severityRisk: SeverityRisk;
  status: SourceStatus;
  workstream: Workstream;
  source: Source;
  lever: Lever;
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
  /** Free-text detail shown when disposition is "Other (please provide detail)". */
  dispositionDetail?: string;
  rcManagingTeam: string;
  ctiRemediation: "Yes" | "No" | "";
  requestedPatchWindow: string;
  expectedRemediationDate: string;
  crqNumber: string;
  remediationPendingClearScan: "Yes" | "No" | "";
  healthCheckTime: string;
  healthCheckComplete: "Yes" | "No" | "";
  identifiedBlockers: Blocker[];
  otherBlockerDetail: string;
  falsePositiveReason: string;
  deferralJustification: string;
  reEvaluateBy: string;
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
