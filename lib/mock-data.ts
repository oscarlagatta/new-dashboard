import type {
  Vulnerability,
  TriageStatus,
  SeverityRisk,
  SourceStatus,
  Workstream,
  Source,
  Lever,
  OperatingEnvironment,
  Disposition,
  Blocker,
  ActivityLogEntry,
  CioTeam,
  User,
  SparklineDataPoint,
} from "./types";

export const CIO_TEAMS: CioTeam[] = [
  { id: "1", name: "James Hartley" },
  { id: "2", name: "Patricia Owens" },
  { id: "3", name: "Raj Mehta" },
  { id: "4", name: "Sandra Corrigan" },
  { id: "5", name: "Marcus Webb" },
  { id: "6", name: "Claire Fontaine" },
  { id: "7", name: "Derek Okonkwo" },
];

export const USERS: User[] = [
  { id: "1", name: "Scott Zhang", email: "scott.zhang@bank.internal", initials: "SZ" },
  { id: "2", name: "Priyanka Gupta", email: "priyanka.gupta@bank.internal", initials: "PG" },
  { id: "3", name: "Sandip K Dube", email: "sandip.dube@bank.internal", initials: "SD" },
  { id: "4", name: "Sushma Deepika Rupakula", email: "sushma.rupakula@bank.internal", initials: "SR" },
  { id: "5", name: "Rekha Patel", email: "rekha.patel@bank.internal", initials: "RP" },
  { id: "6", name: "Maiko Arai", email: "maiko.arai@bank.internal", initials: "MA" },
  { id: "7", name: "Mark Farr", email: "mark.farr@bank.internal", initials: "MF" },
  { id: "8", name: "Manas Chanda", email: "manas.chanda@bank.internal", initials: "MC" },
  { id: "9", name: "Chris Boswell", email: "chris.boswell@bank.internal", initials: "CB" },
  { id: "10", name: "Saurabh Sharma", email: "saurabh.sharma@bank.internal", initials: "SS" },
  { id: "11", name: "Barbara Billups", email: "barbara.billups@bank.internal", initials: "BB" },
  { id: "12", name: "Rachael B Kotch", email: "rachael.kotch@bank.internal", initials: "RK" },
  { id: "13", name: "Kenneth K Lee", email: "kenneth.lee@bank.internal", initials: "KL" },
];

export function generateSparklineData(base: number, seed: number): SparklineDataPoint[] {
  const data: SparklineDataPoint[] = [];
  for (let i = 13; i >= 0; i--) {
    const offset = Math.round(base * 0.15 * Math.sin((i + seed) * 0.7));
    data.push({ day: 13 - i, value: Math.max(0, base + offset) });
  }
  return data;
}

const TITLES = [
  "Apache Tika XFA File Handling XML External (XXE) Injection Issue",
  "TianoCore EDK II MdePkg/Library/Bi BIOS Dell Technologies PowerEdge R740xd",
  "SHA-1 Algorithm in Use (TLS 1.2 or higher)",
  "Insecure TLS v1.1 Protocol Version Supported",
  "Session Timeout is Too Long",
  "CloudWatch Log Group is not encrypted using KMS",
  "Lack of Protection Against Clickjacking",
  "Improper Cookie Configuration: Cookie Not Sent Over HTTPS",
  "Improper Cookie Configuration: Sensitive Cookies Not Marked Secure",
  "WalletJet Multiple Products Unspecified BIOS Dell Technologies",
  "OpenSSL crypto/pem/pem_lib.c PEM BIOS Dell Technologies PowerEdge",
  "Cross-Frame Scripting / Clickjacking",
  "Unauthenticated QVM TCP/UDP Failure with Traceroute",
  "Authorization/Session Management Excessive Session Timeout",
  "SSL/TLS Certificate Signed Using Weak Hashing Algorithm",
  "Apache HTTP Server mod_rewrite Buffer Overflow",
  "Java Deserialization Remote Code Execution",
  "Nginx HTTP Server Request Smuggling",
  "MySQL Privilege Escalation via UDF",
  "Red Hat Enterprise Linux Kernel Local Privilege Escalation",
  "Tomcat Default Credentials Exposure",
  "Windows Server SMBv1 Protocol Enabled",
  "OpenSSL DTLS Buffered Message Processing Use-After-Free",
  "Log4Shell Remote Code Execution (CVE-2021-44228 variant)",
  "Spring4Shell Remote Code Execution via ClassLoader",
  "Jenkins Arbitrary File Read",
  "Kubernetes API Server Unauthenticated Access",
  "AWS S3 Bucket Publicly Accessible",
  "Azure Blob Storage Public Access Enabled",
  "Docker Daemon Exposed on TCP Without TLS",
];

