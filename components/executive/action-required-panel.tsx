"use client";

import { ChevronRight, AlertOctagon } from "lucide-react";
import type { DashboardSettings } from "@/lib/dashboard-settings";
import type { FilterPresetId } from "@/lib/filter-presets";
import { formatCount } from "@/lib/utils";

// Elevated attention panel. Only contains threshold-based or nuanced items
// that aren't already represented by a secondary stat card. After the v2
// dashboard split, `findingsMissingPlan` and `completedButNotValidated` moved
// to the secondary stat-card tier — only `validationPendingOverThreshold`
// remains here, as its dependency on a configurable threshold makes it more
// nuanced than a simple status count.
//
// Chrome: 4px amber left border + #FFFBEB tinted background to signal urgency
// at a glance — distinct from the neutral cards around it.

interface ActionRow {
  preset: FilterPresetId;
  label: string;
  accentColor: string;
  count: number;
}

interface Props {
  settings: DashboardSettings;
  counts: {
    validationPendingOverThreshold: number;
  };
  onSelectPreset: (preset: FilterPresetId) => void;
}

export function ActionRequiredPanel({ settings, counts, onSelectPreset }: Props) {
  const rows: ActionRow[] = [
    {
      preset: "validationPendingOverThreshold",
      label: `Validation pending > ${settings.validationPendingThresholdDays} days`,
      accentColor: "#DC2626",
      count: counts.validationPendingOverThreshold,
    },
  ];

  const totalRequiringAction = rows.reduce((sum, r) => sum + r.count, 0);

  return (
    <div
      className="vrd-action-required-panel"
      style={{
        background: "#FFFBEB",
        borderRadius: 16,
        padding: "14px 18px 14px",
        border: "1px solid #FCD34D",
        borderLeft: "4px solid #F59E0B",
        boxShadow: "0 1px 3px rgba(245, 158, 11, 0.08), 0 4px 16px rgba(245, 158, 11, 0.05)",
      }}
      aria-label="Action required"
    >
      {/* Header — orange circle icon + label + total badge */}
      <div className="flex items-center gap-2.5 mb-2.5">
        <div
          className="flex items-center justify-center shrink-0"
          style={{
            width: 26,
            height: 26,
            borderRadius: 7,
            background: "#FED7AA",
          }}
          aria-hidden="true"
        >
          <AlertOctagon className="h-[15px] w-[15px]" style={{ color: "#B45309" }} />
        </div>
        <h2 className="text-sm font-semibold text-slate-900 leading-tight m-0">
          Action Required
        </h2>
        <span className="text-xs font-medium text-slate-600 tabular-nums">
          · {formatCount(totalRequiringAction)} flagged
        </span>
      </div>

      <ul className="list-none m-0 p-0 flex flex-col">
        {rows.map((row, idx) => (
          <ActionRowButton
            key={row.preset}
            row={row}
            count={row.count}
            onClick={() => onSelectPreset(row.preset)}
            isLast={idx === rows.length - 1}
          />
        ))}
      </ul>
    </div>
  );
}

function ActionRowButton({
  row,
  count,
  onClick,
  isLast,
}: {
  row: ActionRow;
  count: number;
  onClick: () => void;
  isLast: boolean;
}) {
  const dim = count === 0;
  return (
    <li style={{ borderBottom: isLast ? "none" : "1px solid #FDE68A" }}>
      <button
        type="button"
        onClick={onClick}
        className="w-full flex items-center gap-3 px-1 py-2.5 bg-transparent border-0 text-left cursor-pointer rounded-md transition-colors"
        style={{ font: "inherit" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(254, 243, 199, 0.6)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
        }}
        aria-label={`${count} ${row.label} — apply filter`}
      >
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ background: dim ? "#E5E7EB" : row.accentColor }}
          aria-hidden="true"
        />
        <span
          className={`flex-1 text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis ${
            dim ? "text-slate-400" : "text-slate-700"
          }`}
        >
          {row.label}
        </span>
        <span
          className={`text-sm font-medium tabular-nums shrink-0 ${
            dim ? "text-slate-400" : "text-slate-600"
          }`}
        >
          {formatCount(count)}
        </span>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
      </button>
    </li>
  );
}
