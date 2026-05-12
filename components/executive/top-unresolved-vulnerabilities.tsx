"use client";

import { useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { TOP_UNRESOLVED_VULNS, type UnresolvedVuln } from "@/lib/executive-data";
import type { SeverityRisk } from "@/lib/types";
import {
  RankedListCard,
  RankedListItem,
  SegmentedToggle,
  TonePill,
  MetricPill,
  type RankedTone,
} from "./ranked-list";

// Ranked top-10 list of open findings. Toggle changes the secondary sort:
// "By Severity" → Priority 1 first, with longest-open as tiebreaker (the
// classic "worst-of-the-worst" view). "By Count" → most affected hosts first.

type SortMode = "severity" | "count";

interface Props {
  vulns?: UnresolvedVuln[];
  limit?: number;
}

const PRIORITY_ORDER: Record<SeverityRisk, number> = {
  "Priority 1": 0,
  "Priority 2": 1,
  "Priority 3": 2,
  "Priority 4": 3,
};

// Priority N → tone vocabulary used by the ranked-list primitives.
const PRIORITY_TONE: Record<SeverityRisk, RankedTone> = {
  "Priority 1": "critical",
  "Priority 2": "high",
  "Priority 3": "medium",
  "Priority 4": "low",
};

export function TopUnresolvedVulnerabilities({
  vulns = TOP_UNRESOLVED_VULNS,
  limit = 10,
}: Props) {
  const [mode, setMode] = useState<SortMode>("severity");

  const ranked = useMemo(() => {
    const sorted = [...vulns].sort((a, b) => {
      if (mode === "severity") {
        const ord = PRIORITY_ORDER[a.severity] - PRIORITY_ORDER[b.severity];
        if (ord !== 0) return ord;
        return b.daysOpen - a.daysOpen;
      }
      const diff = b.affectedHosts - a.affectedHosts;
      if (diff !== 0) return diff;
      return PRIORITY_ORDER[a.severity] - PRIORITY_ORDER[b.severity];
    });
    return sorted.slice(0, limit);
  }, [vulns, mode, limit]);

  const maxHosts = ranked.reduce((m, r) => Math.max(m, r.affectedHosts), 0);

  return (
    <RankedListCard
      icon={<AlertTriangle className="h-[15px] w-[15px]" />}
      accent="danger"
      title="Top Unresolved Vulnerabilities"
      count={ranked.length > 0 ? ranked.length : undefined}
      ariaLabel="Top unresolved vulnerabilities"
      toolbar={
        <SegmentedToggle<SortMode>
          label="Sort mode"
          value={mode}
          onChange={setMode}
          options={[
            { value: "count", label: "By Count" },
            { value: "severity", label: "By Severity" },
          ]}
        />
      }
    >
      {ranked.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="m-0 list-none p-0">
          {ranked.map((row, idx) => {
            const tone = PRIORITY_TONE[row.severity];
            return (
              <RankedListItem
                key={row.id}
                rank={idx + 1}
                tone={tone}
                title={row.title}
                subtitle={
                  <span
                    className={
                      row.cve
                        ? "font-mono text-foreground/70"
                        : "italic text-muted-foreground/80"
                    }
                  >
                    {row.cve || "no CVE assigned"}
                  </span>
                }
                badges={
                  <>
                    <TonePill tone={tone}>{row.severity}</TonePill>
                    <MetricPill
                      intent={daysIntent(row.daysOpen)}
                      title={`Open for ${row.daysOpen} days`}
                    >
                      {row.daysOpen}
                      <span className="text-[9px] opacity-80">d</span>
                    </MetricPill>
                  </>
                }
                metric={{
                  value: row.affectedHosts,
                  max: maxHosts,
                  label: "hosts",
                }}
              />
            );
          })}
        </ul>
      )}
    </RankedListCard>
  );
}

function daysIntent(days: number): "danger" | "warn" | "muted" {
  if (days > 90) return "danger";
  if (days > 30) return "warn";
  return "muted";
}

function EmptyState() {
  return (
    <div className="px-3 py-6 text-center text-[13px] text-muted-foreground/80">
      No open vulnerabilities to rank.
    </div>
  );
}