const CVE_IDS = [
  "CVE-2024-38213", "CVE-2024-42156", "CVE-2024-29019", "CVE-2024-21413",
  "CVE-2025-01234", "CVE-2025-11034", "CVE-2024-53761", "CVE-2024-22252",
  "CVE-2025-20008", "CVE-2024-45678", "CVE-2024-11111", "CVE-2025-31337",
  "CVE-2024-66666", "CVE-2025-77777", "CVE-2024-88888", "CVE-2025-99999",
  "CVE-2024-12345", "CVE-2025-23456", "CVE-2024-34567", "CVE-2025-45678",
  "CVE-2024-56789", "CVE-2025-67890", "CVE-2024-78901",
];

const HOST_NAMES = [
  "RED HAT ENtcto-hosting service:AH-928374-001.SDL.CORP.BANKOFAMEFN",
  "MICROSOFT cto-hosting service:WPABX9F2K1.SDL.CORP.BANKOFAN",
  "prd-app-mwpatch-001.bank.internal",
  "prd-app-adsf-002.bank.internal",
  "pre-app-cloud-003.bank.internal",
  "uswxapgrnsc01.sdl.corp",
  "RED HAT ENtcto-hosting service:AH-112233-002.SDL.CORP.BANKOFAMEFN",
  "MICROSOFT cto-hosting service:WPAZQ3M7R8.SDL.CORP.BANKOFAN",
  "prd-app-trading-004.bank.internal",
  "prd-app-risk-005.bank.internal",
  "pre-app-adsf-006.bank.internal",
  "ctg-app-mwpatch-007.bank.internal",
  "uswxapgrnsc02.sdl.corp",
  "RED HAT ENtcto-hosting service:AH-445566-003.SDL.CORP.BANKOFAMEFN",
  "prd-app-fx-008.bank.internal",
  "prd-app-clearing-009.bank.internal",
  "pre-app-cloud-010.bank.internal",
  "RED HAT ENtcto-hosting service:AH-778899-004.SDL.CORP.BANKOFAMEFN",
  "MICROSOFT cto-hosting service:WPAHL4T9X2.SDL.CORP.BANKOFAN",
  "prd-app-entity-011.bank.internal",
];

const IP_POOL = [
  "10.1.100.45", "10.2.50.101", "172.16.10.22", "10.3.200.15",
  "192.168.1.50", "10.4.30.88", "172.16.20.33", "10.5.110.77",
  "10.6.60.44", "172.16.30.55", "192.168.2.100", "10.7.170.66",
  "10.8.80.99", "172.16.40.11", "10.9.90.12",
];

const APP_NAMES = [
  "MARKIT Loan Settlement",
  "AML Defect Reporting Tool",
  "Client Finder",
  "US Enterprise Transaction",
  "FX Trading Platform",
  "Entity Scanning Solution",
  "Credit eTrading Platform",
  "FRO and OTC Clearing",
  "Research Library and Analytics",
  "Greensheet Financial",
  "Global Markets Data",
  "Enterprise Administration",
  "Mercury Portal",
  "Global Business Markets",
];

const TECHNOLOGIES: [string, string][] = [
  ["Apache Tika", "1.x"],
  ["TianoCore EDK II", "2.13.3"],
  ["OpenSSL", "1.1.1k"],
  ["Windows Server", "2019"],
  ["Red Hat Enterprise Linux", "8.4"],
  ["Java", "11.0.12"],
  ["Tomcat", "9.0.45"],
  ["Nginx", "1.18.0"],
  ["MySQL", "8.0.27"],
  ["Apache HTTP Server", "2.4.41"],
];

