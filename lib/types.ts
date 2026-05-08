export type VulnerabilityStatus =
  | "Awaiting Disposition"
  | "In Progress"
  | "Pending Clear Scan"
  | "Resolved"

export type Severity = "Critical" | "High" | "Medium" | "Low"

export type Disposition =
  | "Fix"
  | "Defer"
  | "Accept Risk"
  | "Mitigate"
  | "False Positive"

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

export type Source = "Qualys" | "Internal Scan"

export interface ActivityLogEntry {
  id: string
  userName: string
  userAvatar?: string
  action: string
  field?: string
  oldValue?: string
  newValue?: string
  timestamp: Date
}

export interface Coordinator {
  name: string
  avatar?: string
}

export interface Vulnerability {
  id: string
  
  // Identification
  gisId: string
  qualysId?: string
  beId?: string
  applicationId: string
  cveId: string
  
  // Application & Ownership
  applicationFullName: string
  applicationStatus: string
  applicationManagerContact?: string
  cioDisplayName: string
  techExecutiveContact?: string
  remediationCoordinator?: Coordinator
  runbookOwner?: string
  financialHierarchy?: string
  
  // Asset Details
  hostName: string
  ipAddresses: string[]
  fqdn?: string
  osName?: string
  deviceType?: string
  operatingEnvironment?: string
  displayRegion?: string
  esmType?: string
  
  // Vulnerability Description
  title: string
  description: string
  technicalDescription?: string
  source: Source
  workstreamObservationType?: string
  
  // Status & Timing
  status: VulnerabilityStatus
  statusDetails?: string
  verificationStatus?: string
  dateObserved: Date
  dateLastSeen?: Date
  daysOpen: number
  dueDate?: Date
  dueDateStatus?: string
  pastDue: boolean
  scheduledFixDate?: Date
  remediatedDate?: Date
  
  // Risk & Consequence
  severity: Severity
  severityRisk?: string
  cvssScore: number
  vendorRiskLevel?: string
  consequenceModel?: string
  firstConsequenceDate?: Date
  secondConsequenceDate?: Date
  gisExternalFlag: boolean
  internalFlag?: string
  
  // ERP Exceptions
  erpExceptionId?: string
  erpExceptionRequestStatus?: string
  erpExceptionRiskDecision?: string
  erpExceptionExpirationDate?: Date
  erpStatus?: string
  erpScorecardStatus?: string
  associatedErpExceptionIds?: string[]
  
  // Acceptable Use
  acceptableUseId?: string
  acceptableUseStatus?: string
  acceptableUseExpirationDate?: Date
  
  // Decommissioning
  decommissionRequestNumber?: string
  decommissionRequestStatus?: string
  decommissionSubmitDate?: Date
  decommissionRequestCompletionDate?: Date
  
  // Triage Fields (editable)
  disposition?: Disposition
  ctiRemediation?: boolean
  requestedPatchWindow?: string
  identifiedBlockers?: Blocker[]
  expectedRemediationDate?: Date
  crqNumber?: string
  remediationComplete?: boolean
  healthCheckTime?: Date
  healthCheckComplete?: boolean
  
  // Activity
  activityLog: ActivityLogEntry[]
  lastSavedAt?: Date
  lastSavedBy?: string
}

export type SortDirection = "asc" | "desc"
export type SortField =
  | "status"
  | "severity"
  | "cveId"
  | "title"
  | "applicationFullName"
  | "hostName"
  | "daysOpen"
  | "dueDate"
  | "disposition"
  | "crqNumber"
  | "remediationCoordinator"

export type ViewDensity = "compact" | "comfortable"

export interface ColumnVisibility {
  status: boolean
  severity: boolean
  cveId: boolean
  title: boolean
  applicationFullName: boolean
  hostName: boolean
  daysOpen: boolean
  dueDate: boolean
  disposition: boolean
  crqNumber: boolean
  remediationCoordinator: boolean
}
