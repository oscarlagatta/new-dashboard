/**
 * Executive Dashboard mock data
 * All values are static (no Math.random) to avoid hydration mismatches
 * and keep the senior-management view predictable across reloads.
 */

export const SEVERITY_COLORS = {
  Critical: "#DC2626",
  High: "#EA580C",
  Medium: "#D97706",
  Low: "#65A30D",
} as const;

export const STATUS_COLORS = {
  Awaiting: "#DC2626",
  "In Progress": "#D97706",
  Pending: "#EA580C",
  Resolved: "#16A34A",
} as const;

export type Severity = keyof typeof SEVERITY_COLORS;

export interface KpiTile {
  label: string;
  value: number;
  delta: number; // vs last week
  spark: number[]; // last 8 weeks
  accent: string; // hex
}

export const RISK_POSTURE = {
  score: 68,
  delta: 4, // ▲ from last week
  attestedBy: "Sarah Chen",
  attestedAgo: "12 minutes ago",
};

export const KPI_TILES: KpiTile[] = [
  {
    label: "Awaiting Disposition",
    value: 3,
    delta: -1,
    spark: [6, 5, 7, 5, 4, 4, 4, 3],
    accent: SEVERITY_COLORS.Critical,
  },
  {
    label: "In Progress",
    value: 4,
    delta: 1,
    spark: [2, 3, 3, 4, 3, 3, 3, 4],
    accent: SEVERITY_COLORS.Medium,
  },
  {
    label: "Pending Clear Scan",
    value: 3,
    delta: 0,
    spark: [4, 4, 3, 3, 4, 3, 3, 3],
    accent: SEVERITY_COLORS.High,
  },
  {
    label: "Resolved (30d)",
    value: 2,
    delta: 2,
    spark: [0, 0, 1, 1, 1, 2, 2, 2],
    accent: STATUS_COLORS.Resolved,
  },
];

// SLA strip
export const SLA = {
  withinSlaPct: 94,
  targetPct: 95,
  mttr: [
    { severity: "Critical" as Severity, days: 6, target: 7 },
    { severity: "High" as Severity, days: 12, target: 14 },
    { severity: "Medium" as Severity, days: 24, target: 30 },
    { severity: "Low" as Severity, days: 45, target: 90 },
  ],
  oldestCritical: {
    cve: "CVE-2024-29847",
    title: "Buffer Overflow in Transaction Parsing",
    technology: "Apache Tomcat 9.0.45",
    daysOverdue: 82,
    owner: "David Kim",
    ownerInitials: "DK",
    crq: "CRQ000003456",
  },
};

// Severity x Age heatmap
// Rows: severity, Columns: age buckets
export const AGE_BUCKETS = ["0-7d", "8-14d", "15-30d", "31-60d", "61-90d", "90+d"] as const;
export type AgeBucket = (typeof AGE_BUCKETS)[number];

export const HEATMAP: Record<Severity, Record<AgeBucket, number>> = {
  Critical: { "0-7d": 0, "8-14d": 1, "15-30d": 1, "31-60d": 0, "61-90d": 1, "90+d": 1 },
  High:     { "0-7d": 1, "8-14d": 2, "15-30d": 1, "31-60d": 2, "61-90d": 0, "90+d": 0 },
  Medium:   { "0-7d": 2, "8-14d": 3, "15-30d": 4, "31-60d": 2, "61-90d": 1, "90+d": 0 },
  Low:      { "0-7d": 1, "8-14d": 2, "15-30d": 2, "31-60d": 1, "61-90d": 1, "90+d": 0 },
};

// 60-day burndown — daily counts
function buildBurndown() {
  const days: { date: string; open: number; resolved: number }[] = [];
  const start = new Date(2026, 2, 9); // 5/8 - 60 days = ~3/9
  // Hand-curated curve so the data tells a "we're improving" story
  const opens = [
    18, 18, 19, 19, 20, 20, 19, 18, 18, 17, 17, 18, 18, 17, 16,
    16, 16, 15, 15, 14, 14, 15, 15, 14, 14, 13, 13, 13, 12, 12,
    13, 13, 12, 12, 12, 11, 11, 11, 12, 11, 11, 10, 10, 10, 10,
    11, 11, 10, 10, 9, 9, 9, 10, 10, 9, 9, 8, 8, 8, 8,
  ];
  let cum = 0;
  for (let i = 0; i < 60; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const dayResolved = i === 0 ? 0 : Math.max(0, opens[i - 1] - opens[i]) + (i % 4 === 0 ? 1 : 0);
    cum += dayResolved;
    days.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      open: opens[i],
      resolved: cum,
    });
  }
  return days;
}
export const BURNDOWN = buildBurndown();