const CRQ_NUMBERS = [
  "CRQ000002063551", "CRQ000002063441", "CRQ000002063444",
  "CRQ000002063439", "CRQ000002063373", "CRQ000002063532",
  "CRQ000002063615", "CRQ000002063809", "CRQ000002064059",
];

const VULN_OWNERS = [
  "Scott Zhang", "Priyanka Gupta", "Sandip K Dube",
  "Sushma Deepika Rupakula", "Rekha Patel", "Maiko Arai",
  "Mark Farr", "Manas Chanda", "Chris Boswell",
  "Saurabh Sharma", "Barbara Billups", "Rachael B Kotch",
  "Kenneth K Lee",
];

const CIO_NAMES = [
  "James Hartley", "Patricia Owens", "Raj Mehta",
  "Sandra Corrigan", "Marcus Webb", "Claire Fontaine", "Derek Okonkwo",
];

// Distribution of remediation levers across the 50 mock rows. Indexed by i % 4
// to give a roughly even spread (~13/13/12/12 = ~25% each) so each filtered
// subset is visibly different but no single lever dominates.
const LEVER_DISTRIBUTION: Lever[] = [
  "CTI/APS&E/EET-Managed Remediation",
  "Assessment Underway",
  "CIO E2E",
  "CIO/CTI Engagement",
];

const CTO_NAMES = [
  "Joseph Schafer", "Tal Sadan", "Neil Ewers", "Juan Gaviria", "Pamela Ellis",
];

const CONSEQUENCE_MODELS = [
  "ERP P2 Consequence Model",
  "ERP P3 Consequence Model",
  "ERP External P3 Consequence Model",
  "ERP External P2 Consequence Model",
  "ERP Internal P3 Escalation Model",
  "ERP Third Party Escalation Model",
];

const SCORECARD_DETAILS = [
  "Exception",
  "Pre-Consequence Timeframe",
  "Approaching First Consequence",
  "Reopened on 2026-05-06",
];

const VULN_SUBCATEGORIES = [
  "Server and Container Vulnerabilities",
  "Application Vulnerabilities",
  "Server and Container Compliance",
  "Infra Manual Ingestion Vulnerabilities",
];

const HOSTING_PLATFORMS = [
  "BofA Cloud Standard",
  "BofA Cloud Static",
  "Nextgen BMP",
];

const WORKSTREAMS: Workstream[] = ["MiddlewarePatch", "NonQualysCVE", "ADSF", "CloudConfigCompliance"];
const SOURCES: Source[] = ["ADSF", "MiddlewarePatch", "ESM", "BDNA", "Bladelogic patch", "CTI Manual Ingestion", "Cloud Config Compliance", "Nextgen BMP"];
const OPERATING_ENVS: OperatingEnvironment[] = ["In Production", "Pre-Prod", "Contingency"];

// Days open distribution: ~30% <30, ~40% 30-90, ~20% 90-365, ~10% >365
const DAYS_OPEN_POOL = [
  5, 8, 12, 15, 18, 21, 25, 28, 14, 7,           // 10 under 30
  3, 6, 10, 16, 22,                               // 5 more under 30
  32, 38, 45, 52, 58, 63, 70, 75, 81, 88,         // 10 x 30-90
  35, 42, 55, 65, 72, 80, 44, 50, 60, 68,         // 10 more 30-90
  95, 110, 125, 145, 160, 180, 210, 250, 300, 340, // 10 x 90-365
  400, 520, 680, 850, 1100,                        // 5 x >365 (maps to rows 45-49)
];

