// In-memory mock dataset for the VulnerabilityCm API routes.
//
// Shapes match the wire contract exactly (see `lib/api/responses.ts`).
// State is process-scoped — restarting the Next dev server resets edits made
// via BulkUpdateVCMExtra.

import type {
  ApiVulnerabilityRow,
  VulnerabilityFilterOptionsResponse,
} from "@/lib/api/responses";

// ── Filter options (verbatim from a production sample) ──────────────────────
export const FILTER_OPTIONS: VulnerabilityFilterOptionsResponse = {
  applicationIds: {
    "0": "",
    "5": "BankofAmerica Firewall",
    "14": "AMRS - Backup Infrastructure",
    "46": "Global Cash Position",
  },
  cioDisplayNames: [
    "",
    "Andrew McKibben",
    "Clare Giffin-Pascoe",
    "Craig Froelich",
    "David Marx",
    "Duncan McInnes",
    "Ganesh Krishnan",
    "Kristopher Fador",
    "Louis Hawkins",
    "Madhuri Deshpande",
    "Michelle Boston",
    "Nageshwar Ravikanti",
    "Pamela Ellis",
    "Richard Knafelz",
    "Sandy Thomson",
    "Thomas Ellis",
  ],
  workstreamObservationTypes: [
    "AccessManagementControls",
    "ADSF",
    "ATMVulnerabilities",
    "AuthenticationRiskAssessment",
    "CloudConfigCompliance",
    "CloudVulnerabilities",
    "ContainerVulnerabilities",
    "DMZ",
    "ESM",
    "FFIEC",
    "IAIA",
    "MiddlewarePatch",
    "NetworkConfiguration",
    "NetworkDeviceConfiguration",
    "NetworkDevices",
    "NonQualysCVE",
    "PKI",
    "PolicyAssessment",
    "Qualys-NonPatch",
    "QualysPrinters",
    "TPIS",
    "Vulnerability",
    "WorkstationCompliance",
    "WorkstationPatch",
  ],
  severityRisks: ["Priority 1", "Priority 2", "Priority 3"],
  scorecardSources: [
    "",
    "ADSF",
    "Aqua Container Vulns",
    "ATM Vulnerabilities",
    "AuthenticationRiskAssessment",
    "Bladelogic patch",
    "Cloud Config Compliance",
    "Cloud Vulnerabilities",
    "Container Compliance",
    "CTI Manual Ingestion",
    "ESM - DB",
    "ESM - MW",
    "ESM - OS",
    "FFIEC",
    "IAIA",
    "IAM Compliance",
    "Network Configuration",
    "Non Qualys CVE",
    "PKI Certs",
    "PolicyAssessment",
    "Qualys - DMZ",
    "Qualys - Internal Non Patch",
    "Qualys - Network Devices",
    "Qualys - Server Patch",
    "Qualys Printers",
    "Skybox findings",
    "Tech Manual Ingestion Vulns",
    "TEM workstations",
  ],
  deviceTypes: [
    "",
    "Accessory",
    "Alarm Panel",
    "Appliance",
    "Backup Reporting",
    "Cluster",
    "Compute Node",
    "Container",
    "Database Appliance",
    "Desktop",
    "Firewall",
    "Gateway",
    "Hardware Security Module",
    "Internal Switch",
    "Intrusion Detection",
    "Laptop",
    "Load Balancer",
    "Mainframe",
    "WORKSTATION-WINDOWS",
  ],
  operatingEnvironments: [
    "",
    "CIT",
    "Contingency",
    "DEV",
    "Development",
    "In Development",
    "In Production",
    "Lab",
    "Non Production Applications with Inbound Access",
    "Pre-Prod",
    "PROD",
    "Production",
    "QA",
    "QA/Test",
    "SIT",
    "UAT",
  ],
};

