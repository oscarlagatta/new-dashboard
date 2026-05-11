/**
 * AG Grid Enterprise + AG Charts Enterprise Setup
 *
 * LICENSE KEYS: Replace placeholder strings with real keys from environment
 * variables in production (NEXT_PUBLIC_AG_GRID_LICENSE_KEY, etc.)
 *
 * For production: replace with rowModelType='serverSide' and provide a
 * serverSideDatasource that calls the .NET API endpoint.
 * Filter, sort, group state can be passed via the IServerSideGetRowsRequest
 * object. Pagination is handled server-side.
 */

// Console filter MUST be imported BEFORE the AG Grid modules so its side
// effect (wrapping console.error) is installed before AG Grid's license-check
// code runs. Imports evaluate in source order — keep this on top.
import "./ag-grid-console-filter";

import { LicenseManager } from "ag-grid-enterprise";
import { AgCharts } from "ag-charts-enterprise";
import "ag-grid-enterprise";

// Only register a license key when a real value is present. Registering the
// placeholder string makes AG Grid log "INVALID LICENSE" instead of the
// quieter trial-mode message; with the console.error filter above this is
// largely cosmetic, but still correct.
function isRealLicenseKey(key: string | undefined): key is string {
  if (!key) return false;
  if (key === "YOUR_AG_GRID_LICENSE_KEY") return false;
  if (key === "YOUR_AG_CHARTS_LICENSE_KEY") return false;
  return key.trim().length > 0;
}

const AG_GRID_LICENSE_KEY = process.env.NEXT_PUBLIC_AG_GRID_LICENSE_KEY;
if (isRealLicenseKey(AG_GRID_LICENSE_KEY)) {
  LicenseManager.setLicenseKey(AG_GRID_LICENSE_KEY);
}

const AG_CHARTS_LICENSE_KEY = process.env.NEXT_PUBLIC_AG_CHARTS_LICENSE_KEY;
if (isRealLicenseKey(AG_CHARTS_LICENSE_KEY)) {
  AgCharts.setLicenseKey(AG_CHARTS_LICENSE_KEY);
}

// Priority 1 first, Priority 4 last
export const severityRiskOrder: Record<string, number> = {
  "Priority 1": 0,
  "Priority 2": 1,
  "Priority 3": 2,
  "Priority 4": 3,
};

export const triageStatusOrder: Record<string, number> = {
  "Awaiting Disposition": 0,
  "In Progress": 1,
  "Pending Clear Scan": 2,
  Resolved: 3,
};

export function severityRiskComparator(a: string, b: string): number {
  return (severityRiskOrder[a] ?? 99) - (severityRiskOrder[b] ?? 99);
}

// Keep old export names for any remaining references
export const severityComparator = severityRiskComparator;
export const statusComparator = (a: string, b: string) =>
  (triageStatusOrder[a] ?? 99) - (triageStatusOrder[b] ?? 99);

export const gridInitialized = true;