function makeActivityLog(i: number, triageStatus: TriageStatus, disposition: Disposition): ActivityLogEntry[] {
  const entries: ActivityLogEntry[] = [
    {
      id: `act-${i}-1`,
      userId: "system",
      userName: "System",
      userInitials: "SY",
      action: "Finding detected and imported from scan",
      timestamp: "2026-05-06T08:00:00.000Z",
    },
  ];

  if (triageStatus !== "Awaiting Disposition") {
    entries.push({
      id: `act-${i}-2`,
      userId: "u1",
      userName: VULN_OWNERS[i % VULN_OWNERS.length] ?? "Scott Zhang",
      userInitials: "SZ",
      action: "moved Triage Status from Awaiting Disposition to In Progress",
      field: "triageStatus",
      oldValue: "Awaiting Disposition",
      newValue: "In Progress",
      timestamp: "2026-05-06T11:30:00.000Z",
    });
  }

  if (disposition) {
    entries.push({
      id: `act-${i}-3`,
      userId: "u2",
      userName: VULN_OWNERS[(i + 2) % VULN_OWNERS.length] ?? "Priyanka Gupta",
      userInitials: "PG",
      action: `set Disposition to '${disposition}'`,
      field: "disposition",
      newValue: disposition,
      timestamp: "2026-05-06T14:15:00.000Z",
    });
  }

  if (triageStatus === "Pending Clear Scan" || triageStatus === "Resolved") {
    entries.push({
      id: `act-${i}-4`,
      userId: "u3",
      userName: VULN_OWNERS[(i + 4) % VULN_OWNERS.length] ?? "Sandip K Dube",
      userInitials: "SD",
      action: "added CRQ" + CRQ_NUMBERS[i % CRQ_NUMBERS.length]?.slice(3),
      field: "crqNumber",
      newValue: CRQ_NUMBERS[i % CRQ_NUMBERS.length],
      timestamp: "2026-05-07T09:00:00.000Z",
    });
  }

  if (triageStatus === "Resolved") {
    entries.push({
      id: `act-${i}-5`,
      userId: "u4",
      userName: VULN_OWNERS[(i + 6) % VULN_OWNERS.length] ?? "Mark Farr",
      userInitials: "MF",
      action: "marked Health Check Complete",
      field: "healthCheckComplete",
      newValue: "Yes",
      timestamp: "2026-05-07T16:45:00.000Z",
    });
  }

  return entries;
}

