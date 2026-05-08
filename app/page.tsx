"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FilterPopover } from "@/components/vulnerability/filter-popover"
import { VulnerabilityTable } from "@/components/vulnerability/vulnerability-table"
import { DetailSheet } from "@/components/vulnerability/detail-sheet"
import { mockVulnerabilities } from "@/lib/mock-data"
import type {
  Vulnerability,
  VulnerabilityStatus,
  Severity,
  Disposition,
  SortField,
  SortDirection,
} from "@/lib/types"
import { Search, X, ChevronLeft, ChevronRight } from "lucide-react"

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
  "Accept Risk",
  "Mitigate",
  "False Positive",
]

const ITEMS_PER_PAGE = 50

export default function VulnerabilityTriageDashboard() {
  const [vulnerabilities, setVulnerabilities] =
    useState<Vulnerability[]>(mockVulnerabilities)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [severityFilter, setSeverityFilter] = useState<string[]>([])
  const [dispositionFilter, setDispositionFilter] = useState<string[]>([])
  const [ownerFilter, setOwnerFilter] = useState<string[]>([])
  const [selectedVulnerability, setSelectedVulnerability] =
    useState<Vulnerability | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [currentPage, setCurrentPage] = useState(1)

  // Get unique owners for filter
  const ownerOptions = useMemo(() => {
    const owners = vulnerabilities
      .map((v) => v.owner?.name)
      .filter((name): name is string => !!name)
    return [...new Set(owners)]
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
          v.system.toLowerCase().includes(query)
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

    // Owner filter
    if (ownerFilter.length > 0) {
      result = result.filter(
        (v) => v.owner && ownerFilter.includes(v.owner.name)
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
          case "cveId":
            aVal = a.cveId
            bVal = b.cveId
            break
          case "system":
            aVal = a.system
            bVal = b.system
            break
          case "severity":
            aVal = SEVERITY_OPTIONS.indexOf(a.severity)
            bVal = SEVERITY_OPTIONS.indexOf(b.severity)
            break
          case "disposition":
            aVal = a.disposition || "zzz"
            bVal = b.disposition || "zzz"
            break
          case "crqNumber":
            aVal = a.crqNumber || "zzz"
            bVal = b.crqNumber || "zzz"
            break
          case "owner":
            aVal = a.owner?.name || "zzz"
            bVal = b.owner?.name || "zzz"
            break
          case "expectedFixDate":
            aVal = a.expectedFixDate?.getTime() || Number.MAX_SAFE_INTEGER
            bVal = b.expectedFixDate?.getTime() || Number.MAX_SAFE_INTEGER
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
    ownerFilter,
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
    type: "status" | "severity" | "disposition" | "owner",
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
      case "owner":
        setOwnerFilter(ownerFilter.filter((s) => s !== value))
        break
    }
  }

  const hasActiveFilters =
    statusFilter.length > 0 ||
    severityFilter.length > 0 ||
    dispositionFilter.length > 0 ||
    ownerFilter.length > 0

  const startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1
  const endItem = Math.min(
    currentPage * ITEMS_PER_PAGE,
    filteredVulnerabilities.length
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1600px] mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground">
            Vulnerability Triage
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredVulnerabilities.length} vulnerabilities assigned to your team
          </p>
        </div>

        {/* Filters */}
        <div className="mb-4 space-y-3">
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by CVE ID or system..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-9 h-8"
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
                label="Owner"
                options={ownerOptions}
                selected={ownerFilter}
                onSelectionChange={(selected) => {
                  setOwnerFilter(selected)
                  setCurrentPage(1)
                }}
              />
            </div>
          </div>

          {/* Active filter chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2">
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
              {ownerFilter.map((owner) => (
                <Badge
                  key={`owner-${owner}`}
                  variant="secondary"
                  className="gap-1 pr-1"
                >
                  {owner}
                  <button
                    onClick={() => removeFilter("owner", owner)}
                    className="ml-1 hover:bg-muted rounded p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Table */}
        <VulnerabilityTable
          vulnerabilities={paginatedVulnerabilities}
          onRowClick={handleRowClick}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
        />

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {startItem}–{endItem} of {filteredVulnerabilities.length}
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
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
