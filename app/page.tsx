"use client";

import { useState, useMemo, useCallback } from "react";
import {
  ShieldCheck,
  LayoutDashboard,
  ShieldAlert,
  Wrench,
  BarChart3,
  Settings,
  ChevronDown,
  Search,
  Bell,
  Check,
  AlertCircle,
  Clock,
  ScanSearch,
  CheckCircle2,
  ArrowUpRight,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  Building2,
  TrendingUp,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { AgGridTriageTable } from "@/components/executive/ag-grid-table";
import { SourceBarChart, DaysOpenChart, RemediationTrendChart, SlaComplianceChart } from "@/components/dashboard/charts";
import { BlockersStrip } from "@/components/dashboard/blockers-strip";
import { mockVulnerabilities, CIO_TEAMS } from "@/lib/mock-data";
import type { Vulnerability, TriageStatus } from "@/lib/types";
import { formatCount } from "@/lib/utils";
import {
  DASHBOARD_STATS,
  SOURCE_CHART_OPEN,
  SOURCE_CHART_ALL,
  APPLICATION_CHART_OPEN,
  APPLICATION_CHART_ALL,
  OWNER_CHART_OPEN,
  OWNER_CHART_ALL,
  DAYS_OPEN_DATA,
} from "@/lib/executive-data";

// ── Animations ─────────────────────────────────────────────────────────────────

const KEYFRAMES = `
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes accentBarGrow {
    from { transform: scaleX(0); }
    to   { transform: scaleX(1); }
  }
@keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`;

// ── Shared shadow / radius tokens ──────────────────────────────────────────────

const CARD_SHADOW = "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)";
const CARD_RADIUS = 16;

// ── Helpers ────────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const CIO_DEPARTMENTS: Record<string, string> = {
  "James Hartley": "Payments Technology",
  "Patricia Owens": "Cybersecurity",
  "Raj Mehta": "Infrastructure",
  "Sandra Corrigan": "Enterprise Apps",
  "Marcus Webb": "Digital Banking",
  "Claire Fontaine": "Risk & Compliance",
  "Derek Okonkwo": "Data & Analytics",
};

type Page = "dashboard" | "vulnerabilities";

// ── Sidebar ────────────────────────────────────────────────────────────────────

interface SidebarProps {
  collapsed: boolean;
  activePage: Page;
  onNavigate: (page: Page) => void;
  onToggle: () => void;
}

const NAV_ITEMS = [
  { id: "dashboard" as const, label: "Dashboard", Icon: LayoutDashboard },
  { id: "vulnerabilities" as const, label: "Vulnerabilities", Icon: ShieldAlert },
  { id: "_remediation", label: "Remediation", Icon: Wrench },
  { id: "_reports", label: "Reports", Icon: BarChart3 },
  { id: "_settings", label: "Settings", Icon: Settings },
];

