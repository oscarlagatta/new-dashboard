"use client";

import type { ICellRendererParams } from "ag-grid-community";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ExternalLink } from "lucide-react";
import { formatDistanceToNow, differenceInDays } from "date-fns";
import type { TriageStatus, Severity, OperatingEnvironment, VerificationStatus } from "@/lib/types";

// Status Badge Cell Renderer
export function StatusBadgeCellRenderer(params: ICellRendererParams) {
  const status = params.value as TriageStatus;
  if (!status) return <span className="text-muted-foreground">—</span>;

  const statusStyles: Record<TriageStatus, string> = {
    "Awaiting Disposition": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    "In Progress": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    "Pending Clear Scan": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    Resolved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  };

  return (
    <Badge variant="secondary" className={`${statusStyles[status]} font-semibold text-xs`}>
      {status}
    </Badge>
  );
}

// Severity Badge Cell Renderer
export function SeverityBadgeCellRenderer(params: ICellRendererParams) {
  const severity = params.value as Severity;
  if (!severity) return <span className="text-muted-foreground">—</span>;

  const severityStyles: Record<Severity, string> = {
    Critical: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    High: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    Medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    Low: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  };

  return (
    <Badge variant="secondary" className={`${severityStyles[severity]} text-xs`}>
      {severity}
    </Badge>
  );
}

// Operating Environment Badge Cell Renderer
export function OperatingEnvironmentBadgeCellRenderer(params: ICellRendererParams) {
  const env = params.value as OperatingEnvironment;
  if (!env) return <span className="text-muted-foreground">—</span>;

  const envStyles: Record<OperatingEnvironment, string> = {
    Production: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400",
    "Non-Production": "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
    Development: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
    UAT: "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
  };

  return (
    <Badge variant="secondary" className={`${envStyles[env]} text-xs`}>
      {env}
    </Badge>
  );
}

// CVE Link Cell Renderer
export function CVELinkCellRenderer(params: ICellRendererParams) {
  const cve = params.value as string;
  if (!cve) return <span className="text-muted-foreground">—</span>;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`https://nvd.nist.gov/vuln/detail/${cve}`, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      onClick={handleClick}
      className="font-mono text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline flex items-center gap-1"
    >
      {cve}
      <ExternalLink className="h-3 w-3" />
    </button>
  );
}

// CRQ Link Cell Renderer
export function CRQLinkCellRenderer(params: ICellRendererParams) {
  const crq = params.value as string;
  if (!crq) return <span className="text-muted-foreground">—</span>;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`https://remedy.bank.internal/arsys/forms/remedy/${crq}`, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      onClick={handleClick}
      className="font-mono text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline flex items-center gap-1"
    >
      {crq}
      <ExternalLink className="h-3 w-3" />
    </button>
  );
}

// Due Date Cell Renderer
export function DueDateCellRenderer(params: ICellRendererParams) {
  const dueDate = params.value as Date;
  if (!dueDate) return <span className="text-muted-foreground">—</span>;

  const date = new Date(dueDate);
  const now = new Date();
  const daysUntilDue = differenceInDays(date, now);

  let colorClass = "text-foreground";
  let text = "";

  if (daysUntilDue < 0) {
    colorClass = "text-red-600 dark:text-red-400 font-semibold";
    text = `${Math.abs(daysUntilDue)} days overdue`;
  } else if (daysUntilDue === 0) {
    colorClass = "text-orange-600 dark:text-orange-400 font-semibold";
    text = "Due today";
  } else if (daysUntilDue <= 7) {
    colorClass = "text-orange-600 dark:text-orange-400";
    text = `in ${daysUntilDue} days`;
  } else {
    text = `in ${daysUntilDue} days`;
  }

  return (
    <span className={colorClass} title={date.toLocaleDateString()}>
      {text}
    </span>
  );
}

// Days Open Cell Renderer
export function DaysOpenCellRenderer(params: ICellRendererParams) {
  const days = params.value as number;
  if (days === undefined || days === null) return <span className="text-muted-foreground">—</span>;

  let colorClass = "text-foreground";
  if (days > 30) {
    colorClass = "text-red-600 dark:text-red-400 font-semibold";
  } else if (days >= 14) {
    colorClass = "text-orange-600 dark:text-orange-400";
  }

  return <span className={colorClass}>{days}</span>;
}

// Owner Cell Renderer
export function OwnerCellRenderer(params: ICellRendererParams) {
  const owner = params.value as string | undefined;

  if (!owner) {
    return <span className="text-muted-foreground italic">Unassigned</span>;
  }

  const initials = owner
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-center gap-2">
      <Avatar className="h-6 w-6">
        <AvatarFallback className="text-xs bg-muted">{initials}</AvatarFallback>
      </Avatar>
      <span className="truncate">{owner}</span>
    </div>
  );
}

// Verification Status Cell Renderer
export function VerificationStatusCellRenderer(params: ICellRendererParams) {
  const status = params.value as VerificationStatus;
  if (!status) return <span className="text-muted-foreground">—</span>;

  const statusStyles: Record<VerificationStatus, string> = {
    Verified: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    "Pending Verification": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    "Verification Failed": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    "Not Required": "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  };

  return (
    <Badge variant="secondary" className={`${statusStyles[status]} text-xs`}>
      {status}
    </Badge>
  );
}

// Boolean Badge Cell Renderer (for Past Due, Is DMZ, etc.)
export function BooleanBadgeCellRenderer(params: ICellRendererParams) {
  const value = params.value as boolean | undefined | null;
  
  if (value === undefined || value === null) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <Badge
      variant="secondary"
      className={
        value
          ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-xs"
          : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 text-xs"
      }
    >
      {value ? "Yes" : "No"}
    </Badge>
  );
}

// Technology Cell Renderer (combines technology + version)
export function TechnologyCellRenderer(params: ICellRendererParams) {
  const data = params.data;
  if (!data) return <span className="text-muted-foreground">—</span>;

  const tech = data.technology;
  const version = data.technologyVersion;

  if (!tech) return <span className="text-muted-foreground">—</span>;

  return (
    <span>
      {tech} {version && <span className="text-muted-foreground">{version}</span>}
    </span>
  );
}

// Source Badge Cell Renderer
export function SourceBadgeCellRenderer(params: ICellRendererParams) {
  const source = params.value as string;
  if (!source) return <span className="text-muted-foreground">—</span>;

  const sourceStyles: Record<string, string> = {
    Qualys: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
    Tenable: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
    Rapid7: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    Manual: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  };

  return (
    <Badge variant="secondary" className={`${sourceStyles[source] || sourceStyles.Manual} text-xs`}>
      {source}
    </Badge>
  );
}

// Last Updated Cell Renderer
export function LastUpdatedCellRenderer(params: ICellRendererParams) {
  const date = params.value as Date;
  if (!date) return <span className="text-muted-foreground">—</span>;

  return (
    <span className="text-muted-foreground" title={new Date(date).toLocaleString()}>
      {formatDistanceToNow(new Date(date), { addSuffix: true })}
    </span>
  );
}

// Disposition Cell Renderer
export function DispositionCellRenderer(params: ICellRendererParams) {
  const disposition = params.value as string | null;
  if (!disposition) return <span className="text-muted-foreground">—</span>;

  const dispositionStyles: Record<string, string> = {
    Fix: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    Mitigate: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    Defer: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    "Accept Risk": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    "False Positive": "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  };

  return (
    <Badge variant="secondary" className={`${dispositionStyles[disposition] || ""} text-xs`}>
      {disposition}
    </Badge>
  );
}
