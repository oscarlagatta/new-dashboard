"use client";

import { CalendarX } from "lucide-react";
import { CompactStatCard } from "./compact-stat-card";

// Amber left border — signals "attention" for the secondary risk-signal tier.
// Count is supplied by the parent from server-side aggregate stats.

const ACCENT = "#F59E0B";

interface Props {
  count: number;
  trend?: number;
  onClick?: () => void;
}

export function NoRemediationDateCard({ count, trend = 0, onClick }: Props) {
  return (
    <CompactStatCard
      label="No Remediation Date"
      count={count}
      Icon={CalendarX}
      accentColor={ACCENT}
      trend={trend}
      trendLabel="Missing plan"
      trendBad={true}
      onClick={onClick}
      ariaLabel="View findings missing a remediation date"
    />
  );
}
