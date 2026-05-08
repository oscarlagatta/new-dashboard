"use client";

/**
 * Vulnerability Triage Dashboard
 * AG Grid Enterprise v32.3.0 + AG Charts Enterprise v10.0.0
 * 
 * API MIGRATION COMMENT:
 * For production, replace inline mock data with Server-Side Row Model.
 * Set rowModelType='serverSide' and provide a serverSideDatasource that calls the .NET API.
 * Filter, sort, and group state can be passed to the backend via the request object.
 * Pagination will be handled server-side.
 */

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import type {
  ColDef,
  GridReadyEvent,
  RowClickedEvent,
  SelectionChangedEvent,
  GridApi,
  GetContextMenuItemsParams,
  MenuItemDef,
  StatusPanelDef,
} from "ag-grid-community";
import { themeQuartz } from "ag-grid-community";
import "@/lib/ag-grid-setup";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Download,
  ChevronDown,
  X,
  Users,
  FileSpreadsheet,
  RefreshCw,
} from "lucide-react";

import {
  StatusBadgeCellRenderer,
  SeverityBadgeCellRenderer,
  OperatingEnvironmentBadgeCellRenderer,
  CVELinkCellRenderer,
  CRQLinkCellRenderer,
  DueDateCellRenderer,
  DaysOpenCellRenderer,
  OwnerCellRenderer,
  TechnologyCellRenderer,
  DispositionCellRenderer,
  VerificationStatusCellRenderer,
  BooleanBadgeCellRenderer,
  SourceBadgeCellRenderer,
  LastUpdatedCellRenderer,
} from "@/components/ag-grid/cell-renderers";
import { StatCards } from "@/components/vulnerability/stat-cards";
import { SeverityStatusChart } from "@/components/vulnerability/severity-status-chart";
import { DetailSheet } from "@/components/vulnerability/detail-sheet";
import {
  mockVulnerabilities,
  generateSeverityStatusData,
  CIO_TEAMS,
  USERS,
} from "@/lib/mock-data";
import { severityComparator, statusComparator } from "@/lib/ag-grid-setup";
import type { Vulnerability, Disposition } from "@/lib/types";

