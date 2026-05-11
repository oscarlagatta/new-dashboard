// Dashboard configuration that will later be served per-CIO from the API.
// Today these are static defaults; treat the file as a stand-in for the
// settings payload the backend will return.

export interface DashboardSettings {
  /**
   * Findings stuck in "Pending Clear Scan" longer than this surface in the
   * Action Required panel and get a filter preset in the grid.
   * (The product spec calls this "Validation Pending" — the codebase uses
   * the equivalent triage status "Pending Clear Scan".)
   */
  validationPendingThresholdDays: number;
}

export const DEFAULT_DASHBOARD_SETTINGS: DashboardSettings = {
  validationPendingThresholdDays: 14,
};
