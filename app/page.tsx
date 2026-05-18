"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  ShieldCheck,
  LayoutDashboard,
  Gauge,
  ListChecks,
  ClipboardCheck,
  BarChart3,
  CalendarClock,
  ChevronDown,
  Search,
  Bell,
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
  Menu,
  X as XIcon,
  HelpCircle,
} from "lucide-react";
import { AgGridTriageTable } from "@/components/executive/ag-grid-table";
import { SourceBarChart, DaysOpenChart, RemediationTrendChart, SlaComplianceChart } from "@/components/dashboard/charts";
import { BlockersStrip } from "@/components/dashboard/blockers-strip";
import { NoRemediationDateCard } from "@/components/executive/no-remediation-date-card";
import { AwaitingScanCard } from "@/components/executive/awaiting-scan-card";
import { RiskAcceptedCard } from "@/components/executive/risk-accepted-card";
import { ActionRequiredPanel } from "@/components/executive/action-required-panel";
import { EolExposures } from "@/components/executive/eol-exposures";
import { TopUnresolvedVulnerabilities } from "@/components/executive/top-unresolved-vulnerabilities";
import { UserGuideSheet } from "@/components/executive/user-guide-sheet";
import { mockVulnerabilities } from "@/lib/mock-data";
import type { Vulnerability, TriageStatus } from "@/lib/types";
import { formatCount } from "@/lib/utils";
import { useViewport } from "@/lib/use-viewport";
import { DEFAULT_DASHBOARD_SETTINGS } from "@/lib/dashboard-settings";
import type { FilterPresetId } from "@/lib/filter-presets";
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