export default function VulnerabilityDashboard() {
  const gridRef = useRef<AgGridReact>(null);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [rowData, setRowData] = useState<Vulnerability[]>(mockVulnerabilities);
  const [selectedVuln, setSelectedVuln] = useState<Vulnerability | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Vulnerability[]>([]);
  const [quickFilterText, setQuickFilterText] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [selectedCio, setSelectedCio] = useState(CIO_TEAMS[0]);

  // Calculate stats
  const stats = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    return {
      awaitingDisposition: rowData.filter((v) => v.status === "Awaiting Disposition").length,
      inProgress: rowData.filter((v) => v.status === "In Progress").length,
      pendingClearScan: rowData.filter((v) => v.status === "Pending Clear Scan").length,
      resolvedLast30Days: rowData.filter(
        (v) => v.status === "Resolved" && v.remediatedDate && new Date(v.remediatedDate) >= thirtyDaysAgo
      ).length,
    };
  }, [rowData]);

  const chartData = useMemo(() => generateSeverityStatusData(rowData), [rowData]);

  // AG Grid theme customization matching shadcn
  const theme = useMemo(() => {
    return themeQuartz.withParams({
      accentColor: "#3b82f6",
      borderRadius: 6,
      browserColorScheme: "light",
      fontFamily: "inherit",
      fontSize: 13,
      headerFontSize: 13,
      headerFontWeight: 600,
      rowBorder: true,
      spacing: 6,
      wrapperBorder: true,
      wrapperBorderRadius: 8,
    });
  }, []);

  // Column definitions
  const columnDefs = useMemo<ColDef[]>(
    () => [
      {
        headerName: "Status",
        field: "status",
        width: 170,
        pinned: "left",
        cellRenderer: StatusBadgeCellRenderer,
        filter: "agSetColumnFilter",
        filterParams: {
          values: ["Awaiting Disposition", "In Progress", "Pending Clear Scan", "Resolved"],
        },
        comparator: statusComparator,
      },
      {
        headerName: "Severity",
        field: "severity",
        width: 100,
        cellRenderer: SeverityBadgeCellRenderer,
        filter: "agSetColumnFilter",
        filterParams: {
          values: ["Critical", "High", "Medium", "Low"],
        },
        comparator: severityComparator,
      },
      {
        headerName: "CVE",
        field: "cve",
        width: 160,
        cellRenderer: CVELinkCellRenderer,
        filter: "agTextColumnFilter",
      },
      {
        headerName: "Title",
        field: "title",
        flex: 1,
        minWidth: 250,
        tooltipField: "title",
        filter: "agTextColumnFilter",
      },
      {
        headerName: "Technology",
        field: "technology",
        width: 180,
        cellRenderer: TechnologyCellRenderer,
        filter: "agSetColumnFilter",
      },
      {
        headerName: "Host Name / Server",
        field: "hostName",
        width: 220,
        cellClass: "font-mono text-xs",
        tooltipField: "hostName",
        filter: "agTextColumnFilter",
      },
      {
        headerName: "Operating Env",
        field: "operatingEnvironment",
        width: 140,
        cellRenderer: OperatingEnvironmentBadgeCellRenderer,
        filter: "agSetColumnFilter",
        filterParams: {
          values: ["Production", "Non-Production", "Development", "UAT"],
        },
      },
      {
        headerName: "Days Open",
        field: "daysOpen",
        width: 110,
        type: "numericColumn",
        cellRenderer: DaysOpenCellRenderer,
        filter: "agNumberColumnFilter",
      },
      {
        headerName: "Due Date",
        field: "dueDate",
        width: 140,
        cellRenderer: DueDateCellRenderer,
        filter: "agDateColumnFilter",
      },
      {
        headerName: "Disposition",
        field: "disposition",
        width: 130,
        cellRenderer: DispositionCellRenderer,
        filter: "agSetColumnFilter",
        filterParams: {
          values: ["Fix", "Defer", "Mitigate", "Accept Risk", "False Positive"],
        },
      },
      {
        headerName: "CRQ #",
        field: "crqNumber",
        width: 160,
        cellRenderer: CRQLinkCellRenderer,
        filter: "agTextColumnFilter",
      },
      {
        headerName: "Vuln Owner",
        field: "vulnOwner",
        width: 180,
        cellRenderer: OwnerCellRenderer,
        filter: "agSetColumnFilter",
      },
      // Hidden columns (togglable via Columns panel)
      {
        headerName: "Application",
        field: "applicationFullName",
        width: 200,
        hide: true,
        filter: "agSetColumnFilter",
      },
      {
        headerName: "Verification Status",
        field: "verificationStatus",
        width: 160,
        hide: true,
        cellRenderer: VerificationStatusCellRenderer,
        filter: "agSetColumnFilter",
      },
      {
        headerName: "Source",
        field: "source",
        width: 100,
        hide: true,
        cellRenderer: SourceBadgeCellRenderer,
        filter: "agSetColumnFilter",
      },
      {
        headerName: "Past Due",
        field: "pastDue",
        width: 100,
        hide: true,
        cellRenderer: BooleanBadgeCellRenderer,
        filter: "agSetColumnFilter",
      },
      {
        headerName: "Scheduled Fix",
        field: "scheduledFixDate",
        width: 140,
        hide: true,
        filter: "agDateColumnFilter",
        valueFormatter: (params) =>
          params.value ? new Date(params.value).toLocaleDateString() : "—",
      },
      {
        headerName: "Last Updated",
        field: "lastUpdated",
        width: 140,
        hide: true,
        cellRenderer: LastUpdatedCellRenderer,
        filter: "agDateColumnFilter",
      },
      {
        headerName: "GIS ID",
        field: "gisId",
        width: 160,
        hide: true,
        cellClass: "font-mono text-xs",
        filter: "agTextColumnFilter",
      },
      {
        headerName: "Qualys ID",
        field: "qualysId",
        width: 120,
        hide: true,
        cellClass: "font-mono text-xs",
        filter: "agTextColumnFilter",
      },
      {
        headerName: "OS Name",
        field: "osName",
        width: 200,
        hide: true,
        filter: "agTextColumnFilter",
      },
      {
        headerName: "IP Addresses",
        field: "ipAddresses",
        width: 180,
        hide: true,
        cellClass: "font-mono text-xs",
        valueFormatter: (params) => params.value?.join(", ") || "—",
        filter: "agTextColumnFilter",
      },
      {
        headerName: "Tier",
        field: "tier",
        width: 140,
        hide: true,
        filter: "agSetColumnFilter",
      },
      {
        headerName: "Runbook Owner",
        field: "runbookOwner",
        width: 160,
        hide: true,
        filter: "agSetColumnFilter",
      },
      {
        headerName: "Tech Executive",
        field: "techExecutive",
        width: 160,
        hide: true,
        filter: "agTextColumnFilter",
      },
      {
        headerName: "Workstream",
        field: "workstream",
        width: 180,
        hide: true,
        filter: "agSetColumnFilter",
      },
      {
        headerName: "Built In House",
        field: "isBuiltInHouse",
        width: 120,
        hide: true,
        cellRenderer: BooleanBadgeCellRenderer,
        filter: "agSetColumnFilter",
      },
      {
        headerName: "Hosting Platform",
        field: "hostingPlatform",
        width: 140,
        hide: true,
        filter: "agSetColumnFilter",
      },
    ],
    []
  );

  // Default column properties
  const defaultColDef = useMemo<ColDef>(
    () => ({
      sortable: true,
      filter: true,
      floatingFilter: true,
      resizable: true,
      suppressHeaderMenuButton: false,
    }),
    []
  );

  // Status bar
  const statusBar = useMemo<{ statusPanels: StatusPanelDef[] }>(
    () => ({
      statusPanels: [
        { statusPanel: "agTotalRowCountComponent", align: "left" },
        { statusPanel: "agFilteredRowCountComponent", align: "left" },
        { statusPanel: "agSelectedRowCountComponent", align: "center" },
        { statusPanel: "agAggregationComponent", align: "right" },
      ],
    }),
    []
  );

  // Context menu
  const getContextMenuItems = useCallback(
    (params: GetContextMenuItemsParams): (string | MenuItemDef)[] => {
      const result: (string | MenuItemDef)[] = [];
      
      if (params.column?.getColId() === "cve" && params.value) {
        result.push({
          name: "Open in NVD",
          action: () => {
            window.open(`https://nvd.nist.gov/vuln/detail/${params.value}`, "_blank");
          },
        });
      }

      if (params.column?.getColId() === "crqNumber" && params.value) {
        result.push({
          name: "Open in Remedy",
          action: () => {
            window.open(`https://remedy.bank.internal/arsys/forms/remedy/${params.value}`, "_blank");
          },
        });
      }

      if (params.value && params.column) {
        result.push({
          name: "Filter by this value",
          action: () => {
            const filterInstance = params.api.getFilterInstance(params.column!.getColId());
            if (filterInstance) {
              filterInstance.setModel({ values: [params.value] });
              params.api.onFilterChanged();
            }
          },
        });
      }

      result.push("separator");
      result.push("copy");
      result.push("copyWithHeaders");
      result.push("separator");

      if (params.node?.data) {
        result.push({
          name: "Assign to me",
          action: () => {
            const updatedData = { ...params.node!.data, vulnOwner: "Current User" };
            params.node!.setData(updatedData);
          },
        });
        result.push({
          name: "Set Disposition",
          subMenu: [
            { name: "Fix", action: () => updateDisposition(params, "Fix") },
            { name: "Defer", action: () => updateDisposition(params, "Defer") },
            { name: "Mitigate", action: () => updateDisposition(params, "Mitigate") },
            { name: "Accept Risk", action: () => updateDisposition(params, "Accept Risk") },
            { name: "False Positive", action: () => updateDisposition(params, "False Positive") },
          ],
        });
      }

      result.push("separator");
      result.push("export");
      result.push("chartRange");

      return result;
    },
    []
  );

  const updateDisposition = (params: GetContextMenuItemsParams, disposition: Disposition) => {
    if (params.node?.data) {
      const updatedData = { ...params.node.data, disposition };
      params.node.setData(updatedData);
    }
  };

  // Event handlers
  const onGridReady = useCallback((params: GridReadyEvent) => {
    setGridApi(params.api);
  }, []);

  const onRowClicked = useCallback((event: RowClickedEvent) => {
    const target = event.event?.target as HTMLElement;
    if (
      target?.closest("button") ||
      target?.closest("a") ||
      target?.closest('[role="checkbox"]') ||
      target?.closest(".ag-checkbox-input-wrapper")
    ) {
      return;
    }
    setSelectedVuln(event.data);
    setSheetOpen(true);
  }, []);

  const onSelectionChanged = useCallback((event: SelectionChangedEvent) => {
    setSelectedRows(event.api.getSelectedRows());
  }, []);

  const handleQuickFilter = useCallback(
    (value: string) => {
      setQuickFilterText(value);
      gridApi?.setGridOption("quickFilterText", value);
    },
    [gridApi]
  );

  // Export handlers
  const handleExportExcel = useCallback(() => {
    const selectedCount = selectedRows.length;
    gridApi?.exportDataAsExcel({
      fileName: `vulnerabilities_${selectedCio.code}_${new Date().toISOString().split("T")[0]}.xlsx`,
      sheetName: "Vulnerabilities",
      onlySelected: selectedCount > 0,
    });
  }, [gridApi, selectedRows.length, selectedCio.code]);

  const handleExportCsv = useCallback(() => {
    const selectedCount = selectedRows.length;
    gridApi?.exportDataAsCsv({
      fileName: `vulnerabilities_${selectedCio.code}_${new Date().toISOString().split("T")[0]}.csv`,
      onlySelected: selectedCount > 0,
    });
  }, [gridApi, selectedRows.length, selectedCio.code]);

  // Bulk action handlers
  const handleBulkAssign = useCallback(
    (userId: string) => {
      const user = USERS.find((u) => u.id === userId);
      if (!user) return;

      selectedRows.forEach((row) => {
        const rowNode = gridApi?.getRowNode(row.id);
        if (rowNode) {
          rowNode.setData({ ...row, vulnOwner: user.name });
        }
      });
      gridApi?.deselectAll();
    },
    [gridApi, selectedRows]
  );

  const handleBulkDisposition = useCallback(
    (disposition: Disposition) => {
      selectedRows.forEach((row) => {
        const rowNode = gridApi?.getRowNode(row.id);
        if (rowNode) {
          rowNode.setData({ ...row, disposition });
        }
      });
      gridApi?.deselectAll();
    },
    [gridApi, selectedRows]
  );

  const handleClearSelection = useCallback(() => {
    gridApi?.deselectAll();
  }, [gridApi]);

  // Update filter state
  useEffect(() => {
    if (!gridApi) return;

    const updateFilters = () => {
      const filterModel = gridApi.getFilterModel();
      const filters: Record<string, string[]> = {};
      Object.entries(filterModel).forEach(([key, value]: [string, unknown]) => {
        const filterValue = value as { values?: string[]; filter?: string };
        if (filterValue?.values) {
          filters[key] = filterValue.values;
        } else if (filterValue?.filter) {
          filters[key] = [filterValue.filter];
        }
      });
      setActiveFilters(filters);
    };

    gridApi.addEventListener("filterChanged", updateFilters);
    return () => {
      if (!gridApi.isDestroyed()) {
        gridApi.removeEventListener("filterChanged", updateFilters);
      }
    };
  }, [gridApi]);

  const handleRemoveFilter = useCallback(
    (field: string) => {
      const filterInstance = gridApi?.getFilterInstance(field);
      if (filterInstance) {
        filterInstance.setModel(null);
        gridApi?.onFilterChanged();
      }
    },
    [gridApi]
  );

  const handleSaveVulnerability = useCallback(
    (updated: Vulnerability) => {
      setRowData((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
      const rowNode = gridApi?.getRowNode(updated.id);
      if (rowNode) {
        rowNode.setData(updated);
      }
    },
    [gridApi]
  );

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="border-b px-6 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Vulnerability Remediation</h1>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  CIO: {selectedCio.name}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64" align="start">
                <div className="space-y-1">
                  {CIO_TEAMS.map((team) => (
                    <Button
                      key={team.id}
                      variant={selectedCio.id === team.id ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setSelectedCio(team)}
                    >
                      {team.name}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Last refreshed: 12 minutes ago</span>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      {/* Stats & Chart */}
      <div className="px-6 py-4 space-y-4 shrink-0 border-b">
        <StatCards counts={stats} />
        <SeverityStatusChart data={chartData} />
      </div>

      {/* Toolbar */}
      <div className="px-6 py-3 shrink-0 space-y-3">
        <div className="flex items-center gap-4">
          {/* Quick Filter */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Quick filter across all columns..."
              value={quickFilterText}
              onChange={(e) => handleQuickFilter(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Export buttons */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportExcel}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export to Excel
                {selectedRows.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {selectedRows.length} selected
                  </Badge>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportCsv}>
                <Download className="h-4 w-4 mr-2" />
                Export to CSV
                {selectedRows.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {selectedRows.length} selected
                  </Badge>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Active filter chips */}
        {Object.keys(activeFilters).length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {Object.entries(activeFilters).map(([field, values]) => (
              <Badge key={field} variant="secondary" className="gap-1">
                {field}: {values.join(", ")}
                <button
                  onClick={() => handleRemoveFilter(field)}
                  className="ml-1 hover:bg-muted rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => gridApi?.setFilterModel(null)}
              className="text-xs"
            >
              Clear all
            </Button>
          </div>
        )}
      </div>

      {/* AG Grid */}
      <div className="flex-1 px-6 pb-6">
        <div className="h-full w-full">
          <AgGridReact
            ref={gridRef}
            theme={theme}
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            getRowId={(params) => params.data.id}
            onGridReady={onGridReady}
            onRowClicked={onRowClicked}
            onSelectionChanged={onSelectionChanged}
            rowSelection={{
              mode: "multiRow",
              checkboxes: true,
              headerCheckbox: true,
              enableClickSelection: false,
              enableSelectionWithoutKeys: false,
            }}
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
            rowHeight={36}
            statusBar={statusBar}
            sideBar={{
              toolPanels: [
                {
                  id: "columns",
                  labelDefault: "Columns",
                  labelKey: "columns",
                  iconKey: "columns",
                  toolPanel: "agColumnsToolPanel",
                },
                {
                  id: "filters",
                  labelDefault: "Filters",
                  labelKey: "filters",
                  iconKey: "filter",
                  toolPanel: "agFiltersToolPanel",
                },
              ],
              defaultToolPanel: "",
            }}
            getContextMenuItems={getContextMenuItems}
            rowGroupPanelShow="always"
            groupDisplayType="singleColumn"
            autoGroupColumnDef={{
              minWidth: 200,
              cellRendererParams: {
                suppressCount: false,
              },
            }}
          />
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedRows.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-background border rounded-lg shadow-lg px-4 py-3 flex items-center gap-4 z-50">
          <span className="text-sm font-medium">{selectedRows.length} selected</span>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Users className="h-4 w-4 mr-2" />
                Assign Owner
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56" align="start">
              <div className="space-y-1">
                {USERS.map((user) => (
                  <Button
                    key={user.id}
                    variant="ghost"
                    className="w-full justify-start text-sm"
                    onClick={() => handleBulkAssign(user.id)}
                  >
                    {user.name}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Select onValueChange={(value) => handleBulkDisposition(value as Disposition)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Set Disposition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Fix">Fix</SelectItem>
              <SelectItem value="Defer">Defer</SelectItem>
              <SelectItem value="Mitigate">Mitigate</SelectItem>
              <SelectItem value="Accept Risk">Accept Risk</SelectItem>
              <SelectItem value="False Positive">False Positive</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            <Download className="h-4 w-4 mr-2" />
            Export Selected
          </Button>

          <Button variant="ghost" size="sm" onClick={handleClearSelection}>
            Cancel
          </Button>
        </div>
      )}

      {/* Detail Sheet */}
      <DetailSheet
        vulnerability={selectedVuln}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSave={handleSaveVulnerability}
      />
    </div>
  );
}
