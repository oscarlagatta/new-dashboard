// External-filter presets driven by dashboard cards / Action Required rows.
// These are applied via AG Grid's `isExternalFilterPresent` + `doesExternalFilterPass`
// hooks rather than the column filter model, so they don't conflict with the
// user's own column filters or the Saved Views state.

import type { Vulnerability } from "./types";
import type { DashboardSettings } from "./dashboard-settings";

export type FilterPresetId =
  | "noRemediationDate"
  | "validationPendingOverThreshold"
  | "awaitingScan"
  | "riskAccepted"
  | "awaitingDisposition"
  | "inProgress"
  | "pendingClearScan"
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
  validationPendingOverThreshold: {
    id: "validationPendingOverThreshold",
    label: "Validation pending over threshold",
  },
  awaitingScan: {
    id: "awaitingScan",
    label: "Awaiting scan",
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
  pendingClearScan: {
    id: "pendingClearScan",
    label: "Pending Clear Scan",
  },
  resolved: {
    id: "resolved",
    label: "Resolved",
  },
};

export function matchesPreset(
  v: Vulnerability,
  preset: FilterPresetId,
  settings: DashboardSettings,
): boolean {
  switch (preset) {
    case "noRemediationDate":
      // The "No Remediation Date" dashboard card scopes to the visible
      // Due Date column — the SLA deadline a CIO scans for. Using the
      // user-set expectedRemediationDate previously matched almost every
      // row (it's empty whenever a CRQ hasn't been raised yet) and made
      // the filter feel like a no-op.
      return !v.dueDate || v.dueDate.trim() === "";
    case "validationPendingOverThreshold":
      // Spec says "Validation Pending"; the data model uses "Pending Clear Scan".
      return (
        v.triageStatus === "Pending Clear Scan" &&
        v.daysOpen > settings.validationPendingThresholdDays
      );
    case "awaitingScan":
      // Spec: Remediation Complete = true (remediationPendingClearScan === "Yes")
      // AND the source-system status is still Open — i.e., the clear scan has
      // not yet confirmed closure.
      return v.remediationPendingClearScan === "Yes" && v.status === "Open";
    case "riskAccepted":
      return v.disposition === "Accept Risk";
    case "awaitingDisposition":
      return v.triageStatus === "Awaiting Disposition";
    case "inProgress":
      return v.triageStatus === "In Progress";
    case "pendingClearScan":
      return v.triageStatus === "Pending Clear Scan";
    case "resolved":
      return v.triageStatus === "Resolved";
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
