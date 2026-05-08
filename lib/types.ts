// Vulnerability Triage Dashboard Types
// For AG Grid Enterprise v32.3.0 + AG Charts Enterprise v10.0.0

export type TriageStatus = 
  | "Awaiting Disposition" 
  | "In Progress" 
  | "Pending Clear Scan" 
  | "Resolved";

export type Severity = "Critical" | "High" | "Medium" | "Low";

export type Disposition = 
  | "Fix" 
  | "Defer" 
  | "Mitigate" 
  | "Accept Risk" 
  | "False Positive"
  | null;

export type OperatingEnvironment = 
  | "Production" 
  | "Non-Production" 
  | "Development" 
  | "UAT";

export type VerificationStatus = 
  | "Verified" 
  | "Pending Verification" 
  | "Verification Failed" 
  | "Not Required";

export type Source = "Qualys" | "Tenable" | "Rapid7" | "Manual";

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

export interface ActivityLogEntry {
  id: string;
  odiserId: string;
  userName: string;
  userAvatar?: string;
  action: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  timestamp: Date;
}

export interface Vulnerability {
  // Primary identifiers
  id: string;
  gisId: string;
  qualysId: string;
  cve: string;
  title: string;

  // Status & workflow
  status: TriageStatus;
  statusDetails?: string;
  severity: Severity;
  severityRisk?: string;
  verificationStatus: VerificationStatus;
  source: Source;
  sources?: string;

  // Disposition & triage
  disposition: Disposition;
  ctiRemediation: boolean | null;
  identifiedBlockers: Blocker[];
  requestedPatchWindow?: string;
  expectedRemediationDate?: Date;
  crqNumber?: string;
  remediationComplete: boolean | null;
  healthCheckTime?: Date;
  healthCheckComplete: boolean | null;
  falsePositiveReason?: string;

  // Asset / Host information
  hostName: string;
  fqdn: string;
  osName: string;
  osVersion?: string;
  ipAddresses: string[];
  operatingEnvironment: OperatingEnvironment;
  hostingPlatform?: string;
  isPublicInternetAccessible: boolean;
  isDmz: boolean;
  isOnSite: boolean;
  tier?: string;
  securityZone?: string;

  // Application & ownership
  applicationFullName: string;
  cioDisplayName: string;
  techExecutive?: string;
  techExecutiveContact?: string;
  vulnOwner?: string;
  vulnOwnerEmail?: string;
  runbookOwner?: string;
  mwOwner?: string;
  operationalCto?: string;
  financialHierarchy?: string;
  remediationCoordinator?: string;

  // Vulnerability details
  description: string;
  technicalDescription?: string;
  technicalDetail?: string;
  vulnerabilityFindings?: string;
  vulnerabilitySubcategory?: string;

  // Technology
  technology: string;
  technologyVersion?: string;

  // Dates
  dateObserved: Date;
  dateLastSeen: Date;
  hostLastSeen?: Date;
  daysOpen: number;
  dueDate: Date;
  scheduledFixDate?: Date;
  remediatedDate?: Date;
  nextRmw?: Date;
  lastUpdated: Date;
  pastDue: boolean;

  // Remediation tracking
  patchCategory?: string;
  patchTitle?: string;
  levers?: string;
  remediation?: string;
  vmRemediationGroupingName?: string;
  vmRemediationInstructions?: string;
  vmTitleGroup?: string;
  vmReportDate?: Date;

  // Risk & consequence
  vendorRiskLevel?: string;
  firstConsequenceDate?: Date;
  secondConsequenceDate?: Date;
  thirdConsequenceDate?: Date;
  gisExternalFlag: boolean;
  gisThirdPartyScope?: string;
  vendorNameManaging?: string;
  thirdPartyName?: string;

  // Governance & exceptions
  erpScorecardStatus?: string;
  erpScorecardPendingId?: string;
  erpScorecardPendingStatus?: string;
  erpScorecardPendingExpirationDate?: Date;
  erpCount?: number;
  acceptableUseId?: string;
  acceptableUseStatus?: string;
  acceptableUseExpirationDate?: Date;

  // Platform & metadata
  esmType?: string;
  resourceId?: string;
  resourceType?: string;
  policyName?: string;
  riskTech?: string;
  isBuiltInHouse: boolean;
  managed?: string;
  gisAssetCategory?: string;
  gisMetricAlignment?: string;
  workstream?: string;
  workstreamObservationType?: string;
  ingestionDate?: Date;
  freshnessVersionDate?: Date;

  // Activity log
  activityLog: ActivityLogEntry[];

  // Metadata
  lastSavedAt?: Date;
  lastSavedBy?: string;
}

export interface CioTeam {
  id: string;
  name: string;
  code: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

// Sparkline data point for stat cards
export interface SparklineDataPoint {
  date: string;
  value: number;
}

// Chart data for severity x status
export interface SeverityStatusData {
  severity: Severity;
  awaitingDisposition: number;
  inProgress: number;
  pendingClearScan: number;
  resolved: number;
}