function Sidebar({ collapsed, activePage, onNavigate, onToggle }: SidebarProps) {
  return (
    <nav
      style={{
        position: "fixed",
        left: 20,
        top: 20,
        width: collapsed ? 104 : 354,
        height: "calc(100vh - 40px)",
        background: "#FFFFFF",
        borderRadius: 16,
        boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
        zIndex: 20,
        display: "flex",
        flexDirection: "column",
        transition: "width 250ms ease",
        overflow: "hidden",
      }}
      aria-label="Main navigation"
    >
      {/* Branding */}
      <div
        style={{
          padding: collapsed ? "20px 0 8px" : "20px 20px 8px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          justifyContent: collapsed ? "center" : "flex-start",
          borderBottom: "1px solid #F3F4F6",
          marginBottom: 8,
          flexShrink: 0,
        }}
      >
        <ShieldCheck
          style={{ width: 24, height: 24, color: "#2563EB", flexShrink: 0 }}
          aria-hidden="true"
        />
        {!collapsed && (
          <span
            style={{
              fontWeight: 700,
              fontSize: 14,
              color: "#111827",
              whiteSpace: "nowrap",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              lineHeight: 1,
            }}
          >
            Vulnerability Remediation
          </span>
        )}
      </div>

      {/* MENU label */}
      {!collapsed && (
        <div
          style={{
            margin: "16px 16px 8px",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#9CA3AF",
            whiteSpace: "nowrap",
          }}
        >
          Menu
        </div>
      )}

      {/* Nav items */}
      <div style={{ flex: 1, overflow: "hidden", padding: collapsed ? "0 4px" : "0" }}>
        {NAV_ITEMS.map(({ id, label, Icon }) => {
          const isNavigable = id === "dashboard" || id === "vulnerabilities";
          const isActive = isNavigable && id === activePage;
          return (
            <SidebarNavItem
              key={id}
              id={id}
              label={label}
              Icon={Icon}
              isActive={isActive}
              collapsed={collapsed}
              disabled={!isNavigable}
              onClick={() => isNavigable && onNavigate(id as Page)}
            />
          );
        })}
      </div>

      {/* Collapse / expand toggle — pinned at bottom */}
      <div
        style={{
          borderTop: "1px solid #F3F4F6",
          padding: collapsed ? "8px 4px" : "8px 12px",
          flexShrink: 0,
        }}
      >
        <button
          onClick={onToggle}
          style={{
            width: "100%",
            height: 44,
            borderRadius: 10,
            border: "none",
            background: "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start",
            gap: 10,
            padding: collapsed ? 0 : "0 4px",
            cursor: "pointer",
            color: "#9CA3AF",
            fontSize: 14,
            fontWeight: 500,
            transition: "background 100ms, color 100ms",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#F9FAFB";
            (e.currentTarget as HTMLButtonElement).style.color = "#374151";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            (e.currentTarget as HTMLButtonElement).style.color = "#9CA3AF";
          }}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen style={{ width: 18, height: 18, flexShrink: 0 }} aria-hidden="true" />
          ) : (
            <>
              <PanelLeftClose style={{ width: 18, height: 18, flexShrink: 0 }} aria-hidden="true" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>

    </nav>
  );
}

