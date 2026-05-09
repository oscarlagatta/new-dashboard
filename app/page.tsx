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
import { mockVulnerabilities, CIO_TEAMS } from "@/lib/mock-data";
import type { Vulnerability, TriageStatus } from "@/lib/types";
import { formatCount } from "@/lib/utils";
import { DASHBOARD_STATS, SOURCE_CHART_OPEN, SOURCE_CHART_ALL, DAYS_OPEN_DATA } from "@/lib/executive-data";

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
      {/* Left: title + badge row */}
      <div style={{ minWidth: 0 }}>
        <h1
          style={{
            fontSize: 44,
            fontWeight: 800,
            color: "#111827",
            lineHeight: 1.1,
            margin: 0,
            whiteSpace: "nowrap",
          }}
        >
          Security Risk Console
        </h1>
        <p
          style={{
            fontSize: 14,
            fontWeight: 400,
            color: "#6B7280",
            margin: "6px 0 8px",
            lineHeight: 1.5,
          }}
        >
          Real-time visibility into open vulnerabilities, remediation progress, and SLA compliance across all teams.
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <InlineIconBadge
            Icon={ShieldAlert}
            text={`${formatCount(stats.total)} vulnerabilities`}
            onClick={() => onNavigate("vulnerabilities")}
          />
          <InlineIconBadge
            Icon={Clock}
            text={`${formatCount(stats.overdue)} overdue`}
            onClick={() => onNavigate("vulnerabilities")}
          />
          <InlineIconBadge
            Icon={AlertTriangle}
            text={`${formatCount(stats.priority1)} Priority 1`}
            onClick={() => onNavigate("vulnerabilities")}
          />
          <InlineIconBadge Icon={Building2} text={department} />
        </div>
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

function InlineIconBadge({
  Icon,
  text,
  onClick,
}: {
  Icon: React.ComponentType<{ style?: React.CSSProperties }>;
  text: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        background: "none",
        border: "none",
        padding: 0,
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <Icon style={{ width: 13, height: 13, color: "#9CA3AF" }} aria-hidden="true" />
      <span style={{ fontSize: 12, fontWeight: 500, color: "#6B7280" }}>{text}</span>
    </button>
  );
}

// ── Stat Card (Influency style) ────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  count: number;
  iconBg: string;
  Icon: React.ComponentType<{ style?: React.CSSProperties }>;
  iconColor: string;
  accentColor: string;
  countColor: string;
  gradient: string;
  trend: number;
  trendLabel: string;
  trendBad: boolean;
  animDelay: number;
  onNavigate: (page: Page) => void;
  triageStatus?: TriageStatus;
}

function StatCard({
  label,
  count,
  iconBg,
  Icon,
  iconColor,
  accentColor,
  countColor,
  gradient,
  trend,
  trendLabel,
  trendBad,
  animDelay,
  onNavigate,
  triageStatus,
}: StatCardProps) {
  const [hovered, setHovered] = useState(false);
  const [arrowHovered, setArrowHovered] = useState(false);
  const TrendIcon = trend >= 0 ? ArrowUp : ArrowDown;
  const trendColor = trendBad ? "#EF4444" : "#22C55E";

  return (
    <div
      style={{
        background: gradient,
        borderRadius: CARD_RADIUS,
        border: "none",
        boxShadow: hovered
          ? "0 6px 24px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.04)"
          : CARD_SHADOW,
        padding: "14px 20px 0",
        flex: 1,
        minWidth: 0,
        minHeight: 190,
        position: "relative",
        overflow: "hidden",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        transition: "transform 150ms ease, box-shadow 150ms ease",
        animation: "fadeSlideUp 300ms ease forwards",
        animationDelay: `${animDelay}ms`,
        opacity: 0,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Top row: icon + arrow button */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 48,
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-hidden="true"
        >
          <Icon style={{ width: 24, height: 24, color: iconColor }} />
        </div>
        <button
          onClick={() => triageStatus && onNavigate("vulnerabilities")}
          onMouseEnter={() => setArrowHovered(true)}
          onMouseLeave={() => setArrowHovered(false)}
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            border: `1.5px solid ${arrowHovered ? "#2563EB" : "#E5E7EB"}`,
            background: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: triageStatus ? "pointer" : "default",
            padding: 0,
            transition: "border-color 150ms",
          }}
          aria-label={`View ${label}`}
        >
          <ArrowUpRight
            style={{
              width: 22,
              height: 22,
              color: arrowHovered ? "#2563EB" : "#9CA3AF",
              transition: "color 150ms",
            }}
            aria-hidden="true"
          />
        </button>
      </div>

      {/* Count */}
      <p
        style={{
          fontSize: 56,
          fontWeight: 800,
          color: "#111827",
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
          margin: 0,
        }}
        aria-label={`${count} ${label}`}
      >
        {formatCount(count)}
      </p>

      {/* Trend */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          marginTop: 4,
        }}
        aria-label={trendLabel}
      >
        <TrendIcon
          style={{ width: 12, height: 12, color: trendColor, flexShrink: 0 }}
          aria-hidden="true"
        />
        <span style={{ fontSize: 12, fontWeight: 500, color: trendColor }}>
          {trendLabel}
        </span>
      </div>

      {/* Label */}
      <p
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: "#374151",
          margin: "2px 0 10px",
        }}
      >
        {label}
      </p>

      {/* Accent bar — no border-radius; card overflow:hidden clips it */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 5,
          background: accentColor,
          transformOrigin: "left",
          animation: "accentBarGrow 400ms ease forwards",
          animationDelay: `${animDelay + 280}ms`,
          transform: "scaleX(0)",
        }}
        aria-hidden="true"
      />
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

