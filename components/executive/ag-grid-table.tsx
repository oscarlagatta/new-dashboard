"use client";

import {
  useMemo,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import type {
  ColDef,
  ColumnState,
  GetContextMenuItemsParams,
  GridSizeChangedEvent,
  MenuItemDef,
  GridReadyEvent,
  SelectionChangedEvent,
  RowClickedEvent,
  ValueGetterParams,
  IRowNode,
} from "ag-grid-community";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Search,
  Download,
  Filter,
  X,
  ChevronDown,
  LayoutGrid,
} from "lucide-react";
import { DetailSheet } from "@/components/vulnerability/detail-sheet";
import { VulnerabilityCard } from "@/components/executive/vulnerability-card";
import { severityRiskComparator, statusComparator } from "@/lib/ag-grid-setup";
import { useViewport } from "@/lib/use-viewport";
import {
  TriageStatusBadgeCellRenderer,
  SeverityBadgeCellRenderer,
  SourceStatusBadgeCellRenderer,
  OperatingEnvBadgeCellRenderer,
  CVELinkCellRenderer,
  CRQLinkCellRenderer,
  DueDateCellRenderer,
  DaysOpenCellRenderer,
  OwnerCellRenderer,
  BooleanBadgeCellRenderer,
  VerificationStatusBadgeCellRenderer,
  DispositionCellRenderer,
  TechnologyCellRenderer,
} from "@/components/ag-grid/cell-renderers";
import type { Vulnerability, Disposition } from "@/lib/types";
import { USERS } from "@/lib/mock-data";
import "@/lib/ag-grid-setup";
import { useSavedViews } from "@/hooks/use-saved-views";
import { useSavedViewsToolbarUi } from "@/components/vulnerability/saved-views-toolbar";

// For production: replace with rowModelType='serverSide' and provide a
// serverSideDatasource that calls the .NET API endpoint.
// Filter, sort, group state can be passed via the IServerSideGetRowsRequest
// object. Pagination is handled server-side.

type DensityMode = "compact" | "comfortable";

// Tablet (768–1023px): keep this lean set so columns fit at ~1024px without
// horizontal scroll. Hidden columns remain available via the side-panel
// Columns tool when the user pulls it up.
const TABLET_VISIBLE_FIELDS = new Set<string>([
  "triageStatus",
  "severityRisk",
  "status",
  "cve",
  "title",
  "hostName",
  "dueDate",
  "vulnOwner",
]);

const FILTER_OPTIONS = {
  sourceStatus: ["Open", "Closed"],
  triageStatus: ["Awaiting Disposition", "In Progress", "Pending Clear Scan", "Resolved"],
  severityRisk: ["Priority 1", "Priority 2", "Priority 3", "Priority 4"],
  workstream: ["MiddlewarePatch", "NonQualysCVE", "ADSF", "CloudConfigCompliance"],
  source: [
    "ADSF",
    "MiddlewarePatch",
    "ESM",
    "BDNA",
    "Bladelogic patch",
    "CTI Manual Ingestion",
    "Cloud Config Compliance",
    "Nextgen BMP",
  ],
  operatingEnvironment: ["In Production", "Pre-Prod", "Contingency"],
  pastDue: ["Y", "N"],
};

type FilterKey = keyof typeof FILTER_OPTIONS;

interface MultiSelectPopoverProps {
  label: string;
  options: string[];
  selected: Set<string>;
  onChange: (selected: Set<string>) => void;
}

