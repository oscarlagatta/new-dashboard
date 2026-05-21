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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Search,
  Download,
  Filter,
  X,
  ChevronDown,
  LayoutGrid,
  Check,
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
import type { Vulnerability, Disposition, Lever, Blocker } from "@/lib/types";
import { LEVERS, DISPOSITIONS, BLOCKERS } from "@/lib/types";
import { USERS } from "@/lib/mock-data";
import { getPatchWindows } from "@/lib/patch-windows";
import { dispositionFields } from "@/lib/disposition-fields";
import "@/lib/ag-grid-setup";
import { useSavedViews } from "@/hooks/use-saved-views";
import { useSavedViewsToolbarUi } from "@/components/vulnerability/saved-views-toolbar";
import {
  ExportDialog,
  fireExportStartedToast,
  type ExportColumnOption,
  type ExportSelection,
} from "@/components/vulnerability/export-dialog";
import {
  matchesPreset,
  FILTER_PRESETS,
  type FilterPresetId,
} from "@/lib/filter-presets";
import {
  DEFAULT_DASHBOARD_SETTINGS,
  type DashboardSettings,
} from "@/lib/dashboard-settings";

// For production: replace with rowModelType='serverSide' and provide a
// serverSideDatasource that calls the .NET API endpoint.
// Filter, sort, group state can be passed via the IServerSideGetRowsRequest
// object. Pagination is handled server-side.

type DensityMode = "compact" | "comfortable";

// Tablet (768–1023px): keep this lean set so columns fit at ~1024px without
// horizontal scroll. Hidden columns remain available via the side-panel
// Columns tool when the user pulls it up.
const TABLET_VISIBLE_FIELDS = new Set<string>([
  "status",
  "daysOpen",
  "lever",
  "cve",
  "title",
  "vulnOwner",
]);

const FILTER_OPTIONS = {
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

// ── Work Queue filter pills ─────────────────────────────────────────────────────

// Wide grey single-select dropdown buttons shown in a horizontal row above the
// grid (see screenshot.webp). An empty `value` ("") means no filter is applied
// — the implicit "All" option. The button label stays fixed; a selected value
// is appended after the label so the row reads as a stable, named control set.

interface FilterPillProps {
  label: string;
  options: string[];
  value: string; // "" = All
  onChange: (value: string) => void;
  /** Label for the implicit reset option. */
  allLabel?: string;
  /** Render the pill but make it non-interactive (data wiring not yet available). */
  disabled?: boolean;
  /** Tooltip explaining why the pill is disabled. */
  disabledHint?: string;
}

function FilterPillOption({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-muted transition-colors flex items-center gap-2"
      onClick={onSelect}
      aria-pressed={selected}
    >
      <Check
        className={`h-3.5 w-3.5 flex-shrink-0 text-primary ${selected ? "opacity-100" : "opacity-0"}`}
      />
      <span className="flex-1 truncate">{label}</span>
    </button>
  );
}

function FilterPill({
  label,
  options,
  value,
  onChange,
  allLabel = "All",
  disabled = false,
  disabledHint,
}: FilterPillProps) {
  const [open, setOpen] = useState(false);
  const active = value !== "";

  const trigger = (
    <Button
      variant="secondary"
      disabled={disabled}
      className="h-9 min-w-[150px] sm:min-w-[190px] justify-between gap-2 rounded-lg px-3.5 text-xs font-medium disabled:opacity-50"
      aria-label={
        disabled
          ? `${label} — unavailable`
          : `${label}${active ? `: ${value}` : ""}`
      }
      title={disabled ? disabledHint : undefined}
    >
      <span className="truncate">
        {label}
        {active && <span className="text-primary">: {value}</span>}
      </span>
      <ChevronDown className="h-3.5 w-3.5 opacity-50 flex-shrink-0" />
    </Button>
  );

  // Disabled pills (e.g. CIO-1 Down before its hierarchy data exists) still
  // render in the bar so the control set is complete, but open no popover.
  if (disabled) return trigger;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-56 p-1 max-h-[50vh] overflow-y-auto" align="start">
        <FilterPillOption
          label={allLabel}
          selected={value === ""}
          onSelect={() => {
            onChange("");
            setOpen(false);
          }}
        />
        {options.length > 0 && <div aria-hidden className="my-1 h-px bg-border" />}
        {options.map((opt) => (
          <FilterPillOption
            key={opt}
            label={opt}
            selected={value === opt}
            onSelect={() => {
              onChange(opt);
              setOpen(false);
            }}
          />
        ))}
      </PopoverContent>
    </Popover>
  );
}

// ── Bulk Action Bar ────────────────────────────────────────────────────────────

