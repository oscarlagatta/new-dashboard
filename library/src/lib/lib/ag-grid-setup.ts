// ag-grid-setup — comparators and sort order maps only.
//
// License registration moved to ./configure-dashboard.ts, which the host
// calls at app startup. No more process.env reads, no module-scope side
// effects beyond defining these constants.

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

// Kept for any remaining references in the codebase.
export const severityComparator = severityRiskComparator;
export const statusComparator = (a: string, b: string) =>
  (triageStatusOrder[a] ?? 99) - (triageStatusOrder[b] ?? 99);

export const gridInitialized = true;
