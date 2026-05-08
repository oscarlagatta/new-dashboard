"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { FilterPopover } from "@/components/vulnerability/filter-popover"
import { VulnerabilityTable } from "@/components/vulnerability/vulnerability-table"
import { DetailSheet } from "@/components/vulnerability/detail-sheet"
import { mockVulnerabilities, defaultColumnVisibility } from "@/lib/mock-data"
import type {
  Vulnerability,
  VulnerabilityStatus,
  Severity,
  Disposition,
  SortField,
  SortDirection,
  ColumnVisibility,
  ViewDensity,
} from "@/lib/types"
import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Users,
  FileText,
  Download,
} from "lucide-react"

const STATUS_OPTIONS: VulnerabilityStatus[] = [
  "Awaiting Disposition",
  "In Progress",
  "Pending Clear Scan",
  "Resolved",
]

const SEVERITY_OPTIONS: Severity[] = ["Critical", "High", "Medium", "Low"]

const DISPOSITION_OPTIONS: Disposition[] = [
  "Fix",
  "Defer",
  "Mitigate",
  "Accept Risk",
  "False Positive",
]

const ITEMS_PER_PAGE = 50

const COLUMN_LABELS: Record<keyof ColumnVisibility, string> = {
  status: "Status",
  severity: "Severity",
  cveId: "CVE",
  title: "Title",
  applicationFullName: "Application",
  hostName: "Host / Server",
  daysOpen: "Days Open",
  dueDate: "Due Date",
  disposition: "Disposition",
  crqNumber: "CRQ #",
  remediationCoordinator: "Coordinator",
}