export function createMockData(): Vulnerability[] {
  // Triage status distribution: 12/18/12/8 = 50
  const triageStatuses: TriageStatus[] = [
    ...Array(12).fill("Awaiting Disposition"),
    ...Array(18).fill("In Progress"),
    ...Array(12).fill("Pending Clear Scan"),
    ...Array(8).fill("Resolved"),
  ] as TriageStatus[];

  // Severity distribution: 2/12/28/8 = 50
  const severities: SeverityRisk[] = [
    ...Array(2).fill("Priority 1"),
    ...Array(12).fill("Priority 2"),
    ...Array(28).fill("Priority 3"),
    ...Array(8).fill("Priority 4"),
  ] as SeverityRisk[];

  return Array.from({ length: 50 }, (_, i) => {
    const triageStatus = triageStatuses[i] as TriageStatus;
    const severityRisk = severities[i] as SeverityRisk;
    const daysOpen = DAYS_OPEN_POOL[i] ?? 30;
    const pastDue: "Y" | "N" = daysOpen > 90 ? "Y" : "N";
    const sourceStatus: SourceStatus = triageStatus === "Resolved" ? "Closed" : "Open";
    const workstream = WORKSTREAMS[i % WORKSTREAMS.length] as Workstream;
    const source = SOURCES[i % SOURCES.length] as Source;
    const opEnv = OPERATING_ENVS[i % 3] as OperatingEnvironment;
    const cve = workstream === "NonQualysCVE" ? "" : (CVE_IDS[i % CVE_IDS.length] ?? "");
    const [tech, techVersion] = TECHNOLOGIES[i % TECHNOLOGIES.length] ?? ["", ""];
    const hostName = HOST_NAMES[i % HOST_NAMES.length] ?? "";
    const ipAddr = IP_POOL[i % IP_POOL.length] ?? "";
    const appName = APP_NAMES[i % APP_NAMES.length] ?? "";
    const cioName = CIO_NAMES[i % CIO_NAMES.length] ?? "";
    const ctoName = CTO_NAMES[i % CTO_NAMES.length] ?? "";
    const title = TITLES[i % TITLES.length] ?? "";
    const ownerIdx = i % 5 === 0 ? -1 : i % VULN_OWNERS.length; // ~20% unassigned
    const vulnOwner = ownerIdx === -1 ? "" : (VULN_OWNERS[ownerIdx] ?? "");
    const hasCrq = i % 5 < 2; // ~40%
    const crqNumber = hasCrq ? (CRQ_NUMBERS[i % CRQ_NUMBERS.length] ?? "") : "";
    const hasErpException = i % 3 === 0;

    const disposition: Disposition =
      triageStatus === "Awaiting Disposition"
        ? ""
        : triageStatus === "Resolved"
        ? "Fix"
        : (["Fix", "Defer", "Mitigate", "Accept Risk"][i % 4] as Disposition);

    // Blockers are populated when the disposition is non-Fix and the work is stuck.
    // Distribution is deterministic on `i` and weighted toward the most common
    // real-world blockers (vendor delay, no patch) so the rollup is realistic.
    const BLOCKER_DISTRIBUTION: Blocker[][] = [
      ["No patch available"],
      ["Vendor / internal package availability"],
      ["No patch available", "Testing and partner / peer team dependencies"],
      ["Vendor / internal package availability"],
      ["Application re-design / re-architecture required"],
      ["Third-party dependencies"],
      ["No patch available"],
      ["Hardware dependencies"],
      ["Vendor / internal package availability", "Limited central (bulk) remediation capabilities"],
      ["Hosting Capacity"],
      ["No patch available"],
      ["False positives in Vulnerability and FOSS data"],
      ["Vendor / internal package availability"],
      ["Data and reporting limitations"],
      ["Testing and partner / peer team dependencies"],
    ];
    const blockers: Blocker[] =
      disposition === "Defer" ||
      disposition === "Accept Risk" ||
      disposition === "Mitigate"
        ? BLOCKER_DISTRIBUTION[i % BLOCKER_DISTRIBUTION.length] ?? []
        : [];

    return {
      id: `vuln-${String(i + 1).padStart(3, "0")}`,
      qualysId: 10000 + i + 1,
      cve,
      title,
      severityRisk,
      status: sourceStatus,
      workstream,
      source,
      lever: LEVER_DISTRIBUTION[i % LEVER_DISTRIBUTION.length]!,
      operatingEnvironment: opEnv,
      hostName,
      fqdn: hostName.toLowerCase().replace(/ /g, "-").split(":")[1] ?? hostName.toLowerCase(),
      ipAddresses: `${ipAddr}, ${IP_POOL[(i + 7) % IP_POOL.length] ?? ipAddr}`,
      osName: i % 2 === 0 ? "Red Hat Enterprise Linux 8.4" : "Windows Server 2019",
      deviceType: i % 3 === 0 ? "Server" : i % 3 === 1 ? "Virtual Machine" : "Container",
      hostingPlatform: HOSTING_PLATFORMS[i % HOSTING_PLATFORMS.length] ?? "",
      technology: tech ?? "",
      technologyVersion: techVersion ?? "",
      applicationFullName: appName,
      applicationId: `APP-${String(1000 + i).padStart(5, "0")}`,
      applicationManagerContactName: VULN_OWNERS[(i + 1) % VULN_OWNERS.length] ?? "",
      applicationManagerContactNetwork: `${(VULN_OWNERS[(i + 1) % VULN_OWNERS.length] ?? "").toLowerCase().replace(/ /g, ".")}@bank.internal`,
      applicationSupportContactName: VULN_OWNERS[(i + 2) % VULN_OWNERS.length] ?? "",
      applicationSupportContactNetwork: `${(VULN_OWNERS[(i + 2) % VULN_OWNERS.length] ?? "").toLowerCase().replace(/ /g, ".")}@bank.internal`,
      technicalExecutiveContactName: VULN_OWNERS[(i + 3) % VULN_OWNERS.length] ?? "",
      technicalExecutiveContactNetwork: `${(VULN_OWNERS[(i + 3) % VULN_OWNERS.length] ?? "").toLowerCase().replace(/ /g, ".")}@bank.internal`,
      cioDisplayName: cioName,
      operationalCto: ctoName,
      runbookOwner: VULN_OWNERS[(i + 4) % VULN_OWNERS.length] ?? "",
      financialHierarchy: `Technology > ${cioName?.split(" ")[1] ?? "Group"} > ${appName}`,
      patchCategory: "Security Update",
      description: `A vulnerability exists in ${tech} ${techVersion} that requires immediate attention. This affects ${appName} running on ${opEnv} infrastructure. The vulnerability was detected by ${source} and classified as ${severityRisk}.`,
      technicalDescription: `This ${severityRisk} finding was identified through ${source}. The affected component is ${tech} version ${techVersion} running on ${hostName}. Exploitation of this vulnerability could lead to unauthorized access or service disruption.`,
      technicalDetail: `Vulnerability details: ${title}. Operating environment: ${opEnv}. Days open: ${daysOpen}. Workstream: ${workstream}.`,
      vulnerabilityFindings: `Confirmed via ${source} automated scan on 2026-05-06. Asset: ${hostName}. IP: ${ipAddr}.`,
      vulnerabilitySubcategory: VULN_SUBCATEGORIES[i % VULN_SUBCATEGORIES.length] ?? "",
      consequenceModel: CONSEQUENCE_MODELS[i % CONSEQUENCE_MODELS.length] ?? "",
      verificationStatus: sourceStatus === "Closed" ? "Verification Passed" : "",
      pastDue,
      daysOpen,
      // Awaiting Disposition rows haven't been triaged yet → no SLA Due Date
      // assigned. Drives the "No Remediation Date" dashboard card.
      dueDate:
        triageStatus === "Awaiting Disposition"
          ? ""
          : daysOpen > 90
          ? "2026-04-15"
          : `2026-0${5 + (i % 3)}-${String(10 + (i % 18)).padStart(2, "0")}`,
      scheduledFixDate: hasCrq ? `2026-05-${String(10 + (i % 7)).padStart(2, "0")}` : "",
      resolvedDate: triageStatus === "Resolved" ? "2026-05-07" : "",
      reportDate: "06/05/2026",
      freshnessDate: "08/05/2026 12:18",
      firstConsequenceDate: daysOpen > 90 ? "2026-04-01" : "",
      secondConsequenceDate: daysOpen > 180 ? "2026-04-15" : "",
      thirdConsequenceDate: daysOpen > 270 ? "2026-05-01" : "",
      erpScorecardStatus: i % 3 === 0 ? "Active" : "",
      scorecardErpStatusDetails: SCORECARD_DETAILS[i % SCORECARD_DETAILS.length] ?? "",
      erpExceptionId: hasErpException ? `ERP-EX-${String(2000 + i).padStart(6, "0")}` : "",
      erpExceptionRequestStatus: hasErpException ? (i % 3 === 0 ? "Approved" : "Pending") : "",
      erpExceptionExpirationDate: hasErpException ? "2026-12-31" : "",
      erpExceptionRiskDecision: hasErpException ? "Accepted with compensating controls" : "",
      erpExceptionBisoRequestStatus: hasErpException ? "Approved" : "",
      associatedErpExceptions: hasErpException ? `ERP-EX-${String(1900 + i).padStart(6, "0")}` : "",
      erpScorecardPendingId: i % 7 === 0 ? `ERP-PEND-${String(3000 + i).padStart(6, "0")}` : "",
      erpScorecardPendingStatus: i % 7 === 0 ? "Pending Review" : "",
      erpScorecardPendingExpirationDate: i % 7 === 0 ? "2026-09-30" : "",
      isDmz: i % 7 === 0 ? "Y" : "N",
      isPublicInternetAccessible: i % 5 === 0 ? "Y" : "N",
      isCisa: i % 20 === 0 ? "Y" : "N",
      isOnSite: i % 4 === 0 ? "N" : "Y",
      securityZone: i % 5 === 0 ? "secure" : "",
      gisAssetCategory: VULN_SUBCATEGORIES[i % VULN_SUBCATEGORIES.length] ?? "",
      gisMetricAlignment: "GIS Standard",
      gisExternalFlag: i % 8 === 0 ? "Y" : "N",
      gisThirdPartyScope: i % 8 === 0 ? "Third Party Managed" : "",
      port: i % 4 === 0 ? "443" : i % 4 === 1 ? "8080" : i % 4 === 2 ? "22" : "3306",
      assessmentArea: i % 10 === 0 ? "Ethical Hacking" : "",
      assessmentScope: i % 10 === 0 ? "Not An Initiative" : "",
      scorecardSource: source,
      sigAlgorithm: i % 3 === 0 ? "SHA-1" : "SHA-256",
      issuerName: i % 3 === 0 ? "Bank Internal CA" : "",
      cloudAccountId: opEnv !== "In Production" ? `ACC-${String(9000 + i).padStart(6, "0")}` : "",
      resourceId: opEnv !== "In Production" ? `res-${String(4000 + i).padStart(8, "0")}` : "",
      resourceType: opEnv !== "In Production" ? "EC2 Instance" : "",
      policyName: workstream === "CloudConfigCompliance" ? "CIS AWS Foundations Benchmark" : "",
      nonBauReason: disposition === "Defer" ? "Awaiting vendor patch" : "",
      domain: `${appName?.split(" ")[0]?.toLowerCase() ?? "app"}.bank.internal`,
      thirdPartyName: i % 8 === 0 ? "Vendor Solutions Inc." : "",
      remediation: `Apply latest ${tech} security patch. Restart affected services. Verify with vulnerability scan.`,
      scorecardErpDays: String(daysOpen),
      evm: i % 4 === 0 ? "N" : "Y",
      tppe: "Standard",
      acceptableUseId: i % 12 === 0 ? `AU-${String(5000 + i).padStart(6, "0")}` : "",
      acceptableUseExpirationDate: i % 12 === 0 ? "2026-11-30" : "",
      acceptableUseStatus: i % 12 === 0 ? "Active" : "",
      decommissionRequestNumber: "",
      decommissionRequestStatus: "",
      esmType: source === "ESM" ? ["ESM - OS", "UNAUTH-DEVICE", "Application"][i % 3] ?? "" : "",
      dateObserved: "2026-03-01",
      dateLastSeen: "2026-05-07",
      hostLastSeen: "2026-05-07",
      classificationDate: "2026-03-02",
      // Triage fields
      triageStatus,
      disposition,
      ctiRemediation: triageStatus === "Awaiting Disposition" ? "" : i % 2 === 0 ? "Yes" : "No",
      requestedPatchWindow: hasCrq ? (["Sat 5/9 00:00–08:00 ET", "Sat 5/9 08:00–16:00 ET", "Sun 5/10 00:00–08:00 ET"][i % 3] ?? "") : "",
      expectedRemediationDate: hasCrq ? `2026-05-${String(10 + (i % 7)).padStart(2, "0")}` : "",
      crqNumber,
      remediationPendingClearScan:
        triageStatus === "Pending Clear Scan" || triageStatus === "Resolved" ? "Yes" : "",
      healthCheckTime:
        triageStatus === "Resolved" ? "2026-05-07T14:00:00" : "",
      healthCheckComplete: triageStatus === "Resolved" ? "Yes" : "",
      identifiedBlockers: blockers,
      falsePositiveReason: disposition === "False Positive" ? "Asset not in scope for this scan." : "",
      deferralJustification: disposition === "Defer" ? "Pending vendor patch availability; remediation scheduled for next quarter." : disposition === "Accept Risk" ? "Risk accepted by BISO — asset decommission planned within 90 days." : "",
      reEvaluateBy: disposition === "Defer" ? `2026-${String(8 + (i % 4)).padStart(2, "0")}-01` : "",
      vulnOwner,
      lastSavedBy: triageStatus === "Awaiting Disposition" ? "" : (VULN_OWNERS[i % VULN_OWNERS.length] ?? ""),
      lastSavedAt: triageStatus === "Awaiting Disposition" ? "" : "2026-05-07T10:30:00.000Z",
      activityLog: makeActivityLog(i, triageStatus, disposition),
    };
  });
}

// Pre-generated for SSR consistency
export const mockVulnerabilities: Vulnerability[] = createMockData();
