"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface RankedListCardProps {
  icon: React.ReactNode;
  /** Tone of the icon chip + the subtle accent on the title rail. */
  accent?: "danger" | "warn" | "info" | "neutral";
  title: string;
  /** Renders "· N ranked" next to the title when provided. */
  count?: number;
  /** Right-aligned toolbar slot (sort toggles, filters, etc.). */
  toolbar?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}

const ACCENT: Record<NonNullable<RankedListCardProps["accent"]>, string> = {
  danger: "bg-red-500/10 text-red-600 dark:text-red-400 ring-red-500/20",
  warn:
    "bg-amber-500/10 text-amber-700 dark:text-amber-400 ring-amber-500/20",
  info: "bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-blue-500/20",
  neutral:
    "bg-muted text-muted-foreground ring-border/60 dark:bg-white/[0.06]",
};

export function RankedListCard({
  icon,
  accent = "danger",
  title,
  count,
  toolbar,
  children,
  className,
  ariaLabel,
}: RankedListCardProps) {
  return (
    <section
      aria-label={ariaLabel ?? title}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/70 bg-card",
        "shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_-4px_rgba(0,0,0,0.06)]",
        "px-4 py-3.5",
        className,
      )}
    >
      <header className="mb-2.5 flex items-center gap-2.5">
        <span
          aria-hidden
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1",
            ACCENT[accent],
          )}
        >
          {icon}
        </span>
        <h2 className="m-0 text-[14px] font-semibold leading-tight tracking-tight text-foreground">
          {title}
        </h2>
        {typeof count === "number" && (
          <span className="text-[12px] font-medium tabular-nums text-muted-foreground">
            · {count} ranked
          </span>
        )}
        {toolbar && <div className="ml-auto">{toolbar}</div>}
      </header>
      {children}
    </section>
  );
}

/**
 * Segmented toggle for the right-hand toolbar slot.
 * Matches the visual language of the chart toolbar toggles already used
 * elsewhere on the dashboard.
 */
export function SegmentedToggle<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (next: T) => void;
  options: { value: T; label: string }[];
  label?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="inline-flex items-center gap-1 rounded-md bg-muted/70 p-[3px] dark:bg-white/[0.04]"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded px-2 py-[3px] text-[11px] font-medium transition-[background-color,color,box-shadow] duration-150",
              active
                ? "bg-card text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