function SidebarNavItem({
  id,
  label,
  Icon,
  isActive,
  collapsed,
  disabled,
  onClick,
}: {
  id: string;
  label: string;
  Icon: React.ComponentType<{ style?: React.CSSProperties }>;
  isActive: boolean;
  collapsed: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      role={disabled ? "none" : "button"}
      tabIndex={disabled ? -1 : 0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && !disabled && onClick()}
      onMouseEnter={() => !isActive && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-current={isActive ? "page" : undefined}
      aria-label={label}
      style={{
        height: 44,
        padding: collapsed ? "0" : "0 16px",
        borderRadius: 10,
        margin: collapsed ? "3px 4px" : "3px 12px",
        display: "flex",
        alignItems: "center",
        justifyContent: collapsed ? "center" : "flex-start",
        gap: 10,
        cursor: disabled ? "default" : "pointer",
        background: isActive
          ? "#EFF6FF"
          : hovered
          ? "#F9FAFB"
          : "transparent",
        color: isActive ? "#2563EB" : hovered ? "#374151" : "#6B7280",
        fontWeight: isActive ? 600 : 500,
        fontSize: 14,
        transition: "background 100ms, color 100ms",
        whiteSpace: "nowrap",
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <Icon
        style={{
          width: 18,
          height: 18,
          flexShrink: 0,
          color: isActive ? "#2563EB" : hovered ? "#6B7280" : "#9CA3AF",
        }}
      />
      {!collapsed && <span>{label}</span>}
    </div>
  );
}

// ── Floating Header Card ────────────────────────────────────────────────────────

interface HeaderStats {
  total: number;
  overdue: number;
  priority1: number;
}

interface HeaderCardProps {
  selectedCio: (typeof CIO_TEAMS)[0];
  onSelectCio: (cio: (typeof CIO_TEAMS)[0]) => void;
  stats: HeaderStats;
  onNavigate: (page: Page) => void;
}

function HeaderCard({ selectedCio, onSelectCio, stats, onNavigate }: HeaderCardProps) {
  const [cioOpen, setCioOpen] = useState(false);
  const department = CIO_DEPARTMENTS[selectedCio.name] ?? "Technology";
  const initials = getInitials(selectedCio.name);

  return (
    <div
      style={{
        background: "transparent",
        borderRadius: 0,
        boxShadow: "none",
        border: "none",
        padding: "0 0 16px 0",
        margin: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        flexShrink: 0,
      }}
    >
      {/* Left: title (recessed) + meta-row (promoted) */}
      <div style={{ minWidth: 0 }}>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 600,
            color: "#111827",
            lineHeight: 1.2,
            margin: 0,
            whiteSpace: "nowrap",
          }}
        >
          Security Risk Console
        </h1>
        <p
          style={{
            fontSize: 13,
            fontWeight: 400,
            color: "#9CA3AF",
            margin: "2px 0 10px",
            lineHeight: 1.4,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          Real-time vulnerability remediation across all teams.
        </p>
        <MetaRow
          stats={stats}
          department={department}
          onNavigate={onNavigate}
        />
      </div>

      {/* Right: search + bell + CIO */}
      <div
        style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}
      >
        <IconCircleBtn aria-label="Search">
          <Search style={{ width: 17, height: 17, color: "#6B7280" }} />
        </IconCircleBtn>

        <div style={{ position: "relative" }}>
          <IconCircleBtn aria-label={`${formatCount(stats.priority1)} notifications`}>
            <Bell style={{ width: 17, height: 17, color: "#6B7280" }} />
          </IconCircleBtn>
          <span
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              minWidth: 16,
              height: 16,
              borderRadius: 8,
              background: "#EF4444",
              border: "1.5px solid #fff",
              fontSize: 9,
              fontWeight: 700,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 3px",
              lineHeight: 1,
            }}
            aria-hidden="true"
          >
            {stats.priority1 > 99 ? "99+" : stats.priority1}
          </span>
        </div>

        {/* CIO selector */}
        <Popover open={cioOpen} onOpenChange={setCioOpen}>
          <PopoverTrigger asChild>
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                border: "1px solid #E5E7EB",
                borderRadius: 10,
                padding: "6px 12px",
                background: "#FAFAFA",
                cursor: "pointer",
                transition: "background 100ms",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background = "#F3F4F6")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background = "#FAFAFA")
              }
              aria-label="Select CIO team"
            >
              <Avatar initials={initials} size={32} />
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#111827",
                  whiteSpace: "nowrap",
                }}
              >
                CIO: {selectedCio.name}
              </span>
              <ChevronDown
                style={{ width: 14, height: 14, color: "#9CA3AF" }}
                aria-hidden="true"
              />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-1" align="end">
            {CIO_TEAMS.map((cio) => (
              <button
                key={cio.id}
                onClick={() => {
                  onSelectCio(cio);
                  setCioOpen(false);
                }}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted transition-colors"
                style={{ border: "none", background: "transparent", cursor: "pointer" }}
                aria-label={`Switch to ${cio.name}`}
              >
                <Avatar initials={getInitials(cio.name)} size={28} fontSize={11} />
                <span
                  style={{ flex: 1, fontSize: 13, color: "#111827", textAlign: "left" }}
                >
                  {cio.name}
                </span>
                {cio.id === selectedCio.id && (
                  <Check
                    style={{ width: 14, height: 14, color: "#2563EB" }}
                    aria-hidden="true"
                  />
                )}
              </button>
            ))}
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

function IconCircleBtn({
  children,
  "aria-label": ariaLabel,
}: {
  children: React.ReactNode;
  "aria-label": string;
}) {
  return (
    <button
      style={{
        width: 36,
        height: 36,
        borderRadius: "50%",
        border: "none",
        background: "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
      }}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}

function Avatar({
  initials,
  size = 32,
  fontSize = 13,
}: {
  initials: string;
  size?: number;
  fontSize?: number;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "#2563EB",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize,
        fontWeight: 600,
        flexShrink: 0,
      }}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}

