"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  LayoutDashboard,
  ShieldAlert,
  Bell,
  Search,
  Filter,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ScanSearch,
  AlertCircle,
  TrendingUp,
  BarChart3,
  Users,
  Eye,
  ArrowUpRight,
  Keyboard,
  HelpCircle,
  CheckSquare,
  Edit3,
  Layers,
  PieChart,
  Download,
  Bookmark,
  MousePointerClick,
  ListChecks,
  Workflow,
  Columns3,
  BookOpen,
} from "lucide-react";
import type { ReactNode } from "react";

interface UserGuideSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SEVERITY_COLORS: Array<{ label: string; color: string; meaning: string }> = [
  { label: "Critical / Priority 1", color: "#DC2626", meaning: "Immediate action required — exploit available or actively used" },
  { label: "High / Priority 2", color: "#EA580C", meaning: "Significant risk — remediate within SLA window" },
  { label: "Medium / Priority 3", color: "#D97706", meaning: "Moderate risk — schedule remediation" },
  { label: "Low / Priority 4", color: "#65A30D", meaning: "Low priority — fix during routine maintenance" },
  { label: "Resolved", color: "#16A34A", meaning: "Finding closed and validated" },
];

const TRIAGE_STATUSES: Array<{ status: string; description: string; icon: typeof AlertCircle; color: string }> = [
  {
    status: "Awaiting Disposition",
    description: "New findings that have not yet been reviewed or assigned. Start here — set an owner and disposition.",
    icon: AlertCircle,
    color: "#EF4444",
  },
  {
    status: "In Progress",
    description: "Remediation work is underway. Once a disposition is set (other than False Positive) the finding lands here.",
    icon: Clock,
    color: "#F59E0B",
  },
  {
    status: "Pending Clear Scan",
    description: "Fix has been applied; awaiting a validation scan to confirm closure.",
    icon: ScanSearch,
    color: "#3B82F6",
  },
  {
    status: "Resolved",
    description: "Finding validated as remediated within the last 30 days.",
    icon: CheckCircle2,
    color: "#22C55E",
  },
];

const DISPOSITIONS: Array<{ name: string; description: string }> = [
  {
    name: "Fix",
    description: "Apply a patch or configuration change. Requires a requested patch window, expected remediation date, and CRQ #.",
  },
  {
    name: "Mitigate",
    description: "Reduce risk via a compensating control without fully patching. Same patch fields apply.",
  },
  {
    name: "Defer",
    description: "Delay remediation. Requires written justification, identified blockers, and a re-evaluation date.",
  },
  {
    name: "Accept Risk",
    description: "Formally accept the risk (ERP exception path). Requires justification, blockers, and re-evaluation date.",
  },
  {
    name: "False Positive",
    description: "The finding is invalid. Requires a reason explaining why it does not apply.",
  },
];

function Section({
  title,
  icon: Icon,
  children,
  id,
}: {
  title: string;
  icon: typeof HelpCircle;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section id={id} style={{ marginBottom: 24, scrollMarginTop: 90 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 10,
          paddingBottom: 8,
          borderBottom: "1px solid #F3F4F6",
        }}
      >
        <span
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: "#EFF6FF",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
          aria-hidden="true"
        >
          <Icon style={{ width: 15, height: 15, color: "#2563EB" }} />
        </span>
        <h3
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#111827",
            margin: 0,
            letterSpacing: "-0.005em",
          }}
        >
          {title}
        </h3>
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.6, color: "#374151" }}>{children}</div>
    </section>
  );
}

function SubHeading({ children }: { children: ReactNode }) {
  return (
    <h4
      style={{
        fontSize: 12,
        fontWeight: 700,
        color: "#111827",
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        margin: "14px 0 6px",
      }}
    >
      {children}
    </h4>
  );
}

function Paragraph({ children }: { children: ReactNode }) {
  return <p style={{ margin: "0 0 10px", color: "#374151" }}>{children}</p>;
}

function Term({ children }: { children: ReactNode }) {
  return <strong style={{ fontWeight: 600, color: "#111827" }}>{children}</strong>;
}

function List({ children }: { children: ReactNode }) {
  return (
    <ul style={{ margin: "0 0 10px", paddingLeft: 18, color: "#374151" }}>
      {children}
    </ul>
  );
}

function OrderedList({ children }: { children: ReactNode }) {
  return (
    <ol style={{ margin: "0 0 10px", paddingLeft: 20, color: "#374151" }}>
      {children}
    </ol>
  );
}

function Item({ children }: { children: ReactNode }) {
  return <li style={{ marginBottom: 4 }}>{children}</li>;
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd
      style={{
        display: "inline-block",
        padding: "1px 6px",
        fontSize: 11,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        background: "#F3F4F6",
        border: "1px solid #E5E7EB",
        borderRadius: 4,
        color: "#374151",
        lineHeight: 1.5,
      }}
    >
      {children}
    </kbd>
  );
}

function Callout({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "warn" }) {
  const palette =
    tone === "warn"
      ? { bg: "#FFFBEB", border: "#FDE68A", text: "#92400E" }
      : { bg: "#EFF6FF", border: "#BFDBFE", text: "#1E40AF" };
  return (
    <div
      style={{
        margin: "8px 0 12px",
        padding: "10px 12px",
        background: palette.bg,
        border: `1px solid ${palette.border}`,
        borderRadius: 8,
        fontSize: 12,
        color: palette.text,
        lineHeight: 1.5,
      }}
    >
      {children}
    </div>
  );
}

function DictEntry({
  term,
  meaning,
  impact,
}: {
  term: string;
  meaning: ReactNode;
  impact: ReactNode;
}) {
  return (
    <div
      style={{
        padding: "10px 12px",
        background: "#FFFFFF",
        border: "1px solid #F3F4F6",
        borderRadius: 8,
        marginBottom: 6,
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: "#111827",
          marginBottom: 4,
        }}
      >
        {term}
      </div>
      <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.5 }}>
        {meaning}
      </div>
      <div
        style={{
          marginTop: 6,
          paddingTop: 6,
          borderTop: "1px dashed #E5E7EB",
          fontSize: 11,
          color: "#6B7280",
          lineHeight: 1.5,
        }}
      >
        <span style={{ fontWeight: 600, color: "#2563EB" }}>Triage impact: </span>
        {impact}
      </div>
    </div>
  );
}

function DictGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <h4
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: "#111827",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          margin: "12px 0 8px",
        }}
      >
        {title}
      </h4>
      {children}
    </div>
  );
}

function TocLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      style={{
        display: "block",
        padding: "5px 8px",
        fontSize: 12,
        color: "#2563EB",
        textDecoration: "none",
        borderRadius: 6,
      }}
    >
      {label}
    </a>
  );
}

