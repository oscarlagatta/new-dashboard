"use client";

import * as React from "react";
import { cn, formatCount } from "@/lib/utils";

// Severity tone drives the rank badge, left accent, and mini-bar colour.
// Map your domain severities to one of these five tones at the call site.
export type RankedTone = "critical" | "high" | "medium" | "low" | "neutral";

interface ToneStyle {
  rankGradient: string;
  rankRing: string;
  accent: string;
  bar: string;
  glow: string;
}

const TONE: Record<RankedTone, ToneStyle> = {
  critical: {
    rankGradient: "bg-gradient-to-br from-red-500 to-red-700",
    rankRing: "ring-red-500/30",
    accent: "bg-red-500",
    bar: "bg-gradient-to-r from-red-500 to-red-600",
    glow: "group-hover:shadow-red-500/10",
  },
  high: {
    rankGradient: "bg-gradient-to-br from-orange-500 to-orange-700",
    rankRing: "ring-orange-500/30",
    accent: "bg-orange-500",
    bar: "bg-gradient-to-r from-orange-500 to-orange-600",
    glow: "group-hover:shadow-orange-500/10",
  },
  medium: {
    rankGradient: "bg-gradient-to-br from-amber-500 to-amber-600",
    rankRing: "ring-amber-500/30",
    accent: "bg-amber-500",
    bar: "bg-gradient-to-r from-amber-500 to-amber-600",
    glow: "group-hover:shadow-amber-500/10",
  },
  low: {
    rankGradient: "bg-gradient-to-br from-lime-500 to-emerald-600",
    rankRing: "ring-emerald-500/30",
    accent: "bg-emerald-500",
    bar: "bg-gradient-to-r from-lime-500 to-emerald-600",
    glow: "group-hover:shadow-emerald-500/10",
  },
  neutral: {
    rankGradient: "bg-gradient-to-br from-zinc-500 to-zinc-700",
    rankRing: "ring-zinc-500/25",
    accent: "bg-zinc-400 dark:bg-zinc-500",
    bar: "bg-gradient-to-r from-zinc-400 to-zinc-500",
    glow: "group-hover:shadow-zinc-500/10",
  },
};

export interface RankedListItemProps {
  rank: number;
  tone: RankedTone;
  title: string;
  titleHref?: string;
  subtitle?: React.ReactNode;
  /** Slot for severity pill, status chips, etc. — kept compact (height ~18px). */
  badges?: React.ReactNode;
  /** Primary numeric metric, rendered with a normalised mini-bar. */
  metric: {
    value: number;
    max: number;
    label: string;
  };
  /** Top N ranks render the severity-tinted rank badge + persistent left accent. */
  highlightTop?: number;
  className?: string;
  onClick?: () => void;
}

