"use client";

import { useMemo } from "react";
import { TrendingDown } from "lucide-react";
import type { Vulnerability, Blocker } from "@/lib/types";
import { formatCount } from "@/lib/utils";

interface BlockersStripProps {
  vulnerabilities: Vulnerability[];
  /** Optional callback fires on chip click — wire to the grid filter when ready. */
  onSelectBlocker?: (blocker: Blocker) => void;
}

const BLOCKER_SHORT_LABELS: Record<Blocker, string> = {
  "Vendor / internal package availability": "Vendor / package",
  "Testing and partner / peer team dependencies": "Testing / peer deps",
  "Limited central (bulk) remediation capabilities": "Central remediation",
  "Third-party dependencies": "Third-party",
  "Hardware dependencies": "Hardware",
  "Application re-design / re-architecture required": "App redesign",
  "Hosting Capacity": "Hosting capacity",
  "No patch available": "No patch",
  "False positives in Vulnerability and FOSS data": "FP / FOSS data",
  "Data and reporting limitations": "Data / reporting",
};

function aggregate(vulns: Vulnerability[]) {
  const counts = new Map<Blocker, number>();
  let blockedRecords = 0;
  for (const v of vulns) {
    if (v.triageStatus === "Resolved") continue;
    if (v.identifiedBlockers.length === 0) continue;
    blockedRecords += 1;
    for (const b of v.identifiedBlockers) {
      counts.set(b, (counts.get(b) ?? 0) + 1);
    }
  }
  const ranked = Array.from(counts.entries())
    .map(([blocker, count]) => ({ blocker, count }))
    .sort((a, b) => b.count - a.count);
  return { ranked, blockedRecords };
}

/** Returns a visual weight tier driven by the chip's count, so the biggest
 *  blockers read as the biggest blockers at a glance. */
function chipTier(count: number): "lg" | "md" | "sm" {
  if (count >= 5) return "lg";
  if (count >= 3) return "md";
  return "sm";
}

export function BlockersStrip({ vulnerabilities, onSelectBlocker }: BlockersStripProps) {
  const { ranked, blockedRecords } = useMemo(
    () => aggregate(vulnerabilities),
    [vulnerabilities],
  );

  if (ranked.length === 0) return null;

  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: 16,
        padding: "14px 18px 14px",
        border: "1px solid #E5E7EB",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)",
      }}
      aria-label="Remediation blockers across the estate"
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 10,
        }}
      >
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 7,
            background: "#FEF2F2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
          aria-hidden="true"
        >
          <TrendingDown
            style={{ width: 15, height: 15, color: "#DC2626" }}
          />
        </div>
        <h2
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "#111827",
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          What&rsquo;s Blocking Remediation
        </h2>
        <span
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: "#6B7280",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          · {formatCount(blockedRecords)} blocked
        </span>
      </div>

      {/* Weighted chips, count-descending */}
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        {ranked.map(({ blocker, count }) => (
          <BlockerChip
            key={blocker}
            blocker={blocker}
            count={count}
            tier={chipTier(count)}
            onClick={onSelectBlocker ? () => onSelectBlocker(blocker) : undefined}
          />
        ))}
      </div>
    </div>
  );
}

function BlockerChip({
  blocker,
  count,
  tier,
  onClick,
}: {
  blocker: Blocker;
  count: number;
  tier: "lg" | "md" | "sm";
  onClick?: () => void;
}) {
  const tokens = {
    lg: {
      padX: 12,
      padY: 7,
      countSize: 18,
      countWeight: 700,
      labelSize: 12,
      bg: "#FEF2F2",
      border: "#FECACA",
      hoverBg: "#FEE2E2",
    },
    md: {
      padX: 11,
      padY: 6,
      countSize: 16,
      countWeight: 700,
      labelSize: 11,
      bg: "#FFFFFF",
      border: "#E5E7EB",
      hoverBg: "#F9FAFB",
    },
    sm: {
      padX: 10,
      padY: 5,
      countSize: 14,
      countWeight: 600,
      labelSize: 10,
      bg: "#FFFFFF",
      border: "#E5E7EB",
      hoverBg: "#F9FAFB",
    },
  }[tier];

  const clickable = !!onClick;
  // TODO: wire onClick to filter the vulnerabilities grid by blocker once
  //       AgGridTriageTable exposes an external filter API.
  return (
    <button
      type="button"
      onClick={onClick}
      title={blocker}
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 8,
        padding: `${tokens.padY}px ${tokens.padX}px`,
        borderRadius: 10,
        border: `1px solid ${tokens.border}`,
        background: tokens.bg,
        cursor: clickable ? "pointer" : "default",
        transition: "background 120ms ease, border-color 120ms ease",
        font: "inherit",
        textAlign: "left",
      }}
      onMouseEnter={(e) => {
        if (clickable) e.currentTarget.style.background = tokens.hoverBg;
      }}
      onMouseLeave={(e) => {
        if (clickable) e.currentTarget.style.background = tokens.bg;
      }}
      aria-label={`${count} vulnerabilities blocked by ${blocker}`}
    >
      <span
        style={{
          fontSize: tokens.countSize,
          fontWeight: tokens.countWeight,
          color: "#111827",
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1,
        }}
      >
        {formatCount(count)}
      </span>
      <span
        style={{
          fontSize: tokens.labelSize,
          color: "#6B7280",
          whiteSpace: "nowrap",
        }}
      >
        {BLOCKER_SHORT_LABELS[blocker] ?? blocker}
      </span>
    </button>
  );
}
