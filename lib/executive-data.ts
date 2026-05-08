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