// Top critical exposures (the 3 worst-of-the-worst)
export interface ExposureCard {
  id: string;
  cve: string;
  severity: Severity;
  title: string;
  technology: string;
  hostname: string;
  daysOverdue: number;
  dueDate: string;
  owner: string;
  ownerInitials: string;
  crq: string;
}

export const TOP_EXPOSURES: ExposureCard[] = [
  {
    id: "1",
    cve: "CVE-2024-29847",
    severity: "Critical",
    title: "Buffer Overflow in Transaction Parsing",
    technology: "Apache Tomcat 9.0.45",
    hostname: "pay-gw-prd-001.bank.internal",
    daysOverdue: 82,
    dueDate: "Feb 15, 2026",
    owner: "David Kim",
    ownerInitials: "DK",
    crq: "CRQ000003456",
  },
  {
    id: "2",
    cve: "CVE-2024-38213",
    severity: "Critical",
    title: "Authentication RCE in Module",
    technology: "Apache HTTPD 2.4.54",
    hostname: "auth-svc-prd-003.bank.internal",
    daysOverdue: 5,
    dueDate: "May 3, 2026",
    owner: "Maria Garcia",
    ownerInitials: "MG",
    crq: "CRQ000007821",
  },
  {
    id: "3",
    cve: "CVE-2024-31982",
    severity: "Critical",
    title: "Authentication Bypass via JWT Manipulation",
    technology: "OpenSSL 1.1.1k",
    hostname: "risk-rpt-prd-001.bank.internal",
    daysOverdue: 18,
    dueDate: "Apr 20, 2026",
    owner: "James Wilson",
    ownerInitials: "JW",
    crq: "CRQ000005112",
  },
];

export const SCOPES = [
  "CIO: Payments Technology",
  "CIO: Retail Banking",
  "CIO: Wealth Management",
  "CIO: Capital Markets",
  "CIO: Corporate Banking",
];

// Remediation trend — 12 weeks of opened vs closed (realistic scale)
export interface TrendWeek {
  week: string;
  opened: number;
  closed: number;
}

export const REMEDIATION_TREND: TrendWeek[] = [
  { week: "Feb 9",  opened: 52400, closed: 38200 },
  { week: "Feb 16", opened: 54800, closed: 41500 },
  { week: "Feb 23", opened: 48200, closed: 39800 },
  { week: "Mar 2",  opened: 51600, closed: 43200 },
  { week: "Mar 9",  opened: 47800, closed: 45600 },
  { week: "Mar 16", opened: 45200, closed: 48100 },
  { week: "Mar 23", opened: 49400, closed: 51800 },
  { week: "Mar 30", opened: 43600, closed: 53200 },
  { week: "Apr 6",  opened: 41200, closed: 52400 },
  { week: "Apr 13", opened: 44800, closed: 55700 },
  { week: "Apr 20", opened: 38600, closed: 57200 },
  { week: "Apr 27", opened: 36800, closed: 59400 },
];

// Vulnerabilities by source and priority (pre-aggregated at scale)
export interface SourceChartRow {
  source: string;
  priority1: number;
  priority2: number;
  priority3: number;
  priority4: number;
}

export const SOURCE_CHART_OPEN: SourceChartRow[] = [
  { source: "MWPatch", priority1:  1750, priority2:  28000, priority3: 192500, priority4: 127750 },
  { source: "ADSF",    priority1:  1400, priority2:  22400, priority3: 154000, priority4: 102200 },
  { source: "BDNA",    priority1:  1100, priority2:  17600, priority3: 121000, priority4:  80300 },
  { source: "Blade",   priority1:  1050, priority2:  16800, priority3: 115500, priority4:  76650 },
  { source: "ESM",     priority1:   950, priority2:  15200, priority3: 104500, priority4:  69350 },
  { source: "Cloud",   priority1:   725, priority2:  11600, priority3:  79750, priority4:  52925 },
  { source: "BMP",     priority1:   325, priority2:   5200, priority3:  35750, priority4:  23725 },
  { source: "CTI",     priority1:   200, priority2:   3200, priority3:  22000, priority4:  14600 },
];