// ── Animations & responsive rules ──────────────────────────────────────────────
// All styles scoped under `.src-dashboard` so they don't leak when this app is
// embedded inside another monorepo's global stylesheet.

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
    .src-dashboard *, .src-dashboard *::before, .src-dashboard *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }

  /* ── Responsive: tablet & below (≤1023px) ──────────────────────────────── */
  @media (max-width: 1023px) {
    /* Release flex:1 constraints so cards take natural height and the
       content-area scroll absorbs overflow. Without this, stacked chart
       cards squash and visually overlap each other. */
    .src-dashboard .vrd-page-content { flex: 0 0 auto !important; min-height: 0 !important; }
    .src-dashboard .vrd-charts-row { flex: 0 0 auto !important; min-height: 0 !important; flex-direction: column !important; }
    .src-dashboard .vrd-chart-card { flex: 0 0 auto !important; width: 100% !important; height: auto !important; min-height: 360px !important; }
    .src-dashboard .vrd-stat-row { flex-wrap: wrap !important; flex: 0 0 auto !important; }
    .src-dashboard .vrd-stat-card { flex: 1 1 calc(50% - 6px) !important; min-width: 0 !important; }
    /* Top Unresolved + EOL Exposures stack on tablet/phone */
    .src-dashboard .vrd-ranked-row { grid-template-columns: 1fr !important; }
    /* Charts row no longer stretches with flex:1 on desktop; on tablet allow
       natural height so the column stack rule above can take effect. */
    .src-dashboard .vrd-charts-row { height: auto !important; }
    .src-dashboard .vrd-main-content { flex: 0 0 auto !important; min-height: 0 !important; }
    .src-dashboard .vrd-content-area { padding: 12px 14px !important; margin-left: 0 !important; }
    .src-dashboard .vrd-header-title { font-size: 17px !important; }
    .src-dashboard .vrd-header-cio-name { display: none !important; }
    .src-dashboard .vrd-header-cio-btn { padding: 6px !important; }
    .src-dashboard .vrd-header-cio-chevron { display: none !important; }
  }

  /* ── Responsive: phone (≤767px) ────────────────────────────────────────── */
  @media (max-width: 767px) {
    .src-dashboard .vrd-stat-card { flex: 1 1 100% !important; min-height: 110px !important; }
    .src-dashboard .vrd-chart-toolbar { flex-wrap: wrap !important; gap: 6px !important; }
    .src-dashboard .vrd-chart-toolbar > * { flex-shrink: 0; }
    .src-dashboard .vrd-chart-title { font-size: 14px !important; }
    .src-dashboard .vrd-chart-summary { gap: 18px !important; }
    .src-dashboard .vrd-chart-summary-num { font-size: 24px !important; }
    .src-dashboard .vrd-page-content { gap: 8px !important; }
    .src-dashboard .vrd-content-area { padding: 10px !important; gap: 10px !important; }
    .src-dashboard .vrd-header-meta { font-size: 12px !important; gap: 8px !important; }
    .src-dashboard .vrd-header-meta-dot { display: none !important; }
    .src-dashboard .vrd-header-meta-dept { display: none !important; }
    .src-dashboard .vrd-header-search-btn { display: none !important; }
    .src-dashboard .vrd-header-actions { gap: 4px !important; }
    .src-dashboard .vrd-blockers-strip { padding: 12px 14px !important; }
    .src-dashboard .vrd-vuln-page-header { padding: 12px 14px !important; }
    .src-dashboard .vrd-vuln-page-body { padding: 10px 12px 14px !important; }
    .src-dashboard .vrd-vuln-page-card { border-radius: 12px !important; }
  }

  /* Block horizontal scroll on the host page when sidebar drawer is open */
  .src-dashboard.vrd-drawer-open { overflow: hidden !important; }

  /* Grid wrapper sizes via flex-1 inside the Vulnerabilities page card now;
     no per-viewport height overrides — the parent flex column controls it. */

  /* Prevent horizontal page scroll caused by very wide content */
  .src-dashboard { overflow-x: hidden; }

  /* Touch target hardening — make all buttons within tappable */
  @media (hover: none) and (pointer: coarse) {
    .src-dashboard button { -webkit-tap-highlight-color: transparent; }
    .src-dashboard button, .src-dashboard [role="button"] { min-height: 36px; }
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

type Page = "dashboard" | "vulnerabilities";

// ── Sidebar ────────────────────────────────────────────────────────────────────

interface SidebarProps {
  collapsed: boolean;
  activePage: Page;
  onNavigate: (page: Page) => void;
  onToggle: () => void;
  /** "fixed" = desktop docked sidebar; "drawer" = off-canvas mobile/tablet drawer. */
  mode: "fixed" | "drawer";
  drawerOpen: boolean;
  onDrawerClose: () => void;
}

const NAV_ITEMS = [
  {
    id: "dashboard" as const,
    label: "Executive Dashboard",
    subtitle: "Overview of remediation",
    Icon: LayoutDashboard,
  },
  {
    id: "_cio",
    label: "CIO Cockpit",
    subtitle: "CIO remediation summary",
    Icon: Gauge,
  },
  {
    id: "vulnerabilities" as const,
    label: "Work Queue",
    subtitle: "Backlog to remediate",
    Icon: ListChecks,
  },
  {
    id: "_validation",
    label: "Validation Pending",
    subtitle: "Remediation pending validation",
    Icon: ClipboardCheck,
  },
  {
    id: "_insights",
    label: "Insight Dashboards",
    subtitle: "Placeholder for Tableau",
    Icon: BarChart3,
  },
  {
    id: "_weekend",
    label: "Weekend C2",
    subtitle: "Weekend activity dashboard",
    Icon: CalendarClock,
  },
];

function Sidebar({
  collapsed,
  activePage,
  onNavigate,
  onToggle,
  mode,
  drawerOpen,
  onDrawerClose,
}: SidebarProps) {
  const isDrawer = mode === "drawer";
  // In drawer mode the sidebar is always visually expanded (collapsed prop is ignored).
  const visualCollapsed = isDrawer ? false : collapsed;

  // Close drawer on Escape
  useEffect(() => {
    if (!isDrawer || !drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDrawerClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isDrawer, drawerOpen, onDrawerClose]);

  const drawerWidth = 280;

  const navStyle: React.CSSProperties = isDrawer
    ? {
        position: "fixed",
        left: 0,
        top: 0,
        width: drawerWidth,
        maxWidth: "85vw",
        height: "100dvh",
        background: "#FFFFFF",
        borderRadius: 0,
        boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
        zIndex: 60,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        transform: drawerOpen ? "translateX(0)" : `translateX(-${drawerWidth + 20}px)`,
        transition: "transform 240ms cubic-bezier(.2,.8,.2,1)",
        visibility: drawerOpen ? "visible" : "hidden",
      }
    : {
        position: "fixed",
        left: 20,
        top: 20,
        width: visualCollapsed ? 104 : 354,
        height: "calc(100vh - 40px)",
        background: "#FFFFFF",
        borderRadius: 16,
        boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
        zIndex: 20,
        display: "flex",
        flexDirection: "column",
        transition: "width 250ms ease",
        overflow: "hidden",
      };

  return (
    <>
      {isDrawer && drawerOpen && (
        <div
          onClick={onDrawerClose}
          aria-hidden="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            zIndex: 55,
            animation: "fadeIn 180ms ease",
          }}
        />
      )}
      <nav
        style={navStyle}
        aria-label="Main navigation"
        aria-hidden={isDrawer && !drawerOpen}
      >
      {/* Branding */}
      <div
        style={{
          padding: visualCollapsed ? "20px 0 8px" : "20px 20px 8px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          justifyContent: visualCollapsed ? "center" : "space-between",
          borderBottom: "1px solid #F3F4F6",
          marginBottom: 8,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <ShieldCheck
            style={{ width: 24, height: 24, color: "#2563EB", flexShrink: 0 }}
            aria-hidden="true"
          />
          {!visualCollapsed && (
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
              Vulnerability Command &amp; Control
            </span>
          )}
        </div>
        {isDrawer && (
          <button
            onClick={onDrawerClose}
            aria-label="Close navigation"
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              border: "none",
              background: "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#6B7280",
              flexShrink: 0,
            }}
          >
            <XIcon style={{ width: 18, height: 18 }} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* MENU label */}
      {!visualCollapsed && (
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
          Main Pages
        </div>
      )}

      {/* Nav items */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: visualCollapsed ? "0 4px" : "0" }}>
        {NAV_ITEMS.map(({ id, label, subtitle, Icon }) => {
          const isNavigable = id === "dashboard" || id === "vulnerabilities";
          const isActive = isNavigable && id === activePage;
          return (
            <SidebarNavItem
              key={id}
              id={id}
              label={label}
              subtitle={subtitle}
              Icon={Icon}
              isActive={isActive}
              collapsed={visualCollapsed}
              disabled={!isNavigable}
              onClick={() => {
                if (!isNavigable) return;
                onNavigate(id as Page);
                if (isDrawer) onDrawerClose();
              }}
            />
          );
        })}
      </div>

      {/* Collapse / expand toggle — pinned at bottom (desktop only) */}
      {!isDrawer && (
        <div
          style={{
            borderTop: "1px solid #F3F4F6",
            padding: visualCollapsed ? "8px 4px" : "8px 12px",
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
              justifyContent: visualCollapsed ? "center" : "flex-start",
              gap: 10,
              padding: visualCollapsed ? 0 : "0 4px",
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
            aria-label={visualCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {visualCollapsed ? (
              <PanelLeftOpen style={{ width: 18, height: 18, flexShrink: 0 }} aria-hidden="true" />
            ) : (
              <>
                <PanelLeftClose style={{ width: 18, height: 18, flexShrink: 0 }} aria-hidden="true" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      )}
      </nav>
    </>
  );
}

function SidebarNavItem({
  id,
  label,
  subtitle,
  Icon,
  isActive,
  collapsed,
  disabled,
  onClick,
}: {
  id: string;
  label: string;
  subtitle: string;
  Icon: React.ComponentType<{ style?: React.CSSProperties }>;
  isActive: boolean;
  collapsed: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  // Active item: filled blue highlight background with white text.
  const labelColor = isActive ? "#FFFFFF" : hovered ? "#374151" : "#374151";
  const subtitleColor = isActive
    ? "rgba(255,255,255,0.78)"
    : hovered
    ? "#6B7280"
    : "#9CA3AF";
  const iconColor = isActive ? "#FFFFFF" : hovered ? "#6B7280" : "#9CA3AF";

  return (
    <div
      role={disabled ? "none" : "button"}
      tabIndex={disabled ? -1 : 0}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && !disabled && onClick()}
      onMouseEnter={() => !isActive && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-current={isActive ? "page" : undefined}
      aria-label={collapsed ? `${label} — ${subtitle}` : label}
      title={collapsed ? `${label} — ${subtitle}` : undefined}
      style={{
        minHeight: collapsed ? 44 : 54,
        padding: collapsed ? "0" : "8px 14px",
        borderRadius: 10,
        margin: collapsed ? "3px 4px" : "3px 12px",
        display: "flex",
        alignItems: "center",
        justifyContent: collapsed ? "center" : "flex-start",
        gap: 12,
        cursor: disabled ? "default" : "pointer",
        background: isActive
          ? "#2563EB"
          : hovered
          ? "#F9FAFB"
          : "transparent",
        transition: "background 100ms, color 100ms",
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <Icon
        style={{
          width: 18,
          height: 18,
          flexShrink: 0,
          color: iconColor,
        }}
      />
      {!collapsed && (
        <div style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
          <span
            style={{
              fontSize: 13.5,
              fontWeight: 600,
              color: labelColor,
              lineHeight: 1.3,
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 400,
              color: subtitleColor,
              lineHeight: 1.3,
              whiteSpace: "nowrap",
            }}
          >
            {subtitle}
          </span>
        </div>
      )}
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
  stats: HeaderStats;
  onNavigate: (page: Page) => void;
  showMenuButton: boolean;
  onMenuClick: () => void;
}

function HeaderCard({
  stats,
  onNavigate,
  showMenuButton,
  onMenuClick,
}: HeaderCardProps) {
  const [guideOpen, setGuideOpen] = useState(false);

  return (
    <>
    <div
      style={{
        background: "transparent",
        borderRadius: 0,
        boxShadow: "none",
        border: "none",
        padding: "0 0 6px 0",
        margin: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        flexShrink: 0,
      }}
    >
      {/* Left: hamburger (mobile) + title + meta-row */}
      <div style={{ minWidth: 0, flex: 1, display: "flex", alignItems: "center", gap: 10 }}>
        {showMenuButton && (
          <button
            onClick={onMenuClick}
            aria-label="Open navigation menu"
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              border: "1px solid #E5E7EB",
              background: "#FFFFFF",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              color: "#374151",
            }}
          >
            <Menu style={{ width: 20, height: 20 }} aria-hidden="true" />
          </button>
        )}
        <div style={{ minWidth: 0 }}>
          <h1
            className="vrd-header-title"
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: "#111827",
              lineHeight: 1.2,
              margin: 0,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            Security Risk Console
          </h1>
          <div style={{ marginTop: 4 }}>
            <MetaRow stats={stats} onNavigate={onNavigate} />
          </div>
        </div>
      </div>

      {/* Right: search + bell + CIO */}
      <div
        className="vrd-header-actions"
        style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}
      >
        <span className="vrd-header-search-btn" style={{ display: "inline-flex" }}>
          <IconCircleBtn aria-label="Search">
            <Search style={{ width: 17, height: 17, color: "#6B7280" }} />
          </IconCircleBtn>
        </span>

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

        {/* User guide */}
        <IconCircleBtn
          aria-label="Open user guide"
          onClick={() => setGuideOpen(true)}
        >
          <HelpCircle style={{ width: 17, height: 17, color: "#6B7280" }} />
        </IconCircleBtn>

      </div>
    </div>
    <UserGuideSheet open={guideOpen} onOpenChange={setGuideOpen} />
    </>
  );
}

function IconCircleBtn({
  children,
  "aria-label": ariaLabel,
  onClick,
}: {
  children: React.ReactNode;
  "aria-label": string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
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
  onNavigate,
}: {
  stats: HeaderStats;
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
      className="vrd-header-meta"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
        fontSize: 13,
        fontWeight: 500,
        color: "#374151",
      }}
    >
      <MetaItem
        value={formatCount(stats.total)}
        label="findings"
        onClick={() => onNavigate("vulnerabilities")}
      />
      <span className="vrd-header-meta-dot" style={dotStyle} aria-hidden="true" />
      <MetaItem
        value={formatCount(stats.overdue)}
        label="overdue"
        valueColor="#DC2626"
        onClick={() => onNavigate("vulnerabilities")}
      />
      <span className="vrd-header-meta-dot" style={dotStyle} aria-hidden="true" />
      <MetaItem
        value={formatCount(stats.priority1)}
        label="Priority 1"
        valueColor="#DC2626"
        onClick={() => onNavigate("vulnerabilities")}
      />
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
      className="vrd-stat-card"
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
        padding: "14px 18px 12px 18px",
        flex: 1,
        minWidth: 0,
        minHeight: 122,
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
          marginBottom: 8,
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
          fontSize: 32,
          fontWeight: 700,
          color: "#111827",
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
          margin: "0 0 8px",
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
  noRemediationDate: number;
  awaitingScan: number;
  riskAccepted: number;
  findingsMissingPlan: number;
  validationPendingOverThreshold: number;
  completedButNotValidated: number;
}

interface DashboardPageProps {
  stats: DashboardStats;
  onNavigate: (page: Page) => void;
  vulnerabilities: Vulnerability[];
  /** Set a grid filter preset and navigate to the Vulnerabilities page. */
  onApplyFilterPreset: (preset: FilterPresetId) => void;
}

type Dimension = "application" | "source" | "owner";

const DIMENSION_TITLES: Record<Dimension, string> = {
  application: "Findings by Application",
  source: "Findings by Source",
  owner: "Findings by Owner",
};

const TRIAGE_STATUS_TO_PRESET: Record<TriageStatus, FilterPresetId> = {
  "Awaiting Disposition": "awaitingDisposition",
  "In Progress": "inProgress",
  "Pending Clear Scan": "pendingClearScan",
  Resolved: "resolved",
};

/** Truncate long labels (app names, full owner names) for the X-axis. */
function shortDimensionLabel(value: string): string {
  if (value.length <= 14) return value;
  return value.slice(0, 13) + "…";
}

function DashboardPage({ stats, onNavigate, vulnerabilities, onApplyFilterPreset }: DashboardPageProps) {
  const dashboardSettings = DEFAULT_DASHBOARD_SETTINGS;
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
    <div className="vrd-page-content" style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }} aria-label="Dashboard">
      {/* PRIMARY TIER — full-weight headline KPIs (the daily workload). */}
      <div className="text-xs uppercase tracking-widest text-slate-400 font-medium mb-2">
        Workload
      </div>
      <section
        className="vrd-stat-row"
        style={{ display: "flex", gap: 12, alignItems: "stretch" }}
        aria-label="Workload — primary triage-status KPIs"
      >
        {STAT_CARDS.map((card) => {
          // Each primary card's triageStatus maps 1:1 to a filter preset so
          // clicking the card scopes the grid to that status (instead of
          // navigating to an unfiltered grid). onApplyFilterPreset already
          // sets currentPage="vulnerabilities", so we don't also call
          // onNavigate — doing so would queue a redundant state update.
          const preset = card.triageStatus
            ? TRIAGE_STATUS_TO_PRESET[card.triageStatus]
            : null;
          return (
            <StatCard
              key={card.label}
              {...card}
              onNavigate={(page) => {
                if (preset) onApplyFilterPreset(preset);
                else onNavigate(page);
              }}
            />
          );
        })}
      </section>

      {/* Divider separating primary headline KPIs from the lighter
          secondary indicator tier — visually splits "workload" from "signals". */}
      <div className="h-px bg-slate-200 my-3" role="separator" aria-hidden="true" />

      {/* SECONDARY TIER — lighter risk-signal indicators. Compact cards
          (~70% height, text-2xl number, colored left border, no accent strip). */}
      <div className="text-xs uppercase tracking-widest text-slate-400 font-medium mb-2">
        Risk signals
      </div>
      <section
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3"
        aria-label="Risk signals — secondary indicators"
      >
        <NoRemediationDateCard
          count={stats.noRemediationDate}
          onClick={() => onApplyFilterPreset("noRemediationDate")}
        />
        <AwaitingScanCard
          count={stats.awaitingScan}
          onClick={() => onApplyFilterPreset("awaitingScan")}
        />
        <RiskAcceptedCard
          count={stats.riskAccepted}
          onClick={() => onApplyFilterPreset("riskAccepted")}
        />
      </section>

      {/* Action Required — full-width, elevated (amber tint + border) so it
          reads as the most urgent thing on the page. Stripped down to only
          threshold-based items; status counts moved to secondary cards above. */}
      <section className="mb-3" aria-label="Action required">
        <ActionRequiredPanel
          settings={dashboardSettings}
          counts={{
            validationPendingOverThreshold: stats.validationPendingOverThreshold,
          }}
          onSelectPreset={onApplyFilterPreset}
        />
      </section>

      {/* SLA Compliance + Remediation Trend — paired charts. SLA is the
          compliance signal (must read at-a-glance); Trend is historical
          context. Sit side-by-side; stacks on tablet via .vrd-ranked-row. */}
      <section
        className="vrd-ranked-row mb-3"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        aria-label="SLA compliance and remediation trend"
      >
        <div
          className="vrd-chart-card"
          style={{
            background: "#F9FAFB",
            borderRadius: CARD_RADIUS,
            boxShadow: CARD_SHADOW,
            padding: "14px 18px",
            display: "flex",
            flexDirection: "column",
            minHeight: 280,
          }}
        >
          <div className="flex items-center justify-between mb-2.5 gap-2">
            <span className="text-[15px] font-semibold text-slate-900 flex items-center gap-2">
              <span className="w-[30px] h-[30px] rounded-full bg-white flex items-center justify-center shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
                <CheckCircle2 className="w-4 h-4 text-slate-500" aria-hidden="true" />
              </span>
              SLA Compliance
            </span>
            <span className="text-[11px] text-slate-400">By priority</span>
          </div>
          <div className="flex-1 min-h-0 flex flex-col">
            <SlaComplianceChart />
          </div>
        </div>

        <div
          className="vrd-chart-card"
          style={{
            background: "#F9FAFB",
            borderRadius: CARD_RADIUS,
            boxShadow: CARD_SHADOW,
            padding: "14px 18px",
            display: "flex",
            flexDirection: "column",
            minHeight: 280,
          }}
        >
          <div className="flex items-center justify-between mb-2 gap-2">
            <span className="text-[15px] font-semibold text-slate-900 flex items-center gap-2">
              <span className="w-[30px] h-[30px] rounded-full bg-white flex items-center justify-center shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
                <TrendingUp className="w-4 h-4 text-slate-500" aria-hidden="true" />
              </span>
              Remediation Trend
            </span>
            <span className="text-[11px] text-slate-400">Last 12 weeks</span>
          </div>
          <div className="flex-1 min-h-0">
            <RemediationTrendChart />
          </div>
        </div>
      </section>

      {/* PRIORITY FINDINGS — the two ranked lists. Moved up from below the
          fold so users see the worst-of-the-worst items without scrolling. */}
      <div className="text-xs uppercase tracking-widest text-slate-400 font-medium mb-2">
        Priority findings
      </div>
      <section
        className="vrd-ranked-row mb-3"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        aria-label="Top exposures and unresolved findings"
      >
        <TopUnresolvedVulnerabilities />
        <EolExposures />
      </section>

      {/* What's Blocking Remediation — operational detail; placed directly
          above the App/Days-Open charts since it's chart-row context, not a
          status signal that belongs in the elevated attention zone. */}
      <section className="mb-3" aria-label="Remediation blockers">
        <BlockersStrip vulnerabilities={vulnerabilities} />
      </section>

      {/* Charts row — explicit height so the row doesn't fight the EOL widget
          below for vertical space. */}
      <section
        className="vrd-charts-row"
        style={{ display: "flex", gap: 12, alignItems: "stretch", marginBottom: 10, height: 380, flexShrink: 0 }}
        aria-label="Data visualizations"
      >
        {/* Left: Source bar chart (60%) */}
        <div
          className="vrd-chart-card"
          style={{ flex: "0 0 60%", ...cardStyle, background: "#F9FAFB", padding: "14px 18px", display: "flex", flexDirection: "column", minHeight: 0 }}
        >
          <div
            className="vrd-chart-toolbar"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
              gap: 8,
            }}
          >
            <span className="vrd-chart-title" style={{ fontSize: 15, fontWeight: 600, color: "#111827", display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", flexShrink: 0 }}>
                <BarChart3 style={{ width: 16, height: 16, color: "#6B7280" }} aria-hidden="true" />
              </div>
              <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {DIMENSION_TITLES[dimension]}
              </span>
            </span>
            <div style={{ display: "flex", gap: 8, flexShrink: 0, flexWrap: "wrap" }}>
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
                        fontSize: 12,
                        fontWeight: 500,
                        padding: "4px 10px",
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
                      fontSize: 12,
                      fontWeight: 500,
                      padding: "4px 12px",
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
          <div className="vrd-chart-summary" style={{ display: "flex", gap: 28, marginBottom: 4, flexWrap: "wrap" }}>
            <div>
              <div
                className="vrd-chart-summary-num"
                style={{
                  fontSize: 30,
                  fontWeight: 800,
                  color: "#111827",
                  lineHeight: 1,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {formatCount(openClosed.open)}
              </div>
              <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>
                Open
                <span style={{ color: "#22C55E", marginLeft: 8, fontWeight: 600 }}>
                  ▲ 4.1%
                </span>
              </div>
            </div>
            <div>
              <div
                className="vrd-chart-summary-num"
                style={{
                  fontSize: 30,
                  fontWeight: 800,
                  color: "#6B7280",
                  lineHeight: 1,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {formatCount(openClosed.closed)}
              </div>
              <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>
                Closed
                <span style={{ color: "#22C55E", marginLeft: 8, fontWeight: 600 }}>
                  ▼ 2%
                </span>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, minHeight: 0 }}>
            <SourceBarChart
              data={chartData}
              tickFormatter={dimension === "source" ? undefined : shortDimensionLabel}
              barSize={dimension === "source" ? 28 : 22}
            />
          </div>
        </div>

        {/* Right: Days Open donut (40% minus gap) */}
        <div
          className="vrd-chart-card"
          style={{
            flex: "0 0 calc(40% - 6px)",
            ...cardStyle,
            background: "#F9FAFB",
            padding: "14px 18px",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          <div
            className="vrd-chart-toolbar"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 4,
              gap: 8,
            }}
          >
            <span className="vrd-chart-title" style={{ fontSize: 15, fontWeight: 600, color: "#111827", display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", flexShrink: 0 }}>
                <Clock style={{ width: 16, height: 16, color: "#6B7280" }} aria-hidden="true" />
              </div>
              Days Open
            </span>
            <button
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: "#6B7280",
                background: "none",
                border: "1px solid #E5E7EB",
                borderRadius: 6,
                padding: "4px 10px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              This Report
              <ChevronDown style={{ width: 14, height: 14 }} aria-hidden="true" />
            </button>
          </div>
          <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
            <DaysOpenChart data={DAYS_OPEN_DATA} />
          </div>
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
  stats: { total: number };
  filterPreset: FilterPresetId | null;
  onClearFilterPreset: () => void;
}

function VulnerabilitiesPage({
  vulnerabilities,
  selectedVuln,
  sheetOpen,
  onRowSelected,
  onSheetChange,
  onSave,
  stats,
  filterPreset,
  onClearFilterPreset,
}: VulnerabilitiesPageProps) {
  return (
    <div
      className="vrd-vuln-page-card"
      style={{
        background: "#fff",
        borderRadius: CARD_RADIUS,
        border: "none",
        boxShadow: CARD_SHADOW,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        // Fill remaining vertical space inside <main> so the grid below can
        // take flex-1 and reach the bottom of the viewport.
        flex: 1,
        minHeight: 0,
      }}
    >
      {/* Slim inner header — fixed height */}
      <div
        className="vrd-vuln-page-header"
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
          All Findings
        </h2>
        <p style={{ fontSize: 13, color: "#6B7280", margin: "3px 0 0" }}>
          {formatCount(stats.total)} records total
        </p>
      </div>

      {/* Toolbar + grid — becomes the flex container that hosts the grid.
          flex:1 + minHeight:0 + flexDirection:column lets the grid inside
          claim every remaining pixel and show its own internal scrollbar. */}
      <div
        className="vrd-vuln-page-body"
        style={{
          padding: "14px 20px 16px",
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <AgGridTriageTable
          vulnerabilities={vulnerabilities}
          onRowSelected={onRowSelected}
          selectedVuln={selectedVuln}
          sheetOpen={sheetOpen}
          onSheetChange={onSheetChange}
          onSave={onSave}
          filterPreset={filterPreset}
          settings={DEFAULT_DASHBOARD_SETTINGS}
          onClearFilterPreset={onClearFilterPreset}
        />
      </div>
    </div>
  );
}

// ── App Shell ──────────────────────────────────────────────────────────────────

export default function App() {
  // Work Queue (the findings/vulnerabilities page) is the default landing page.
  const [currentPage, setCurrentPage] = useState<Page>("vulnerabilities");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedVuln, setSelectedVuln] = useState<Vulnerability | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  // Pending preset is set from the dashboard cards / Action Required rows and
  // consumed by the Vulnerabilities page when it mounts the grid.
  const [filterPreset, setFilterPreset] = useState<FilterPresetId | null>(null);

  const viewport = useViewport();
  const isCompact = viewport !== "desktop"; // mobile + tablet share the drawer treatment

  // Auto-close the drawer if the viewport grows back to desktop, so state stays clean.
  useEffect(() => {
    if (!isCompact && drawerOpen) setDrawerOpen(false);
  }, [isCompact, drawerOpen]);

  // Lock the underlying scroll when drawer is open (mobile UX).
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.querySelector<HTMLDivElement>(".src-dashboard");
    if (!root) return;
    if (drawerOpen) root.classList.add("vrd-drawer-open");
    else root.classList.remove("vrd-drawer-open");
  }, [drawerOpen]);

  const sidebarWidth = isSidebarCollapsed ? 104 : 354;
  // Desktop only: 20px left offset + sidebar width + 20px gap before content.
  const contentMarginLeft = isCompact ? 0 : 20 + sidebarWidth + 20;

  const stats = DASHBOARD_STATS;

  const onNavigate = useCallback((page: Page) => setCurrentPage(page), []);

  const onApplyFilterPreset = useCallback((preset: FilterPresetId) => {
    setFilterPreset(preset);
    setCurrentPage("vulnerabilities");
  }, []);

  const onClearFilterPreset = useCallback(() => setFilterPreset(null), []);

  const onRowSelected = useCallback((v: Vulnerability) => {
    setSelectedVuln(v);
    setSheetOpen(true);
  }, []);

  const onSave = useCallback((v: Vulnerability) => setSelectedVuln(v), []);

  return (
    <>
      <style>{KEYFRAMES}</style>

      {/* Sidebar — fixed on desktop, off-canvas drawer below 1024px */}
      <Sidebar
        collapsed={isSidebarCollapsed}
        activePage={currentPage}
        onNavigate={onNavigate}
        onToggle={() => setIsSidebarCollapsed((v) => !v)}
        mode={isCompact ? "drawer" : "fixed"}
        drawerOpen={drawerOpen}
        onDrawerClose={() => setDrawerOpen(false)}
      />

      {/* Scrollable content area */}
      <div
        className="vrd-content-area"
        style={{
          marginLeft: contentMarginLeft,
          transition: "margin-left 250ms ease",
          height: "100dvh",
          overflowY: "auto",
          overflowX: "hidden",
          background: "#F7F8FA",
          fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          padding: "16px 20px",
        }}
      >
        {/* Floating header card */}
        <HeaderCard
          stats={stats}
          onNavigate={onNavigate}
          showMenuButton={isCompact}
          onMenuClick={() => setDrawerOpen(true)}
        />

        {/* Page content */}
        <main
          id="main-content"
          className="vrd-main-content"
          tabIndex={-1}
          style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}
        >
          {currentPage === "dashboard" ? (
            <DashboardPage
              stats={stats}
              onNavigate={onNavigate}
              vulnerabilities={mockVulnerabilities}
              onApplyFilterPreset={onApplyFilterPreset}
            />
          ) : (
            <VulnerabilitiesPage
              vulnerabilities={mockVulnerabilities}
              selectedVuln={selectedVuln}
              sheetOpen={sheetOpen}
              onRowSelected={onRowSelected}
              onSheetChange={setSheetOpen}
              onSave={onSave}
              stats={stats}
              filterPreset={filterPreset}
              onClearFilterPreset={onClearFilterPreset}
            />
          )}
        </main>

        {/* Bottom breathing room */}
        <div style={{ height: 4, flexShrink: 0 }} />
      </div>

      {/* ARIA live region */}
      <div aria-live="polite" className="sr-only" id="grid-status" />
    </>
  );
}
