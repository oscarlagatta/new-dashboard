// External-filter presets driven by dashboard cards / Action Required rows.
// Applied via AG Grid's `isExternalFilterPresent` + `doesExternalFilterPass`
// hooks rather than the column filter model, so they don't conflict with the
// user's own column filters or the Saved Views state.
//
// Several presets that relied on FE-only fields (triageStatus, daysOpen,
// remediationPendingClearScan) were removed when the FE type was aligned
// with the GetVulnerabilityCM API response. The cards consuming the removed
// IDs (Validation Pending, Awaiting Scan, Pending Clear Scan) are pruned in
// the dashboard layer.

import type { Vulnerability } from "./types";
import type { DashboardSettings } from "./dashboard-settings";

export type FilterPresetId =
  | "noRemediationDate"
  | "riskAccepted"
  | "awaitingDisposition"
  | "inProgress"
  | "resolved";

export interface FilterPresetMeta {
  id: FilterPresetId;
  label: string;
}

export const FILTER_PRESETS: Record<FilterPresetId, FilterPresetMeta> = {
  noRemediationDate: {
    id: "noRemediationDate",
    label: "No remediation date",
  },
  riskAccepted: {
    id: "riskAccepted",
    label: "Risk accepted",
  },
  awaitingDisposition: {
    id: "awaitingDisposition",
    label: "Awaiting Disposition",
  },
  inProgress: {
    id: "inProgress",
    label: "In Progress",
  },
  resolved: {
    id: "resolved",
    label: "Resolved",
  },
};

export function matchesPreset(
  v: Vulnerability,
  preset: FilterPresetId,
  _settings: DashboardSettings,
): boolean {
  switch (preset) {
    case "noRemediationDate":
      // SLA deadline missing → the "No Remediation Date" dashboard card.
      return !v.dueDate || v.dueDate.trim() === "";
    case "riskAccepted":
      return v.disposition === "Accept Risk";
    case "awaitingDisposition":
      // Derived: no disposition has been chosen yet (empty string is falsy).
      return !v.disposition;
    case "inProgress":
      // Derived: disposition chosen, source-system status still Open.
      return !!v.disposition && v.status === "Open";
    case "resolved":
      // Derived: source-system has closed the finding.
      return v.status === "Closed";
  }
}

export function countPreset(
  vulns: Vulnerability[],
  preset: FilterPresetId,
  settings: DashboardSettings,
): number {
  let n = 0;
  for (const v of vulns) if (matchesPreset(v, preset, settings)) n += 1;
  return n;
}