/**
 * Promoted page-header meta-row. Reads as the page's primary scope context
 * rather than chrome — overdue and priority-1 counts get a red number accent
 * because those are what the CIO scans for first.
 */
function MetaRow({
  stats,
  department,
  onNavigate,
}: {
  stats: HeaderStats;
  department: string;
  onNavigate: (page: Page) => void;
}) {
  const dotStyle: React.CSSProperties = {
    width: 3,
    height: 3,
    borderRadius: 2,
    background: "#9CA3AF",
    flexShrink: 0,
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        flexWrap: "wrap",
        fontSize: 14,
        fontWeight: 500,
        color: "#374151",
      }}
    >
      <MetaItem
        value={formatCount(stats.total)}
        label="vulnerabilities"
        onClick={() => onNavigate("vulnerabilities")}
      />
      <span style={dotStyle} aria-hidden="true" />
      <MetaItem
        value={formatCount(stats.overdue)}
        label="overdue"
        valueColor="#DC2626"
        onClick={() => onNavigate("vulnerabilities")}
      />
      <span style={dotStyle} aria-hidden="true" />
      <MetaItem
        value={formatCount(stats.priority1)}
        label="Priority 1"
        valueColor="#DC2626"
        onClick={() => onNavigate("vulnerabilities")}
      />
      <span style={dotStyle} aria-hidden="true" />
      <span style={{ color: "#6B7280" }}>{department}</span>
    </div>
  );
}

function MetaItem({
  value,
  label,
  valueColor,
  onClick,
}: {
  value: string;
  label: string;
  valueColor?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        gap: 5,
        background: "none",
        border: "none",
        padding: 0,
        cursor: onClick ? "pointer" : "default",
        font: "inherit",
        color: "inherit",
      }}
    >
      <span
        style={{
          fontWeight: 700,
          color: valueColor ?? "#111827",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </span>
      <span style={{ fontWeight: 400, color: "#6B7280" }}>{label}</span>
    </button>
  );
}

// ── Stat Card (Influency style) ────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  count: number;
  Icon: React.ComponentType<{ style?: React.CSSProperties }>;
  accentColor: string;
  trend: number;
  trendLabel: string;
  trendBad: boolean;
  animDelay: number;
  onNavigate: (page: Page) => void;
  triageStatus?: TriageStatus;
}

/**
 * Operational stat card — flat neutral background with a left-edge color accent.
 * Whole card is the click target when a triageStatus is set; arrow icon top-right
 * signals the affordance.
 */
function StatCard({
  label,
  count,
  Icon,
  accentColor,
  trend,
  trendLabel,
  trendBad,
  animDelay,
  onNavigate,
  triageStatus,
}: StatCardProps) {
  const [hovered, setHovered] = useState(false);
  const TrendIcon = trend >= 0 ? ArrowUp : ArrowDown;
  const trendColor = trendBad ? "#DC2626" : "#16A34A";
  const trendBg = trendBad ? "#FEF2F2" : "#F0FDF4";
  const clickable = !!triageStatus;

  return (
    <div
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-label={clickable ? `View ${label}` : undefined}
      onClick={() => clickable && onNavigate("vulnerabilities")}
      onKeyDown={(e) => {
        if (clickable && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onNavigate("vulnerabilities");
        }
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#FFFFFF",
        borderRadius: CARD_RADIUS,
        border: "1px solid #E5E7EB",
        boxShadow: hovered
          ? "0 6px 20px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04)"
          : CARD_SHADOW,
        padding: "20px 22px 18px 22px",
        flex: 1,
        minWidth: 0,
        minHeight: 158,
        position: "relative",
        overflow: "hidden",
        transform: hovered ? "translateY(-1px)" : "translateY(0)",
        transition: "transform 150ms ease, box-shadow 150ms ease, border-color 150ms ease",
        borderColor: hovered && clickable ? "#D1D5DB" : "#E5E7EB",
        animation: "fadeSlideUp 300ms ease forwards",
        animationDelay: `${animDelay}ms`,
        opacity: 0,
        cursor: clickable ? "pointer" : "default",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Left accent strip */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: accentColor,
        }}
        aria-hidden="true"
      />

      {/* Top row: small leading icon + label, arrow top-right */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 14,
          gap: 8,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            minWidth: 0,
          }}
        >
          <Icon
            style={{ width: 14, height: 14, color: "#6B7280", flexShrink: 0 }}
            aria-hidden="true"
          />
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#374151",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {label}
          </span>
        </div>
        {clickable && (
          <ArrowUpRight
            style={{
              width: 16,
              height: 16,
              color: hovered ? "#374151" : "#9CA3AF",
              flexShrink: 0,
              transition: "color 150ms",
            }}
            aria-hidden="true"
          />
        )}
      </div>

      {/* Count */}
      <p
        style={{
          fontSize: 44,
          fontWeight: 700,
          color: "#111827",
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
          margin: "0 0 12px",
        }}
        aria-label={`${count} ${label}`}
      >
        {formatCount(count)}
      </p>

      {/* Trend pill — color reflects whether the change is good or bad */}
      <div
        style={{
          display: "inline-flex",
          alignSelf: "flex-start",
          alignItems: "center",
          gap: 4,
          padding: "3px 8px",
          borderRadius: 999,
          background: trendBg,
          marginTop: "auto",
        }}
        aria-label={trendLabel}
      >
        <TrendIcon
          style={{ width: 11, height: 11, color: trendColor, flexShrink: 0 }}
          aria-hidden="true"
        />
        <span style={{ fontSize: 11, fontWeight: 600, color: trendColor }}>
          {trendLabel}
        </span>
      </div>
    </div>
  );
}