function DashboardPage({ stats, onNavigate, vulnerabilities }: DashboardPageProps) {
  const [chartFilter, setChartFilter] = useState<"open" | "all">("open");

  const openClosed = useMemo(() => {
    const open = SOURCE_CHART_OPEN.reduce(
      (s, r) => s + r.priority1 + r.priority2 + r.priority3 + r.priority4, 0
    );
    return { open, closed: DASHBOARD_STATS.total - open };
  }, []);

  const STAT_CARDS: Omit<StatCardProps, "onNavigate">[] = [
    {
      label: "Awaiting Disposition",
      count: stats.awaiting,
      iconBg: "#FEF2F2",
      Icon: AlertCircle,
      iconColor: "#EF4444",
      accentColor: "#EF4444",
      countColor: "#EF4444",
      gradient: "linear-gradient(135deg, #FEE2E2 0%, #FECACA 60%, #FCA5A5 100%)",
      trend: 2,
      trendLabel: "2 more than last week",
      trendBad: true,
      animDelay: 0,
      triageStatus: "Awaiting Disposition",
    },
    {
      label: "In Progress",
      count: stats.inProgress,
      iconBg: "#FFFBEB",
      Icon: Clock,
      iconColor: "#F59E0B",
      accentColor: "#F59E0B",
      countColor: "#F59E0B",
      gradient: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 60%, #FCD34D 100%)",
      trend: -1,
      trendLabel: "1 fewer than last week",
      trendBad: false,
      animDelay: 80,
      triageStatus: "In Progress",
    },
    {
      label: "Pending Clear Scan",
      count: stats.pendingClear,
      iconBg: "#FFF7ED",
      Icon: ScanSearch,
      iconColor: "#F97316",
      accentColor: "#F97316",
      countColor: "#F97316",
      gradient: "linear-gradient(135deg, #FFEDD5 0%, #FED7AA 60%, #FDBA74 100%)",
      trend: 1,
      trendLabel: "1 more than last week",
      trendBad: true,
      animDelay: 160,
      triageStatus: "Pending Clear Scan",
    },
    {
      label: "Resolved (last 30 days)",
      count: stats.resolved,
      iconBg: "#F0FDF4",
      Icon: CheckCircle2,
      iconColor: "#22C55E",
      accentColor: "#22C55E",
      countColor: "#22C55E",
      gradient: "linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 60%, #86EFAC 100%)",
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
            <span style={{ fontSize: 20, fontWeight: 600, color: "#111827", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", flexShrink: 0 }}>
                <BarChart3 style={{ width: 22, height: 22, color: "#6B7280" }} aria-hidden="true" />
              </div>
              Vulnerabilities by Source
            </span>
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

          <SourceBarChart data={chartFilter === "open" ? SOURCE_CHART_OPEN : SOURCE_CHART_ALL} />
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
