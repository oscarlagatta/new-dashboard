"use client";

import { CalendarOff } from "lucide-react";
import { EOL_EXPOSURES, type EolExposure } from "@/lib/executive-data";
import type { Severity } from "@/lib/executive-data";
import {
  RankedListCard,
  RankedListItem,
  TonePill,
  type RankedTone,
} from "./ranked-list";

// Ranked top-10 list of End-of-Life technologies still in the estate.
// Shares the ranked-list primitives with TopUnresolvedVulnerabilities so the
// pair reads as a coordinated set in the dashboard row.

interface Props {
  exposures?: EolExposure[];
}

const SEVERITY_TONE: Record<Severity, RankedTone> = {
  Critical: "critical",
  High: "high",
  Medium: "medium",
  Low: "low",
};

export function EolExposures({ exposures = EOL_EXPOSURES }: Props) {
  const maxHosts = exposures.reduce(
    (m, r) => Math.max(m, r.affectedHosts),
    0,
  );

  return (
    <RankedListCard
      icon={<CalendarOff className="h-[15px] w-[15px]" />}
      accent="danger"
      title="Top EOL Exposures"
      count={exposures.length > 0 ? exposures.length : undefined}
      ariaLabel="Top End-of-Life exposures"
    >
      {exposures.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="m-0 list-none p-0">
          {exposures.map((row) => {
            const tone = SEVERITY_TONE[row.severity];
            return (
              <RankedListItem
                key={row.rank}
                rank={row.rank}
                tone={tone}
                title={row.technology}
                subtitle={`EOL ${formatEolDate(row.eolDate)}`}
                badges={<TonePill tone={tone}>{row.severity}</TonePill>}
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

function EmptyState() {
  return (
    <div className="px-3 py-6 text-center text-[13px] text-muted-foreground/80">
      No End-of-Life exposures detected.
    </div>
  );
}

// Parse YYYY-MM-DD deterministically so SSR and CSR agree.
function formatEolDate(iso: string): string {
  const [y, m, d] = iso.split("-").map((s) => Number.parseInt(s, 10));
  if (!y || !m || !d) return iso;
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
