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
  | "riskAccepted";

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
};

export function matchesPreset(
  v: Vulnerability,
  preset: FilterPresetId,
  settings: DashboardSettings,
): boolean {
  switch (preset) {
    case "noRemediationDate":
      return !v.expectedRemediationDate || v.expectedRemediationDate.trim() === "";
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
