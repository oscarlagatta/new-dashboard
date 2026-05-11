"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpRight } from "lucide-react";
import { formatCount } from "@/lib/utils";

// Visual base shared by the new stat cards (No Remediation Date, Awaiting
// Scan, Risk Accepted, …). Matches the look of the existing inline StatCard
// in app/page.tsx so the row reads as one set, but lives in its own file so
// new variants don't risk breaking the existing four.

export interface DashboardStatCardProps {
  label: string;
  count: number;
  Icon: React.ComponentType<{ style?: React.CSSProperties; "aria-hidden"?: boolean }>;
  accentColor: string;            // hex; rendered as the left edge strip
  trend: number;
  trendLabel: string;
  trendBad: boolean;
  animDelay: number;
  onClick?: () => void;
  ariaLabel?: string;
}

const CARD_SHADOW = "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05)";
const CARD_RADIUS = 16;

export function DashboardStatCard({
  label,
  count,
  Icon,
  accentColor,
  trend,
  trendLabel,
  trendBad,
  animDelay,
  onClick,
  ariaLabel,
}: DashboardStatCardProps) {
  const [hovered, setHovered] = useState(false);
  const TrendIcon = trend >= 0 ? ArrowUp : ArrowDown;
  const trendColor = trendBad ? "#DC2626" : "#16A34A";
  const trendBg = trendBad ? "#FEF2F2" : "#F0FDF4";
  const clickable = !!onClick;

  return (
    <div
      className="vrd-stat-card"
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
      style={{
        background: "#FFFFFF",
        borderRadius: CARD_RADIUS,
        border: "1px solid #E5E7EB",
        boxShadow: hovered
          ? "0 6px 20px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04)"
          : CARD_SHADOW,
        padding: "14px 18px 12px 18px",
        flex: 1,
        minWidth: 0,
        minHeight: 122,
        position: "relative",
        overflow: "hidden",
        transform: hovered ? "translateY(-1px)" : "translateY(0)",
        transition: "transform 150ms ease, box-shadow 150ms ease, border-color 150ms ease",
        borderColor: hovered && clickable ? "#D1D5DB" : "#E5E7EB",
        animation: "fadeSlideUp 300ms ease forwards",
        animationDelay: `${animDelay}ms`,
        opacity: 0,
        cursor: clickable ? "pointer" : "default",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: accentColor }}
        aria-hidden="true"
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 8,
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
          <Icon
            style={{ width: 14, height: 14, color: "#6B7280", flexShrink: 0 }}
            aria-hidden={true}
          />
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#374151",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {label}
          </span>
        </div>
        {clickable && (
          <ArrowUpRight
            style={{
              width: 16,
              height: 16,
              color: hovered ? "#374151" : "#9CA3AF",
              flexShrink: 0,
              transition: "color 150ms",
            }}
            aria-hidden={true}
          />
        )}
      </div>

      <p
        style={{
          fontSize: 32,
          fontWeight: 700,
          color: "#111827",
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
          margin: "0 0 8px",
        }}
        aria-label={`${count} ${label}`}
      >
        {formatCount(count)}
      </p>

      <div
        style={{
          display: "inline-flex",
          alignSelf: "flex-start",
          alignItems: "center",
          gap: 4,
          padding: "3px 8px",
          borderRadius: 999,
          background: trendBg,
          marginTop: "auto",
        }}
        aria-label={trendLabel}
      >
        <TrendIcon
          style={{ width: 11, height: 11, color: trendColor, flexShrink: 0 }}
          aria-hidden={true}
        />
        <span style={{ fontSize: 11, fontWeight: 600, color: trendColor }}>{trendLabel}</span>
      </div>
    </div>
  );
}
