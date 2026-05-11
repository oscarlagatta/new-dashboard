"use client";

import { useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { TOP_UNRESOLVED_VULNS, type UnresolvedVuln } from "@/lib/executive-data";
import type { SeverityRisk } from "@/lib/types";
import { formatCount } from "@/lib/utils";

// Ranked top-10 list of open findings. Toggle changes the secondary sort:
// "By Severity" → Priority 1 first, with longest-open as tiebreaker (the
// classic "worst-of-the-worst" view). "By Count" → most affected hosts first.
//
// Same outer card shape as the EOL widget so the two read as a paired set
// when stacked side-by-side in the dashboard's two-column row.

type SortMode = "severity" | "count";

interface Props {
  vulns?: UnresolvedVuln[];
  limit?: number;
}

const TITLE_TRUNCATE = 60;

// Priority badge colors come from the SEVERITY_COLORS palette in
// executive-data.ts but those keys are Critical/High/Medium/Low. The grid uses
// Priority 1..4 instead — map here so badges match the same visual language.
const PRIORITY_COLORS: Record<SeverityRisk, string> = {
  "Priority 1": "#DC2626",
  "Priority 2": "#EA580C",
  "Priority 3": "#D97706",
  "Priority 4": "#65A30D",
};

const PRIORITY_ORDER: Record<SeverityRisk, number> = {
  "Priority 1": 0,
  "Priority 2": 1,
  "Priority 3": 2,
  "Priority 4": 3,
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
      // By count
      const diff = b.affectedHosts - a.affectedHosts;
      if (diff !== 0) return diff;
      return PRIORITY_ORDER[a.severity] - PRIORITY_ORDER[b.severity];
    });
    return sorted.slice(0, limit);
  }, [vulns, mode, limit]);

  return (
    <div
      className="vrd-top-unresolved"
      style={{
        background: "#FFFFFF",
        borderRadius: 16,
        padding: "14px 18px 14px",
        border: "1px solid #E5E7EB",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)",
      }}
      aria-label="Top unresolved vulnerabilities"
    >
      {/* Header — mirrors EOL widget */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
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
          <AlertTriangle style={{ width: 15, height: 15, color: "#DC2626" }} />
        </div>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0, lineHeight: 1.2 }}>
          Top Unresolved Vulnerabilities
        </h2>
        {ranked.length > 0 && (
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "#6B7280",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            · {ranked.length} ranked
          </span>
        )}

        {/* Sort-mode toggle — same shape as the chart toolbar toggles */}
        <div
          role="tablist"
          aria-label="Sort mode"
          style={{
            display: "flex",
            gap: 4,
            background: "#F3F4F6",
            borderRadius: 6,
            padding: 3,
            marginLeft: "auto",
          }}
        >
          <ModeButton active={mode === "count"} onClick={() => setMode("count")}>
            By Count
          </ModeButton>
          <ModeButton active={mode === "severity"} onClick={() => setMode("severity")}>
            By Severity
          </ModeButton>
        </div>
      </div>

      {ranked.length === 0 ? <EmptyState /> : <Rows rows={ranked} />}
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      style={{
        fontSize: 11,
        fontWeight: 500,
        padding: "3px 8px",
        borderRadius: 4,
        border: "none",
        cursor: "pointer",
        background: active ? "#FFFFFF" : "transparent",
        color: active ? "#111827" : "#6B7280",
        boxShadow: active ? "0 1px 2px rgba(0,0,0,0.08)" : "none",
        transition: "background 150ms, color 150ms, box-shadow 150ms",
      }}
    >
      {children}
    </button>
  );
}

function Rows({ rows }: { rows: UnresolvedVuln[] }) {
  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {rows.map((row, idx) => (
        <li
          key={row.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "8px 4px",
            borderBottom: idx === rows.length - 1 ? "none" : "1px solid #F3F4F6",
          }}
        >
          <RankBadge rank={idx + 1} />

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#111827",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                lineHeight: 1.3,
              }}
              title={row.title}
            >
              {truncate(row.title, TITLE_TRUNCATE)}
            </div>
            <div
              style={{
                fontSize: 11,
                marginTop: 2,
                fontFamily: "var(--font-mono-jb), ui-monospace, monospace",
                color: row.cve ? "#374151" : "#9CA3AF",
                fontStyle: row.cve ? "normal" : "italic",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {row.cve || "no CVE assigned"}
            </div>
          </div>

          <PriorityBadge severity={row.severity} />
          <DaysOpenPill days={row.daysOpen} />

          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#111827",
              fontVariantNumeric: "tabular-nums",
              minWidth: 64,
              textAlign: "right",
              flexShrink: 0,
            }}
            aria-label={`${row.affectedHosts} affected hosts`}
          >
            {formatCount(row.affectedHosts)}
            <span style={{ fontSize: 10, color: "#9CA3AF", marginLeft: 4, fontWeight: 500 }}>
              hosts
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function RankBadge({ rank }: { rank: number }) {
  return (
    <span
      style={{
        width: 24,
        height: 24,
        borderRadius: 6,
        background: "#F3F4F6",
        color: "#374151",
        fontSize: 12,
        fontWeight: 700,
        fontVariantNumeric: "tabular-nums",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
      aria-hidden="true"
    >
      {rank}
    </span>
  );
}

function PriorityBadge({ severity }: { severity: SeverityRisk }) {
  const color = PRIORITY_COLORS[severity];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: 10,
        fontWeight: 600,
        color,
        background: hexToBg(color),
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {severity}
    </span>
  );
}

function DaysOpenPill({ days }: { days: number }) {
  const { color, bg } = daysOpenTone(days);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        gap: 3,
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        color,
        background: bg,
        whiteSpace: "nowrap",
        flexShrink: 0,
        fontVariantNumeric: "tabular-nums",
      }}
      aria-label={`Open for ${days} days`}
    >
      {days}
      <span style={{ fontSize: 9, opacity: 0.8 }}>d</span>
    </span>
  );
}

function daysOpenTone(days: number): { color: string; bg: string } {
  if (days > 90) return { color: "#DC2626", bg: "rgba(220, 38, 38, 0.12)" };
  if (days > 30) return { color: "#B45309", bg: "rgba(245, 158, 11, 0.15)" };
  return { color: "#374151", bg: "#F3F4F6" };
}

function EmptyState() {
  return (
    <div
      style={{
        padding: "24px 12px",
        textAlign: "center",
        color: "#9CA3AF",
        fontSize: 13,
      }}
    >
      No open vulnerabilities to rank.
    </div>
  );
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n - 1).trimEnd() + "…";
}

function hexToBg(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, 0.12)`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const m = hex.replace("#", "");
  return {
    r: Number.parseInt(m.substring(0, 2), 16),
    g: Number.parseInt(m.substring(2, 4), 16),
    b: Number.parseInt(m.substring(4, 6), 16),
  };
}
