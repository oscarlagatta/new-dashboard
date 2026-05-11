"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpRight } from "lucide-react";
import { formatCount } from "@/lib/utils";

// Secondary-tier stat card. Roughly 70% the height of the primary
// DashboardStatCard (~86px min vs 122px), no internal accent strip — instead
// the entire left border is colored. Number drops from text-4xl-ish to
// text-2xl so the card reads as "indicator" rather than "headline metric".

export interface CompactStatCardProps {
  label: string;
  count: number;
  Icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  trend: number;
  trendLabel: string;
  trendBad: boolean;
  onClick?: () => void;
  ariaLabel?: string;
}

export function CompactStatCard({
  label,
  count,
  Icon,
  accentColor,
  trend,
  trendLabel,
  trendBad,
  onClick,
  ariaLabel,
}: CompactStatCardProps) {
  const [hovered, setHovered] = useState(false);
  const TrendIcon = trend >= 0 ? ArrowUp : ArrowDown;
  const trendColor = trendBad ? "#DC2626" : "#16A34A";
  const trendBg = trendBad ? "#FEF2F2" : "#F0FDF4";
  const clickable = !!onClick;

  return (
    <div
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-label={clickable ? ariaLabel ?? `View ${label}` : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (clickable && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick?.();
        }
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="bg-card rounded-lg flex items-center gap-3 transition-shadow"
      style={{
        border: "1px solid #E5E7EB",
        borderLeft: `4px solid ${accentColor}`,
        padding: "12px 14px",
        minHeight: 86,
        cursor: clickable ? "pointer" : "default",
        boxShadow: hovered
          ? "0 2px 8px rgba(0,0,0,0.04)"
          : "0 1px 2px rgba(0,0,0,0.03)",
        transform: hovered ? "translateY(-1px)" : "translateY(0)",
        transition: "transform 150ms ease, box-shadow 150ms ease",
      }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          <Icon className="h-3 w-3 shrink-0" />
          <span className="truncate">{label}</span>
        </div>

        <div className="flex items-baseline gap-2 mt-1">
          <span
            className="text-2xl font-semibold text-slate-900 tabular-nums leading-none"
            aria-label={`${count} ${label}`}
          >
            {formatCount(count)}
          </span>
          <span
            className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium tabular-nums"
            style={{ background: trendBg, color: trendColor }}
            aria-label={trendLabel}
          >
            <TrendIcon className="h-2.5 w-2.5 shrink-0" />
            {Math.abs(trend) > 0 ? Math.abs(trend) : trendLabel}
          </span>
        </div>
      </div>

      {clickable && (
        <ArrowUpRight
          className="h-3.5 w-3.5 shrink-0 transition-colors"
          style={{ color: hovered ? "#374151" : "#9CA3AF" }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
