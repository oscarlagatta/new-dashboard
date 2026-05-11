// configureDashboard — one-time license registration for AG Grid Enterprise
// and AG Charts Enterprise. The host app must call this BEFORE rendering
// <ExecutiveDashboard /> so the grid doesn't show a watermark.
//
// Idempotent: subsequent calls are a no-op even if license keys change.

import { LicenseManager } from "ag-grid-enterprise";
import { AgCharts } from "ag-charts-enterprise";
import "ag-grid-enterprise";

interface ConfigureOptions {
  /** AG Grid Enterprise license key. Omit in dev to accept the watermark. */
  agGridLicenseKey?: string;
  /** AG Charts Enterprise license key. */
  agChartsLicenseKey?: string;
}

let configured = false;

export function configureDashboard(opts: ConfigureOptions = {}): void {
  if (configured) return;
  if (opts.agGridLicenseKey) {
    LicenseManager.setLicenseKey(opts.agGridLicenseKey);
  }
  if (opts.agChartsLicenseKey) {
    AgCharts.setLicenseKey(opts.agChartsLicenseKey);
  }
  configured = true;
}

/** Test/escape hatch — reset the configured flag. Not for production use. */
export function __resetDashboardConfiguration(): void {
  configured = false;
}
