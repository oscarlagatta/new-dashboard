"use client";

import { Radar } from "lucide-react";
import { CompactStatCard } from "./compact-stat-card";

// Blue left border — informational, waiting for the scanner to confirm.
// Count comes from server-side aggregate stats (see DASHBOARD_STATS).

const ACCENT = "#3B82F6";

interface Props {
  count: number;
  trend?: number;
  onClick?: () => void;
}

export function AwaitingScanCard({ count, trend = 0, onClick }: Props) {
  return (
    <CompactStatCard
      label="Awaiting Scan"
      count={count}
      Icon={Radar}
      accentColor={ACCENT}
      trend={trend}
      trendLabel="Pending clear scan"
      trendBad={false}
      onClick={onClick}
      ariaLabel="View findings awaiting scan confirmation"
    />
  );
}
