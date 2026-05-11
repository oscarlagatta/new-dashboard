"use client";

import { ShieldOff } from "lucide-react";
import { CompactStatCard } from "./compact-stat-card";

// Purple left border — deliberate-exit signal; distinct from active workflow.
// Count comes from server-side aggregate stats (see DASHBOARD_STATS).

const ACCENT = "#8B5CF6";

interface Props {
  count: number;
  trend?: number;
  onClick?: () => void;
}

export function RiskAcceptedCard({ count, trend = 0, onClick }: Props) {
  return (
    <CompactStatCard
      label="Risk Accepted"
      count={count}
      Icon={ShieldOff}
      accentColor={ACCENT}
      trend={trend}
      trendLabel="Accept Risk disposition"
      trendBad={false}
      onClick={onClick}
      ariaLabel="View risk-accepted findings"
    />
  );
}
