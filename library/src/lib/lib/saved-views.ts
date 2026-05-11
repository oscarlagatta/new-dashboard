// Saved Views — captures filter / column / search state so users can return
// to a known triage configuration with one click.
//
// PRODUCTION NOTE: This module persists views in localStorage. In production,
// replace `loadFromStorage` / `saveToStorage` (see hooks/use-saved-views.ts)
// with calls to a backend API such as:
//   GET    /api/views          -> SavedView[]
//   POST   /api/views          -> SavedView      (create)
//   PUT    /api/views/:id      -> SavedView      (update / rename / set-default)
//   DELETE /api/views/:id
// so that views sync across devices and can be shared across a team.

import type { ColumnState } from "ag-grid-community";

export interface SavedView {
  id: string;
  name: string;
  description?: string;
  filterModel: Record<string, unknown>;
  columnState: ColumnState[];
  searchTerm: string;
  isDefault: boolean;
  isBuiltIn?: boolean;
}

export const STORAGE_KEY_VIEWS = "vuln-dashboard-saved-views";
export const STORAGE_KEY_CURRENT_VIEW = "vuln-dashboard-current-view";

// Pretend-current-user. In production this comes from the auth session.
export const CURRENT_USER = "Scott Zhang";

// Built-in views are rebuilt on each call because date-based filters
// ("Due this week", "Resolved this month") depend on "now".
export function getBuiltInViews(): SavedView[] {
  const today = new Date();
  const isoToday = today.toISOString().slice(0, 10);
  const isoPlus7 = addDays(today, 7).toISOString().slice(0, 10);
  const isoMinus30 = addDays(today, -30).toISOString().slice(0, 10);

  return [
    {
      id: "builtin:all",
      name: "All vulnerabilities",
      description: "Everything in scope, worst by age first",
      filterModel: {},
      columnState: [
        { colId: "daysOpen", sort: "desc", sortIndex: 0 },
        { colId: "severityRisk", sort: null },
      ],
      searchTerm: "",
      isDefault: false,
      isBuiltIn: true,
    },
    {
      id: "builtin:my-open",
      name: "My open items",
      description: `Owned by ${CURRENT_USER}, not yet resolved`,
      filterModel: {
        vulnOwner: { filterType: "text", type: "equals", filter: CURRENT_USER },
        triageStatus: {
          filterType: "set",
          values: ["Awaiting Disposition", "In Progress", "Pending Clear Scan"],
        },
      },
      columnState: [{ colId: "daysOpen", sort: "desc", sortIndex: 0 }],
      searchTerm: "",
      isDefault: false,
      isBuiltIn: true,
    },
    {
      id: "builtin:critical-overdue",
      name: "Critical & overdue",
      description: "Priority 1 items past their due date",
      filterModel: {
        severityRisk: { filterType: "set", values: ["Priority 1"] },
        pastDue: { filterType: "set", values: ["Y"] },
      },
      columnState: [{ colId: "daysOpen", sort: "desc", sortIndex: 0 }],
      searchTerm: "",
      isDefault: false,
      isBuiltIn: true,
    },
    {
      id: "builtin:awaiting-disposition",
      name: "Awaiting disposition",
      description: "Needs a triage decision",
      filterModel: {
        triageStatus: { filterType: "set", values: ["Awaiting Disposition"] },
      },
      columnState: [{ colId: "severityRisk", sort: "asc", sortIndex: 0 }],
      searchTerm: "",
      isDefault: false,
      isBuiltIn: true,
    },
    {
      id: "builtin:due-this-week",
      name: "Due this week",
      description: "Due in the next 7 days, still open",
      filterModel: {
        dueDate: {
          filterType: "date",
          type: "inRange",
          dateFrom: `${isoToday} 00:00:00`,
          dateTo: `${isoPlus7} 23:59:59`,
        },
        triageStatus: {
          filterType: "set",
          values: ["Awaiting Disposition", "In Progress", "Pending Clear Scan"],
        },
      },
      columnState: [{ colId: "dueDate", sort: "asc", sortIndex: 0 }],
      searchTerm: "",
      isDefault: false,
      isBuiltIn: true,
    },
    {
      id: "builtin:resolved-this-month",
      name: "Resolved this month",
      description: "Closed in the last 30 days",
      filterModel: {
        triageStatus: { filterType: "set", values: ["Resolved"] },
        resolvedDate: {
          filterType: "date",
          type: "greaterThan",
          dateFrom: `${isoMinus30} 00:00:00`,
        },
      },
      columnState: [{ colId: "resolvedDate", sort: "desc", sortIndex: 0 }],
      searchTerm: "",
      isDefault: false,
      isBuiltIn: true,
    },
  ];
}

export const DEFAULT_BUILTIN_VIEW_ID = "builtin:all";

function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

// Count of active filters in a filterModel — used for the "3 filters" badge.
export function countFilters(filterModel: Record<string, unknown>): number {
  return Object.keys(filterModel ?? {}).length;
}

// Deep-equal-ish compare of two AG Grid filter models. We stringify after
// sorting keys so { a, b } and { b, a } compare equal.
export function filterModelsEqual(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
): boolean {
  return stableStringify(a) === stableStringify(b);
}

// Compare two ColumnState arrays for the fields that matter to a saved view
// (visibility, order, width, sort). Width changes from auto-fit shouldn't
// flag the view as modified, so we round widths to the nearest 5px.
export function columnStatesEqual(a: ColumnState[], b: ColumnState[]): boolean {
  const norm = (s: ColumnState[]) =>
    stableStringify(
      s.map((c) => ({
        colId: c.colId,
        hide: !!c.hide,
        sort: c.sort ?? null,
        sortIndex: c.sortIndex ?? null,
        width: c.width ? Math.round(c.width / 5) * 5 : null,
      })),
    );
  return norm(a) === norm(b);
}

function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_k, v) => {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const sorted: Record<string, unknown> = {};
      for (const k of Object.keys(v as Record<string, unknown>).sort()) {
        sorted[k] = (v as Record<string, unknown>)[k];
      }
      return sorted;
    }
    return v;
  });
}

export function makeViewId(): string {
  return `view_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}
