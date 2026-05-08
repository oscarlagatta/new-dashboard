import type {
  Vulnerability,
  TriageStatus,
  Severity,
  Disposition,
  OperatingEnvironment,
  VerificationStatus,
  Source,
  Blocker,
  ActivityLogEntry,
  CioTeam,
  User,
  SparklineDataPoint,
  SeverityStatusData,
} from "./types";

// CIO Teams
export const CIO_TEAMS: CioTeam[] = [
  { id: "1", name: "Payments Technology", code: "PAY" },
  { id: "2", name: "Trading Systems", code: "TRD" },
  { id: "3", name: "Risk & Compliance", code: "RSK" },
  { id: "4", name: "Consumer Banking", code: "CNB" },
  { id: "5", name: "Wealth Management", code: "WLT" },
];

// Patch windows for scheduling
export const patchWindows = [
  "Sat 5/9 00:00–08:00 ET",
  "Sat 5/9 08:00–16:00 ET",
  "Sun 5/10 00:00–08:00 ET",
  "Sun 5/10 08:00–16:00 ET",
  "Sat 5/16 00:00–08:00 ET",
  "Sat 5/16 08:00–16:00 ET",
];

// Blocker options for disposition
export const blockerOptions: Blocker[] = [
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

// Users for assignments
export const USERS: User[] = [
  { id: "1", name: "Sarah Chen", email: "sarah.chen@bank.internal" },
  { id: "2", name: "James Wilson", email: "james.wilson@bank.internal" },
  { id: "3", name: "Maria Garcia", email: "maria.garcia@bank.internal" },
  { id: "4", name: "David Kim", email: "david.kim@bank.internal" },
  { id: "5", name: "Emily Johnson", email: "emily.johnson@bank.internal" },
  { id: "6", name: "Michael Brown", email: "michael.brown@bank.internal" },
  { id: "7", name: "Lisa Anderson", email: "lisa.anderson@bank.internal" },
  { id: "8", name: "Robert Taylor", email: "robert.taylor@bank.internal" },
];

const APPLICATIONS = [
  "Payments Gateway",
  "Authentication Service",
  "Customer Portal",
  "Trade Settlement Engine",
  "Risk Reporting Platform",
  "Wire Transfer System",
  "Card Processing",
  "Treasury Services",
  "FX Trading Platform",
  "Mortgage Origination",
  "Account Management",
  "Fraud Detection",
  "Compliance Monitor",
  "Market Data Feed",
  "Order Management",
];

const TECHNOLOGIES = [
  { name: "Apache", version: "2.4.41" },
  { name: "OpenSSL", version: "1.1.1k" },
  { name: "Windows Server", version: "2019" },
  { name: "Red Hat Enterprise Linux", version: "8.4" },
  { name: "Java", version: "11.0.12" },
  { name: "Tomcat", version: "9.0.45" },
  { name: "MySQL", version: "8.0.27" },
  { name: "Nginx", version: "1.18.0" },
  { name: "PostgreSQL", version: "13.4" },
  { name: "Node.js", version: "16.13.0" },
  { name: "Oracle Database", version: "19c" },
  { name: "IBM MQ", version: "9.2" },
  { name: "Docker", version: "20.10.12" },
  { name: "Kubernetes", version: "1.23.4" },
];

const VULN_TITLES = [
  "Remote Code Execution in Authentication Module",
  "SQL Injection in Search Functionality",
  "Cross-Site Scripting in Message Rendering",
  "Buffer Overflow in Transaction Parsing",
  "Authentication Bypass via JWT Manipulation",
  "Information Disclosure in Error Messages",
  "Insecure Deserialization in Session Handling",
  "Path Traversal in File Upload",
  "SSRF in Report Generation Module",
  "Template Injection in Email Rendering",
  "Privilege Escalation via API Endpoint",
  "Improper Access Control in Customer Data",
  "XML External Entity Processing",
  "Cryptographic Weakness in Key Exchange",
  "Memory Leak in Connection Handler",
  "Denial of Service via Malformed Request",
  "Race Condition in Payment Processing",
  "Insecure Random Number Generation",
  "Hard-coded Credentials in Configuration",
  "Missing Certificate Validation",
];

const DESCRIPTIONS = [
  "A critical vulnerability exists in the authentication module that allows remote attackers to execute arbitrary code by exploiting improper input validation in the login request handler.",
  "The search functionality is vulnerable to SQL injection attacks due to insufficient sanitization of user input parameters, potentially allowing unauthorized database access.",
  "Cross-site scripting vulnerability in the message rendering component allows attackers to inject malicious scripts that execute in the context of authenticated users.",
  "A buffer overflow vulnerability in the transaction parsing module can be exploited by sending specially crafted transaction data, potentially leading to remote code execution.",
  "The JWT validation process can be bypassed by manipulating the algorithm header, allowing attackers to forge authentication tokens.",
  "Error messages returned by the application disclose sensitive information about the internal system architecture and configuration.",
  "The session handling mechanism is vulnerable to insecure deserialization attacks that can lead to remote code execution.",
  "Path traversal vulnerability in the file upload functionality allows attackers to write files to arbitrary locations on the server.",
  "Server-side request forgery vulnerability in the report generation module allows attackers to make requests to internal services.",
  "Template injection vulnerability in the email rendering component allows attackers to execute arbitrary code on the server.",
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomDate(daysAgo: number, daysAhead: number = 0): Date {
  const now = new Date();
  const offset = randomInt(-daysAgo, daysAhead);
  return new Date(now.getTime() + offset * 24 * 60 * 60 * 1000);
}

function generateCVE(): string {
  const year = Math.random() > 0.3 ? 2024 : 2025;
  const id = randomInt(10000, 99999);
  return `CVE-${year}-${id}`;
}

function generateHostName(app: string, env: OperatingEnvironment): string {
  const prefix = app.toLowerCase().replace(/\s+/g, "-").substring(0, 8);
  const envCode = env === "Production" ? "prd" : env === "Non-Production" ? "npd" : env === "Development" ? "dev" : "uat";
  const num = String(randomInt(1, 999)).padStart(3, "0");
  return `${prefix}-${envCode}-${num}.bank.internal`;
}

function generateIP(): string {
  const subnets = ["10.1.100", "10.2.50", "172.16.20", "192.168.10"];
  return `${randomElement(subnets)}.${randomInt(1, 254)}`;
}

function generateGisId(): string {
  return `GIS-${new Date().getFullYear()}-${String(randomInt(1, 999999)).padStart(6, "0")}`;
}

function generateQualysId(): string {
  return `QID-${randomInt(10000, 99999)}`;
}

function generateCrqNumber(): string {
  return `CRQ${String(randomInt(1, 99999999)).padStart(12, "0")}`;
}

function weightedRandom<T>(options: { value: T; weight: number }[]): T {
  const total = options.reduce((sum, opt) => sum + opt.weight, 0);
  let random = Math.random() * total;
  for (const option of options) {
    random -= option.weight;
    if (random <= 0) return option.value;
  }
  return options[options.length - 1].value;
}

function generateActivityLog(status: TriageStatus, disposition: Disposition): ActivityLogEntry[] {
  const entries: ActivityLogEntry[] = [];
  const now = new Date();
  
  entries.push({
    id: crypto.randomUUID(),
    odiserId: "system",
    userName: "System",
    action: "Vulnerability detected and imported from scan",
    timestamp: new Date(now.getTime() - randomInt(5, 30) * 24 * 60 * 60 * 1000),
  });

  if (status !== "Awaiting Disposition" || Math.random() > 0.5) {
    const user = randomElement(USERS);
    entries.push({
      id: crypto.randomUUID(),
      odiserId: user.id,
      userName: user.name,
      action: "was assigned as vulnerability owner",
      timestamp: new Date(now.getTime() - randomInt(3, 20) * 24 * 60 * 60 * 1000),
    });
  }

  if (status === "In Progress" || status === "Pending Clear Scan" || status === "Resolved") {
    const user = randomElement(USERS);
    entries.push({
      id: crypto.randomUUID(),
      odiserId: user.id,
      userName: user.name,
      action: "changed status",
      field: "status",
      oldValue: "Awaiting Disposition",
      newValue: "In Progress",
      timestamp: new Date(now.getTime() - randomInt(2, 15) * 24 * 60 * 60 * 1000),
    });
  }

  if (disposition) {
    const user = randomElement(USERS);
    entries.push({
      id: crypto.randomUUID(),
      odiserId: user.id,
      userName: user.name,
      action: `set disposition to "${disposition}"`,
      field: "disposition",
      newValue: disposition,
      timestamp: new Date(now.getTime() - randomInt(1, 10) * 24 * 60 * 60 * 1000),
    });
  }

  if (status === "Pending Clear Scan" || status === "Resolved") {
    const user = randomElement(USERS);
    entries.push({
      id: crypto.randomUUID(),
      odiserId: user.id,
      userName: user.name,
      action: "changed status",
      field: "status",
      oldValue: "In Progress",
      newValue: status === "Resolved" ? "Pending Clear Scan" : status,
      timestamp: new Date(now.getTime() - randomInt(1, 5) * 24 * 60 * 60 * 1000),
    });
  }

  if (status === "Resolved") {
    const user = randomElement(USERS);
    entries.push({
      id: crypto.randomUUID(),
      odiserId: user.id,
      userName: user.name,
      action: "marked health check as complete",
      timestamp: new Date(now.getTime() - randomInt(0, 3) * 24 * 60 * 60 * 1000),
    });
    entries.push({
      id: crypto.randomUUID(),
      odiserId: user.id,
      userName: user.name,
      action: "changed status",
      field: "status",
      oldValue: "Pending Clear Scan",
      newValue: "Resolved",
      timestamp: new Date(now.getTime() - randomInt(0, 2) * 24 * 60 * 60 * 1000),
    });
  }

  return entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

export function generateVulnerabilities(count: number = 50): Vulnerability[] {
  const vulnerabilities: Vulnerability[] = [];

  for (let i = 0; i < count; i++) {
    const status = weightedRandom<TriageStatus>([
      { value: "Awaiting Disposition", weight: 30 },
      { value: "In Progress", weight: 35 },
      { value: "Pending Clear Scan", weight: 20 },
      { value: "Resolved", weight: 15 },
    ]);

    const severity = weightedRandom<Severity>([
      { value: "Critical", weight: 5 },
      { value: "High", weight: 25 },
      { value: "Medium", weight: 50 },
      { value: "Low", weight: 20 },
    ]);

    const operatingEnvironment = weightedRandom<OperatingEnvironment>([
      { value: "Production", weight: 60 },
      { value: "Non-Production", weight: 25 },
      { value: "Development", weight: 10 },
      { value: "UAT", weight: 5 },
    ]);

    const source = weightedRandom<Source>([
      { value: "Qualys", weight: 70 },
      { value: "Tenable", weight: 15 },
      { value: "Rapid7", weight: 10 },
      { value: "Manual", weight: 5 },
    ]);

    const verificationStatus = weightedRandom<VerificationStatus>([
      { value: "Verified", weight: 40 },
      { value: "Pending Verification", weight: 35 },
      { value: "Verification Failed", weight: 5 },
      { value: "Not Required", weight: 20 },
    ]);

    let disposition: Disposition = null;
    if (status !== "Awaiting Disposition") {
      disposition = weightedRandom<Disposition>([
        { value: "Fix", weight: 50 },
        { value: "Mitigate", weight: 20 },
        { value: "Defer", weight: 15 },
        { value: "Accept Risk", weight: 10 },
        { value: "False Positive", weight: 5 },
      ]);
    }

    const app = randomElement(APPLICATIONS);
    const tech = randomElement(TECHNOLOGIES);
    const hostName = generateHostName(app, operatingEnvironment);
    const daysOpen = weightedRandom([
      { value: randomInt(1, 7), weight: 20 },
      { value: randomInt(7, 14), weight: 25 },
      { value: randomInt(14, 30), weight: 30 },
      { value: randomInt(30, 60), weight: 15 },
      { value: randomInt(60, 120), weight: 10 },
    ]);

    const dateObserved = new Date(Date.now() - daysOpen * 24 * 60 * 60 * 1000);
    const dueDate = new Date(dateObserved.getTime() + randomInt(14, 45) * 24 * 60 * 60 * 1000);
    const pastDue = dueDate < new Date();

    const hasOwner = Math.random() > 0.2;
    const owner = hasOwner ? randomElement(USERS) : null;

    const hasCrq = disposition === "Fix" || disposition === "Mitigate" ? Math.random() > 0.3 : Math.random() > 0.7;

    const identifiedBlockers: Blocker[] = [];
    if (disposition === "Defer" || disposition === "Accept Risk") {
      const blockerCount = randomInt(1, 3);
      const allBlockers: Blocker[] = [
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
      for (let b = 0; b < blockerCount; b++) {
        const blocker = randomElement(allBlockers);
        if (!identifiedBlockers.includes(blocker)) {
          identifiedBlockers.push(blocker);
        }
      }
    }

    const vulnerability: Vulnerability = {
      id: crypto.randomUUID(),
      gisId: generateGisId(),
      qualysId: generateQualysId(),
      cve: generateCVE(),
      title: randomElement(VULN_TITLES),
      status,
      statusDetails: status === "In Progress" ? "Remediation in progress" : undefined,
      severity,
      severityRisk: severity,
      verificationStatus,
      source,
      disposition,
      ctiRemediation: disposition ? Math.random() > 0.3 : null,
      identifiedBlockers,
      requestedPatchWindow: disposition === "Fix" || disposition === "Mitigate" 
        ? randomElement(["Sat 5/9 00:00–08:00 ET", "Sat 5/9 08:00–16:00 ET", "Sun 5/10 00:00–08:00 ET", "Sat 5/16 00:00–08:00 ET"])
        : undefined,
      expectedRemediationDate: disposition === "Fix" || disposition === "Mitigate" || disposition === "Defer" ? randomDate(0, 30) : undefined,
      crqNumber: hasCrq ? generateCrqNumber() : undefined,
      remediationComplete: status === "Pending Clear Scan" || status === "Resolved" ? true : null,
      healthCheckTime: status === "Resolved" ? randomDate(7, 0) : undefined,
      healthCheckComplete: status === "Resolved" ? true : null,
      hostName,
      fqdn: `${hostName.replace(".bank.internal", "")}.payments.bank.internal`,
      osName: randomElement(["Red Hat Enterprise Linux 8.6", "Windows Server 2019", "Ubuntu 20.04 LTS", "CentOS 7.9"]),
      osVersion: randomElement(["8.6", "2019", "20.04", "7.9"]),
      ipAddresses: [generateIP(), Math.random() > 0.5 ? generateIP() : ""].filter(Boolean),
      operatingEnvironment,
      hostingPlatform: randomElement(["AWS", "Azure", "On-Premise", "GCP", "Private Cloud"]),
      isPublicInternetAccessible: Math.random() > 0.7,
      isDmz: Math.random() > 0.8,
      isOnSite: Math.random() > 0.4,
      tier: randomElement(["Tier 1 Critical", "Tier 2 Important", "Tier 3 Standard"]),
      securityZone: randomElement(["Internal", "DMZ", "External", "Restricted"]),
      applicationFullName: app,
      cioDisplayName: "Payments Technology",
      techExecutive: randomElement(["John Smith", "Jane Doe", "Robert Johnson", "Patricia Williams"]),
      techExecutiveContact: `${randomElement(["john.smith", "jane.doe", "robert.johnson"])}@bank.internal`,
      vulnOwner: owner?.name,
      vulnOwnerEmail: owner?.email,
      runbookOwner: randomElement(["Platform Engineering", "Security Operations", "Infrastructure", "DevOps"]),
      financialHierarchy: `Technology > ${app.split(" ")[0]} > Core Processing`,
      remediationCoordinator: Math.random() > 0.5 ? randomElement(USERS).name : undefined,
      description: randomElement(DESCRIPTIONS),
      technicalDescription: "This vulnerability affects the core authentication mechanism and requires immediate attention.",
      technicalDetail: "CVE details indicate that the vulnerability can be exploited remotely without authentication.",
      vulnerabilityFindings: "Confirmed via automated scan and manual verification.",
      vulnerabilitySubcategory: randomElement(["Injection", "Authentication", "Configuration", "Cryptography"]),
      technology: tech.name,
      technologyVersion: tech.version,
      dateObserved,
      dateLastSeen: randomDate(3, 0),
      hostLastSeen: randomDate(1, 0),
      daysOpen,
      dueDate,
      scheduledFixDate: disposition === "Fix" ? randomDate(0, 14) : undefined,
      remediatedDate: status === "Resolved" ? randomDate(5, 0) : undefined,
      nextRmw: randomDate(0, 7),
      lastUpdated: randomDate(3, 0),
      pastDue,
      patchCategory: randomElement(["Security Update", "Hotfix", "Service Pack", "Cumulative Update"]),
      patchTitle: `${tech.name} Security Update ${new Date().getFullYear()}-${randomInt(1, 12).toString().padStart(2, "0")}`,
      vendorRiskLevel: randomElement(["Critical", "High", "Medium", "Low"]),
      gisExternalFlag: Math.random() > 0.8,
      erpScorecardStatus: Math.random() > 0.7 ? randomElement(["Active", "Pending", "Expired"]) : undefined,
      erpCount: Math.random() > 0.7 ? randomInt(0, 5) : undefined,
      esmType: randomElement(["Tier 1 Critical", "Tier 2 Important", "Tier 3 Standard"]),
      isBuiltInHouse: Math.random() > 0.6,
      workstream: randomElement(["Vulnerability Management", "Patch Management", "Risk Remediation"]),
      activityLog: generateActivityLog(status, disposition),
      lastSavedAt: Math.random() > 0.5 ? randomDate(7, 0) : undefined,
      lastSavedBy: Math.random() > 0.5 ? randomElement(USERS).name : undefined,
    };

    vulnerabilities.push(vulnerability);
  }

  return vulnerabilities;
}

export function generateSparklineData(baseValue: number, days: number = 14): SparklineDataPoint[] {
  const data: SparklineDataPoint[] = [];
  const now = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const variation = Math.floor(baseValue * 0.3 * (Math.random() - 0.5));
    data.push({
      date: date.toISOString().split("T")[0],
      value: Math.max(0, baseValue + variation),
    });
  }
  
  return data;
}

export function generateSeverityStatusData(vulnerabilities: Vulnerability[]): SeverityStatusData[] {
  const severities: Severity[] = ["Critical", "High", "Medium", "Low"];
  
  return severities.map((severity) => {
    const filtered = vulnerabilities.filter((v) => v.severity === severity);
    return {
      severity,
      awaitingDisposition: filtered.filter((v) => v.status === "Awaiting Disposition").length,
      inProgress: filtered.filter((v) => v.status === "In Progress").length,
      pendingClearScan: filtered.filter((v) => v.status === "Pending Clear Scan").length,
      resolved: filtered.filter((v) => v.status === "Resolved").length,
    };
  });
}

export const mockVulnerabilities = generateVulnerabilities(50);
