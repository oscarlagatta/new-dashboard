
import type { ICellRendererParams } from "ag-grid-community";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { ExternalLink, AlertTriangle } from "lucide-react";
import type {
  TriageStatus,
  SeverityRisk,
  OperatingEnvironment,
} from "../../lib/types";

// ── Triage Status ──────────────────────────────────────────────────────────────
export function TriageStatusBadgeCellRenderer(params: ICellRendererParams) {
  const value = params.value as TriageStatus | undefined;
  if (!value) return <span className="text-muted-foreground text-xs">—</span>;

  const styles: Record<TriageStatus, string> = {
    "Awaiting Disposition": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    "In Progress": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    "Pending Clear Scan": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    Resolved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${styles[value]}`}
    >
      {value}
    </span>
  );
}

// Keep backward-compat alias used by existing imports
export const StatusBadgeCellRenderer = TriageStatusBadgeCellRenderer;

// ── Severity Risk ──────────────────────────────────────────────────────────────
export function SeverityBadgeCellRenderer(params: ICellRendererParams) {
  const value = params.value as SeverityRisk | undefined;
  if (!value) return <span className="text-muted-foreground text-xs">—</span>;

  const styles: Record<SeverityRisk, string> = {
    "Priority 1": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    "Priority 2": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    "Priority 3": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    "Priority 4": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[value]}`}
    >
      {value}
    </span>
  );
}

// ── Source Status (Open / Closed) ──────────────────────────────────────────────
export function SourceStatusBadgeCellRenderer(params: ICellRendererParams) {
  const value = params.value as string | undefined;
  if (!value) return <span className="text-muted-foreground text-xs">—</span>;

  const styles: Record<string, string> = {
    Open: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    Closed: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[value] ?? "bg-gray-100 text-gray-600"}`}
    >
      {value}
    </span>
  );
}

// ── Operating Environment ──────────────────────────────────────────────────────
export function OperatingEnvBadgeCellRenderer(params: ICellRendererParams) {
  const value = params.value as OperatingEnvironment | undefined;
  if (!value) return <span className="text-muted-foreground text-xs">—</span>;

  const styles: Record<string, string> = {
    "In Production": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    "Pre-Prod": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    Contingency: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[value] ?? "bg-gray-100 text-gray-600"}`}
    >
      {value}
    </span>
  );
}

// Keep alias for existing usages
export const OperatingEnvironmentBadgeCellRenderer = OperatingEnvBadgeCellRenderer;

// ── CVE Link ───────────────────────────────────────────────────────────────────
export function CVELinkCellRenderer(params: ICellRendererParams) {
  const cve = params.value as string | undefined;
  if (!cve) return <span className="text-muted-foreground text-xs">—</span>;

  return (
    <a
      href={`https://nvd.nist.gov/vuln/detail/${cve}`}
      target="_blank"
      rel="noopener noreferrer"
      className="font-mono text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 inline-flex items-center gap-1"
      onClick={(e) => e.stopPropagation()}
      aria-label={`Open ${cve} in NVD`}
    >
      {cve}
      <ExternalLink className="h-3 w-3 opacity-60 flex-shrink-0" />
    </a>
  );
}

// ── CRQ Link ───────────────────────────────────────────────────────────────────
export function CRQLinkCellRenderer(params: ICellRendererParams) {
  const crq = params.value as string | undefined;
  if (!crq) return <span className="text-muted-foreground text-xs">—</span>;

  return (
    <a
      href={`https://remedy.example.com/change/${crq}`}
      target="_blank"
      rel="noopener noreferrer"
      className="font-mono text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 inline-flex items-center gap-1"
      onClick={(e) => e.stopPropagation()}
      aria-label={`Open ${crq} in Remedy`}
    >
      {crq}
      <ExternalLink className="h-3 w-3 opacity-60 flex-shrink-0" />
    </a>
  );
}

// ── Due Date ───────────────────────────────────────────────────────────────────
export function DueDateCellRenderer(params: ICellRendererParams) {
  const raw = params.value as string | undefined;
  if (!raw) return <span className="text-muted-foreground text-xs">—</span>;

  const due = new Date(raw);
  const now = new Date("2026-05-08");
  const diffDays = Math.round((due.getTime() - now.getTime()) / 86_400_000);

  let label: string;
  let cls: string;

  if (diffDays < 0) {
    label = `${Math.abs(diffDays)}d overdue`;
    cls = "text-red-600 font-semibold";
  } else if (diffDays <= 7) {
    label = `in ${diffDays}d`;
    cls = "text-orange-600";
  } else {
    label = `in ${diffDays}d`;
    cls = "text-foreground";
  }

  return <span className={`text-xs ${cls}`}>{label}</span>;
}

// ── Days Open ──────────────────────────────────────────────────────────────────
export function DaysOpenCellRenderer(params: ICellRendererParams) {
  const days = params.value as number | undefined;
  if (days === undefined || days === null)
    return <span className="text-muted-foreground text-xs">—</span>;

  if (days > 365) {
    return (
      <span className="text-xs text-red-700 font-bold flex items-center gap-1">
        <AlertTriangle className="h-3 w-3 flex-shrink-0" />
        {days}d
      </span>
    );
  }
  if (days > 90) {
    return <span className="text-xs text-red-600 font-semibold">{days}d</span>;
  }
  if (days > 30) {
    return <span className="text-xs text-orange-600">{days}d</span>;
  }
  return <span className="text-xs">{days}d</span>;
}

// ── Owner ──────────────────────────────────────────────────────────────────────
export function OwnerCellRenderer(params: ICellRendererParams) {
  const owner = params.value as string | undefined;
  if (!owner) {
    return <span className="text-xs text-muted-foreground italic">Unassigned</span>;
  }

  const initials = owner
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <span className="flex items-center gap-1.5 text-xs">
      <Avatar className="h-5 w-5 flex-shrink-0">
        <AvatarFallback className="text-[9px] bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
          {initials}
        </AvatarFallback>
      </Avatar>
      {owner}
    </span>
  );
}

// ── Boolean Badge (Y/N) ────────────────────────────────────────────────────────
export function BooleanBadgeCellRenderer(params: ICellRendererParams) {
  const value = params.value as "Y" | "N" | undefined;
  if (!value) return <span className="text-muted-foreground text-xs">—</span>;

  return value === "Y" ? (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
      Y
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
      N
    </span>
  );
}

// ── Verification Status ────────────────────────────────────────────────────────
export function VerificationStatusBadgeCellRenderer(params: ICellRendererParams) {
  const value = params.value as string | undefined;
  if (!value) return <span className="text-muted-foreground text-xs">—</span>;

  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
      {value}
    </span>
  );
}

// ── Technology (combines tech + version) ───────────────────────────────────────
export function TechnologyCellRenderer(params: ICellRendererParams) {
  const value = params.value as string | undefined;
  if (!value) return <span className="text-muted-foreground text-xs">—</span>;
  return <span className="text-xs">{value}</span>;
}

// ── Disposition ────────────────────────────────────────────────────────────────
export function DispositionCellRenderer(params: ICellRendererParams) {
  const value = params.value as string | undefined;
  if (!value) return <span className="text-muted-foreground text-xs">—</span>;

  const styles: Record<string, string> = {
    Fix: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    Defer: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    Mitigate: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    "Accept Risk": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    "False Positive": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[value] ?? "bg-gray-100 text-gray-600"}`}
    >
      {value}
    </span>
  );
}
