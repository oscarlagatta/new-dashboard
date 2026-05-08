"use client";

import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import type { ColDef, GridApi, GridReadyEvent, RowClickedEvent } from "ag-grid-community";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, ChevronUp, Search, Download, Columns3, Filter, X } from "lucide-react";
import { mockVulnerabilities } from "@/lib/mock-data";
import { severityComparator, statusComparator } from "@/lib/ag-grid-setup";
import {
  StatusBadgeCellRenderer,
  SeverityBadgeCellRenderer,
  CVELinkCellRenderer,
  CRQLinkCellRenderer,
  DueDateCellRenderer,
  DaysOpenCellRenderer,
  OwnerCellRenderer,
  OperatingEnvironmentBadgeCellRenderer,
  TechnologyCellRenderer,
  DispositionCellRenderer,
} from "@/components/ag-grid/cell-renderers";
import { DetailSheet } from "@/components/vulnerability/detail-sheet";
import type { Vulnerability } from "@/lib/types";

// Import AG Grid setup (registers enterprise modules and license)
import "@/lib/ag-grid-setup";

interface ColumnVisibility {
  [key: string]: boolean;
}

const DEFAULT_VISIBLE_COLUMNS: ColumnVisibility = {
  status: true,
  severity: true,
  cve: true,
  title: true,
  technology: true,
  hostName: true,
  operatingEnvironment: true,
  daysOpen: true,
  dueDate: true,
  disposition: true,
  crqNumber: true,
  vulnOwner: true,
};

