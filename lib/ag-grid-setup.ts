/**
 * AG Grid Enterprise + AG Charts Enterprise Setup
 * 
 * LICENSE KEYS:
 * Replace placeholder strings with real license keys from environment variables in production.
 * 
 * API MIGRATION COMMENT:
 * For production, replace inline mock data with Server-Side Row Model.
 * Set rowModelType='serverSide' and provide a serverSideDatasource that calls the .NET API.
 * Filter, sort, and group state can be passed to the backend via the request object.
 * Pagination will be handled server-side.
 */

import { LicenseManager } from "ag-grid-enterprise";
import { AgCharts } from "ag-charts-enterprise";

// Import and register all enterprise features
import "ag-grid-enterprise";

// Set AG Grid license key (replace with env variable in production)
const AG_GRID_LICENSE_KEY = process.env.NEXT_PUBLIC_AG_GRID_LICENSE_KEY || "YOUR_AG_GRID_LICENSE_KEY";
LicenseManager.setLicenseKey(AG_GRID_LICENSE_KEY);

// Set AG Charts license key (replace with env variable in production)
const AG_CHARTS_LICENSE_KEY = process.env.NEXT_PUBLIC_AG_CHARTS_LICENSE_KEY || "YOUR_AG_CHARTS_LICENSE_KEY";
AgCharts.setLicenseKey(AG_CHARTS_LICENSE_KEY);

// Severity sort order (Critical > High > Medium > Low)
export const severitySortOrder: Record<string, number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};

// Status sort order
export const statusSortOrder: Record<string, number> = {
  "Awaiting Disposition": 0,
  "In Progress": 1,
  "Pending Clear Scan": 2,
  Resolved: 3,
};

// Custom severity comparator for AG Grid sorting
export function severityComparator(valueA: string, valueB: string): number {
  return (severitySortOrder[valueA] ?? 99) - (severitySortOrder[valueB] ?? 99);
}

// Custom status comparator
export function statusComparator(valueA: string, valueB: string): number {
  return (statusSortOrder[valueA] ?? 99) - (statusSortOrder[valueB] ?? 99);
}

export const gridInitialized = true;