export function UserGuideSheet({ open, onOpenChange }: UserGuideSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="sm:max-w-2xl w-full overflow-y-auto"
        style={{ padding: 0 }}
      >
        <SheetHeader
          style={{
            padding: "20px 24px 16px",
            borderBottom: "1px solid #F3F4F6",
            background: "#FFFFFF",
            position: "sticky",
            top: 0,
            zIndex: 1,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "#EFF6FF",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
              aria-hidden="true"
            >
              <HelpCircle style={{ width: 20, height: 20, color: "#2563EB" }} />
            </span>
            <div style={{ minWidth: 0 }}>
              <SheetTitle style={{ fontSize: 17, fontWeight: 700, color: "#111827" }}>
                User Guide
              </SheetTitle>
              <SheetDescription style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                How to use the CIO Cockpit Dashboard
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div style={{ padding: "20px 24px 32px" }}>
          {/* ── Table of contents ── */}
          <nav
            aria-label="Guide contents"
            style={{
              marginBottom: 24,
              padding: "12px 14px",
              background: "#F9FAFB",
              border: "1px solid #F3F4F6",
              borderRadius: 10,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#6B7280",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 6,
              }}
            >
              On this page
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 0,
              }}
            >
              <TocLink href="#overview" label="Overview" />
              <TocLink href="#header" label="Header & top bar" />
              <TocLink href="#sidebar" label="Sidebar" />
              <TocLink href="#dashboard" label="Dashboard page" />
              <TocLink href="#findings" label="Findings page" />
              <TocLink href="#toolbar" label="All Findings toolbar" />
              <TocLink href="#selection" label="Selecting & bulk updates" />
              <TocLink href="#detail" label="Detail panel" />
              <TocLink href="#triage" label="How to triage" />
              <TocLink href="#dictionary" label="Field dictionary" />
              <TocLink href="#aggrid" label="Grid features" />
              <TocLink href="#grouping" label="Grouping & pivoting" />
              <TocLink href="#views" label="Saved views" />
              <TocLink href="#export" label="Exporting" />
              <TocLink href="#severity" label="Severity & priorities" />
              <TocLink href="#statuses" label="Triage statuses" />
              <TocLink href="#shortcuts" label="Keyboard shortcuts" />
            </div>
          </nav>

          {/* ── Overview ── */}
          <Section title="Overview" icon={Eye} id="overview">
            <Paragraph>
              The <Term>Security Risk Console</Term> is a CIO-level dashboard for
              triaging and remediating security findings across your portfolio.
              Findings include both <Term>vulnerabilities</Term> (CVEs) and{" "}
              <Term>end-of-life (EOL)</Term> exposures.
            </Paragraph>
            <Paragraph>
              The application has two pages: <Term>Dashboard</Term> for at-a-glance
              KPIs and trends, and <Term>Findings</Term> for the full inventory
              grid where day-to-day triage work happens.
            </Paragraph>
          </Section>

          {/* ── Header ── */}
          <Section title="Header & Top Bar" icon={Users} id="header">
            <List>
              <Item>
                <Term>Title & meta row</Term> — shows the current scope plus
                totals for findings, overdue items, and Priority 1 items. Click
                any metric to jump straight to the Findings list filtered by it.
              </Item>
              <Item>
                <Term>
                  <Search style={{ width: 12, height: 12, display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                  Search
                </Term>{" "}
                — open the search dialog (desktop).
              </Item>
              <Item>
                <Term>
                  <Bell style={{ width: 12, height: 12, display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                  Notifications
                </Term>{" "}
                — red badge shows the count of Priority 1 findings requiring
                attention.
              </Item>
              <Item>
                <Term>
                  <HelpCircle style={{ width: 12, height: 12, display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                  User Guide
                </Term>{" "}
                — opens this guide.
              </Item>
              <Item>
                <Term>CIO selector</Term> — switch which CIO team's findings are
                shown. The selection scopes the entire dashboard and the Findings
                grid. Pick <Term>All CIOs</Term> at the top of the dropdown to
                clear the scope and see every team's findings.
              </Item>
              <Item>
                <Term>Lever selector</Term> — scope the dashboard and Findings
                grid to a single remediation lever (CTI / APS&E / EET-Managed,
                Assessment Underway, CIO E2E, or CIO / CTI Engagement). Pick{" "}
                <Term>All Levers</Term> to clear the scope.
              </Item>
            </List>
          </Section>

          {/* ── Sidebar ── */}
          <Section title="Sidebar Navigation" icon={LayoutDashboard} id="sidebar">
            <List>
              <Item>
                <Term>Dashboard</Term> — KPIs, charts, and ranked priority lists.
              </Item>
              <Item>
                <Term>Findings</Term> — full inventory grid with filtering,
                sorting, selection, bulk updates, and detail editing.
              </Item>
              <Item>
                Remediation, Reports, and Settings are reserved for future
                releases.
              </Item>
              <Item>
                Collapse the sidebar with the toggle at the bottom to give the
                main content more room. On smaller screens the sidebar becomes
                an off-canvas drawer accessed via the menu button in the header.
              </Item>
            </List>
          </Section>

          {/* ── Dashboard ── */}
          <Section title="Dashboard Page" icon={BarChart3} id="dashboard">
            <Paragraph>The dashboard is organised into tiers, top to bottom:</Paragraph>
            <List>
              <Item>
                <Term>Workload</Term> — four primary KPI cards covering the
                daily triage queue (Awaiting Disposition, In Progress, Pending
                Clear Scan, Resolved). Click any card to deep-link into the
                Findings grid filtered to that status.
              </Item>
              <Item>
                <Term>Risk Signals</Term> — three secondary cards (No Remediation
                Date, Awaiting Scan, Risk Accepted) that highlight items needing
                process intervention. Click to apply the matching filter.
              </Item>
              <Item>
                <Term>Action Required</Term> — the amber-tinted panel surfaces
                threshold-based items, such as findings stuck in validation past
                the SLA. Click a row to open the matching filtered view.
              </Item>
              <Item>
                <Term>SLA Compliance & Remediation Trend</Term> — compliance by
                priority next to a 12-week historical trend.
              </Item>
              <Item>
                <Term>Priority Findings</Term> — Top Unresolved findings and EOL
                Exposures side-by-side, so the worst-of-the-worst sit above the
                fold.
              </Item>
              <Item>
                <Term>Remediation Blockers</Term> — the strip below the ranked
                lists shows what is currently blocking remediation work.
              </Item>
              <Item>
                <Term>Charts row</Term> — findings broken down by Application,
                Source, or Owner (toggle), plus a Days Open distribution. Switch
                between Open and All findings with the Open/All toggle.
              </Item>
            </List>
          </Section>

          {/* ── Findings page ── */}
          <Section title="Findings Page" icon={ShieldAlert} id="findings">
            <Paragraph>
              The Findings page hosts a full-featured AG Grid Enterprise table.
              Every record is a finding — either a CVE-based vulnerability or an
              EOL exposure.
            </Paragraph>

            <Paragraph>
              See <a href="#toolbar" style={{ color: "#2563EB" }}>All Findings
              Toolbar</a> below for a button-by-button walkthrough.
            </Paragraph>

            <SubHeading>Active filter chips</SubHeading>
            <Paragraph>
              When any filter is active (preset, multi-select, search, or the
              header CIO / Lever scope), a row of removable chips appears under
              the toolbar. Click an <Kbd>×</Kbd> on a chip to remove that single
              value, or click <Term>Clear all</Term> to reset every filter
              including the header scopes.
            </Paragraph>

            <SubHeading>Status bar at the bottom</SubHeading>
            <Paragraph>
              The grid footer shows Total rows, Filtered rows, Selected rows,
              and live aggregations (sum/avg/count) over your current range or
              cell selection.
            </Paragraph>
          </Section>

          {/* ── All Findings toolbar ── */}
          <Section title="All Findings Toolbar — Button by Button" icon={LayoutDashboard} id="toolbar">
            <Paragraph>
              The toolbar at the top of the Findings page packs a lot of
              controls into one row. Here is what each one does, left to right.
            </Paragraph>

            <SubHeading>My Views dropdown</SubHeading>
            <Paragraph>
              The first button on the toolbar shows the current view's name
              (or <em>All findings</em> if none is active) with a chevron. An{" "}
              <span
                style={{
                  display: "inline-block",
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#F97316",
                  verticalAlign: "middle",
                }}
                aria-hidden="true"
              />{" "}
              <Term>orange dot</Term> and <em>(modified)</em> suffix appear
              whenever the live grid state differs from the saved snapshot.
            </Paragraph>
            <Paragraph>Clicking the button opens a popover with:</Paragraph>
            <List>
              <Item>
                <Term>Search views</Term> input at the top — type to filter
                both groups by name or description.
              </Item>
              <Item>
                <Term>My Views</Term> section — your personal saved views.
                Each row shows the name, optional description, a yellow{" "}
                <Term>★ star</Term> if it's your default, and a badge with the
                view's filter count.
              </Item>
              <Item>
                <Term>Built-in Views</Term> section — read-only views that
                ship with the app (e.g. P1 Overdue, Awaiting Triage).
              </Item>
              <Item>
                <Term>Create new view from current filters</Term> at the
                bottom — opens the Save dialog using whatever state you have
                right now.
              </Item>
            </List>
            <Callout>
              Clicking any row instantly applies that view — filters, sort,
              column visibility, column order, and search term all snap to
              the saved snapshot.
            </Callout>

            <SubHeading>Search box</SubHeading>
            <Paragraph>
              Type to quick-filter rows across CVE, host, application, title,
              workstream, and owner. Click the <Kbd>×</Kbd> inside the search
              field to clear it.
            </Paragraph>

            <SubHeading>Filter chip buttons</SubHeading>
            <Paragraph>
              Seven multi-select popovers sit next to the search box:{" "}
              <em>Source Status</em>, <em>Triage Status</em>,{" "}
              <em>Severity</em>, <em>Workstream</em>, <em>Source</em>,{" "}
              <em>Operating Env</em>, <em>Past Due</em>. Clicking opens a
              checklist; a numeric badge on the button shows how many values
              are currently selected. The button turns from outlined to
              filled when active. Use the <em>Clear</em> link at the bottom of
              the popover to remove every value for that filter at once.
            </Paragraph>

            <SubHeading>Export… button</SubHeading>
            <Paragraph>
              Opens the <Term>Export Findings</Term> dialog where you pick
              format, scope, and exactly which columns to include. See{" "}
              <a href="#export" style={{ color: "#2563EB" }}>Exporting</a> for
              the dialog walkthrough.
            </Paragraph>

            <SubHeading>Compact / Comfortable button</SubHeading>
            <Paragraph>
              The <Term>density toggle</Term>. The button label shows the
              <em> mode you will switch to</em>, not the current mode:
            </Paragraph>
            <List>
              <Item>
                Button reads <Term>Compact</Term> → you are currently in
                Comfortable (36px rows). Click to shrink to 32px rows.
              </Item>
              <Item>
                Button reads <Term>Comfortable</Term> → you are currently in
                Compact. Click to expand rows back to 36px.
              </Item>
            </List>
            <Paragraph>
              Compact mode fits roughly 12% more rows on screen. The setting
              applies to the current session only.
            </Paragraph>

            <SubHeading>Excel button</SubHeading>
            <Paragraph>
              One-click download of the current grid as <em>.xlsx</em>. The
              file name uses today's date (e.g. <em>findings-2026-05-13.xlsx</em>).
              If you have rows selected via checkbox, the export contains{" "}
              <em>only the selected rows</em>; otherwise it exports every row
              currently visible after filters.
            </Paragraph>

            <SubHeading>CSV button</SubHeading>
            <Paragraph>
              Same as Excel but produces a comma-separated <em>.csv</em>{" "}
              file. Useful when feeding the data into another tool that
              prefers CSV.
            </Paragraph>

            <SubHeading>Save button (floppy-disk icon)</SubHeading>
            <Paragraph>
              <em>Overwrites the current saved view</em> with the live grid
              state. It is enabled only when both of these are true:
            </Paragraph>
            <List>
              <Item>You have unsaved changes (orange dot in the My Views button).</Item>
              <Item>The current view is user-created (built-in views are read-only).</Item>
            </List>
            <Paragraph>
              If the button is disabled, hover for a tooltip explaining why —
              either there are no unsaved changes, or you are on a built-in
              view (in which case use <em>Save as new view</em> from the
              three-dot menu instead).
            </Paragraph>

            <SubHeading>Three-dot button (More actions)</SubHeading>
            <Paragraph>Opens the view-management menu:</Paragraph>
            <List>
              <Item>
                <Term>Save as new view</Term> — always enabled. Opens a dialog
                with <em>Name</em> (required, max 50 chars),{" "}
                <em>Description</em> (optional, max 200 chars), and a{" "}
                <em>Set as my default view</em> checkbox.
              </Item>
              <Item>
                <Term>Rename</Term> — opens the same form with the current
                name and description pre-filled. Disabled for built-in views.
              </Item>
              <Item>
                <Term>Delete</Term> — destructive (red). Shows a confirmation
                dialog with the view name. Disabled for built-in views.
              </Item>
              <Item>
                <Term>Set as default</Term> — marks the current view as your
                default (yellow ★ star in the picker). It will auto-apply
                when you next open the Findings page. Disabled when the view
                is built-in or already the default.
              </Item>
              <Item>
                <Term>Reset to default</Term> — discards uncommitted changes
                and re-applies the saved snapshot of the current view.
                Disabled when there are no unsaved changes.
              </Item>
            </List>
            <Callout tone="warn">
              The Save and three-dot buttons sit on the <em>right</em> side
              of the toolbar; the My Views dropdown sits on the <em>left</em>.
              That left/right split is intentional — pick a view on the left,
              act on it on the right.
            </Callout>
          </Section>

          {/* ── Selection & bulk updates ── */}
          <Section title="Selecting Findings & Bulk Updates" icon={CheckSquare} id="selection">
            <SubHeading>Selecting rows</SubHeading>
            <List>
              <Item>
                Click the <Term>checkbox</Term> at the left of any row to select
                it. The checkbox column is pinned, so it stays visible while you
                scroll horizontally.
              </Item>
              <Item>
                Click the <Term>header checkbox</Term> to select / deselect every
                row currently visible after filters.
              </Item>
              <Item>
                Hold <Kbd>Shift</Kbd> and click a second checkbox to select a
                continuous range of rows.
              </Item>
              <Item>
                Hold <Kbd>Ctrl</Kbd> (or <Kbd>⌘</Kbd> on macOS) and click to
                add or remove individual rows without clearing the rest.
              </Item>
              <Item>
                Clicking a row body (anywhere except the checkbox or a link)
                opens the detail panel — it does <em>not</em> change selection.
              </Item>
            </List>

            <SubHeading>Bulk action bar</SubHeading>
            <Paragraph>
              As soon as at least one row is selected, a black <Term>bulk action
              bar</Term> slides up from the bottom of the screen. It contains:
            </Paragraph>
            <List>
              <Item>
                <Term>Assign Owner</Term> — reassign every selected row to a
                user from the dropdown.
              </Item>
              <Item>
                <Term>Set Disposition</Term> — apply Fix, Defer, Mitigate, Accept
                Risk, or False Positive in one click. If a finding is currently
                <em> Awaiting Disposition</em> its triage status automatically
                advances to <em>In Progress</em>.
              </Item>
              <Item>
                <Term>Export Selected</Term> — download only the selected rows
                as CSV.
              </Item>
              <Item>
                <Term>×</Term> — clear the selection and hide the bar.
              </Item>
            </List>
            <Callout tone="warn">
              Bulk Set Disposition does <em>not</em> capture justification or
              blockers — for <em>Defer</em> or <em>Accept Risk</em>, open each
              finding's detail panel afterward and complete the required fields.
            </Callout>

            <SubHeading>Quick single-row actions</SubHeading>
            <Paragraph>
              Right-click any cell to open the context menu:{" "}
              <Term>Copy</Term>, <Term>Copy with headers</Term>,{" "}
              <Term>Export</Term>, <Term>Filter by this value</Term>,{" "}
              <Term>Assign to me</Term>, and <Term>Set Disposition →</Term>{" "}
              submenu. On the CVE column you also get <em>Open CVE in NVD</em>;
              on the CRQ column, <em>Open CRQ in Remedy</em>.
            </Paragraph>
          </Section>

          {/* ── Detail panel ── */}
          <Section title="Finding Detail Panel" icon={Edit3} id="detail">
            <Paragraph>
              Click any row to slide the <Term>detail panel</Term> in from the
              right. The panel is the single place to read everything known
              about a finding and to edit triage fields.
            </Paragraph>

            <SubHeading>Panel layout</SubHeading>
            <List>
              <Item>
                <Term>Title row</Term> — CVE number (links to NVD), short title,
                a <Kbd>j</Kbd> / <Kbd>k</Kbd> pager for stepping through the
                current grid order, a shortcut popover (<Kbd>?</Kbd>), and a
                close button (<Kbd>Esc</Kbd>).
              </Item>
              <Item>
                <Term>Summary strip</Term> — quick-read chips for triage status,
                severity, days open, due date, owner, and key exposure flags
                (CISA, DMZ, public internet, etc).
              </Item>
              <Item>
                <Term>Triage panel</Term> — collapsible editor. Toggle with the
                Triage button in the footer or with <Kbd>t</Kbd>.
              </Item>
              <Item>
                <Term>Details tab</Term> — every read-only field grouped by
                section: identifiers, technology, host, ownership, dates, ERP
                exception data, scorecard, and reference IDs.
              </Item>
              <Item>
                <Term>Activity tab</Term> — chronological audit log with a count
                badge. Every triage save records <em>one entry per changed
                field</em> (with before / after values), so the trail shows
                exactly what moved.
              </Item>
              <Item>
                <Term>Footer</Term> — Triage toggle, Save / Cancel when the
                triage form is dirty, and last-saved metadata.
              </Item>
            </List>

            <Callout>
              If you have unsaved triage changes and try to close the panel or
              navigate to another finding, a confirmation dialog will offer to
              keep editing or discard.
            </Callout>
          </Section>

          {/* ── How to triage ── */}
          <Section title="How to Triage a Finding" icon={Workflow} id="triage">
            <Paragraph>
              Triage is the workflow that moves a finding from <em>Awaiting
              Disposition</em> all the way to <em>Resolved</em>. Here is the
              typical flow:
            </Paragraph>
            <OrderedList>
              <Item>
                Open the finding (click the row) and press <Kbd>t</Kbd> or click{" "}
                <Term>Triage</Term> in the footer to expand the editor.
              </Item>
              <Item>
                Set <Term>Assigned to</Term> — pick an owner from the dropdown
                or click <em>Assign to me</em>.
              </Item>
              <Item>
                Pick a <Term>Disposition</Term> (required). The form changes
                shape based on what you pick:
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    margin: "8px 0 4px",
                  }}
                >
                  {DISPOSITIONS.map((d) => (
                    <div
                      key={d.name}
                      style={{
                        padding: "8px 10px",
                        background: "#F9FAFB",
                        borderRadius: 8,
                        border: "1px solid #F3F4F6",
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                        {d.name}
                      </div>
                      <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                        {d.description}
                      </div>
                    </div>
                  ))}
                </div>
              </Item>
              <Item>
                Answer <Term>CTI Remediation</Term> (Yes / No, required).
              </Item>
              <Item>
                Fill in the conditional fields for your disposition (patch
                window, blockers, justification, etc.). <em>Save</em> stays
                disabled until required fields are complete.
              </Item>
              <Item>
                Click <Term>Save</Term>. The triage panel collapses and the
                finding's status updates. One audit entry is added to the
                Activity log for each field you changed (Disposition, CRQ #,
                Owner, etc.), each showing the old and new value.
              </Item>
              <Item>
                Use <Kbd>k</Kbd> (or the right-arrow button) to advance to the
                next finding without leaving the panel.
              </Item>
            </OrderedList>

            <Callout>
              Once a fix is applied, the finding moves to <em>Pending Clear
              Scan</em>. The next clean scan from the source system marks it{" "}
              <em>Resolved</em> automatically.
            </Callout>
          </Section>

          {/* ── Field dictionary ── */}
          <Section title="Field Dictionary" icon={BookOpen} id="dictionary">
            <Paragraph>
              Every field that appears on the <Term>Details</Term> tab of the
              detail panel, grouped by the section it lives in. Each entry
              explains what the field is and how it should shape triage
              decisions.
            </Paragraph>
            <Callout>
              The Details tab has a <Term>+ Show empty fields</Term> toggle
              at the top right. Many fields below are optional — turn the
              toggle on to see every slot even when blank.
            </Callout>

            <DictGroup title="Summary strip (always on top)">
              <DictEntry
                term="Severity"
                meaning={
                  <>
                    Priority 1–4 banding. P1 highlights with a red badge and{" "}
                    <AlertTriangle
                      style={{ width: 11, height: 11, display: "inline", verticalAlign: "middle" }}
                      aria-hidden="true"
                    />{" "}
                    icon. Derived from CVSS / consequence-model scoring.
                  </>
                }
                impact="Drives SLA target and remediation order. P1 must always be triaged first; P1 + Past Due triggers Action Required."
              />
              <DictEntry
                term="Triage Status"
                meaning="Where the finding sits in the workflow: Awaiting Disposition → In Progress → Pending Clear Scan → Resolved."
                impact="The single most important field. Moves automatically when you save a disposition or when a clean scan arrives."
              />
              <DictEntry
                term="Owner (Finding Owner / vulnOwner)"
                meaning="The named person accountable for remediation."
                impact="Required before active triage. Bulk-assignable from the action bar. An unassigned P1 is a process gap."
              />
              <DictEntry
                term="Due Date"
                meaning="The SLA-derived target date for remediation. Highlighted red with a Past due chip when overdue."
                impact="Past Due rows roll into the overdue count in the header and feed the SLA Compliance chart."
              />
              <DictEntry
                term="Days Open / Time to Resolve"
                meaning="Days since first observation. Switches label to Time to Resolve when the record is Resolved. Values over 365 days carry a warning icon."
                impact="Long-tail Days Open without progress is a triage smell — confirm there's an active CRQ or justification."
              />
              <DictEntry
                term="Environment (Operating Env)"
                meaning="In Production (red), Pre-Prod (yellow), or Contingency (grey)."
                impact="Production findings outrank Pre-Prod at the same priority — bump up the urgency."
              />
              <DictEntry
                term="Application"
                meaning="Full application name owning the asset."
                impact="Determines the application contact chain and which CIO scope the finding belongs to."
              />
            </DictGroup>

            <DictGroup title="Identification">
              <DictEntry
                term="GIS ID"
                meaning="Bank-internal identifier (the row key throughout the system)."
                impact="Quote this ID when escalating or filing tickets — it's the canonical reference."
              />
              <DictEntry
                term="Qualys ID"
                meaning="Numeric ID assigned by the Qualys scanner."
                impact="Use to cross-reference raw scan output and detection signatures."
              />
              <DictEntry
                term="CVE"
                meaning="MITRE CVE identifier, links to NVD. Absent for non-CVE findings such as EOL exposures."
                impact="Drives CVSS scoring, CISA KEV match, and exploit-availability checks. No CVE = treat as configuration/EOL finding."
              />
            </DictGroup>

            <DictGroup title="Asset & Exposure — Identity">
              <DictEntry
                term="FQDN"
                meaning="Fully-qualified domain name of the host."
                impact="Combined with Public-facing/DMZ flags determines blast radius."
              />
              <DictEntry
                term="IP Addresses"
                meaning="One or more bound IPs."
                impact="Helps confirm whether a finding is on a known internet-facing range."
              />
              <DictEntry
                term="OS Name"
                meaning="Operating system + version."
                impact="Drives patch path. EOL OS is a separate EOL exposure even when no CVE applies."
              />
              <DictEntry
                term="Device Type"
                meaning="Server, network device, container, etc."
                impact="Affects remediation playbook — patching a container differs from a bare-metal server."
              />
              <DictEntry
                term="Hosting Platform"
                meaning="BofA Cloud Standard / Static, Nextgen BMP, or other."
                impact="Determines which patch workstream owns delivery and what CRQ window applies."
              />
              <DictEntry
                term="Port"
                meaning="Listening port that exposes the vulnerable service."
                impact="If the port is firewalled off, mitigation may be enough without a full patch."
              />
            </DictGroup>

            <DictGroup title="Asset & Exposure — Exposure badges">
              <DictEntry
                term="Public-facing / Internal-only (isPublicInternetAccessible)"
                meaning="Whether the asset is reachable from the public internet."
                impact="Public-facing tilts the decision toward Fix and shortens acceptable patch windows."
              />
              <DictEntry
                term="DMZ / Not in DMZ (isDmz)"
                meaning="Whether the asset sits in the demilitarised zone."
                impact="DMZ assets are isolated but still exposed — treat as elevated risk relative to internal."
              />
              <DictEntry
                term="CISA-listed / Not CISA-listed (isCisa)"
                meaning="Match against CISA's Known Exploited Vulnerabilities (KEV) catalogue."
                impact="CISA-listed = active in-the-wild exploitation. Almost always escalates to Fix with the tightest window available."
              />
              <DictEntry
                term="On-site / Off-site (isOnSite)"
                meaning="Whether the asset is inside the bank's data centres."
                impact="Off-site assets carry higher residual risk because perimeter controls don't apply."
              />
              <DictEntry
                term="Security Zone"
                meaning="Internal network segmentation tier."
                impact="Higher-trust zones (e.g. payments back-end) demand faster remediation regardless of CVSS."
              />
            </DictGroup>

            <DictGroup title="Asset & Exposure — Cloud (when present)">
              <DictEntry
                term="Cloud Account ID"
                meaning="Cloud account / subscription / project ID hosting the resource."
                impact="Identifies which cloud team owns the fix and which compliance perimeter applies."
              />
              <DictEntry
                term="Resource ID"
                meaning="ARN, resource ID, or self-link of the affected cloud resource."
                impact="Needed in the CRQ; uniquely identifies the asset across cloud regions."
              />
              <DictEntry
                term="Resource Type"
                meaning="EC2 instance, S3 bucket, container image, etc."
                impact="Drives remediation playbook — image rebuilds differ from instance patching."
              />
            </DictGroup>

            <DictGroup title="Finding details">
              <DictEntry
                term="Description"
                meaning="Business-friendly summary of the finding."
                impact="Use when briefing application owners who aren't on the security side."
              />
              <DictEntry
                term="Technical Description"
                meaning="Engineering-level description of the underlying weakness."
                impact="Read before deciding between Fix and Mitigate — sometimes a compensating control is sufficient."
              />
              <DictEntry
                term="Technical Detail"
                meaning="Detection-time evidence: signature output, configuration excerpt, etc."
                impact="Helps confirm False Positive — if the detail does not match the asset's real configuration, FP is justified."
              />
              <DictEntry
                term="Vulnerability Findings"
                meaning="Raw text from the scanner / detection source."
                impact="Final source of truth when the structured fields disagree with what is in production."
              />
              <DictEntry
                term="Subcategory"
                meaning="Classification (e.g. Missing Patch, Misconfiguration, EOL Software)."
                impact="EOL Software dispositions almost never resolve via Fix in isolation — usually paired with Decommission."
              />
              <DictEntry
                term="Lever"
                meaning="Authoritative remediation lever — one of CTI/APS&E/EET-Managed Remediation, Assessment Underway, CIO E2E, or CIO/CTI Engagement. Every finding belongs to exactly one."
                impact="Tells you which team owns the work and the engagement model. Filter the grid by Lever (toolbar column filter or the header Lever selector) to focus on the queue you're responsible for."
              />
              <DictEntry
                term="Technology + Version"
                meaning="Software product and current version on the asset."
                impact="If the technology is end-of-support, escalate to an EOL workstream rather than patching."
              />
              <DictEntry
                term="Policy Name"
                meaning="Compliance / scanning policy that raised the finding."
                impact="Tells you which control framework the finding maps to (PCI, SOX, etc) and may dictate the SLA."
              />
              <DictEntry
                term="Remediation"
                meaning="Vendor or internal guidance on how to fix."
                impact="Copy-paste the suggested fix into the CRQ; saves the remediator a step."
              />
            </DictGroup>

            <DictGroup title="Status & Dates">
              <DictEntry
                term="Source Status"
                meaning="Open or Closed at the source system (Qualys, ESM, etc)."
                impact="A finding can stay Open at source but be Resolved in triage — for example after Accept Risk. Reconcile mismatches before closing out."
              />
              <DictEntry
                term="Date Observed"
                meaning="When the source first reported this finding."
                impact="Anchors Days Open and SLA timer. Suspect Date Observed if Days Open seems wrong."
              />
              <DictEntry
                term="Date Last Seen"
                meaning="Most recent scan that still saw the issue."
                impact="If Date Last Seen is older than the latest scan cycle, schedule a re-scan before closing."
              />
              <DictEntry
                term="Scheduled Fix Date"
                meaning="When remediation is currently scheduled to land."
                impact="Compared to Due Date — if scheduled past the due date, escalate the patch window."
              />
              <DictEntry
                term="Resolved Date"
                meaning="When the finding was marked Resolved."
                impact="Locks in the Time-to-Resolve metric on the SLA chart."
              />
            </DictGroup>

            <DictGroup title="Ownership — Application">
              <DictEntry
                term="Application Full Name"
                meaning="Long-form application name from the asset registry."
                impact="The authoritative application label; the grid's short name is derived from this."
              />
              <DictEntry
                term="Application ID"
                meaning="Application registry ID (numeric / alphanumeric)."
                impact="Use when querying the asset registry or filing CMDB updates."
              />
              <DictEntry
                term="Patch Category"
                meaning="Application's patch-cadence band (monthly, quarterly, ad-hoc, etc)."
                impact="Sets the realistic floor on remediation date — don't ask for a window the app cannot meet."
              />
              <DictEntry
                term="Runbook Owner"
                meaning="The team or person responsible for the application's operational runbook."
                impact="Escalation path when remediation is blocked on operational change."
              />
            </DictGroup>

            <DictGroup title="Ownership — Contacts">
              <DictEntry
                term="App Manager Contact + Network"
                meaning="Application manager and their network ID."
                impact="First point of escalation for prioritisation conversations."
              />
              <DictEntry
                term="App Support Contact + Network"
                meaning="Application support engineer and network ID."
                impact="Operational contact for executing remediations and validating scans."
              />
            </DictGroup>

            <DictGroup title="Ownership — Leadership">
              <DictEntry
                term="Technical Executive"
                meaning="The technical executive sponsor for the application."
                impact="Required when escalating for an exception or accept-risk decision."
              />
              <DictEntry
                term="CIO Display Name"
                meaning="The CIO whose org owns the application."
                impact="Scopes the entire dashboard — selecting this CIO in the header limits every page."
              />
              <DictEntry
                term="Operational CTO"
                meaning="Operational CTO for the asset's hosting domain."
                impact="Escalation for infrastructure-level fixes (network, OS, hypervisor)."
              />
            </DictGroup>

            <DictGroup title="Exceptions & Governance — ERP">
              <DictEntry
                term="ERP Scorecard Status"
                meaning="Current state on the Enterprise Risk Platform scorecard."
                impact="Indicates whether the finding is already in scope for executive risk reporting."
              />
              <DictEntry
                term="ERP Scorecard Status Details"
                meaning="Free-text detail explaining the scorecard state."
                impact="Read before opening a new exception — the explanation often lists what's already been tried."
              />
              <DictEntry
                term="ERP Scorecard Pending ID / Status / Expiry"
                meaning="In-flight ERP scorecard change request and its expected expiry."
                impact="A pending status often blocks bulk closure — wait for the scorecard refresh before acting."
              />
              <DictEntry
                term="ERP Exception ID"
                meaning="The exception record granting deferred-risk treatment."
                impact="Required when disposition is Defer or Accept Risk; without it, the risk is undocumented."
              />
              <DictEntry
                term="ERP Exception Status"
                meaning="Approved (green) or Pending (yellow)."
                impact="Defer / Accept Risk requires an Approved status — anything else is provisional."
              />
              <DictEntry
                term="ERP Exception Expiry"
                meaning="When the exception lapses."
                impact="On expiry, the finding re-opens as Awaiting Disposition. Plan re-triage at least a week before."
              />
              <DictEntry
                term="ERP Exception Risk Decision"
                meaning="The written risk decision (rationale)."
                impact="Reference text for the audit trail; reuse the language when filing similar exceptions."
              />
              <DictEntry
                term="ERP Exception BISO Status"
                meaning="Business Information Security Officer review state."
                impact="BISO sign-off is mandatory for Accept Risk on high-severity findings."
              />
              <DictEntry
                term="First / Second / Third Consequence Date"
                meaning="Escalating consequence milestones if remediation slips."
                impact="Past the first consequence date the finding will start appearing on consequence reports. Treat as soft deadlines that precede the hard SLA."
              />
            </DictGroup>

            <DictGroup title="Exceptions & Governance — Acceptable Use & Decommission">
              <DictEntry
                term="Acceptable Use ID / Expiry / Status"
                meaning="Acceptable-use exemption granted to the asset."
                impact="When present, the finding may be moot until expiry — but track the expiry so it doesn't lapse silently."
              />
              <DictEntry
                term="Decommission Request # / Status"
                meaning="Asset retirement request and its progress."
                impact="If a decommission is in flight and dated before Due Date, Defer with a clear note is usually correct."
              />
            </DictGroup>

            <DictGroup title="Reference data (collapsible at the bottom)">
              <DictEntry
                term="Report Date"
                meaning="When the finding was first reported in this dashboard."
                impact="Used for data-freshness audits, not for SLA."
              />
              <DictEntry
                term="Freshness Date"
                meaning="Most recent ingestion/refresh of the source data."
                impact="If old, the displayed status may be stale — request a refresh before acting."
              />
              <DictEntry
                term="Workstream"
                meaning="MiddlewarePatch, NonQualysCVE, ADSF, CloudConfigCompliance, etc."
                impact="Identifies which remediation factory owns delivery — bulk triage rarely crosses workstreams."
              />
              <DictEntry
                term="ESM Type"
                meaning="ESM – OS, UNAUTH-DEVICE, Application, etc."
                impact="ESM OS findings often resolve in patch cycles; UNAUTH-DEVICE usually requires asset-management response."
              />
              <DictEntry
                term="Source"
                meaning="Scanner / inventory system that emitted the finding (Qualys, ESM, BDNA, etc)."
                impact="Drives credibility of the data and which team can re-validate."
              />
              <DictEntry
                term="Scorecard Source"
                meaning="Which scorecard system aggregates this finding."
                impact="Determines where the finding shows up in executive reporting."
              />
              <DictEntry
                term="GIS External Flag"
                meaning="Internally / externally facing classification from GIS."
                impact="Confirms the Public-facing exposure flag."
              />
              <DictEntry
                term="GIS Third Party Scope"
                meaning="Whether the asset is in scope for third-party risk."
                impact="Affects exception path — third-party scope usually demands additional approvals."
              />
              <DictEntry
                term="GIS Asset Category"
                meaning="High-level asset classification."
                impact="Maps to control frameworks and required hardening baselines."
              />
              <DictEntry
                term="GIS Metric Alignment"
                meaning="Which executive metric this finding rolls into."
                impact="If a finding feeds a board-level metric, treat it as visibility-critical."
              />
              <DictEntry
                term="Assessment Area / Scope"
                meaning="Audit / assessment programme the finding was raised under."
                impact="Audit-driven findings may have separate (often stricter) SLAs."
              />
              <DictEntry
                term="Sig Algorithm"
                meaning="Signature / hash algorithm (for crypto findings)."
                impact="Drives deprecation timelines — anything in MD5/SHA-1 should be on a Fix path."
              />
              <DictEntry
                term="Issuer Name"
                meaning="Certificate issuer (for cert findings)."
                impact="Determines remediation team — internal CA vs public CA."
              />
              <DictEntry
                term="Domain"
                meaning="DNS domain the asset answers on."
                impact="Helps confirm public exposure when the FQDN alone is ambiguous."
              />
              <DictEntry
                term="Third Party Name"
                meaning="Vendor or partner managing the asset."
                impact="Adds the vendor management team to the remediation chain."
              />
              <DictEntry
                term="Financial Hierarchy"
                meaning="Cost-centre / business-unit hierarchy."
                impact="Drives chargeback for any remediation work."
              />
              <DictEntry
                term="Scorecard ERP Days"
                meaning="Days the finding has spent on the ERP scorecard."
                impact="Long ERP-scorecard age is an escalation signal independent of Days Open."
              />
              <DictEntry
                term="EVM"
                meaning="Enterprise Vulnerability Management classification."
                impact="Identifies which EVM cohort the finding belongs to for batched reporting."
              />
              <DictEntry
                term="TPPE"
                meaning="Third-Party Privacy / Engagement marker."
                impact="If set, privacy review may be a prerequisite to closure."
              />
              <DictEntry
                term="Non-BAU Reason"
                meaning="Reason this is not part of business-as-usual work."
                impact="Findings tagged Non-BAU follow exception governance rather than the standard SLA."
              />
            </DictGroup>
          </Section>

          {/* ── AG Grid features ── */}
          <Section title="Grid Features" icon={Layers} id="aggrid">
            <SubHeading>Sorting</SubHeading>
            <List>
              <Item>Click a column header to toggle ascending → descending → no sort.</Item>
              <Item>
                Hold <Kbd>Shift</Kbd> while clicking another header to add it
                as a secondary sort. The order of additions is the sort
                priority.
              </Item>
              <Item>
                Severity Risk and Triage Status use custom comparators so they
                sort by business priority, not alphabetically.
              </Item>
            </List>

            <SubHeading>Column filtering</SubHeading>
            <List>
              <Item>
                The <Term>floating filter row</Term> sits just below the column
                headers. Type into a text cell or pick from a set cell for an
                instant filter.
              </Item>
              <Item>
                Hover any column header and click the <Term>☰ menu icon</Term>{" "}
                for the full filter UI plus column actions. Filter types vary
                by data: text, number, date, or set (multi-pick).
              </Item>
              <Item>
                Toolbar multi-select chips and column filters combine with AND
                semantics — narrow further by stacking them.
              </Item>
            </List>

            <SubHeading>Column management</SubHeading>
            <List>
              <Item>
                <Term>Reorder</Term> — drag a column header left or right.
              </Item>
              <Item>
                <Term>Resize</Term> — drag the divider on the right edge of a
                header. Double-click to auto-size.
              </Item>
              <Item>
                <Term>Show / hide</Term> — open the right-side tool panel
                (
                <Columns3 style={{ width: 12, height: 12, display: "inline", verticalAlign: "middle" }} />{" "}
                Columns) and toggle checkboxes. The <Term>Lever</Term> column
                appears right after Workstream and is visible by default. Many
                extra columns are hidden by default: Report Date, GIS ID,
                Qualys ID, Application Full Name, FQDN, IP Addresses, ERP
                exception fields, OS Name, and more.
              </Item>
              <Item>
                On tablet width the grid auto-fits a lean column set; toggling
                additional columns is still available via the side panel.
              </Item>
            </List>

            <SubHeading>Cell & range selection</SubHeading>
            <List>
              <Item>
                Click a cell, then drag (or <Kbd>Shift</Kbd>-click) to select a
                range. Selected cells highlight and feed the aggregation read-
                out in the status bar.
              </Item>
              <Item>
                <Kbd>Ctrl</Kbd>+<Kbd>C</Kbd> copies the selection. Use the
                context menu's <em>Copy with headers</em> when pasting into
                Excel.
              </Item>
            </List>

            <SubHeading>Integrated charts</SubHeading>
            <Paragraph>
              Range-select numeric data, right-click, and pick{" "}
              <Term>Chart Range</Term> to open an inline chart of your selection
              (bar, column, pie, line, etc.). Useful for quick visual checks
              without leaving the grid.
            </Paragraph>

            <SubHeading>Pagination</SubHeading>
            <Paragraph>
              The grid paginates 50 rows at a time by default. The page size
              selector in the footer offers 25, 50, 100, or 200.
            </Paragraph>
          </Section>

          {/* ── Grouping & pivoting ── */}
          <Section title="Grouping & Pivoting" icon={PieChart} id="grouping">
            <SubHeading>Row grouping</SubHeading>
            <Paragraph>
              The <Term>Row Groups</Term> drop-zone bar sits above the grid. To
              group:
            </Paragraph>
            <OrderedList>
              <Item>
                Drag a column header into the <em>Row Groups</em> zone, or open
                the column menu and choose <em>Group by this column</em>.
              </Item>
              <Item>
                Findings collapse under expandable group rows. The leftmost
                column shows the group hierarchy.
              </Item>
              <Item>
                Drag a second column into the zone to nest groups (e.g. group
                by CIO, then by Workstream).
              </Item>
              <Item>
                Click the chip in the drop-zone to remove the grouping, or
                drag the column back to the grid.
              </Item>
            </OrderedList>

            <SubHeading>Aggregations on grouped rows</SubHeading>
            <Paragraph>
              In the Columns tool panel, scroll to the <Term>Values</Term>{" "}
              section and drag numeric columns (e.g. Days Open, Qualys ID) in.
              Choose sum, avg, min, max, or count. Aggregated values appear on
              the group rows.
            </Paragraph>

            <SubHeading>Pivoting</SubHeading>
            <Paragraph>
              The <Term>Pivot Mode</Term> toggle at the top of the Columns tool
              panel turns the grid into a pivot table:
            </Paragraph>
            <OrderedList>
              <Item>Switch on <em>Pivot Mode</em>.</Item>
              <Item>
                Drag columns into <Term>Row Groups</Term> for row dimensions
                (e.g. Operating Env).
              </Item>
              <Item>
                Drag columns into <Term>Column Labels</Term> for the pivot
                dimension (e.g. Severity Risk).
              </Item>
              <Item>
                Drag at least one numeric column into <Term>Values</Term> with
                an aggregation (e.g. count of CVE).
              </Item>
            </OrderedList>
            <Paragraph>
              You will get a cross-tab — for example, count of findings per
              Operating Env × Severity. Switch pivot mode off to return to the
              flat grid.
            </Paragraph>
          </Section>

          {/* ── Saved views ── */}
          <Section title="Saved Views" icon={Bookmark} id="views">
            <Paragraph>
              A <Term>view</Term> captures the grid's filter model, sort,
              column visibility / order, and search term — everything except
              your row selection. Views are stored in your browser, so each
              user has their own set.
            </Paragraph>
            <Paragraph>
              The mechanics — picker popover, Save (overwrite), three-dot
              menu (Save as new / Rename / Delete / Set as default / Reset to
              default) — are all covered in detail in the{" "}
              <a href="#toolbar" style={{ color: "#2563EB" }}>
                All Findings Toolbar
              </a>{" "}
              section above. A few extra points worth knowing:
            </Paragraph>
            <List>
              <Item>
                Your <Term>default view</Term> auto-applies when you open the
                Findings page. Switch defaults from the three-dot menu.
              </Item>
              <Item>
                Built-in views are <Term>read-only</Term>: you cannot rename,
                delete, overwrite, or mark them as default. To customise one,
                apply it then use <em>Save as new view</em>.
              </Item>
              <Item>
                Tweaking filters/sort/columns from inside a saved view marks
                it <em>(modified)</em> until you Save, Reset, or switch to
                another view.
              </Item>
              <Item>
                The filter-count badge on each picker row shows how many
                column filters the view encodes, so you can spot heavy vs.
                light views at a glance.
              </Item>
            </List>
          </Section>

          {/* ── Export ── */}
          <Section title="Exporting" icon={Download} id="export">
            <SubHeading>Quick exports</SubHeading>
            <List>
              <Item>
                <Term>Excel</Term> and <Term>CSV</Term> buttons on the toolbar
                — one-click download of the visible rows, or just the
                selected rows when any are checked.
              </Item>
              <Item>
                <Term>Export Selected</Term> in the bulk action bar — CSV of
                only the currently selected rows.
              </Item>
              <Item>
                <Term>Right-click → Export</Term> — context-menu shortcut for
                CSV / Excel.
              </Item>
            </List>

            <SubHeading>Configurable Export dialog</SubHeading>
            <Paragraph>
              The <Term>Export…</Term> toolbar button opens a dialog with
              three sections:
            </Paragraph>
            <List>
              <Item>
                <Term>Format</Term> — three radio options:
                <List>
                  <Item>
                    <em>CSV</em> — comma-separated, opens anywhere.
                  </Item>
                  <Item>
                    <em>Excel (.xlsx)</em> — native Excel with column types.
                  </Item>
                  <Item>
                    <em>PDF Summary</em> — branded report with charts and
                    table.
                  </Item>
                </List>
              </Item>
              <Item>
                <Term>Scope</Term> — two options:
                <List>
                  <Item>
                    <em>Current view</em> — respects all active filters,
                    search, and sort.
                  </Item>
                  <Item>
                    <em>Full dataset for this CIO team</em> — every finding
                    owned by the selected CIO, regardless of filters.
                  </Item>
                </List>
              </Item>
              <Item>
                <Term>Columns</Term> — checklist of every column the grid
                knows about. Defaults to whatever is visible right now. Use{" "}
                <em>Select all</em> / <em>Select none</em> to flip the list
                quickly.
              </Item>
            </List>
          </Section>

          {/* ── Severity ── */}
          <Section title="Severity & Priorities" icon={AlertTriangle} id="severity">
            <Paragraph>
              Severity drives SLA targets and remediation order. The same colour
              palette is used everywhere — KPI accents, severity badges, the
              SLA chart, and the burndown lines.
            </Paragraph>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                marginBottom: 8,
              }}
            >
              {SEVERITY_COLORS.map((s) => (
                <div
                  key={s.label}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    padding: "8px 10px",
                    background: "#F9FAFB",
                    borderRadius: 8,
                    border: "1px solid #F3F4F6",
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 3,
                      background: s.color,
                      marginTop: 5,
                      flexShrink: 0,
                    }}
                    aria-hidden="true"
                  />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                      {s.label}
                    </div>
                    <div style={{ fontSize: 12, color: "#6B7280", marginTop: 1 }}>
                      {s.meaning}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* ── Triage statuses ── */}
          <Section title="Triage Statuses" icon={ListChecks} id="statuses">
            <Paragraph>
              Every finding moves through this lifecycle. The four primary
              workload cards on the dashboard mirror these statuses.
            </Paragraph>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {TRIAGE_STATUSES.map(({ status, description, icon: Icon, color }) => (
                <div
                  key={status}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    padding: "8px 10px",
                    background: "#F9FAFB",
                    borderRadius: 8,
                    border: "1px solid #F3F4F6",
                  }}
                >
                  <Icon
                    style={{
                      width: 16,
                      height: 16,
                      color,
                      marginTop: 2,
                      flexShrink: 0,
                    }}
                    aria-hidden="true"
                  />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                      {status}
                    </div>
                    <div style={{ fontSize: 12, color: "#6B7280", marginTop: 1 }}>
                      {description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* ── Filtering primer ── */}
          <Section title="Filtering Findings" icon={Filter}>
            <Paragraph>There are several ways to narrow the list:</Paragraph>
            <List>
              <Item>
                <Term>Dashboard cards</Term> — fastest. One click loads the grid
                pre-filtered (the active preset shows as a coloured chip at the
                top of the grid).
              </Item>
              <Item>
                <Term>Quick search</Term> — search across CVE, host,
                application, title, workstream, owner.
              </Item>
              <Item>
                <Term>Toolbar filter chips</Term> — multi-select popovers for
                the most-used dimensions.
              </Item>
              <Item>
                <Term>Column filters</Term> — text, number, date, or set
                filters per column via the floating filter row or the column
                menu.
              </Item>
              <Item>
                <Term>CIO selector</Term> — re-scopes every page to that CIO's
                findings, or to <em>All CIOs</em> to clear the scope.
              </Item>
              <Item>
                <Term>Lever selector</Term> — re-scopes the grid to a single
                remediation lever. Appears as its own removable chip on the
                Findings toolbar.
              </Item>
              <Item>
                <Term>Right-click → Filter by this value</Term> — populate the
                search with the value under the cursor.
              </Item>
            </List>
          </Section>

          {/* ── Trend pills ── */}
          <Section title="Reading Trend Pills" icon={TrendingUp}>
            <Paragraph>
              Trend pills on KPI cards compare the current count to last week.
              <Term> Green</Term> means the change is good (fewer items in
              workload queues, more resolved). <Term>Red</Term> means the change
              is bad (more items piling up). The arrow direction shows up or
              down regardless of whether that is good or bad — so always read
              the <em>colour</em>, not the arrow, to judge whether something
              needs attention.
            </Paragraph>
          </Section>

          {/* ── Shortcuts ── */}
          <Section title="Keyboard Shortcuts" icon={Keyboard} id="shortcuts">
            <SubHeading>Detail panel — navigation</SubHeading>
            <Paragraph>
              The detail panel is built for keyboard-first triage so you can
              burn through a queue without touching the mouse. While the
              panel is open and your focus is <em>outside</em> any input/
              textarea/select, these shortcuts work anywhere on the page:
            </Paragraph>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                marginBottom: 12,
              }}
            >
              {[
                { keys: ["←", "j"], label: "Previous finding (jumps to the previous row in the current grid order)" },
                { keys: ["→", "k"], label: "Next finding (jumps to the next row in the current grid order)" },
                { keys: ["t"], label: "Toggle the Triage editor open / closed" },
                { keys: ["Esc"], label: "Close the panel — prompts to confirm if the triage form is dirty" },
                { keys: ["?"], label: "Show the in-panel shortcut popover (same list)" },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "6px 10px",
                    background: "#F9FAFB",
                    borderRadius: 6,
                    border: "1px solid #F3F4F6",
                  }}
                >
                  <span style={{ display: "inline-flex", gap: 4, flexShrink: 0, minWidth: 72 }}>
                    {s.keys.map((k, i) => (
                      <span key={k} style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
                        {i > 0 && (
                          <span style={{ fontSize: 11, color: "#9CA3AF" }}>or</span>
                        )}
                        <Kbd>{k}</Kbd>
                      </span>
                    ))}
                  </span>
                  <span style={{ fontSize: 12, color: "#374151" }}>{s.label}</span>
                </div>
              ))}
            </div>

            <Callout>
              <Term>Important:</Term> shortcut keys are suppressed while you
              are typing in a form field — so typing the letter <em>t</em> or
              <em> k</em> in a justification box won't unexpectedly trigger a
              shortcut.
            </Callout>

            <SubHeading>Detail panel — title-row controls</SubHeading>
            <Paragraph>
              The same actions are available as buttons in the title row at
              the top of the panel:
            </Paragraph>
            <List>
              <Item>
                <Term>‹ button</Term> (with a small <Kbd>j</Kbd> badge) —
                previous finding. Disabled at the start of the list.
              </Item>
              <Item>
                <Term>1 / 45 counter</Term> — shows your position in the
                current filtered + sorted list. Useful to track progress
                through a triage queue.
              </Item>
              <Item>
                <Term>› button</Term> (with a small <Kbd>k</Kbd> badge) —
                next finding. Disabled at the end of the list.
              </Item>
              <Item>
                <Term>? button</Term> — opens the shortcut popover for
                reference without leaving the panel.
              </Item>
              <Item>
                <Term>× button</Term> — closes the panel (same as{" "}
                <Kbd>Esc</Kbd>).
              </Item>
            </List>

            <SubHeading>Detail panel — within the triage form</SubHeading>
            <List>
              <Item>
                <Kbd>Tab</Kbd> / <Kbd>Shift</Kbd>+<Kbd>Tab</Kbd> — move
                between form controls in reading order.
              </Item>
              <Item>
                <Kbd>Space</Kbd> on a radio or checkbox — toggle.
              </Item>
              <Item>
                <Kbd>Enter</Kbd> on a select — open the dropdown;{" "}
                <Kbd>↑</Kbd> / <Kbd>↓</Kbd> to move between options,{" "}
                <Kbd>Enter</Kbd> to pick.
              </Item>
              <Item>
                When the form is dirty, the footer reveals <Term>Cancel</Term>{" "}
                and <Term>Save</Term> buttons. Press <Kbd>Tab</Kbd> to reach
                them, then <Kbd>Enter</Kbd> to confirm. <Term>Save</Term>{" "}
                stays disabled until required fields are filled (e.g.
                justification when disposition is <em>Defer</em> or{" "}
                <em>Accept Risk</em>).
              </Item>
            </List>

            <SubHeading>Discard-changes dialog</SubHeading>
            <Paragraph>
              If you press <Kbd>Esc</Kbd>, switch findings with <Kbd>j</Kbd> /{" "}
              <Kbd>k</Kbd>, or click away while the triage form has unsaved
              edits, a confirmation dialog appears. Use <Kbd>Tab</Kbd> to
              move between the two actions and <Kbd>Enter</Kbd> to confirm,
              or <Kbd>Esc</Kbd> to dismiss (which keeps you editing).
            </Paragraph>

            <SubHeading>Grid</SubHeading>
            <List>
              <Item>
                <Kbd>Ctrl</Kbd>+<Kbd>C</Kbd> — copy selected cells
              </Item>
              <Item>
                <Kbd>Shift</Kbd>-click a checkbox — select range
              </Item>
              <Item>
                <Kbd>Ctrl</Kbd>-click a checkbox — toggle a single row in the
                selection
              </Item>
              <Item>
                <Kbd>Shift</Kbd>-click a header — add as secondary sort
              </Item>
              <Item>
                Double-click a header edge — auto-size column
              </Item>
            </List>
          </Section>

          {/* ── Tips ── */}
          <Section title="Tips" icon={MousePointerClick}>
            <List>
              <Item>
                <Term>Click a KPI card</Term> on the dashboard to deep-link into
                the Findings grid filtered to that status.{" "}
                <ArrowUpRight
                  style={{
                    width: 12,
                    height: 12,
                    display: "inline",
                    verticalAlign: "middle",
                  }}
                  aria-hidden="true"
                />
              </Item>
              <Item>
                <Term>Click a metric in the header</Term> (findings / overdue /
                Priority 1) to jump straight to the Findings page.
              </Item>
              <Item>
                When triaging many similar findings, select them with
                checkboxes and use the bulk action bar before opening the
                detail panel for any that need justification.
              </Item>
              <Item>
                Save a view per workflow — <em>My queue</em>, <em>Past due
                Priority 1</em>, <em>Awaiting clear scan over 14 days</em> —
                and switch between them with the Saved Views selector.
              </Item>
              <Item>
                Switch CIO teams in the header to re-scope the entire
                dashboard.
              </Item>
            </List>
          </Section>

          <div
            style={{
              marginTop: 24,
              padding: "12px 14px",
              background: "#F9FAFB",
              border: "1px dashed #E5E7EB",
              borderRadius: 10,
              fontSize: 12,
              color: "#6B7280",
              lineHeight: 1.5,
            }}
          >
            Need more help? Contact your security operations team or check the
            internal documentation portal for runbooks and SLA policy.
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