export function AgGridVulnerabilityTable() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [quickFilterText, setQuickFilterText] = useState("");
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [selectedVulnerability, setSelectedVulnerability] = useState<Vulnerability | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>(DEFAULT_VISIBLE_COLUMNS);
  const gridRef = useRef<AgGridReact>(null);

  const columnDefs: ColDef<Vulnerability>[] = useMemo(
    () => [
      {
        headerName: "Status",
        field: "status",
        width: 160,
        cellRenderer: StatusBadgeCellRenderer,
        comparator: statusComparator,
        filter: "agSetColumnFilter",
        hide: !columnVisibility.status,
      },
      {
        headerName: "Severity",
        field: "severity",
        width: 100,
        cellRenderer: SeverityBadgeCellRenderer,
        comparator: severityComparator,
        filter: "agSetColumnFilter",
        hide: !columnVisibility.severity,
      },
      {
        headerName: "CVE",
        field: "cve",
        width: 160,
        cellRenderer: CVELinkCellRenderer,
        filter: "agTextColumnFilter",
        hide: !columnVisibility.cve,
      },
      {
        headerName: "Title",
        field: "title",
        flex: 1,
        minWidth: 250,
        filter: "agTextColumnFilter",
        tooltipField: "title",
        hide: !columnVisibility.title,
      },
      {
        headerName: "Technology",
        field: "technology",
        width: 150,
        cellRenderer: TechnologyCellRenderer,
        filter: "agSetColumnFilter",
        hide: !columnVisibility.technology,
      },
      {
        headerName: "Host Name / Server",
        field: "hostName",
        width: 200,
        filter: "agTextColumnFilter",
        tooltipField: "hostName",
        hide: !columnVisibility.hostName,
      },
      {
        headerName: "Operating Env",
        field: "operatingEnvironment",
        width: 130,
        cellRenderer: OperatingEnvironmentBadgeCellRenderer,
        filter: "agSetColumnFilter",
        hide: !columnVisibility.operatingEnvironment,
      },
      {
        headerName: "Days Open",
        field: "daysOpen",
        width: 100,
        cellRenderer: DaysOpenCellRenderer,
        filter: "agNumberColumnFilter",
        sort: "desc",
        hide: !columnVisibility.daysOpen,
      },
      {
        headerName: "Due Date",
        field: "dueDate",
        width: 140,
        cellRenderer: DueDateCellRenderer,
        filter: "agDateColumnFilter",
        hide: !columnVisibility.dueDate,
      },
      {
        headerName: "Disposition",
        field: "disposition",
        width: 120,
        cellRenderer: DispositionCellRenderer,
        filter: "agSetColumnFilter",
        hide: !columnVisibility.disposition,
      },
      {
        headerName: "CRQ #",
        field: "crqNumber",
        width: 150,
        cellRenderer: CRQLinkCellRenderer,
        filter: "agTextColumnFilter",
        hide: !columnVisibility.crqNumber,
      },
      {
        headerName: "Vuln Owner",
        field: "vulnOwner",
        width: 180,
        cellRenderer: OwnerCellRenderer,
        filter: "agTextColumnFilter",
        hide: !columnVisibility.vulnOwner,
      },
    ],
    [columnVisibility]
  );

  const defaultColDef: ColDef = useMemo(
    () => ({
      sortable: true,
      resizable: true,
      filter: true,
      floatingFilter: true,
      suppressHeaderMenuButton: false,
      menuTabs: ["filterMenuTab", "generalMenuTab", "columnsMenuTab"],
    }),
    []
  );

  const onGridReady = useCallback((params: GridReadyEvent) => {
    setGridApi(params.api);
  }, []);

  const onRowClicked = useCallback((event: RowClickedEvent<Vulnerability>) => {
    if (event.data) {
      setSelectedVulnerability(event.data);
      setSheetOpen(true);
    }
  }, []);

  const handleExport = useCallback(() => {
    if (gridApi) {
      gridApi.exportDataAsCsv({
        fileName: `vulnerabilities-export-${new Date().toISOString().split("T")[0]}.csv`,
      });
    }
  }, [gridApi]);

  const handleClearFilters = useCallback(() => {
    if (gridApi) {
      gridApi.setFilterModel(null);
      setQuickFilterText("");
    }
  }, [gridApi]);

  const toggleColumn = useCallback((columnId: string) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [columnId]: !prev[columnId],
    }));
  }, []);

  // Handle quick filter changes
  useEffect(() => {
    if (gridApi) {
      gridApi.setGridOption("quickFilterText", quickFilterText);
    }
  }, [gridApi, quickFilterText]);

  // Handle escape key to close sheet
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && sheetOpen) {
        setSheetOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [sheetOpen]);

  return (
    <>
      <Card className="border-border/60">
        <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b">
          <CardTitle className="text-sm font-medium">
            All Vulnerabilities
            <span className="text-muted-foreground font-normal ml-2">
              ({mockVulnerabilities.length} records)
            </span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8 p-0"
          >
            {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </CardHeader>

        {!isCollapsed && (
          <CardContent className="p-0">
            {/* Toolbar */}
            <div className="px-4 py-3 border-b flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-[400px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Quick filter across all columns..."
                  value={quickFilterText}
                  onChange={(e) => setQuickFilterText(e.target.value)}
                  className="pl-9 h-9"
                />
                {quickFilterText && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => setQuickFilterText("")}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>

              <Button variant="outline" size="sm" onClick={handleClearFilters} className="h-9 gap-2">
                <Filter className="h-3.5 w-3.5" />
                Clear Filters
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 gap-2">
                    <Columns3 className="h-3.5 w-3.5" />
                    Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {Object.keys(DEFAULT_VISIBLE_COLUMNS).map((col) => (
                    <DropdownMenuCheckboxItem
                      key={col}
                      checked={columnVisibility[col]}
                      onCheckedChange={() => toggleColumn(col)}
                    >
                      {col.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="outline" size="sm" onClick={handleExport} className="h-9 gap-2">
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </Button>
            </div>

            {/* AG Grid */}
            <div className="ag-theme-quartz h-[600px] w-full">
              <AgGridReact
                ref={gridRef}
                rowData={mockVulnerabilities}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                onGridReady={onGridReady}
                onRowClicked={onRowClicked}
                rowSelection={{
                  mode: "multiRow",
                  checkboxes: true,
                  headerCheckbox: true,
                  enableClickSelection: false,
                  copySelectedRows: false,
                }}
                pagination={true}
                paginationPageSize={50}
                paginationPageSizeSelector={[25, 50, 100, 200]}
                animateRows={true}
                enableCellTextSelection={true}
                rowHeight={42}
                headerHeight={40}
                floatingFiltersHeight={38}
                tooltipShowDelay={300}
                getRowId={(params) => params.data.id}
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Detail Sheet */}
      {selectedVulnerability && (
        <DetailSheet
          vulnerability={selectedVulnerability}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          onSave={(updated) => {
            setSelectedVulnerability(updated);
          }}
        />
      )}
    </>
  );
}
