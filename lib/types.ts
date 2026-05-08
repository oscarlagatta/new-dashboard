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

export interface ActivityLogEntry {
  id: string
  userName: string
  action: string
  field?: string
  value?: string
  timestamp: Date
}

export interface Vulnerability {
  id: string
  cveId: string
  status: VulnerabilityStatus
  system: string
  severity: Severity
  disposition?: Disposition
  crqNumber?: string
  owner?: {
    name: string
    avatar?: string
  }
  expectedFixDate?: Date
  description: string
  firstDetected: Date
  cvssScore: number
  ctiRemediation?: boolean
  requestedPatchWindow?: string
  identifiedBlockers?: Blocker[]
  expectedRemediationDate?: Date
  remediationComplete?: boolean
  healthCheckTime?: Date
  healthCheckComplete?: boolean
  activityLog: ActivityLogEntry[]
}

export type SortDirection = "asc" | "desc"
export type SortField =
  | "status"
  | "cveId"
  | "system"
  | "severity"
  | "disposition"
  | "crqNumber"
  | "owner"
  | "expectedFixDate"