export const SOURCE_CHART_ALL: SourceChartRow[] = [
  { source: "MWPatch", priority1:  3200, priority2:  51000, priority3: 365000, priority4: 243000 },
  { source: "ADSF",    priority1:  2600, priority2:  41000, priority3: 291000, priority4: 193000 },
  { source: "BDNA",    priority1:  2000, priority2:  32000, priority3: 228000, priority4: 151000 },
  { source: "Blade",   priority1:  1900, priority2:  30000, priority3: 218000, priority4: 144000 },
  { source: "ESM",     priority1:  1700, priority2:  27000, priority3: 197000, priority4: 130000 },
  { source: "Cloud",   priority1:  1300, priority2:  21000, priority3: 150000, priority4:  99000 },
  { source: "BMP",     priority1:   600, priority2:   9500, priority3:  67000, priority4:  44500 },
  { source: "CTI",     priority1:   400, priority2:   6000, priority3:  41000, priority4:  27000 },
];

// TODO: wire to real data — currently stubbed. Same row shape as the source chart;
// the `source` field carries the dimension's display label (application name / owner).
// Application names match the APP_NAMES list in lib/mock-data.ts so the grid stays consistent.
export const APPLICATION_CHART_OPEN: SourceChartRow[] = [
  { source: "MARKIT Loan Settlement",     priority1: 1500, priority2: 24000, priority3: 165000, priority4: 109500 },
  { source: "FX Trading Platform",        priority1: 1300, priority2: 21000, priority3: 144000, priority4:  95700 },
  { source: "US Enterprise Transaction",  priority1: 1100, priority2: 17600, priority3: 121000, priority4:  80300 },
  { source: "Credit eTrading Platform",   priority1:  950, priority2: 15200, priority3: 104500, priority4:  69350 },
  { source: "Mercury Portal",             priority1:  800, priority2: 12800, priority3:  88000, priority4:  58400 },
  { source: "Global Markets Data",        priority1:  650, priority2: 10400, priority3:  71500, priority4:  47450 },
  { source: "Entity Scanning Solution",   priority1:  525, priority2:  8400, priority3:  57750, priority4:  38325 },
  { source: "Client Finder",              priority1:  400, priority2:  6400, priority3:  44000, priority4:  29200 },
  { source: "Enterprise Administration",  priority1:  175, priority2:  2800, priority3:  19250, priority4:  12775 },
  { source: "AML Defect Reporting Tool",  priority1:  100, priority2:  1600, priority3:  11000, priority4:   7300 },
];

export const APPLICATION_CHART_ALL: SourceChartRow[] = [
  { source: "MARKIT Loan Settlement",     priority1: 2700, priority2: 43000, priority3: 297000, priority4: 197000 },
  { source: "FX Trading Platform",        priority1: 2400, priority2: 38000, priority3: 260000, priority4: 173000 },
  { source: "US Enterprise Transaction",  priority1: 2000, priority2: 32000, priority3: 218000, priority4: 145000 },
  { source: "Credit eTrading Platform",   priority1: 1700, priority2: 27500, priority3: 188000, priority4: 125000 },
  { source: "Mercury Portal",             priority1: 1450, priority2: 23000, priority3: 158500, priority4: 105500 },
  { source: "Global Markets Data",        priority1: 1170, priority2: 18750, priority3: 128500, priority4:  85500 },
  { source: "Entity Scanning Solution",   priority1:  945, priority2: 15100, priority3: 104000, priority4:  69200 },
  { source: "Client Finder",              priority1:  720, priority2: 11500, priority3:  79000, priority4:  52600 },
  { source: "Enterprise Administration",  priority1:  315, priority2:  5050, priority3:  34700, priority4:  23000 },
  { source: "AML Defect Reporting Tool",  priority1:  180, priority2:  2900, priority3:  19800, priority4:  13200 },
];