// ── Vulnerability rows (generated deterministically) ────────────────────────
const CIOS = [
  "Sandy Thomson",
  "Andrew McKibben",
  "Pamela Ellis",
  "Ganesh Krishnan",
  "Louis Hawkins",
  "Michelle Boston",
  "Richard Knafelz",
  "Thomas Ellis",
];
const SEVERITIES = ["Priority 1", "Priority 2", "Priority 3"];
const WORKSTREAMS = [
  "WorkstationPatch",
  "MiddlewarePatch",
  "NonQualysCVE",
  "CloudConfigCompliance",
  "ESM",
  "ADSF",
  "Vulnerability",
];
const SOURCES = [
  "TEM workstations",
  "Bladelogic patch",
  "Cloud Config Compliance",
  "ESM - OS",
  "ESM - MW",
  "ADSF",
  "Non Qualys CVE",
];
const DEVICE_TYPES = [
  "WORKSTATION-WINDOWS",
  "Compute Node",
  "Desktop",
  "Laptop",
  "Firewall",
  "Internal Switch",
  "Database Appliance",
];
const OS_NAMES = ["WINDOWS 11", "WINDOWS 10", "RHEL 8", "RHEL 9", "AIX 7.2"];
const OP_ENVS = ["", "Production", "Pre-Prod", "DEV", "Contingency", "QA"];
const TITLES = [
  "MS-Curl_8.14.1",
  "OpenSSL CVE-2024-2511",
  "Apache Log4j 2.17.2",
  "Microsoft Edge Chromium Update",
  "WebLogic Server CVE-2024-21181",
  "Windows Kernel Privilege Escalation",
  "Adobe Acrobat Reader DC Patch",
  "VMware Tools 12.5.0",
  "Java JDK 11 Update",
  "Cisco IOS XE Authentication Bypass",
];

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

function generateRows(count: number): ApiVulnerabilityRow[] {
  const rows: ApiVulnerabilityRow[] = [];
  for (let i = 0; i < count; i++) {
    const gisid = String(1000008314 + i);
    const isoNow = "2026-05-18T13:45:56.58";
    rows.push({
      id: i + 1,
      reportDate: "2026-05-18",
      gisid,
      status: i % 7 === 0 ? "Closed" : "Open",
      ciodisplayName: pick(CIOS, i),
      workstreamObservationType: pick(WORKSTREAMS, i),
      scorecardSource: pick(SOURCES, i),
      dueDate: `2025-${String((i % 11) + 1).padStart(2, "0")}-${String((i % 27) + 1).padStart(2, "0")}T00:00:00`,
      esmtype: "",
      applicationManagerContactName: "",
      applicationId: [0, 5, 14, 46][i % 4],
      applicationFullName: ["", "BankofAmerica Firewall", "AMRS - Backup Infrastructure", "Global Cash Position"][i % 4],
      financialHierarchy: `FBBB.${(i % 100).toString().padStart(3, "0")}.AI`,
      severityRisk: pick(SEVERITIES, i),
      gisexternalFlag: i % 5 === 0 ? "Y" : "N",
      erpscorecardStatus: i % 4 === 0 ? "Exception" : "",
      erpexceptionRequestStatus: i % 4 === 0 ? "Approved" : "",
      acceptableUseStatus: "",
      dateObserved: `2025-08-${String((i % 27) + 1).padStart(2, "0")}T00:00:00`,
      hostLastSeen: i % 6 === 0 ? "1900-01-01T00:00:00" : `2026-05-${String((i % 17) + 1).padStart(2, "0")}T00:00:00`,
      dateLastSeen: `2024-10-${String((i % 27) + 1).padStart(2, "0")}T00:00:00`,
      qualysId: i % 3 === 0 ? null : 90000 + i,
      cve: i % 2 === 0 ? `CVE-2024-${String(20000 + i).padStart(5, "0")}` : "",
      patchCategory: "",
      title: pick(TITLES, i),
      technicalDetail: "",
      technicalDescription: "",
      hostNameServer: `vh${String(1234 + i).padStart(4, "0")}wwc${(i % 9) + 1}`,
      ipaddress: `30.93.${(i % 256)}.${((i * 7) % 256)}`,
      deviceType: pick(DEVICE_TYPES, i),
      osname: pick(OS_NAMES, i),
      operatingEnvironment: pick(OP_ENVS, i),
      // Triage fields — partially populated to exercise the disposition flow
      crq: i % 11 === 0 ? `CRQ000000${i}` : null,
      disposition:
        i % 13 === 0
          ? "CIO ACTION – Need Requested Patch Window"
          : i % 17 === 0
            ? "CIO REVIEW – PCC will patch under established RMW"
            : null,
      expectedRemediationDate:
        i % 13 === 0 ? `2026-07-${String((i % 27) + 1).padStart(2, "0")}T00:00:00` : null,
      identifiedBlockers:
        i % 19 === 0 ? "Hardware dependencies; Third-party dependencies" : null,
      rcmanagingTeam: null,
      requestedPatchWindow: i % 13 === 0 ? "2026-06-15" : null,
      createdUserId: null,
      createdDateTime: isoNow,
      updatedUserId: null,
      updatedDateTime: i % 13 === 0 ? isoNow : null,
    });
  }
  return rows;
}

// Mutable — BulkUpdateVCMExtra patches mutate entries here so the next
// GetVulnerabilityCM call reflects the changes.
export const VULNERABILITY_ROWS: ApiVulnerabilityRow[] = generateRows(500);
