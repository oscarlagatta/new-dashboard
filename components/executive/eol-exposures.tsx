"use client";

import { CalendarOff } from "lucide-react";
import { EOL_EXPOSURES, SEVERITY_COLORS, type EolExposure } from "@/lib/executive-data";
import { formatCount } from "@/lib/utils";

// Ranked top-10 list of End-of-Life technologies still in the estate.
// Same outer card shape as BlockersStrip so the two read as a set.

interface Props {
  exposures?: EolExposure[];
}

export function EolExposures({ exposures = EOL_EXPOSURES }: Props) {
  return (
    <div
      className="vrd-eol-exposures"
      style={{
        background: "#FFFFFF",
        borderRadius: 16,
        padding: "14px 18px 14px",
        border: "1px solid #E5E7EB",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)",
      }}
      aria-label="Top End-of-Life exposures"
    >
      {/* Header — same shape as BlockersStrip */}
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
          <CalendarOff style={{ width: 15, height: 15, color: "#DC2626" }} />
        </div>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: "#111827", margin: 0, lineHeight: 1.2 }}>
          Top EOL Exposures
        </h2>
        {exposures.length > 0 && (
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "#6B7280",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            · {exposures.length} ranked
          </span>
        )}
      </div>

      {exposures.length === 0 ? <EmptyState /> : <Rows rows={exposures} />}
    </div>
  );
}

function Rows({ rows }: { rows: EolExposure[] }) {
  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
      {rows.map((row, idx) => (
        <li
          key={row.rank}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "8px 4px",
            borderBottom: idx === rows.length - 1 ? "none" : "1px solid #F3F4F6",
          }}
        >
          <RankBadge rank={row.rank} />

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
              title={row.technology}
            >
              {row.technology}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#6B7280",
                marginTop: 2,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              EOL {formatEolDate(row.eolDate)}
            </div>
          </div>

          <SeverityBadge severity={row.severity} />

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

function SeverityBadge({ severity }: { severity: keyof typeof SEVERITY_COLORS }) {
  const color = SEVERITY_COLORS[severity];
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
      No End-of-Life exposures detected.
    </div>
  );
}

function formatEolDate(iso: string): string {
  // Parse YYYY-MM-DD deterministically so SSR and CSR agree.
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

// Soft tint behind the severity label — color * ~12% opacity equivalent.
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