export function RankedListItem({
  rank,
  tone,
  title,
  titleHref,
  subtitle,
  badges,
  metric,
  highlightTop = 3,
  className,
  onClick,
}: RankedListItemProps) {
  const t = TONE[tone];
  const isTop = rank <= highlightTop;
  const pct =
    metric.max > 0
      ? Math.max(4, Math.min(100, (metric.value / metric.max) * 100))
      : 0;

  return (
    <li
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-3 rounded-lg px-2.5 py-2",
        "transition-[background-color,transform,box-shadow] duration-200 ease-out",
        "hover:-translate-y-px hover:bg-muted/60 dark:hover:bg-white/[0.03]",
        "hover:shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.12)]",
        onClick && "cursor-pointer",
        t.glow,
        className,
      )}
    >
      {/* Left severity accent — solid for top ranks, fades in on hover otherwise. */}
      <span
        aria-hidden
        className={cn(
          "absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full transition-opacity duration-200",
          t.accent,
          isTop ? "opacity-100" : "opacity-0 group-hover:opacity-50",
        )}
      />

      <RankBadge rank={rank} tone={t} isTop={isTop} />

      <div className="min-w-0 flex-1">
        {titleHref ? (
          <a
            href={titleHref}
            target="_blank"
            rel="noreferrer noopener"
            title={title}
            className="block truncate text-[13px] font-semibold leading-tight text-foreground decoration-dotted underline-offset-[3px] hover:underline"
          >
            {title}
          </a>
        ) : (
          <span
            title={title}
            className="block truncate text-[13px] font-semibold leading-tight text-foreground"
          >
            {title}
          </span>
        )}
        {subtitle && (
          <div className="mt-0.5 truncate text-[11px] leading-tight text-muted-foreground">
            {subtitle}
          </div>
        )}
      </div>

      {badges && (
        <div className="flex shrink-0 items-center gap-1.5">{badges}</div>
      )}

      <div
        className="flex shrink-0 flex-col items-end gap-1"
        aria-label={`${metric.value} ${metric.label}`}
      >
        <div className="text-[13px] font-semibold leading-none tabular-nums text-foreground">
          {formatCount(metric.value)}
          <span className="ml-1 text-[10px] font-medium text-muted-foreground">
            {metric.label}
          </span>
        </div>
        <div
          className="relative h-1 w-16 overflow-hidden rounded-full bg-muted dark:bg-white/[0.06]"
          aria-hidden
        >
          <span
            className={cn(
              "absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-out",
              t.bar,
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </li>
  );
}

function RankBadge({
  rank,
  tone,
  isTop,
}: {
  rank: number;
  tone: ToneStyle;
  isTop: boolean;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] text-[12px] font-bold tabular-nums leading-none",
        "transition-transform duration-200 group-hover:scale-[1.04]",
        isTop
          ? cn("text-white shadow-sm ring-2", tone.rankGradient, tone.rankRing)
          : "bg-muted text-muted-foreground ring-1 ring-border/60 dark:bg-white/[0.04] dark:ring-white/[0.06]",
      )}
    >
      {rank}
    </span>
  );
}

/**
 * Soft tone-tinted pill, designed to slot into `badges` of <RankedListItem>.
 * Keeps the same tone vocabulary so badges feel native to the row.
 */
export function TonePill({
  tone,
  children,
  className,
}: {
  tone: RankedTone;
  children: React.ReactNode;
  className?: string;
}) {
  const styles: Record<RankedTone, string> = {
    critical:
      "bg-red-500/10 text-red-600 ring-red-500/20 dark:text-red-400 dark:bg-red-500/15",
    high:
      "bg-orange-500/10 text-orange-600 ring-orange-500/20 dark:text-orange-400 dark:bg-orange-500/15",
    medium:
      "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-400 dark:bg-amber-500/15",
    low:
      "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-400 dark:bg-emerald-500/15",
    neutral:
      "bg-muted text-muted-foreground ring-border/40 dark:bg-white/[0.06]",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2 py-[2px]",
        "text-[10px] font-semibold tracking-wide ring-1",
        styles[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * Neutral, tone-agnostic pill — e.g. "142d", "Q4 2024".
 * Tinted via a `severity`-like prop ("danger" / "warn" / "muted") so callers
 * don't have to reach for arbitrary colours.
 */
export function MetricPill({
  intent = "muted",
  children,
  className,
  title,
}: {
  intent?: "danger" | "warn" | "muted";
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  const styles: Record<typeof intent & string, string> = {
    danger:
      "bg-red-500/10 text-red-600 ring-red-500/20 dark:text-red-400 dark:bg-red-500/15",
    warn:
      "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-400 dark:bg-amber-500/15",
    muted:
      "bg-muted text-foreground/80 ring-border/40 dark:bg-white/[0.06] dark:text-foreground/90",
  };
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-baseline gap-[2px] whitespace-nowrap rounded-full px-2 py-[2px]",
        "text-[11px] font-semibold tabular-nums ring-1",
        styles[intent],
        className,
      )}
    >
      {children}
    </span>
  );
}