// TODO: wire to real data — currently stubbed. `source` holds the assigned-remediator name.
export const OWNER_CHART_OPEN: SourceChartRow[] = [
  { source: "Scott Zhang",              priority1: 1400, priority2: 22400, priority3: 154000, priority4: 102200 },
  { source: "Priyanka Gupta",           priority1: 1250, priority2: 20000, priority3: 137500, priority4:  91250 },
  { source: "Sandip K Dube",            priority1: 1050, priority2: 16800, priority3: 115500, priority4:  76650 },
  { source: "Sushma Deepika Rupakula",  priority1:  900, priority2: 14400, priority3:  99000, priority4:  65700 },
  { source: "Rekha Patel",              priority1:  750, priority2: 12000, priority3:  82500, priority4:  54750 },
  { source: "Maiko Arai",               priority1:  625, priority2: 10000, priority3:  68750, priority4:  45625 },
  { source: "Mark Farr",                priority1:  500, priority2:  8000, priority3:  55000, priority4:  36500 },
  { source: "Manas Chanda",             priority1:  400, priority2:  6400, priority3:  44000, priority4:  29200 },
  { source: "Chris Boswell",            priority1:  325, priority2:  5200, priority3:  35750, priority4:  23725 },
  { source: "Saurabh Sharma",           priority1:  300, priority2:  4800, priority3:  33000, priority4:  21900 },
];

export const OWNER_CHART_ALL: SourceChartRow[] = [
  { source: "Scott Zhang",              priority1: 2550, priority2: 40800, priority3: 280500, priority4: 186200 },
  { source: "Priyanka Gupta",           priority1: 2275, priority2: 36400, priority3: 250250, priority4: 166075 },
  { source: "Sandip K Dube",            priority1: 1925, priority2: 30800, priority3: 211750, priority4: 140525 },
  { source: "Sushma Deepika Rupakula",  priority1: 1650, priority2: 26400, priority3: 181500, priority4: 120450 },
  { source: "Rekha Patel",              priority1: 1375, priority2: 22000, priority3: 151250, priority4: 100375 },
  { source: "Maiko Arai",               priority1: 1140, priority2: 18250, priority3: 125400, priority4:  83200 },
  { source: "Mark Farr",                priority1:  920, priority2: 14700, priority3: 100900, priority4:  66950 },
  { source: "Manas Chanda",             priority1:  730, priority2: 11700, priority3:  80500, priority4:  53400 },
  { source: "Chris Boswell",            priority1:  595, priority2:  9500, priority3:  65500, priority4:  43500 },
  { source: "Saurabh Sharma",           priority1:  550, priority2:  8800, priority3:  60500, priority4:  40150 },
];

// Days open distribution (pre-aggregated open vulnerabilities)
export interface DaysOpenData {
  under30:  number;
  d30to90:  number;
  d90to365: number;
  over365:  number;
}

export const DAYS_OPEN_DATA: DaysOpenData = {
  under30:  285000,
  d30to90:  523000,
  d90to365: 480000,
  over365:  212000,
};

// SLA compliance by priority
export interface SlaComplianceRow {
  priority: string;
  slaDays: number;
  compliance: number;
  target: number;
  color: string;
}

export const SLA_COMPLIANCE_BY_PRIORITY: SlaComplianceRow[] = [
  { priority: "Priority 1", slaDays: 7,  compliance: 88, target: 95, color: "#EF4444" },
  { priority: "Priority 2", slaDays: 14, compliance: 92, target: 95, color: "#F97316" },
  { priority: "Priority 3", slaDays: 30, compliance: 96, target: 95, color: "#FBBF24" },
  { priority: "Priority 4", slaDays: 90, compliance: 98, target: 95, color: "#60A5FA" },
];

export const SLA_OVERALL_COMPLIANCE = 93;

// Aggregated KPI counts — in production these come from a server-side aggregation
// API, not from counting paginated rows. The AG Grid table is a separate request.
export const DASHBOARD_STATS = {
  total:        2_847_291,
  awaiting:       124_583,
  inProgress:     312_847,
  pendingClear:   198_412,
  resolved:       563_204,
  priority1:        8_423,
  overdue:        134_892,
};