// ── Dashboard Page ─────────────────────────────────────────────────────────────

interface DashboardStats {
  total: number;
  awaiting: number;
  inProgress: number;
  pendingClear: number;
  resolved: number;
  priority1: number;
  overdue: number;
}

interface DashboardPageProps {
  stats: DashboardStats;
  onNavigate: (page: Page) => void;
  vulnerabilities: Vulnerability[];
}

type Dimension = "application" | "source" | "owner";

const DIMENSION_TITLES: Record<Dimension, string> = {
  application: "Vulnerabilities by Application",
  source: "Vulnerabilities by Source",
  owner: "Vulnerabilities by Owner",
};

/** Truncate long labels (app names, full owner names) for the X-axis. */
function shortDimensionLabel(value: string): string {
  if (value.length <= 14) return value;
  return value.slice(0, 13) + "…";
}

function DashboardPage({ stats, onNavigate, vulnerabilities }: DashboardPageProps) {
  const [chartFilter, setChartFilter] = useState<"open" | "all">("open");
  const [dimension, setDimension] = useState<Dimension>("application");

  const openClosed = useMemo(() => {
    const open = SOURCE_CHART_OPEN.reduce(
      (s, r) => s + r.priority1 + r.priority2 + r.priority3 + r.priority4, 0
    );
    return { open, closed: DASHBOARD_STATS.total - open };
  }, []);

  const chartData = useMemo(() => {
    // Summary numbers (1.5M Open / 1.3M Closed) intentionally remain overall —
    // not dimension-scoped. The dimension toggle only swaps the breakdown axis.
    if (dimension === "application") {
      return chartFilter === "open" ? APPLICATION_CHART_OPEN : APPLICATION_CHART_ALL;
    }
    if (dimension === "owner") {
      return chartFilter === "open" ? OWNER_CHART_OPEN : OWNER_CHART_ALL;
    }
    return chartFilter === "open" ? SOURCE_CHART_OPEN : SOURCE_CHART_ALL;
  }, [dimension, chartFilter]);

  const STAT_CARDS: Omit<StatCardProps, "onNavigate">[] = [
    {
      label: "Awaiting Disposition",
      count: stats.awaiting,
      Icon: AlertCircle,
      accentColor: "#EF4444",
      trend: 2,
      trendLabel: "2 more than last week",
      trendBad: true,
      animDelay: 0,
      triageStatus: "Awaiting Disposition",
    },
    {
      label: "In Progress",
      count: stats.inProgress,
      Icon: Clock,
      accentColor: "#F59E0B",
      trend: -1,
      trendLabel: "1 fewer than last week",
      trendBad: false,
      animDelay: 80,
      triageStatus: "In Progress",
    },
    {
      label: "Pending Clear Scan",
      count: stats.pendingClear,
      Icon: ScanSearch,
      accentColor: "#3B82F6",
      trend: 1,
      trendLabel: "1 more than last week",
      trendBad: true,
      animDelay: 160,
      triageStatus: "Pending Clear Scan",
    },
    {
      label: "Resolved (last 30 days)",
      count: stats.resolved,
      Icon: CheckCircle2,
      accentColor: "#22C55E",
      trend: -3,
      trendLabel: "3 fewer than last week",
      trendBad: true,
      animDelay: 240,
      triageStatus: "Resolved",
    },
  ];

  const cardStyle: React.CSSProperties = {
    background: "#FFFFFF",
    borderRadius: CARD_RADIUS,
    border: "none",
    boxShadow: CARD_SHADOW,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column" }} aria-label="Dashboard">
      {/* Stat cards */}
      <section
        style={{ display: "flex", gap: 16, marginBottom: 16, alignItems: "stretch" }}
        aria-label="Summary statistics"
      >
        {STAT_CARDS.map((card) => (
          <StatCard key={card.label} {...card} onNavigate={onNavigate} />
        ))}
      </section>

      {/* Blockers rollup — turns triage decisions into org-level visibility */}
      <section style={{ marginBottom: 20 }} aria-label="Remediation blockers">
        <BlockersStrip vulnerabilities={vulnerabilities} />
      </section>

      {/* Charts row */}
      <section
        style={{ display: "flex", gap: 16, alignItems: "stretch", marginBottom: 20 }}
        aria-label="Data visualizations"
      >
        {/* Left: Source bar chart (60%) */}
        <div
          style={{ flex: "0 0 60%", ...cardStyle, background: "#F9FAFB", padding: "22px 24px" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <span style={{ fontSize: 20, fontWeight: 600, color: "#111827", display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", flexShrink: 0 }}>
                <BarChart3 style={{ width: 22, height: 22, color: "#6B7280" }} aria-hidden="true" />
              </div>
              <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {DIMENSION_TITLES[dimension]}
              </span>
            </span>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              {/* Dimension toggle */}
              <div
                style={{
                  display: "flex",
                  gap: 4,
                  background: "#F3F4F6",
                  borderRadius: 6,
                  padding: 3,
                }}
                role="tablist"
                aria-label="Chart dimension"
              >
                {([
                  { id: "application" as const, label: "Application" },
                  { id: "source" as const,      label: "Source" },
                  { id: "owner" as const,       label: "Owner" },
                ]).map((d) => {
                  const active = dimension === d.id;
                  return (
                    <button
                      key={d.id}
                      onClick={() => setDimension(d.id)}
                      role="tab"
                      aria-selected={active}
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        padding: "5px 12px",
                        borderRadius: 4,
                        border: "none",
                        cursor: "pointer",
                        background: active ? "#FFFFFF" : "transparent",
                        color: active ? "#111827" : "#6B7280",
                        boxShadow: active ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
                        transition: "background 150ms, color 150ms, box-shadow 150ms",
                      }}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
              {/* Open/All toggle */}
              <div
                style={{
                  display: "flex",
                  gap: 4,
                  background: "#F3F4F6",
                  borderRadius: 6,
                  padding: 3,
                }}
              >
                {(["Open", "All"] as const).map((opt) => {
                const val = opt === "Open" ? "open" : "all";
                const active = chartFilter === val;
                return (
                  <button
                    key={opt}
                    onClick={() => setChartFilter(val)}
                    style={{
                      fontSize: 16,
                      fontWeight: 500,
                      padding: "5px 14px",
                      borderRadius: 4,
                      border: "none",
                      cursor: "pointer",
                      background: active ? "#2563EB" : "transparent",
                      color: active ? "#fff" : "#6B7280",
                      transition: "background 150ms, color 150ms",
                    }}
                    aria-pressed={active}
                  >
                    {opt}
                  </button>
                );
              })}
              </div>
            </div>
          </div>

          {/* Summary numbers */}
          <div style={{ display: "flex", gap: 36, marginBottom: 8 }}>
            <div>
              <div
                style={{
                  fontSize: 56,
                  fontWeight: 800,
                  color: "#111827",
                  lineHeight: 1,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {formatCount(openClosed.open)}
              </div>
              <div style={{ fontSize: 13, color: "#6B7280", marginTop: 3 }}>Open</div>
              <div
                style={{
                  fontSize: 12,
                  color: "#22C55E",
                  marginTop: 4,
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <ArrowUp style={{ width: 11, height: 11 }} aria-hidden="true" />
                4.1% vs last report
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: 56,
                  fontWeight: 800,
                  color: "#6B7280",
                  lineHeight: 1,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {formatCount(openClosed.closed)}
              </div>
              <div style={{ fontSize: 13, color: "#9CA3AF", marginTop: 3 }}>Closed</div>
              <div
                style={{
                  fontSize: 12,
                  color: "#22C55E",
                  marginTop: 4,
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <ArrowDown style={{ width: 11, height: 11 }} aria-hidden="true" />
                2% vs last report
              </div>
            </div>
          </div>

          <SourceBarChart
            data={chartData}
            tickFormatter={dimension === "source" ? undefined : shortDimensionLabel}
            barSize={dimension === "source" ? 28 : 22}
          />
        </div>

        {/* Right: Days Open donut (40% minus gap) */}
        <div
          style={{
            flex: "0 0 calc(40% - 8px)",
            ...cardStyle,
            background: "#F9FAFB",
            padding: "22px 24px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 4,
            }}
          >
            <span style={{ fontSize: 20, fontWeight: 600, color: "#111827", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", flexShrink: 0 }}>
                <Clock style={{ width: 22, height: 22, color: "#6B7280" }} aria-hidden="true" />
              </div>
              Days Open
            </span>
            <button
              style={{
                fontSize: 16,
                fontWeight: 500,
                color: "#6B7280",
                background: "none",
                border: "1px solid #E5E7EB",
                borderRadius: 6,
                padding: "5px 14px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              This Report
              <ChevronDown style={{ width: 16, height: 16 }} aria-hidden="true" />
            </button>
          </div>
          <DaysOpenChart data={DAYS_OPEN_DATA} />
        </div>
      </section>

      {/* Second charts row — Remediation Trend + SLA Compliance */}
      <section
        style={{ display: "flex", gap: 16, alignItems: "stretch" }}
        aria-label="Trend and SLA analytics"
      >
        {/* Remediation Trend */}
        <div style={{ flex: "0 0 55%", ...cardStyle, background: "#F9FAFB", padding: "22px 24px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <span style={{ fontSize: 20, fontWeight: 600, color: "#111827", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", flexShrink: 0 }}>
                <TrendingUp style={{ width: 22, height: 22, color: "#6B7280" }} aria-hidden="true" />
              </div>
              Remediation Trend
            </span>
            <span style={{ fontSize: 12, color: "#9CA3AF" }}>Last 12 weeks</span>
          </div>
          <RemediationTrendChart />
        </div>

        {/* SLA Compliance */}
        <div style={{ flex: "0 0 calc(45% - 8px)", ...cardStyle, background: "#F9FAFB", padding: "22px 24px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <span style={{ fontSize: 20, fontWeight: 600, color: "#111827", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", flexShrink: 0 }}>
                <CheckCircle2 style={{ width: 22, height: 22, color: "#6B7280" }} aria-hidden="true" />
              </div>
              SLA Compliance
            </span>
            <span style={{ fontSize: 12, color: "#9CA3AF" }}>By priority</span>
          </div>
          <SlaComplianceChart />
        </div>
      </section>

    </div>
  );
}

// ── Vulnerabilities Page ───────────────────────────────────────────────────────

interface VulnerabilitiesPageProps {
  vulnerabilities: Vulnerability[];
  selectedVuln: Vulnerability | null;
  sheetOpen: boolean;
  onRowSelected: (v: Vulnerability) => void;
  onSheetChange: (open: boolean) => void;
  onSave: (v: Vulnerability) => void;
  selectedCio: (typeof CIO_TEAMS)[0];
  stats: { total: number };
}

function VulnerabilitiesPage({
  vulnerabilities,
  selectedVuln,
  sheetOpen,
  onRowSelected,
  onSheetChange,
  onSave,
  selectedCio,
  stats,
}: VulnerabilitiesPageProps) {
  const department = CIO_DEPARTMENTS[selectedCio.name] ?? "Technology";

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: CARD_RADIUS,
        border: "none",
        boxShadow: CARD_SHADOW,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Slim inner header */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid #F3F4F6",
          flexShrink: 0,
        }}
      >
        <h2
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "#111827",
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          All Vulnerabilities
        </h2>
        <p style={{ fontSize: 13, color: "#6B7280", margin: "3px 0 0" }}>
          {selectedCio.name} · {department} · {formatCount(stats.total)} records total
        </p>
      </div>

      {/* Toolbar + grid */}
      <div style={{ padding: "14px 20px 20px" }}>
        <AgGridTriageTable
          vulnerabilities={vulnerabilities}
          onRowSelected={onRowSelected}
          selectedVuln={selectedVuln}
          sheetOpen={sheetOpen}
          onSheetChange={onSheetChange}
          onSave={onSave}
        />
      </div>
    </div>
  );
}

// ── App Shell ──────────────────────────────────────────────────────────────────

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedCio, setSelectedCio] = useState(CIO_TEAMS[0]!);
  const [selectedVuln, setSelectedVuln] = useState<Vulnerability | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const sidebarWidth = isSidebarCollapsed ? 104 : 354;
  // 20px left offset + sidebar width + 20px gap before content
  const contentMarginLeft = 20 + sidebarWidth + 20;

  const stats = DASHBOARD_STATS;

  const onNavigate = useCallback((page: Page) => setCurrentPage(page), []);

  const onRowSelected = useCallback((v: Vulnerability) => {
    setSelectedVuln(v);
    setSheetOpen(true);
  }, []);

  const onSave = useCallback((v: Vulnerability) => setSelectedVuln(v), []);

  return (
    <>
      <style>{KEYFRAMES}</style>

      {/* Fixed sidebar */}
      <Sidebar
        collapsed={isSidebarCollapsed}
        activePage={currentPage}
        onNavigate={onNavigate}
        onToggle={() => setIsSidebarCollapsed((v) => !v)}
      />

      {/* Scrollable content area */}
      <div
        style={{
          marginLeft: contentMarginLeft,
          transition: "margin-left 250ms ease",
          height: "100vh",
          overflowY: "auto",
          background: "#F7F8FA",
          fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
          display: "flex",
          flexDirection: "column",
          gap: 20,
          padding: "24px",
        }}
      >
        {/* Floating header card */}
        <HeaderCard
          selectedCio={selectedCio}
          onSelectCio={setSelectedCio}
          stats={stats}
          onNavigate={onNavigate}
        />

        {/* Page content */}
        <main
          id="main-content"
          tabIndex={-1}
          style={{ flex: 1 }}
        >
          {currentPage === "dashboard" ? (
            <DashboardPage
              stats={stats}
              onNavigate={onNavigate}
              vulnerabilities={mockVulnerabilities}
            />
          ) : (
            <VulnerabilitiesPage
              vulnerabilities={mockVulnerabilities}
              selectedVuln={selectedVuln}
              sheetOpen={sheetOpen}
              onRowSelected={onRowSelected}
              onSheetChange={setSheetOpen}
              onSave={onSave}
              selectedCio={selectedCio}
              stats={stats}
            />
          )}
        </main>

        {/* Bottom breathing room */}
        <div style={{ height: 20, flexShrink: 0 }} />
      </div>

      {/* ARIA live region */}
      <div aria-live="polite" className="sr-only" id="grid-status" />
    </>
  );
}