// Mirrors lib/types.ts DISPOSITIONS — spec values first, then legacy.
// Pulled directly from the central constant so the bulk-action menu stays in
// lockstep with the per-row form dropdown.

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
                className="w-[28rem] p-1 max-h-[60vh] overflow-y-auto"
                align="start"
                side="top"
                sideOffset={8}
              >
                <div className="px-2 py-1 text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                  Set to
                </div>
                {DISPOSITIONS.filter((d) => d.group === "spec").map((d) => (
                  <button
                    key={d.value}
                    className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-muted transition-colors"
                    onClick={() => {
                      onSetDisposition(d.value);
                      setDispositionOpen(false);
                    }}
                  >
                    {d.label}
                  </button>
                ))}
                <div
                  aria-hidden="true"
                  className="px-2 py-1 text-[11px] text-muted-foreground/60 select-none"
                >
                  ──────────
                </div>
                {DISPOSITIONS.filter((d) => d.group === "legacy").map((d) => (
                  <button
                    key={d.value}
                    className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-muted transition-colors"
                    onClick={() => {
                      onSetDisposition(d.value);
                      setDispositionOpen(false);
                    }}
                  >
                    {d.label}
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

// ── Bulk Update Toolbar ────────────────────────────────────────────────────────

// Wire shape for BulkUpdateVCMExtra. Every field except gisid is optional —
// only the fields the user staged are sent so the backend doesn't overwrite
// untouched values.
interface BulkUpdateItem {
  gisid: string;
  disposition?: string;
  requestedPatchWindow?: string;
  expectedRemediationDate?: string; // .NET datetime, e.g. "2026-07-15T00:00:00"
  crq?: string;
  identifiedBlockers?: string; // delimiter TBD with backend
}

interface BulkUpdatePayload {
  items: BulkUpdateItem[];
  updatedUserId?: number;
}

// Maps a FE patch (Partial<Vulnerability>) + gisid to one wire item.
// Handles the FE↔API name/type/format gaps: crqNumber→crq, Blocker[]→string,
// YYYY-MM-DD→ISO datetime.
function patchToApiItem(gisid: string, patch: Partial<Vulnerability>): BulkUpdateItem {
  const item: BulkUpdateItem = { gisid };
  if (patch.disposition !== undefined) item.disposition = patch.disposition;
  if (patch.requestedPatchWindow !== undefined) {
    item.requestedPatchWindow = patch.requestedPatchWindow;
  }
  if (patch.expectedRemediationDate !== undefined) {
    item.expectedRemediationDate = patch.expectedRemediationDate
      ? `${patch.expectedRemediationDate}T00:00:00`
      : "";
  }
  if (patch.crqNumber !== undefined) item.crq = patch.crqNumber;
  if (patch.identifiedBlockers !== undefined) {
    item.identifiedBlockers = patch.identifiedBlockers.join("; ");
  }
  return item;
}

/**
 * Shared bulk-update handler — STUB. Wire this to the real BulkUpdateVCMExtra
 * endpoint once integrated. The 200 response body is empty; treat success as
 * status 200 with no JSON parse.
 */
function bulkUpdateApi(payload: BulkUpdatePayload): void {
  console.info(`[bulk-update stub] payload:`, payload);
}

// Shared styling for the native <select>/<textarea> in the disposition popover.
const BULK_FIELD_CLASS =
  "w-full rounded-md border border-input bg-transparent px-2 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

// Staged disposition + its conditional dependent fields, edited in the popover.
// Only fields that map to BulkUpdateVCMExtra are kept (disposition, crq,
// remediationDate, blockers). Per-row context like detail/justification/
// false-positive reason has no API home and was removed from this path.
interface DispositionDraft {
  disposition: Disposition;
  remediationDate: string;
  crq: string;
  blockers: Blocker[];
}

const EMPTY_DISPOSITION_DRAFT: DispositionDraft = {
  disposition: "",
  remediationDate: "",
  crq: "",
  blockers: [],
};

// Required dependent fields still empty for the chosen disposition — mirrors
// the per-row triage form's validation. Empty when no disposition is chosen.
function missingDispositionFields(
  d: DispositionDraft,
  patchWindowStaged: boolean
): string[] {
  if (!d.disposition) return [];
  const rules = dispositionFields[d.disposition] ?? {};
  const missing: string[] = [];
  // Patch Window is the toolbar's standalone control — checked here, not
  // collected in the popover, so the user only ever sets it once.
  if (rules.patchWindow && !patchWindowStaged) missing.push("Patch Window");
  if (rules.remediationDate && !d.remediationDate) missing.push("Remediation Date");
  if (rules.crq && !d.crq.trim()) missing.push("CRQ");
  if (rules.blockers && d.blockers.length === 0) missing.push("Blockers");
  return missing;
}

// The Vulnerability patch a disposition draft contributes (only its rule-gated
// fields). Returns {} when no disposition is chosen.
function dispositionDraftToPatch(d: DispositionDraft): Partial<Vulnerability> {
  if (!d.disposition) return {};
  const rules = dispositionFields[d.disposition] ?? {};
  // requestedPatchWindow is contributed by the toolbar's standalone Patch
  // Window control, not here — so it is never asked for twice.
  const patch: Partial<Vulnerability> = { disposition: d.disposition };
  if (rules.remediationDate) patch.expectedRemediationDate = d.remediationDate;
  if (rules.crq) patch.crqNumber = d.crq;
  if (rules.blockers) patch.identifiedBlockers = d.blockers;
  return patch;
}

// A single-value staging dropdown. The picked value is held (not applied) and
// shown on the trigger; the toolbar's Apply button commits it.
function BulkStageSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant={value ? "secondary" : "outline"}
              size="sm"
              className="h-8 text-xs gap-1.5"
            >
              <span className="truncate max-w-[170px]">
                {value ? `${label}: ${value}` : label}
              </span>
              <ChevronDown className="h-3 w-3 opacity-60 flex-shrink-0" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        {value && (
          <TooltipContent className="bg-zinc-900 text-white">
            {label}: {value}
          </TooltipContent>
        )}
      </Tooltip>
      <PopoverContent className="w-64 p-1 max-h-[50vh] overflow-y-auto" align="start">
        {value && (
          <button
            className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-muted transition-colors text-muted-foreground"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
          >
            Clear
          </button>
        )}
        {options.map((opt) => (
          <button
            key={opt}
            className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-muted transition-colors"
            onClick={() => {
              onChange(opt);
              setOpen(false);
            }}
          >
            {opt}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

/**
 * Bulk Disposition control — edits the staged DispositionDraft. Mirrors the
 * per-row triage form's conditional required-field logic (dispositionFields):
 * a disposition that needs dependent fields reveals + requires them. The
 * toolbar's single Apply button (not this popover) commits the change.
 */
function BulkDispositionPopover({
  draft,
  missing,
  onChange,
}: {
  draft: DispositionDraft;
  missing: string[];
  onChange: (draft: DispositionDraft) => void;
}) {
  const [open, setOpen] = useState(false);
  const rules = dispositionFields[draft.disposition] ?? {};
  const active = draft.disposition !== "";
  const incomplete = active && missing.length > 0;

  const set = (patch: Partial<DispositionDraft>) =>
    onChange({ ...draft, ...patch });

  const toggleBlocker = (b: Blocker) =>
    set({
      blockers: draft.blockers.includes(b)
        ? draft.blockers.filter((x) => x !== b)
        : [...draft.blockers, b],
    });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant={active ? "secondary" : "outline"}
              size="sm"
              className="h-8 text-xs gap-1.5"
            >
              <span className="truncate max-w-[200px]">
                {active ? `Disposition: ${draft.disposition}` : "Disposition"}
              </span>
              {incomplete && (
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500 flex-shrink-0"
                  aria-label="Required fields missing"
                />
              )}
              <ChevronDown className="h-3 w-3 opacity-60 flex-shrink-0" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        {active && (
          <TooltipContent className="bg-zinc-900 text-white max-w-xs">
            <div className="space-y-0.5">
              <div>Disposition: {draft.disposition}</div>
              {draft.remediationDate && (
                <div>Remediation Date: {draft.remediationDate}</div>
              )}
              {draft.crq && <div>CRQ: {draft.crq}</div>}
              {draft.blockers.length > 0 && (
                <div>Blockers: {draft.blockers.join(", ")}</div>
              )}
            </div>
          </TooltipContent>
        )}
      </Tooltip>
      <PopoverContent
        className="w-96 p-3 max-h-[70vh] overflow-y-auto space-y-3"
        align="start"
      >
        <div>
          <Label className="text-xs font-medium mb-1 block">Disposition</Label>
          <select
            value={draft.disposition}
            onChange={(e) => set({ disposition: e.target.value as Disposition })}
            className={BULK_FIELD_CLASS}
          >
            <option value="">No change</option>
            {DISPOSITIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        {rules.patchWindow && (
          <p className="text-[11px] text-muted-foreground">
            This disposition requires a <strong>Patch Window</strong> — set it
            with the Patch Window dropdown in the toolbar.
          </p>
        )}

        {rules.remediationDate && (
          <div>
            <Label className="text-xs font-medium mb-1 block">
              Remediation Date <span className="text-red-500">*</span>
            </Label>
            <Input
              type="date"
              value={draft.remediationDate}
              onChange={(e) => set({ remediationDate: e.target.value })}
              className="h-8 text-xs"
            />
          </div>
        )}

        {rules.crq && (
          <div>
            <Label className="text-xs font-medium mb-1 block">
              CRQ <span className="text-red-500">*</span>
            </Label>
            <Input
              value={draft.crq}
              onChange={(e) => set({ crq: e.target.value })}
              placeholder="CRQ000000123456"
              className="h-8 text-xs font-mono"
            />
          </div>
        )}

        {rules.blockers && (
          <div>
            <Label className="text-xs font-medium mb-1 block">
              Identified Blockers <span className="text-red-500">*</span>
            </Label>
            <div className="space-y-1 max-h-40 overflow-y-auto rounded-md border border-input p-1.5">
              {BLOCKERS.map((b) => (
                <label
                  key={b}
                  className="flex items-start gap-2 px-1 py-0.5 text-xs cursor-pointer"
                >
                  <Checkbox
                    checked={draft.blockers.includes(b)}
                    onCheckedChange={() => toggleBlocker(b)}
                    className="mt-0.5"
                  />
                  <span className="leading-tight">{b}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {incomplete && (
          <p className="text-[11px] text-red-500">
            Required before this can be applied: {missing.join(", ")}
          </p>
        )}
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setOpen(false)}
          >
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Shown above the grid whenever rows are selected. Every dropdown stages a
// value; the single "Apply" button commits all staged changes to every
// selected row at once.
function BulkUpdateToolbar({
  selectedCount,
  patchWindows,
  onApplyPatch,
  onClear,
}: {
  selectedCount: number;
  patchWindows: string[];
  onApplyPatch: (patch: Partial<Vulnerability>) => void;
  onClear: () => void;
}) {
  const [patchWindow, setPatchWindow] = useState("");
  const [dispDraft, setDispDraft] = useState<DispositionDraft>(
    EMPTY_DISPOSITION_DRAFT
  );

  if (selectedCount === 0) return null;

  const dispMissing = missingDispositionFields(dispDraft, patchWindow !== "");
  const dispIncomplete = dispDraft.disposition !== "" && dispMissing.length > 0;

  const patch: Partial<Vulnerability> = {
    ...(dispIncomplete ? {} : dispositionDraftToPatch(dispDraft)),
    ...(patchWindow ? { requestedPatchWindow: patchWindow } : {}),
  };
  const stagedCount = Object.keys(patch).length;
  const canApply = stagedCount > 0 && !dispIncomplete;

  const resetStaged = () => {
    setPatchWindow("");
    setDispDraft(EMPTY_DISPOSITION_DRAFT);
  };

  const apply = () => {
    if (!canApply) return;
    onApplyPatch(patch);
    resetStaged();
  };

  return (
    <div
      className="flex flex-wrap items-center gap-2 flex-shrink-0 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2"
      role="region"
      aria-label="Bulk update"
    >
      <span className="text-xs font-semibold">
        Bulk update — {selectedCount} row{selectedCount !== 1 ? "s" : ""} selected:
      </span>
      <BulkDispositionPopover
        draft={dispDraft}
        missing={dispMissing}
        onChange={setDispDraft}
      />
      <BulkStageSelect
        label="Patch Window"
        options={patchWindows}
        value={patchWindow}
        onChange={setPatchWindow}
      />
      <Button
        size="sm"
        className="h-8 text-xs"
        disabled={!canApply}
        onClick={apply}
        title={
          dispIncomplete
            ? `Complete the disposition fields: ${dispMissing.join(", ")}`
            : undefined
        }
      >
        Apply to {selectedCount} row{selectedCount !== 1 ? "s" : ""}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="ml-auto h-7 text-xs"
        onClick={() => {
          resetStaged();
          onClear();
        }}
      >
        Clear selection
      </Button>
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
  /** External filter preset applied from a dashboard card / Action Required row. */
  filterPreset?: FilterPresetId | null;
  /** Dashboard settings (e.g., validation-pending threshold). */
  settings?: DashboardSettings;
  /** Notify the parent so it can clear the preset (e.g., when user hits "Clear all"). */
  onClearFilterPreset?: () => void;
  /** Header CIO scope — filters rows by cioDisplayName. Null = no scope. */
  cioScope?: string | null;
  /** Header Lever scope — filters rows by lever. Null = no scope. */
  leverScope?: Lever | null;
  /** Clear the CIO scope (× on its chip, or Clear all). */
  onClearCioScope?: () => void;
  /** Clear the Lever scope (× on its chip, or Clear all). */
  onClearLeverScope?: () => void;
}

export function AgGridTriageTable({
  vulnerabilities,
  onRowSelected,
  selectedVuln,
  sheetOpen,
  onSheetChange,
  onSave,
  filterPreset = null,
  settings = DEFAULT_DASHBOARD_SETTINGS,
  onClearFilterPreset,
  cioScope = null,
  leverScope = null,
  onClearCioScope,
  onClearLeverScope,
}: Props) {
  const gridRef = useRef<AgGridReact>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [gridApi, setGridApi] = useState<any>(null);
  const [quickFilter, setQuickFilter] = useState("");
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [filters, setFilters] = useState<Record<FilterKey, Set<string>>>(
    () =>
      Object.fromEntries(
        Object.keys(FILTER_OPTIONS).map((k) => [k, new Set<string>()])
      ) as Record<FilterKey, Set<string>>
  );
  const [selectedCount, setSelectedCount] = useState(0);
  const [density, setDensity] = useState<DensityMode>("comfortable");
  // Work Queue top-bar pill filters. "" = no filter (the implicit "All").
  // CIO-1 Down has no state — its hierarchy data is not yet available
  // (pending an AIT-based lookup), so it renders as a disabled placeholder.
  const [cioFilter, setCioFilter] = useState("");
  const [leverFilter, setLeverFilter] = useState(""); // "" = All Levers; else a Lever value
  const [connectivityFilter, setConnectivityFilter] = useState(""); // "" | "Internal" | "External"
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

  // Distinct CIO groups present in the data — feeds the CIO pill dropdown.
  const cioOptions = useMemo(
    () =>
      Array.from(
        new Set(vulnerabilities.map((v) => v.cioDisplayName).filter(Boolean))
      ).sort(),
    [vulnerabilities]
  );

  // Shared predicate so the grid (desktop/tablet) and card list (mobile)
  // apply the same filter logic. Includes the toolbar multi-selects AND any
  // active filter preset coming from a dashboard card.
  const matchesFilters = useCallback(
    (v: Vulnerability) => {
      for (const [key, vals] of Object.entries(filters) as [FilterKey, Set<string>][]) {
        if (!vals.size) continue;
        const fieldMap: Partial<Record<FilterKey, string>> = {
          severityRisk: v.severityRisk,
          workstream: v.workstream,
          source: v.source,
          operatingEnvironment: v.operatingEnvironment,
        };
        const cell = fieldMap[key] ?? "";
        if (!vals.has(cell)) return false;
      }
      if (filterPreset && !matchesPreset(v, filterPreset, settings)) return false;
      // Header CIO scope ANDs with toolbar filters and preset. Lever scope/
      // filter state still exists in the UI but the API no longer returns a
      // `lever` field — the filter is a no-op until the CIO/CIO-1 cascade
      // API update reintroduces it.
      if (cioScope && v.cioDisplayName !== cioScope) return false;
      // Work Queue top-bar pill filters — also ANDed with everything above.
      if (cioFilter && v.cioDisplayName !== cioFilter) return false;
      if (connectivityFilter) {
        const isExternal = v.gisExternalFlag === "Y";
        if (connectivityFilter === "External" && !isExternal) return false;
        if (connectivityFilter === "Internal" && isExternal) return false;
      }
      return true;
    },
    [filters, filterPreset, settings, cioScope, leverScope, cioFilter, leverFilter, connectivityFilter]
  );

  // Apply external filters via grid's external filter mechanism
  const isExternalFilterPresent = useCallback(
    () =>
      activeFilters.length > 0 ||
      !!filterPreset ||
      !!cioScope ||
      !!leverScope ||
      !!cioFilter ||
      !!leverFilter ||
      !!connectivityFilter,
    [activeFilters, filterPreset, cioScope, leverScope, cioFilter, leverFilter, connectivityFilter]
  );

  const doesExternalFilterPass = useCallback(
    (node: IRowNode<Vulnerability>) => !node.data || matchesFilters(node.data),
    [matchesFilters]
  );

  // Default row scope — Closed findings are excluded ("Stage Status"). The
  // source data is untouched; only the rows passed to the grid are pre-filtered.
  const openVulnerabilities = useMemo(
    () => vulnerabilities.filter((v) => v.status !== "Closed"),
    [vulnerabilities]
  );

  // Card-list mode (mobile) — apply quick-filter + external filters here since
  // there's no grid to host them. Sort by severity priority so worst-first.
  const cardVulns = useMemo(() => {
    if (!isMobile) return [] as Vulnerability[];
    const q = quickFilter.trim().toLowerCase();
    const haystack = (v: Vulnerability) =>
      [v.cve, v.hostName, v.applicationFullName, v.title, v.workstream]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
    return openVulnerabilities
      .filter((v) => (!q || haystack(v).includes(q)) && matchesFilters(v))
      .sort((a, b) => severityRiskComparator(a.severityRisk, b.severityRisk));
  }, [isMobile, openVulnerabilities, quickFilter, matchesFilters]);

  const columnDefs: ColDef<Vulnerability>[] = useMemo(
    () => [
      // NOTE: no explicit checkbox column — AG Grid 32's new rowSelection API
      // ({ mode: "multiRow", checkboxes: true, headerCheckbox: true }) auto-
      // generates one. Defining a manual `checkboxSelection: true` column
      // alongside the new rowSelection object causes AG Grid to produce null
      // entries in its internal column model, which crashes its renderer
      // (TypeError: Cannot read properties of null (reading 'getColDef')).
      // Visible columns — fixed left-to-right order per the Work Queue spec.
      // Severity and Triage Status removed per stakeholder direction.
      // 1. Stage Status
      {
        headerName: "Stage Status",
        field: "status",
        width: 120,
        cellRenderer: SourceStatusBadgeCellRenderer,
        filter: "agSetColumnFilter",
        filterParams: { values: ["Open", "Closed"] },
      },
      // 2. Source
      {
        headerName: "Source",
        field: "source",
        width: 170,
        filter: "agSetColumnFilter",
        filterParams: { values: FILTER_OPTIONS.source },
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
      // 7. External / Internal — derived from gisExternalFlag (Y = External).
      {
        headerName: "External / Internal",
        colId: "externalInternal",
        width: 150,
        valueGetter: (p: ValueGetterParams<Vulnerability>) =>
          !p.data
            ? ""
            : p.data.gisExternalFlag === "Y"
            ? "External"
            : p.data.gisExternalFlag === "N"
            ? "Internal"
            : "",
        filter: "agSetColumnFilter",
        filterParams: { values: ["External", "Internal"] },
      },
      // 8. Workstream
      {
        headerName: "Workstream",
        field: "workstream",
        width: 170,
        filter: "agSetColumnFilter",
        filterParams: { values: FILTER_OPTIONS.workstream },
      },
      // 9. AIT Number — application / system identifier
      {
        headerName: "AIT Number",
        field: "applicationId",
        width: 140,
        filter: "agTextColumnFilter",
        cellClass: "font-mono text-xs",
      },
      // 11. AIT Name — application / system name
      {
        headerName: "AIT Name",
        field: "applicationFullName",
        width: 220,
        filter: "agTextColumnFilter",
        tooltipField: "applicationFullName",
      },
      // 12. CIO
      {
        headerName: "CIO",
        field: "cioDisplayName",
        width: 180,
        filter: "agSetColumnFilter",
        filterParams: { values: ["James Hartley", "Patricia Owens", "Raj Mehta", "Sandra Corrigan", "Marcus Webb", "Claire Fontaine", "Derek Okonkwo"] },
      },

      // ── Off by default — toggleable via the Columns panel ──
      {
        headerName: "Host Name / Server",
        field: "hostName",
        hide: true,
        width: 230,
        filter: "agTextColumnFilter",
        tooltipField: "hostName",
        cellClass: "font-mono text-xs",
      },
      {
        headerName: "Operating Env",
        field: "operatingEnvironment",
        hide: true,
        cellRenderer: OperatingEnvBadgeCellRenderer,
        filter: "agSetColumnFilter",
        filterParams: { values: FILTER_OPTIONS.operatingEnvironment },
      },
      {
        headerName: "Due Date",
        field: "dueDate",
        hide: true,
        cellRenderer: DueDateCellRenderer,
        filter: "agDateColumnFilter",
      },
      {
        headerName: "Disposition",
        field: "disposition",
        hide: true,
        cellRenderer: DispositionCellRenderer,
        filter: "agSetColumnFilter",
        filterParams: { values: DISPOSITIONS.map((d) => d.value) },
      },
      {
        headerName: "CRQ #",
        field: "crqNumber",
        hide: true,
        cellRenderer: CRQLinkCellRenderer,
        filter: "agTextColumnFilter",
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
        headerName: "App Manager Contact",
        field: "applicationManagerContactName",
        hide: true,
        filter: "agTextColumnFilter",
      },
      {
        headerName: "ESM Type",
        field: "esmType",
        hide: true,
        filter: "agSetColumnFilter",
        filterParams: { values: ["ESM - OS", "UNAUTH-DEVICE", "Application"] },
      },
      {
        headerName: "IP Addresses",
        field: "ipAddresses",
        hide: true,
        filter: "agTextColumnFilter",
        cellClass: "font-mono text-xs",
      },
      {
        headerName: "ERP Exception Status",
        field: "erpExceptionRequestStatus",
        hide: true,
        filter: "agSetColumnFilter",
        filterParams: { values: ["Approved", "Pending"] },
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
        // AG Grid 32 can return null entries in getColumns() during certain
        // initial-mount races (e.g., when a saved view applyColumnState runs
        // in the same commit phase as this effect). Skip them defensively.
        if (!col || typeof col.getColDef !== "function") return null;
        const colId: string = col.getColId();
        const def = col.getColDef() as ColDef<Vulnerability>;
        const field = def?.field as string | undefined;
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

  // External filter notify — toolbar filters, the preset, and the two header
  // scopes are all external filters, so any change must re-evaluate rows.
  useEffect(() => {
    if (gridRef.current?.api) {
      gridRef.current.api.onFilterChanged();
    }
  }, [filters, filterPreset, cioScope, leverScope, cioFilter, leverFilter, connectivityFilter]);

  const clearAllFilters = useCallback(() => {
    setFilters(
      Object.fromEntries(
        Object.keys(FILTER_OPTIONS).map((k) => [k, new Set<string>()])
      ) as Record<FilterKey, Set<string>>
    );
    setQuickFilter("");
    setCioFilter("");
    setLeverFilter("");
    setConnectivityFilter("");
    onClearFilterPreset?.();
    onClearCioScope?.();
    onClearLeverScope?.();
    if (gridRef.current?.api) {
      gridRef.current.api.setFilterModel(null);
    }
  }, [onClearFilterPreset, onClearCioScope, onClearLeverScope]);

  const clearSelection = useCallback(() => {
    gridRef.current?.api?.deselectAll();
  }, []);

  const exportCsv = useCallback(() => {
    gridRef.current?.api?.exportDataAsCsv({
      fileName: `findings-${new Date().toISOString().split("T")[0]}.csv`,
      onlySelected: (gridRef.current?.api?.getSelectedRows().length ?? 0) > 0,
    });
  }, []);

  // Snapshot of every column the grid knows about plus which are currently
  // visible — feeds the Export dialog's column checklist so the user's default
  // selection matches what they see on screen. The leading checkbox column
  // has no headerName and is filtered out.
  const getExportColumns = useCallback((): ExportColumnOption[] => {
    const api = gridRef.current?.api;
    if (!api) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cols = api.getColumns?.() ?? [];
    return (
      cols
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((col: any): ExportColumnOption | null => {
          if (!col || typeof col.getColDef !== "function") return null;
          const def = col.getColDef() as ColDef<Vulnerability>;
          return {
            colId: col.getColId() as string,
            label: (def?.headerName as string | undefined) ?? "",
            visible: col.isVisible() as boolean,
          };
        })
        .filter((c: ExportColumnOption | null): c is ExportColumnOption =>
          c !== null && c.label.length > 0,
        )
    );
  }, []);

  const handleExport = useCallback((selection: ExportSelection) => {
    // Backend wiring lands later; for now log the resolved selection so
    // engineering can verify the payload during integration.
    // eslint-disable-next-line no-console
    console.log("[ExportFindings]", selection);
    fireExportStartedToast();
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
    }));
    api.applyTransaction({ update: updated });
  }, []);

  // Rolling patch windows for the bulk-update toolbar dropdown.
  const patchWindowOptions = useMemo(() => getPatchWindows(), []);

  /**
   * Shared bulk-update handler — applies a field patch to every selected row
   * and routes through the (stubbed) bulk-update API.
   */
  const applyBulkPatch = useCallback((patch: Partial<Vulnerability>) => {
    const api = gridRef.current?.api;
    if (!api) return;
    const selected = api.getSelectedRows() as Vulnerability[];
    if (selected.length === 0) return;
    // FE `id` is the API's `gisid` (mapped from SQL GISID — see
    // docs/vuln-data-collection-plan.md). Rename end-to-end when the
    // response-mapper layer lands.
    const items = selected.map((row) => patchToApiItem(row.id, patch));
    // TODO(nx-monorepo): set `updatedUserId` from AuthContext
    // (`useAuth().user.id`) when this component is integrated into the
    // monorepo. Standalone dev omits the field.
    bulkUpdateApi({ items });
    api.applyTransaction({
      update: selected.map((row) => ({ ...row, ...patch })),
    });
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
          subMenu: DISPOSITIONS.map((d) => ({
            name: d.label,
            action: () => bulkSetDisposition(d.value),
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
      fileName: `findings-${new Date().toISOString().split("T")[0]}.xlsx`,
      sheetName: "Findings",
      ...(selected.length > 0 && { onlySelected: true }),
    });
  }, []);

  const filterLabels: Record<FilterKey, string> = {
    severityRisk: "Severity",
    workstream: "Workstream",
    source: "Source",
    operatingEnvironment: "Operating Env",
  };

  return (
    <>
      {/* Root is a flex column that fills its parent (the VulnerabilitiesPage
          body, which is itself flex:1). Toolbar + chip strip stay shrink:0;
          the grid wrapper takes flex-1 so it stretches to the bottom of the
          viewport. AG Grid's pagination bar lives inside the grid, so it
          naturally pins to the bottom of the grid area. */}
      <div className="flex flex-col gap-2 flex-1 min-h-0">
        {/* Work Queue filter bar — CIO / CIO-1 Down / Lever / Internal vs. External.
            Sits as the top row above the grid toolbar. */}
        <div
          className="flex flex-wrap items-center gap-3 flex-shrink-0"
          role="group"
          aria-label="Work Queue filters"
        >
          <FilterPill
            label="CIO"
            options={cioOptions}
            value={cioFilter}
            onChange={setCioFilter}
            allLabel="All CIOs"
          />
          <FilterPill
            label="CIO-1 Down"
            options={[]}
            value=""
            onChange={() => {}}
            disabled
            disabledHint="CIO-1 downward hierarchy is not yet available — pending an AIT-based lookup (AIT Manager, 2-Deep / 3-Deep). Filtering will be wired once that data exists."
          />
          <FilterPill
            label="Lever"
            options={LEVERS}
            value={leverFilter}
            onChange={setLeverFilter}
            allLabel="All Levers"
          />
          <FilterPill
            label="Internal vs. External"
            options={["Internal", "External"]}
            value={connectivityFilter}
            onChange={setConnectivityFilter}
            allLabel="All"
          />
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
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

          {/* Export — opens the configurable Export Findings dialog. Sits
              right of the filter controls per spec. */}
          {!isMobile && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={() => setExportDialogOpen(true)}
              aria-label="Open export findings dialog"
            >
              <Download className="h-3.5 w-3.5" />
              Export…
            </Button>
          )}

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
        {(activeFilters.length > 0 ||
          quickFilter ||
          filterPreset ||
          cioScope ||
          leverScope ||
          cioFilter ||
          leverFilter ||
          connectivityFilter) && (
          <div className="flex flex-wrap items-center gap-1.5 flex-shrink-0">
            {filterPreset && (
              <span
                key={`preset-${filterPreset}`}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[11px] font-medium"
              >
                {FILTER_PRESETS[filterPreset].label}
                <button
                  className="hover:text-destructive transition-colors"
                  onClick={() => onClearFilterPreset?.()}
                  aria-label={`Remove ${FILTER_PRESETS[filterPreset].label} filter`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {cioScope && (
              <span
                key={`cio-scope-${cioScope}`}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[11px] font-medium"
              >
                CIO: {cioScope}
                <button
                  className="hover:text-destructive transition-colors"
                  onClick={() => onClearCioScope?.()}
                  aria-label={`Remove CIO scope ${cioScope}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {leverScope && (
              <span
                key={`lever-scope-${leverScope}`}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[11px] font-medium"
              >
                Lever: {leverScope}
                <button
                  className="hover:text-destructive transition-colors"
                  onClick={() => onClearLeverScope?.()}
                  aria-label={`Remove Lever scope ${leverScope}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {cioFilter && (
              <span
                key={`cio-filter-${cioFilter}`}
                className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium"
              >
                CIO: {cioFilter}
                <button
                  className="hover:text-destructive transition-colors"
                  onClick={() => setCioFilter("")}
                  aria-label={`Remove CIO filter ${cioFilter}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {leverFilter && (
              <span
                key={`lever-filter-${leverFilter}`}
                className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium"
              >
                Lever: {leverFilter}
                <button
                  className="hover:text-destructive transition-colors"
                  onClick={() => setLeverFilter("")}
                  aria-label={`Remove Lever filter ${leverFilter}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {connectivityFilter && (
              <span
                key={`connectivity-filter-${connectivityFilter}`}
                className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium"
              >
                {connectivityFilter}
                <button
                  className="hover:text-destructive transition-colors"
                  onClick={() => setConnectivityFilter("")}
                  aria-label={`Remove ${connectivityFilter} filter`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
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

        {/* Bulk update toolbar — appears above the grid when rows are selected */}
        <BulkUpdateToolbar
          selectedCount={selectedCount}
          patchWindows={patchWindowOptions}
          onApplyPatch={applyBulkPatch}
          onClear={clearSelection}
        />

        {/* Grid (desktop / tablet) — Card list (mobile). Wrapper takes
            flex-1 so it fills the parent flex column; AG Grid's own
            scrollbar handles overflow inside. */}
        {isMobile ? (
          <div
            className="w-full rounded-md border border-border/60 vrd-ag-grid bg-background overflow-y-auto flex-1 min-h-0"
            role="list"
            aria-label="Findings"
          >
            {cardVulns.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground p-6 text-center">
                No findings match the current filters.
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
          <div className="ag-theme-quartz w-full h-full rounded-md overflow-hidden border border-border/60 vrd-ag-grid flex-1 min-h-0">
            <AgGridReact<Vulnerability>
              ref={gridRef}
              rowData={openVulnerabilities}
              domLayout="normal"
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
              suppressHorizontalScroll={isTablet}
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

      {/* Configurable export — opened via the "Export…" toolbar button */}
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        columns={exportDialogOpen ? getExportColumns() : []}
        onExport={handleExport}
      />

      {/* Detail Sheet */}
      {selectedVuln && (
        <DetailSheet
          vulnerability={selectedVuln}
          open={sheetOpen}
          onOpenChange={onSheetChange}
          onSave={onSave}
          allVulnerabilities={openVulnerabilities}
          onNavigate={onRowSelected}
        />
      )}

    </>
  );
}