export default function VulnerabilityTriageDashboard() {
  const [vulnerabilities, setVulnerabilities] =
    useState<Vulnerability[]>(mockVulnerabilities)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [severityFilter, setSeverityFilter] = useState<string[]>([])
  const [dispositionFilter, setDispositionFilter] = useState<string[]>([])
  const [applicationFilter, setApplicationFilter] = useState<string[]>([])
  const [coordinatorFilter, setCoordinatorFilter] = useState<string[]>([])
  const [selectedVulnerability, setSelectedVulnerability] =
    useState<Vulnerability | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [currentPage, setCurrentPage] = useState(1)
  const [viewDensity, setViewDensity] = useState<ViewDensity>("comfortable")
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>(defaultColumnVisibility)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Get unique applications and coordinators for filters
  const applicationOptions = useMemo(() => {
    const apps = vulnerabilities.map((v) => v.applicationFullName)
    return [...new Set(apps)].sort()
  }, [vulnerabilities])

  const coordinatorOptions = useMemo(() => {
    const coords = vulnerabilities
      .map((v) => v.remediationCoordinator?.name)
      .filter((name): name is string => !!name)
    return [...new Set(coords)].sort()
  }, [vulnerabilities])

  // Calculate stats
  const stats = useMemo(() => {
    const awaiting = vulnerabilities.filter(
      (v) => v.status === "Awaiting Disposition"
    ).length
    const inProgress = vulnerabilities.filter(
      (v) => v.status === "In Progress"
    ).length
    const pendingScan = vulnerabilities.filter(
      (v) => v.status === "Pending Clear Scan"
    ).length
    const resolved = vulnerabilities.filter(
      (v) =>
        v.status === "Resolved" &&
        v.remediatedDate &&
        v.remediatedDate >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length
    return { awaiting, inProgress, pendingScan, resolved }
  }, [vulnerabilities])

  // Filter and sort vulnerabilities
  const filteredVulnerabilities = useMemo(() => {
    let result = [...vulnerabilities]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (v) =>
          v.cveId.toLowerCase().includes(query) ||
          v.hostName.toLowerCase().includes(query) ||
          v.applicationFullName.toLowerCase().includes(query) ||
          v.title.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (statusFilter.length > 0) {
      result = result.filter((v) => statusFilter.includes(v.status))
    }

    // Severity filter
    if (severityFilter.length > 0) {
      result = result.filter((v) => severityFilter.includes(v.severity))
    }

    // Disposition filter
    if (dispositionFilter.length > 0) {
      result = result.filter(
        (v) => v.disposition && dispositionFilter.includes(v.disposition)
      )
    }

    // Application filter
    if (applicationFilter.length > 0) {
      result = result.filter((v) =>
        applicationFilter.includes(v.applicationFullName)
      )
    }

    // Coordinator filter
    if (coordinatorFilter.length > 0) {
      result = result.filter(
        (v) =>
          v.remediationCoordinator &&
          coordinatorFilter.includes(v.remediationCoordinator.name)
      )
    }

    // Sorting
    if (sortField) {
      result.sort((a, b) => {
        let aVal: string | number | Date | undefined
        let bVal: string | number | Date | undefined

        switch (sortField) {
          case "status":
            aVal = STATUS_OPTIONS.indexOf(a.status)
            bVal = STATUS_OPTIONS.indexOf(b.status)
            break
          case "severity":
            aVal = SEVERITY_OPTIONS.indexOf(a.severity)
            bVal = SEVERITY_OPTIONS.indexOf(b.severity)
            break
          case "cveId":
            aVal = a.cveId
            bVal = b.cveId
            break
          case "title":
            aVal = a.title
            bVal = b.title
            break
          case "applicationFullName":
            aVal = a.applicationFullName
            bVal = b.applicationFullName
            break
          case "hostName":
            aVal = a.hostName
            bVal = b.hostName
            break
          case "daysOpen":
            aVal = a.daysOpen
            bVal = b.daysOpen
            break
          case "dueDate":
            aVal = a.dueDate?.getTime() || Number.MAX_SAFE_INTEGER
            bVal = b.dueDate?.getTime() || Number.MAX_SAFE_INTEGER
            break
          case "disposition":
            aVal = a.disposition || "zzz"
            bVal = b.disposition || "zzz"
            break
          case "crqNumber":
            aVal = a.crqNumber || "zzz"
            bVal = b.crqNumber || "zzz"
            break
          case "remediationCoordinator":
            aVal = a.remediationCoordinator?.name || "zzz"
            bVal = b.remediationCoordinator?.name || "zzz"
            break
          default:
            return 0
        }

        if (typeof aVal === "string" && typeof bVal === "string") {
          return sortDirection === "asc"
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal)
        }

        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortDirection === "asc" ? aVal - bVal : bVal - aVal
        }

        return 0
      })
    }

    return result
  }, [
    vulnerabilities,
    searchQuery,
    statusFilter,
    severityFilter,
    dispositionFilter,
    applicationFilter,
    coordinatorFilter,
    sortField,
    sortDirection,
  ])

  // Pagination
  const totalPages = Math.ceil(filteredVulnerabilities.length / ITEMS_PER_PAGE)
  const paginatedVulnerabilities = filteredVulnerabilities.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const handleRowClick = (vulnerability: Vulnerability) => {
    setSelectedVulnerability(vulnerability)
    setSheetOpen(true)
  }

  const handleSave = (updated: Vulnerability) => {
    setVulnerabilities((prev) =>
      prev.map((v) => (v.id === updated.id ? updated : v))
    )
    setSelectedVulnerability(null)
  }

  const removeFilter = (
    type: "status" | "severity" | "disposition" | "application" | "coordinator",
    value: string
  ) => {
    switch (type) {
      case "status":
        setStatusFilter(statusFilter.filter((s) => s !== value))
        break
      case "severity":
        setSeverityFilter(severityFilter.filter((s) => s !== value))
        break
      case "disposition":
        setDispositionFilter(dispositionFilter.filter((s) => s !== value))
        break
      case "application":
        setApplicationFilter(applicationFilter.filter((s) => s !== value))
        break
      case "coordinator":
        setCoordinatorFilter(coordinatorFilter.filter((s) => s !== value))
        break
    }
  }

  const clearAllFilters = () => {
    setStatusFilter([])
    setSeverityFilter([])
    setDispositionFilter([])
    setApplicationFilter([])
    setCoordinatorFilter([])
    setSearchQuery("")
  }

  const hasActiveFilters =
    statusFilter.length > 0 ||
    severityFilter.length > 0 ||
    dispositionFilter.length > 0 ||
    applicationFilter.length > 0 ||
    coordinatorFilter.length > 0

  const startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1
  const endItem = Math.min(
    currentPage * ITEMS_PER_PAGE,
    filteredVulnerabilities.length
  )

  const toggleColumn = (column: keyof ColumnVisibility) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [column]: !prev[column],
    }))
  }

  const clearSelection = () => {
    setSelectedIds(new Set())
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1800px] mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground">
            Vulnerability Triage
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Showing vulnerabilities assigned to Payments Technology
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Awaiting Disposition</p>
              <p className="text-2xl font-semibold text-foreground mt-1">
                {stats.awaiting}
              </p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">In Progress</p>
              <p className="text-2xl font-semibold text-foreground mt-1">
                {stats.inProgress}
              </p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Pending Clear Scan</p>
              <p className="text-2xl font-semibold text-foreground mt-1">
                {stats.pendingScan}
              </p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Resolved (last 30 days)</p>
              <p className="text-2xl font-semibold text-foreground mt-1">
                {stats.resolved}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Toolbar */}
        <div className="mb-4 space-y-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left side - Search and Filters */}
            <div className="flex items-center gap-3 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by CVE, host, application, or title..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="pl-9 h-9"
                />
              </div>

              {/* Filter buttons */}
              <div className="flex items-center gap-2">
                <FilterPopover
                  label="Status"
                  options={STATUS_OPTIONS}
                  selected={statusFilter}
                  onSelectionChange={(selected) => {
                    setStatusFilter(selected)
                    setCurrentPage(1)
                  }}
                />
                <FilterPopover
                  label="Severity"
                  options={SEVERITY_OPTIONS}
                  selected={severityFilter}
                  onSelectionChange={(selected) => {
                    setSeverityFilter(selected)
                    setCurrentPage(1)
                  }}
                />
                <FilterPopover
                  label="Disposition"
                  options={DISPOSITION_OPTIONS}
                  selected={dispositionFilter}
                  onSelectionChange={(selected) => {
                    setDispositionFilter(selected)
                    setCurrentPage(1)
                  }}
                />
                <FilterPopover
                  label="Application"
                  options={applicationOptions}
                  selected={applicationFilter}
                  onSelectionChange={(selected) => {
                    setApplicationFilter(selected)
                    setCurrentPage(1)
                  }}
                />
                <FilterPopover
                  label="Coordinator"
                  options={coordinatorOptions}
                  selected={coordinatorFilter}
                  onSelectionChange={(selected) => {
                    setCoordinatorFilter(selected)
                    setCurrentPage(1)
                  }}
                />
              </div>
            </div>

            {/* Right side - View options */}
            <div className="flex items-center gap-2">
              {/* View Density Toggle */}
              <div className="flex items-center border rounded-md">
                <Button
                  variant={viewDensity === "compact" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-8 px-3 rounded-r-none text-xs"
                  onClick={() => setViewDensity("compact")}
                >
                  Compact
                </Button>
                <Button
                  variant={viewDensity === "comfortable" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-8 px-3 rounded-l-none text-xs"
                  onClick={() => setViewDensity("comfortable")}
                >
                  Comfortable
                </Button>
              </div>

              {/* Column Visibility */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8">
                    <Columns3 className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {(Object.keys(columnVisibility) as Array<keyof ColumnVisibility>).map(
                    (column) => (
                      <DropdownMenuCheckboxItem
                        key={column}
                        checked={columnVisibility[column]}
                        onCheckedChange={() => toggleColumn(column)}
                      >
                        {COLUMN_LABELS[column]}
                      </DropdownMenuCheckboxItem>
                    )
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Active filter chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2">
              {statusFilter.map((status) => (
                <Badge
                  key={`status-${status}`}
                  variant="secondary"
                  className="gap-1 pr-1"
                >
                  {status}
                  <button
                    onClick={() => removeFilter("status", status)}
                    className="ml-1 hover:bg-muted rounded p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {severityFilter.map((severity) => (
                <Badge
                  key={`severity-${severity}`}
                  variant="secondary"
                  className="gap-1 pr-1"
                >
                  {severity}
                  <button
                    onClick={() => removeFilter("severity", severity)}
                    className="ml-1 hover:bg-muted rounded p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {dispositionFilter.map((disposition) => (
                <Badge
                  key={`disposition-${disposition}`}
                  variant="secondary"
                  className="gap-1 pr-1"
                >
                  {disposition}
                  <button
                    onClick={() => removeFilter("disposition", disposition)}
                    className="ml-1 hover:bg-muted rounded p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {applicationFilter.map((app) => (
                <Badge
                  key={`app-${app}`}
                  variant="secondary"
                  className="gap-1 pr-1"
                >
                  {app}
                  <button
                    onClick={() => removeFilter("application", app)}
                    className="ml-1 hover:bg-muted rounded p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {coordinatorFilter.map((coord) => (
                <Badge
                  key={`coord-${coord}`}
                  variant="secondary"
                  className="gap-1 pr-1"
                >
                  {coord}
                  <button
                    onClick={() => removeFilter("coordinator", coord)}
                    className="ml-1 hover:bg-muted rounded p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <button
                onClick={clearAllFilters}
                className="text-sm text-muted-foreground hover:text-foreground underline"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Bulk Action Bar */}
        {selectedIds.size > 0 && (
          <div className="mb-4 flex items-center gap-4 p-3 bg-muted rounded-lg">
            <span className="text-sm font-medium">
              {selectedIds.size} selected
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 gap-1.5">
                <Users className="h-3.5 w-3.5" />
                Assign Coordinator
              </Button>
              <Button variant="outline" size="sm" className="h-8 gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                Set Disposition
              </Button>
              <Button variant="outline" size="sm" className="h-8 gap-1.5">
                <Download className="h-3.5 w-3.5" />
                Export
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 ml-auto"
              onClick={clearSelection}
            >
              Cancel
            </Button>
          </div>
        )}

        {/* Table */}
        <VulnerabilityTable
          vulnerabilities={paginatedVulnerabilities}
          onRowClick={handleRowClick}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
          columnVisibility={columnVisibility}
          viewDensity={viewDensity}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
        />

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filteredVulnerabilities.length > 0 ? startItem : 0}–{endItem} of{" "}
            {filteredVulnerabilities.length.toLocaleString()}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              Page {currentPage} of {totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>

        {/* Detail Sheet */}
        <DetailSheet
          vulnerability={selectedVulnerability}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          onSave={handleSave}
        />
      </div>
    </div>
  )
}
