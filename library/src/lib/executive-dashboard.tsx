
import { useState, useMemo, useCallback, useEffect } from "react";
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
  Menu,
  X as XIcon,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./components/ui/popover";
import { AgGridTriageTable } from "./components/executive/ag-grid-table";
import { SourceBarChart, DaysOpenChart, RemediationTrendChart, SlaComplianceChart } from "./components/dashboard/charts";
import { BlockersStrip } from "./components/dashboard/blockers-strip";
import { mockVulnerabilities, CIO_TEAMS } from "./lib/mock-data";
import type { Vulnerability, TriageStatus } from "./lib/types";
import { formatCount } from "./lib/utils";
import { useViewport } from "./lib/use-viewport";
import {
  DASHBOARD_STATS,
  SOURCE_CHART_OPEN,
  SOURCE_CHART_ALL,
  APPLICATION_CHART_OPEN,
  APPLICATION_CHART_ALL,
  OWNER_CHART_OPEN,
  OWNER_CHART_ALL,
  DAYS_OPEN_DATA,
} from "./lib/executive-data";

// ── Animations & responsive rules ──────────────────────────────────────────────
// All styles scoped under `.src-dashboard` so they don't leak when this app is
// embedded inside another monorepo's global stylesheet.

const KEYFRAMES = `
  /* Scoped border + outline defaults — equivalent of the v4 globals.css
     @layer base rule, but as raw CSS so the host's Tailwind config isn't
     required to apply it. */
  .src-dashboard *, .src-dashboard *::before, .src-dashboard *::after {
    border-color: var(--border);
    outline-color: color-mix(in oklab, var(--ring) 50%, transparent);
  }
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

  /* AG Grid resizes its own height; ensure the wrapper doesn't blow past viewport */
  @media (max-width: 1023px) {
    .src-dashboard .vrd-ag-grid { height: min(calc(100dvh - 320px), 70vh) !important; }
  }
  @media (max-width: 767px) {
    .src-dashboard .vrd-ag-grid { height: min(calc(100dvh - 360px), 65vh) !important; min-height: 320px !important; }
  }

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
  /** "fixed" = desktop docked sidebar; "drawer" = off-canvas mobile/tablet drawer. */
  mode: "fixed" | "drawer";
  drawerOpen: boolean;
  onDrawerClose: () => void;
}

const NAV_ITEMS = [
  { id: "dashboard" as const, label: "Dashboard", Icon: LayoutDashboard },
  { id: "vulnerabilities" as const, label: "Vulnerabilities", Icon: ShieldAlert },
  { id: "_remediation", label: "Remediation", Icon: Wrench },
  { id: "_reports", label: "Reports", Icon: BarChart3 },
  { id: "_settings", label: "Settings", Icon: Settings },
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
              Vulnerability Remediation
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
          Menu
        </div>
      )}

      {/* Nav items */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: visualCollapsed ? "0 4px" : "0" }}>
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
  showMenuButton: boolean;
  onMenuClick: () => void;
}

function HeaderCard({
  selectedCio,
  onSelectCio,
  stats,
  onNavigate,
  showMenuButton,
  onMenuClick,
}: HeaderCardProps) {
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
            <MetaRow
              stats={stats}
              department={department}
              onNavigate={onNavigate}
            />
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

        {/* CIO selector */}
        <Popover open={cioOpen} onOpenChange={setCioOpen}>
          <PopoverTrigger asChild>
            <button
              className="vrd-header-cio-btn"
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
              aria-label={`Select CIO team. Current: ${selectedCio.name}`}
            >
              <Avatar initials={initials} size={32} />
              <span
                className="vrd-header-cio-name"
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
                className="vrd-header-cio-chevron"
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
        label="vulnerabilities"
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
      <span className="vrd-header-meta-dot" style={dotStyle} aria-hidden="true" />
      <span className="vrd-header-meta-dept" style={{ color: "#6B7280" }}>{department}</span>
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
    <div className="vrd-page-content" style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }} aria-label="Dashboard">
      {/* Stat cards */}
      <section
        className="vrd-stat-row"
        style={{ display: "flex", gap: 12, marginBottom: 10, alignItems: "stretch" }}
        aria-label="Summary statistics"
      >
        {STAT_CARDS.map((card) => (
          <StatCard key={card.label} {...card} onNavigate={onNavigate} />
        ))}
      </section>

      {/* Blockers rollup — turns triage decisions into org-level visibility */}
      <section style={{ marginBottom: 10 }} aria-label="Remediation blockers">
        <BlockersStrip vulnerabilities={vulnerabilities} />
      </section>

      {/* Charts row */}
      <section
        className="vrd-charts-row"
        style={{ display: "flex", gap: 12, alignItems: "stretch", marginBottom: 10, flex: 1, minHeight: 0 }}
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

      {/* Second charts row — Remediation Trend + SLA Compliance */}
      <section
        className="vrd-charts-row"
        style={{ display: "flex", gap: 12, alignItems: "stretch", flex: 1, minHeight: 0 }}
        aria-label="Trend and SLA analytics"
      >
        {/* Remediation Trend */}
        <div className="vrd-chart-card" style={{ flex: "0 0 55%", ...cardStyle, background: "#F9FAFB", padding: "14px 18px", display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div
            className="vrd-chart-toolbar"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
              gap: 8,
            }}
          >
            <span className="vrd-chart-title" style={{ fontSize: 15, fontWeight: 600, color: "#111827", display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", flexShrink: 0 }}>
                <TrendingUp style={{ width: 16, height: 16, color: "#6B7280" }} aria-hidden="true" />
              </div>
              Remediation Trend
            </span>
            <span style={{ fontSize: 11, color: "#9CA3AF" }}>Last 12 weeks</span>
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <RemediationTrendChart />
          </div>
        </div>

        {/* SLA Compliance */}
        <div className="vrd-chart-card" style={{ flex: "0 0 calc(45% - 6px)", ...cardStyle, background: "#F9FAFB", padding: "14px 18px", display: "flex", flexDirection: "column", minHeight: 0 }}>
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
            <span className="vrd-chart-title" style={{ fontSize: 15, fontWeight: 600, color: "#111827", display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.08)", flexShrink: 0 }}>
                <CheckCircle2 style={{ width: 16, height: 16, color: "#6B7280" }} aria-hidden="true" />
              </div>
              SLA Compliance
            </span>
            <span style={{ fontSize: 11, color: "#9CA3AF" }}>By priority</span>
          </div>
          <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
            <SlaComplianceChart />
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
      className="vrd-vuln-page-card"
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
          All Vulnerabilities
        </h2>
        <p style={{ fontSize: 13, color: "#6B7280", margin: "3px 0 0" }}>
          {selectedCio.name} · {department} · {formatCount(stats.total)} records total
        </p>
      </div>

      {/* Toolbar + grid */}
      <div className="vrd-vuln-page-body" style={{ padding: "14px 20px 20px" }}>
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

export function ExecutiveDashboard() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCio, setSelectedCio] = useState(CIO_TEAMS[0]!);
  const [selectedVuln, setSelectedVuln] = useState<Vulnerability | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

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
          /* font: provided by host via Tailwind font-sans utility */
          display: "flex",
          flexDirection: "column",
          gap: 12,
          padding: "16px 20px",
        }}
      >
        {/* Floating header card */}
        <HeaderCard
          selectedCio={selectedCio}
          onSelectCio={setSelectedCio}
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
        <div style={{ height: 4, flexShrink: 0 }} />
      </div>

      {/* ARIA live region */}
      <div aria-live="polite" className="sr-only" id="grid-status" />
    </>
  );
}