function MultiSelectPopover({ label, options, selected, onChange }: MultiSelectPopoverProps) {
  const [open, setOpen] = useState(false);

  const toggleOption = (opt: string) => {
    const next = new Set(selected);
    if (next.has(opt)) next.delete(opt);
    else next.add(opt);
    onChange(next);
  };

  const count = selected.size;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={count > 0 ? "secondary" : "outline"}
          size="sm"
          className="h-8 text-xs gap-1.5"
          aria-label={`Filter by ${label}${count > 0 ? ` (${count} selected)` : ""}`}
        >
          <Filter className="h-3 w-3" />
          {label}
          {count > 0 && (
            <span className="ml-0.5 rounded-full bg-primary text-primary-foreground text-[10px] h-4 w-4 flex items-center justify-center font-medium">
              {count}
            </span>
          )}
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-2" align="start">
        <div className="space-y-1">
          {options.map((opt) => (
            <div key={opt} className="flex items-center gap-2 px-1 py-1 rounded hover:bg-muted">
              <Checkbox
                id={`${label}-${opt}`}
                checked={selected.has(opt)}
                onCheckedChange={() => toggleOption(opt)}
              />
              <Label htmlFor={`${label}-${opt}`} className="text-xs cursor-pointer flex-1">
                {opt}
              </Label>
            </div>
          ))}
        </div>
        {count > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2 h-7 text-xs"
            onClick={() => onChange(new Set())}
          >
            Clear
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}

// ── Bulk Action Bar ────────────────────────────────────────────────────────────

const DISPOSITION_OPTIONS = ["Fix", "Defer", "Mitigate", "Accept Risk", "False Positive"] as const;

interface BulkActionBarProps {
  selectedCount: number;
  onClear: () => void;
  onExportSelected: () => void;
  onAssignOwner: (owner: string) => void;
  onSetDisposition: (disposition: string) => void;
}

function BulkActionBar({
  selectedCount,
  onClear,
  onExportSelected,
  onAssignOwner,
  onSetDisposition,
}: BulkActionBarProps) {
  const [ownerOpen, setOwnerOpen] = useState(false);
  const [dispositionOpen, setDispositionOpen] = useState(false);

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-200 ease-out ${
        selectedCount > 0 ? "translate-y-0" : "translate-y-full"
      }`}
      role="region"
      aria-label="Bulk actions"
      aria-live="polite"
    >
      <div className="mx-3 sm:mx-6 mb-3 sm:mb-4" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="bg-zinc-900 text-white rounded-lg shadow-xl px-3 sm:px-4 py-3 flex flex-wrap items-center gap-2 sm:gap-4">
          <span className="text-sm font-medium flex-shrink-0">
            {selectedCount} row{selectedCount !== 1 ? "s" : ""} selected
          </span>
          <div className="flex items-center gap-2 flex-1 flex-wrap min-w-0">
            {/* Assign Owner */}
            <Popover open={ownerOpen} onOpenChange={setOwnerOpen}>
              <PopoverTrigger asChild>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 text-xs bg-zinc-700 hover:bg-zinc-600 text-white border-0 gap-1"
                  aria-label="Assign owner to selected rows"
                >
                  Assign Owner
                  <ChevronDown className="h-3 w-3 opacity-70" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-48 p-1"
                align="start"
                side="top"
                sideOffset={8}
              >
                <div className="px-2 py-1 text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Assign to
                </div>
                {USERS.map((u) => (
                  <button
                    key={u.id}
                    className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-muted transition-colors flex items-center gap-2"
                    onClick={() => {
                      onAssignOwner(u.name);
                      setOwnerOpen(false);
                    }}
                  >
                    <span className="h-5 w-5 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-[9px] font-medium flex items-center justify-center flex-shrink-0">
                      {u.initials}
                    </span>
                    {u.name}
                  </button>
                ))}
              </PopoverContent>
            </Popover>

            {/* Set Disposition */}
            <Popover open={dispositionOpen} onOpenChange={setDispositionOpen}>
              <PopoverTrigger asChild>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 text-xs bg-zinc-700 hover:bg-zinc-600 text-white border-0 gap-1"
                  aria-label="Set disposition on selected rows"
                >
                  Set Disposition
                  <ChevronDown className="h-3 w-3 opacity-70" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-44 p-1"
                align="start"
                side="top"
                sideOffset={8}
              >
                <div className="px-2 py-1 text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Set to
                </div>
                {DISPOSITION_OPTIONS.map((d) => (
                  <button
                    key={d}
                    className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-muted transition-colors"
                    onClick={() => {
                      onSetDisposition(d);
                      setDispositionOpen(false);
                    }}
                  >
                    {d}
                  </button>
                ))}
              </PopoverContent>
            </Popover>

            <Button
              size="sm"
              variant="secondary"
              className="h-7 text-xs bg-zinc-700 hover:bg-zinc-600 text-white border-0"
              onClick={onExportSelected}
              aria-label="Export selected rows as CSV"
            >
              <Download className="h-3 w-3 mr-1" />
              Export Selected
            </Button>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-zinc-400 hover:text-white hover:bg-zinc-700 flex-shrink-0"
            onClick={onClear}
            aria-label="Clear selection"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

interface Props {
  vulnerabilities: Vulnerability[];
  onRowSelected: (vuln: Vulnerability) => void;
  selectedVuln: Vulnerability | null;
  sheetOpen: boolean;
  onSheetChange: (open: boolean) => void;
  onSave: (updated: Vulnerability) => void;
}

export function AgGridTriageTable({
  vulnerabilities,
  onRowSelected,
  selectedVuln,
  sheetOpen,
  onSheetChange,
  onSave,
}: Props) {
  const gridRef = useRef<AgGridReact>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [gridApi, setGridApi] = useState<any>(null);
  const [quickFilter, setQuickFilter] = useState("");
  const [filters, setFilters] = useState<Record<FilterKey, Set<string>>>(
    () =>
      Object.fromEntries(
        Object.keys(FILTER_OPTIONS).map((k) => [k, new Set<string>()])
      ) as Record<FilterKey, Set<string>>
  );
  const [selectedCount, setSelectedCount] = useState(0);
  const [density, setDensity] = useState<DensityMode>("comfortable");
  const viewport = useViewport();
  const isMobile = viewport === "mobile";
  const isTablet = viewport === "tablet";

  const rowHeight = density === "compact" ? 32 : 36;

  // Compute active filter chips
  const activeFilters = useMemo(() => {
    const chips: { key: FilterKey; value: string }[] = [];
    for (const [k, vals] of Object.entries(filters) as [FilterKey, Set<string>][]) {
      for (const v of vals) chips.push({ key: k, value: v });
    }
    return chips;
  }, [filters]);

  // Shared predicate so the grid (desktop/tablet) and card list (mobile)
  // apply the same filter logic.
  const matchesFilters = useCallback(
    (v: Vulnerability) => {
      for (const [key, vals] of Object.entries(filters) as [FilterKey, Set<string>][]) {
        if (!vals.size) continue;
        const fieldMap: Partial<Record<FilterKey, string>> = {
          sourceStatus: v.status,
          triageStatus: v.triageStatus,
          severityRisk: v.severityRisk,
          workstream: v.workstream,
          source: v.source,
          operatingEnvironment: v.operatingEnvironment,
          pastDue: v.pastDue,
        };
        const cell = fieldMap[key] ?? "";
        if (!vals.has(cell)) return false;
      }
      return true;
    },
    [filters]
  );

  // Apply external filters via grid's external filter mechanism
  const isExternalFilterPresent = useCallback(
    () => activeFilters.length > 0,
    [activeFilters]
  );

  const doesExternalFilterPass = useCallback(
    (node: IRowNode<Vulnerability>) => !node.data || matchesFilters(node.data),
    [matchesFilters]
  );

  // Card-list mode (mobile) — apply quick-filter + external filters here since
  // there's no grid to host them. Sort by severity priority so worst-first.
  const cardVulns = useMemo(() => {
    if (!isMobile) return [] as Vulnerability[];
    const q = quickFilter.trim().toLowerCase();
    const haystack = (v: Vulnerability) =>
      [v.cve, v.hostName, v.applicationFullName, v.title, v.workstream, v.vulnOwner]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
    return vulnerabilities
      .filter((v) => (!q || haystack(v).includes(q)) && matchesFilters(v))
      .sort((a, b) => severityRiskComparator(a.severityRisk, b.severityRisk));
  }, [isMobile, vulnerabilities, quickFilter, matchesFilters]);

  const columnDefs: ColDef<Vulnerability>[] = useMemo(
    () => [
      // 1. Checkbox
      {
        checkboxSelection: true,
        headerCheckboxSelection: true,
        width: 44,
        minWidth: 44,
        maxWidth: 44,
        pinned: "left" as const,
        suppressHeaderMenuButton: true,
        sortable: false,
        filter: false,
        floatingFilter: false,
        resizable: false,
        suppressMovable: true,
      },
      // 2. Triage Status
      {
        headerName: "Triage Status",
        field: "triageStatus",
        width: 175,
        pinned: "left" as const,
        cellRenderer: TriageStatusBadgeCellRenderer,
        comparator: statusComparator,
        filter: "agSetColumnFilter",
        filterParams: {
          values: FILTER_OPTIONS.triageStatus,
        },
      },
      // 3. Severity Risk
      {
        headerName: "Severity Risk",
        field: "severityRisk",
        width: 120,
        cellRenderer: SeverityBadgeCellRenderer,
        comparator: severityRiskComparator,
        filter: "agSetColumnFilter",
        filterParams: { values: FILTER_OPTIONS.severityRisk },
        sort: "asc" as const,
      },
      // 4. Source Status
      {
        headerName: "Source Status",
        field: "status",
        width: 110,
        cellRenderer: SourceStatusBadgeCellRenderer,
        filter: "agSetColumnFilter",
        filterParams: { values: FILTER_OPTIONS.sourceStatus },
      },
      // 5. CVE
      {
        headerName: "CVE",
        field: "cve",
        width: 170,
        cellRenderer: CVELinkCellRenderer,
        filter: "agTextColumnFilter",
      },
      // 6. Title
      {
        headerName: "Title",
        field: "title",
        flex: 1,
        minWidth: 280,
        filter: "agTextColumnFilter",
        tooltipField: "title",
      },
      // 7. Workstream
      {
        headerName: "Workstream",
        field: "workstream",
        width: 170,
        filter: "agSetColumnFilter",
        filterParams: { values: FILTER_OPTIONS.workstream },
      },
      // 8. Technology (combined)
      {
        headerName: "Technology",
        colId: "technology",
        width: 200,
        valueGetter: (p: ValueGetterParams<Vulnerability>) =>
          p.data
            ? `${p.data.technology}${p.data.technologyVersion ? " " + p.data.technologyVersion : ""}`
            : "",
        cellRenderer: TechnologyCellRenderer,
        filter: "agTextColumnFilter",
      },
      // 9. Host Name / Server
      {
        headerName: "Host Name / Server",
        field: "hostName",
        width: 230,
        filter: "agTextColumnFilter",
        tooltipField: "hostName",
        cellClass: "font-mono text-xs",
      },
      // 10. Operating Environment
      {
        headerName: "Operating Env",
        field: "operatingEnvironment",
        width: 135,
        cellRenderer: OperatingEnvBadgeCellRenderer,
        filter: "agSetColumnFilter",
        filterParams: { values: FILTER_OPTIONS.operatingEnvironment },
      },
      // 11. Days Open
      {
        headerName: "Days Open",
        field: "daysOpen",
        width: 110,
        type: "numericColumn",
        cellRenderer: DaysOpenCellRenderer,
        filter: "agNumberColumnFilter",
        sort: "desc" as const,
      },
      // 12. Due Date
      {
        headerName: "Due Date",
        field: "dueDate",
        width: 120,
        cellRenderer: DueDateCellRenderer,
        filter: "agDateColumnFilter",
      },
      // 13. Past Due
      {
        headerName: "Past Due",
        field: "pastDue",
        width: 90,
        cellRenderer: BooleanBadgeCellRenderer,
        filter: "agSetColumnFilter",
        filterParams: { values: FILTER_OPTIONS.pastDue },
      },
      // 14. Disposition
      {
        headerName: "Disposition",
        field: "disposition",
        width: 140,
        cellRenderer: DispositionCellRenderer,
        filter: "agSetColumnFilter",
        filterParams: { values: ["Fix", "Defer", "Mitigate", "Accept Risk", "False Positive"] },
      },
      // 15. CRQ #
      {
        headerName: "CRQ #",
        field: "crqNumber",
        width: 185,
        cellRenderer: CRQLinkCellRenderer,
        filter: "agTextColumnFilter",
      },
      // 16. Vuln Owner
      {
        headerName: "Vuln Owner",
        field: "vulnOwner",
        width: 185,
        cellRenderer: OwnerCellRenderer,
        filter: "agSetColumnFilter",
      },

      // ── Hidden columns (toggleable via Columns panel) ──
      {
        headerName: "Report Date",
        field: "reportDate",
        hide: true,
        filter: "agDateColumnFilter",
      },
      {
        headerName: "GIS ID",
        field: "id",
        hide: true,
        filter: "agTextColumnFilter",
        cellClass: "font-mono text-xs",
      },
      {
        headerName: "Qualys ID",
        field: "qualysId",
        hide: true,
        filter: "agNumberColumnFilter",
        cellClass: "font-mono text-xs",
        type: "numericColumn",
      },
      {
        headerName: "Application Full Name",
        field: "applicationFullName",
        hide: true,
        filter: "agTextColumnFilter",
      },
      {
        headerName: "App Manager Contact",
        field: "applicationManagerContactName",
        hide: true,
        filter: "agTextColumnFilter",
      },
      {
        headerName: "Technical Executive",
        field: "technicalExecutiveContactName",
        hide: true,
        filter: "agTextColumnFilter",
      },
      {
        headerName: "CIO Display Name",
        field: "cioDisplayName",
        hide: true,
        filter: "agSetColumnFilter",
        filterParams: { values: ["James Hartley", "Patricia Owens", "Raj Mehta", "Sandra Corrigan", "Marcus Webb", "Claire Fontaine", "Derek Okonkwo"] },
      },
      {
        headerName: "Source",
        field: "source",
        hide: true,
        filter: "agSetColumnFilter",
        filterParams: { values: FILTER_OPTIONS.source },
      },
      {
        headerName: "ESM Type",
        field: "esmType",
        hide: true,
        filter: "agSetColumnFilter",
        filterParams: { values: ["ESM - OS", "UNAUTH-DEVICE", "Application"] },
      },
      {
        headerName: "Consequence Model",
        field: "consequenceModel",
        hide: true,
        filter: "agSetColumnFilter",
      },
      {
        headerName: "Verification Status",
        field: "verificationStatus",
        hide: true,
        cellRenderer: VerificationStatusBadgeCellRenderer,
        filter: "agSetColumnFilter",
      },
      {
        headerName: "Scorecard ERP Details",
        field: "scorecardErpStatusDetails",
        hide: true,
        filter: "agTextColumnFilter",
      },
      {
        headerName: "Is CISA",
        field: "isCisa",
        hide: true,
        cellRenderer: BooleanBadgeCellRenderer,
        filter: "agSetColumnFilter",
        filterParams: { values: ["Y", "N"] },
      },
      {
        headerName: "Is DMZ",
        field: "isDmz",
        hide: true,
        cellRenderer: BooleanBadgeCellRenderer,
        filter: "agSetColumnFilter",
        filterParams: { values: ["Y", "N"] },
      },
      {
        headerName: "Is Public Internet",
        field: "isPublicInternetAccessible",
        hide: true,
        cellRenderer: BooleanBadgeCellRenderer,
        filter: "agSetColumnFilter",
        filterParams: { values: ["Y", "N"] },
      },
      {
        headerName: "Hosting Platform",
        field: "hostingPlatform",
        hide: true,
        filter: "agSetColumnFilter",
        filterParams: { values: ["BofA Cloud Standard N", "BofA Cloud Static N", "Nextgen BMP N"] },
      },
      {
        headerName: "FQDN",
        field: "fqdn",
        hide: true,
        filter: "agTextColumnFilter",
        cellClass: "font-mono text-xs",
      },
      {
        headerName: "IP Addresses",
        field: "ipAddresses",
        hide: true,
        filter: "agTextColumnFilter",
        cellClass: "font-mono text-xs",
      },
      {
        headerName: "Scheduled Fix Date",
        field: "scheduledFixDate",
        hide: true,
        filter: "agDateColumnFilter",
      },
      {
        headerName: "Resolved Date",
        field: "resolvedDate",
        hide: true,
        filter: "agDateColumnFilter",
      },
      {
        headerName: "Freshness / Version Date",
        field: "freshnessDate",
        hide: true,
        filter: "agDateColumnFilter",
      },
      {
        headerName: "ERP Exception ID",
        field: "erpExceptionId",
        hide: true,
        filter: "agTextColumnFilter",
      },
      {
        headerName: "ERP Exception Status",
        field: "erpExceptionRequestStatus",
        hide: true,
        filter: "agSetColumnFilter",
        filterParams: { values: ["Approved", "Pending"] },
      },
      {
        headerName: "Vulnerability Subcategory",
        field: "vulnerabilitySubcategory",
        hide: true,
        filter: "agSetColumnFilter",
      },
      {
        headerName: "OS Name",
        field: "osName",
        hide: true,
        filter: "agTextColumnFilter",
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [density]
  );

  const defaultColDef: ColDef = useMemo(
    () => ({
      sortable: true,
      resizable: true,
      filter: true,
      floatingFilter: true,
      suppressHeaderMenuButton: false,
      menuTabs: ["filterMenuTab", "generalMenuTab", "columnsMenuTab"],
      enableRowGroup: true,
      enableValue: true,
      enablePivot: true,
    }),
    []
  );

  const sideBar = useMemo(
    () => ({
      toolPanels: ["columns", "filters"],
      defaultToolPanel: "",
    }),
    []
  );

  const statusBar = useMemo(
    () => ({
      statusPanels: [
        { statusPanel: "agTotalRowCountComponent", align: "left" },
        { statusPanel: "agFilteredRowCountComponent", align: "left" },
        { statusPanel: "agSelectedRowCountComponent", align: "left" },
        { statusPanel: "agAggregationComponent", align: "right" },
      ],
    }),
    []
  );

  // ── Saved Views integration ──────────────────────────────────────────────
  // Bridge between AG Grid imperative APIs and the useSavedViews hook.
  // We snapshot filterModel + columnState + searchTerm into a view, and
  // re-hydrate the same three on apply. External MultiSelect filters are
  // intentionally not captured — views speak AG Grid's native filterModel.
  const getCurrentSnapshot = useCallback(() => {
    const api = gridRef.current?.api;
    if (!api) return null;
    return {
      filterModel: (api.getFilterModel?.() ?? {}) as Record<string, unknown>,
      columnState: (api.getColumnState?.() ?? []) as ColumnState[],
      searchTerm: quickFilter,
    };
  }, [quickFilter]);

  const applySnapshot = useCallback(
    (snap: {
      filterModel: Record<string, unknown>;
      columnState: ColumnState[];
      searchTerm: string;
    }) => {
      const api = gridRef.current?.api;
      if (!api) return;
      // Apply filter model first so AG Grid only re-renders rows once.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      api.setFilterModel(snap.filterModel as any);
      // Reset sort across all columns before applying the view's sort so
      // a leftover sort from the previous view doesn't linger.
      api.applyColumnState({
        state: snap.columnState,
        applyOrder: true,
        defaultState: { sort: null },
      });
      setQuickFilter(snap.searchTerm);
    },
    [],
  );

  const savedViews = useSavedViews({ getCurrentSnapshot, applySnapshot });

  // Wait for both the hook to hydrate from localStorage AND AG Grid to be
  // ready, then apply the resolved current view exactly once.
  const initialViewAppliedRef = useRef(false);
  useEffect(() => {
    if (initialViewAppliedRef.current) return;
    if (!savedViews.hydrated) return;
    if (!gridApi) return;
    savedViews.applyCurrentView();
    initialViewAppliedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedViews.hydrated, gridApi]);

  // Quick filter change is detected via the existing useEffect on quickFilter;
  // bridge it into the views hook so the dot/(modified) label updates.
  useEffect(() => {
    if (!initialViewAppliedRef.current) return;
    savedViews.notifyStateChanged();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quickFilter]);

  const handleGridStateChanged = useCallback(() => {
    if (!initialViewAppliedRef.current) return;
    savedViews.notifyStateChanged();
  }, [savedViews]);

  const savedViewsUi = useSavedViewsToolbarUi({
    views: savedViews.views,
    builtInViews: savedViews.builtInViews,
    currentView: savedViews.currentView,
    hasUnsavedChanges: savedViews.hasUnsavedChanges,
    onApplyView: savedViews.applyView,
    onSaveCurrentAsNew: savedViews.saveCurrentAsNew,
    onUpdateCurrent: savedViews.updateCurrent,
    onRename: savedViews.rename,
    onDelete: savedViews.deleteView,
    onSetDefault: savedViews.setDefault,
    onResetCurrent: savedViews.resetCurrent,
  });

  const onGridReady = useCallback((e: GridReadyEvent) => {
    setGridApi(e.api);
  }, []);

  // On tablet, fit visible columns into the available width whenever the
  // grid resizes (drawer toggle, orientation change, browser resize). Skipped
  // on desktop so users keep their explicit column widths.
  const onGridSizeChanged = useCallback(
    (e: GridSizeChangedEvent) => {
      if (isTablet) e.api.sizeColumnsToFit();
    },
    [isTablet]
  );

  // Adjust column visibility when the viewport bucket changes. On tablet we
  // collapse to TABLET_VISIBLE_FIELDS; on desktop we restore each column's
  // declared default. User toggles via the side panel persist within a
  // viewport but reset when the bucket changes.
  useEffect(() => {
    if (!gridApi || isMobile) return;
    const cols = gridApi.getColumns?.() ?? [];
    const state: ColumnState[] = cols
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((col: any) => {
        const colId: string = col.getColId();
        const def = col.getColDef() as ColDef<Vulnerability>;
        const field = def.field as string | undefined;
        // Checkbox / pinned cols without a field — leave alone.
        if (!field) return null;
        if (isTablet) {
          return { colId, hide: !TABLET_VISIBLE_FIELDS.has(field) } as ColumnState;
        }
        return { colId, hide: !!def.hide } as ColumnState;
      })
      .filter((s: ColumnState | null): s is ColumnState => s !== null);
    gridApi.applyColumnState({ state, applyOrder: false });
    gridApi.setGridOption("suppressHorizontalScroll", isTablet);
    if (isTablet) gridApi.sizeColumnsToFit();
  }, [gridApi, isTablet, isMobile]);

  const onSelectionChanged = useCallback((e: SelectionChangedEvent) => {
    setSelectedCount(e.api.getSelectedRows().length);
    const status = document.getElementById("grid-status");
    if (status) status.textContent = `${e.api.getSelectedRows().length} rows selected`;
  }, []);

  const onRowClicked = useCallback(
    (e: RowClickedEvent<Vulnerability>) => {
      // Don't open sheet if click landed on a link (CVE / CRQ)
      const target = e.event?.target as HTMLElement | null;
      if (target?.closest("a")) return;
      if (e.data) onRowSelected(e.data);
    },
    [onRowSelected]
  );

  // Quick filter
  useEffect(() => {
    if (gridRef.current?.api) {
      gridRef.current.api.setGridOption("quickFilterText", quickFilter);
      const status = document.getElementById("grid-status");
      if (status) {
        const count = gridRef.current.api.getDisplayedRowCount();
        status.textContent = `Showing ${count} rows`;
      }
    }
  }, [quickFilter]);

  // External filter notify
  useEffect(() => {
    if (gridRef.current?.api) {
      gridRef.current.api.onFilterChanged();
    }
  }, [filters]);

  const clearAllFilters = useCallback(() => {
    setFilters(
      Object.fromEntries(
        Object.keys(FILTER_OPTIONS).map((k) => [k, new Set<string>()])
      ) as Record<FilterKey, Set<string>>
    );
    setQuickFilter("");
    if (gridRef.current?.api) {
      gridRef.current.api.setFilterModel(null);
    }
  }, []);

  const clearSelection = useCallback(() => {
    gridRef.current?.api?.deselectAll();
  }, []);

  const exportCsv = useCallback(() => {
    gridRef.current?.api?.exportDataAsCsv({
      fileName: `vulnerabilities-${new Date().toISOString().split("T")[0]}.csv`,
      onlySelected: (gridRef.current?.api?.getSelectedRows().length ?? 0) > 0,
    });
  }, []);

  const bulkAssignOwner = useCallback((owner: string) => {
    const api = gridRef.current?.api;
    if (!api) return;
    const updated = api.getSelectedRows().map((row: Vulnerability) => ({
      ...row,
      vulnOwner: owner,
    }));
    api.applyTransaction({ update: updated });
  }, []);

  const bulkSetDisposition = useCallback((disposition: string) => {
    const api = gridRef.current?.api;
    if (!api) return;
    const updated = api.getSelectedRows().map((row: Vulnerability) => ({
      ...row,
      disposition: disposition as Disposition,
      triageStatus:
        row.triageStatus === "Awaiting Disposition"
          ? "In Progress"
          : row.triageStatus,
    }));
    api.applyTransaction({ update: updated });
  }, []);

  const getContextMenuItems = useCallback(
    (params: GetContextMenuItemsParams): (string | MenuItemDef)[] => {
      const col = params.column?.getColId();
      const cve = params.node?.data?.cve;
      const crq = params.node?.data?.crqNumber;

      const menu: (string | MenuItemDef)[] = [
        "copy",
        "copyWithHeaders",
        "separator",
        "export",
        "separator",
        {
          name: "Filter by this value",
          action: () => {
            if (params.value && gridRef.current?.api) {
              gridRef.current.api.setGridOption("quickFilterText", String(params.value));
              setQuickFilter(String(params.value));
            }
          },
        },
        "separator",
      ];

      if (col === "cve" && cve) {
        menu.push({
          name: "Open CVE in NVD",
          action: () => window.open(`https://nvd.nist.gov/vuln/detail/${cve}`, "_blank"),
        });
      }
      if (col === "crqNumber" && crq) {
        menu.push({
          name: "Open CRQ in Remedy",
          action: () => window.open(`https://remedy.example.com/change/${crq}`, "_blank"),
        });
      }

      menu.push(
        "separator",
        {
          name: "Assign to me",
          action: () => bulkAssignOwner("Current User"),
          disabled: params.api.getSelectedRows().length > 1,
        },
        {
          name: "Set Disposition",
          subMenu: DISPOSITION_OPTIONS.map((d) => ({
            name: d,
            action: () => bulkSetDisposition(d),
          })),
        }
      );

      return menu;
    },
    [bulkAssignOwner, bulkSetDisposition]
  );

  const exportExcel = useCallback(() => {
    const selected = gridRef.current?.api?.getSelectedRows() ?? [];
    (gridRef.current?.api as unknown as { exportDataAsExcel: (opts: object) => void })?.exportDataAsExcel({
      fileName: `vulnerabilities-${new Date().toISOString().split("T")[0]}.xlsx`,
      sheetName: "Vulnerabilities",
      ...(selected.length > 0 && { onlySelected: true }),
    });
  }, []);

  const filterLabels: Record<FilterKey, string> = {
    sourceStatus: "Source Status",
    triageStatus: "Triage Status",
    severityRisk: "Severity",
    workstream: "Workstream",
    source: "Source",
    operatingEnvironment: "Operating Env",
    pastDue: "Past Due",
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Saved Views selector — left of search; grid-only feature */}
          {!isMobile && savedViewsUi.selector}

          {/* Search */}
          <div className="relative min-w-[220px] max-w-sm flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by CVE, host, application, title, workstream…"
              value={quickFilter}
              onChange={(e) => setQuickFilter(e.target.value)}
              className="pl-8 h-8 text-xs"
              aria-label="Quick filter across all columns"
            />
            {quickFilter && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => setQuickFilter("")}
                aria-label="Clear search"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Filter popovers */}
          {(Object.keys(FILTER_OPTIONS) as FilterKey[]).map((key) => (
            <MultiSelectPopover
              key={key}
              label={filterLabels[key]}
              options={FILTER_OPTIONS[key]}
              selected={filters[key]}
              onChange={(next) => setFilters((f) => ({ ...f, [key]: next }))}
            />
          ))}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Density + Export — grid-only affordances, hidden in card mode */}
          {!isMobile && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => setDensity((d) => (d === "compact" ? "comfortable" : "compact"))}
                aria-label={`Switch to ${density === "compact" ? "comfortable" : "compact"} density`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                {density === "compact" ? "Comfortable" : "Compact"}
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={exportExcel}
                aria-label="Export to Excel"
              >
                <Download className="h-3.5 w-3.5" />
                Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={exportCsv}
                aria-label="Export to CSV"
              >
                <Download className="h-3.5 w-3.5" />
                CSV
              </Button>

              {/* Saved Views save / more — right of toolbar */}
              {savedViewsUi.actions}
            </>
          )}
        </div>

        {/* Active filter chips */}
        {(activeFilters.length > 0 || quickFilter) && (
          <div className="flex flex-wrap items-center gap-1.5">
            {activeFilters.map(({ key, value }) => (
              <span
                key={`${key}-${value}`}
                className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium"
              >
                {value}
                <button
                  className="hover:text-destructive transition-colors"
                  onClick={() =>
                    setFilters((f) => {
                      const next = new Set(f[key]);
                      next.delete(value);
                      return { ...f, [key]: next };
                    })
                  }
                  aria-label={`Remove ${value} filter`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <button
              className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2"
              onClick={clearAllFilters}
            >
              Clear all
            </button>
          </div>
        )}

        {/* Grid (desktop / tablet) — Card list (mobile) */}
        {isMobile ? (
          <div
            className="w-full rounded-md border border-border/60 vrd-ag-grid bg-background overflow-y-auto"
            style={{ height: "min(calc(100dvh - 240px), 75vh)", minHeight: 360 }}
            role="list"
            aria-label="Vulnerabilities"
          >
            {cardVulns.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground p-6 text-center">
                No vulnerabilities match the current filters.
              </div>
            ) : (
              <div className="flex flex-col gap-2 p-3">
                {cardVulns.map((v) => (
                  <VulnerabilityCard
                    key={v.id}
                    vulnerability={v}
                    onClick={onRowSelected}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div
            className="ag-theme-quartz w-full rounded-md overflow-hidden border border-border/60 vrd-ag-grid"
            style={{ height: "min(calc(100dvh - 240px), 75vh)", minHeight: 360 }}
          >
            <AgGridReact<Vulnerability>
              ref={gridRef}
              rowData={vulnerabilities}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              onGridReady={onGridReady}
              onGridSizeChanged={onGridSizeChanged}
              onRowClicked={onRowClicked}
              onSelectionChanged={onSelectionChanged}
              onFilterChanged={handleGridStateChanged}
              onSortChanged={handleGridStateChanged}
              onColumnVisible={handleGridStateChanged}
              onColumnMoved={handleGridStateChanged}
              onColumnResized={handleGridStateChanged}
              rowSelection={{
                mode: "multiRow",
                checkboxes: true,
                headerCheckbox: true,
                enableClickSelection: false,
              }}
              suppressRowClickSelection={true}
              suppressHorizontalScroll={isTablet}
              enableRangeSelection={true}
              enableCharts={true}
              cellSelection={true}
              pagination={true}
              paginationPageSize={50}
              paginationPageSizeSelector={[25, 50, 100, 200]}
              animateRows={true}
              enableCellTextSelection={true}
              suppressMenuHide={false}
              tooltipShowDelay={500}
              floatingFiltersHeight={36}
              headerHeight={40}
              rowHeight={rowHeight}
              sideBar={sideBar}
              statusBar={statusBar}
              getContextMenuItems={getContextMenuItems}
              isExternalFilterPresent={isExternalFilterPresent}
              doesExternalFilterPass={doesExternalFilterPass}
              rowGroupPanelShow="always"
              pivotPanelShow="always"
              groupDisplayType="singleColumn"
              getRowId={(p) => p.data.id}
            />
          </div>
        )}
      </div>

      {/* Saved Views dialogs (Save / Rename / Delete) — portaled */}
      {savedViewsUi.dialogs}

      {/* Detail Sheet */}
      {selectedVuln && (
        <DetailSheet
          vulnerability={selectedVuln}
          open={sheetOpen}
          onOpenChange={onSheetChange}
          onSave={onSave}
          allVulnerabilities={vulnerabilities}
          onNavigate={onRowSelected}
        />
      )}

      {/* Bulk action bar */}
      <BulkActionBar
        selectedCount={selectedCount}
        onClear={clearSelection}
        onExportSelected={exportCsv}
        onAssignOwner={bulkAssignOwner}
        onSetDisposition={bulkSetDisposition}
      />
    </>
  );
}
