"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { Vulnerability } from "@/lib/types";
import {
  REMEDIATION_TREND,
  SLA_COMPLIANCE_BY_PRIORITY,
  SLA_OVERALL_COMPLIANCE,
  type SourceChartRow,
  type DaysOpenData,
} from "@/lib/executive-data";
import { formatCount } from "@/lib/utils";

const SOURCES = [
  "ADSF",
  "MiddlewarePatch",
  "ESM",
  "BDNA",
  "Bladelogic patch",
  "CTI Manual Ingestion",
  "Cloud Config Compliance",
  "Nextgen BMP",
];

const SOURCE_ABBREV: Record<string, string> = {
  ADSF: "ADSF",
  MiddlewarePatch: "MWPatch",
  ESM: "ESM",
  BDNA: "BDNA",
  "Bladelogic patch": "Blade",
  "CTI Manual Ingestion": "CTI",
  "Cloud Config Compliance": "Cloud",
  "Nextgen BMP": "BMP",
};

// Vivid priority colors matching spec
const P_COLORS = {
  p1: "#EF4444",
  p2: "#F97316",
  p3: "#FBBF24",
  p4: "#60A5FA",
};

interface SourceBarChartProps {
  data: SourceChartRow[];
}

export function SourceBarChart({ data }: SourceBarChartProps) {
  const chartData = data;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} barSize={28} barGap={4} barCategoryGap="25%">
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
        <XAxis
          dataKey="source"
          tick={{ fontSize: 11, fill: "#9CA3AF" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#9CA3AF" }}
          axisLine={false}
          tickLine={false}
          width={36}
          allowDecimals={false}
          tickFormatter={(v: number) => formatCount(v)}
        />
        <Tooltip
          contentStyle={{
            fontSize: 12,
            border: "none",
            borderRadius: 8,
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            background: "#fff",
          }}
          cursor={{ fill: "rgba(0,0,0,0.03)" }}
          formatter={(value: number, name: string) => [formatCount(value), name]}
        />
        <Bar dataKey="priority1" name="Priority 1" fill={P_COLORS.p1} radius={[6, 6, 0, 0]} />
        <Bar dataKey="priority2" name="Priority 2" fill={P_COLORS.p2} radius={[6, 6, 0, 0]} />
        <Bar dataKey="priority3" name="Priority 3" fill={P_COLORS.p3} radius={[6, 6, 0, 0]} />
        <Bar dataKey="priority4" name="Priority 4" fill={P_COLORS.p4} radius={[6, 6, 0, 0]} />
        <Legend
          iconType="circle"
          iconSize={10}
          wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
          formatter={(value) => (
            <span style={{ color: "#6B7280", fontWeight: 500 }}>{value}</span>
          )}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface DaysOpenChartProps {
  data: DaysOpenData;
}

interface Segment {
  label: string;
  count: number;
  color: string;
  pct: number;
}

// Ordered largest→smallest so smaller circles render on top when overlapping
const BUBBLES = [
  { label: "30–90d",  color: "#FBBF24", cx:  95, cy:  95, r: 85 },
  { label: "90–365d", color: "#F97316", cx: 220, cy:  80, r: 70 },
  { label: "< 30d",   color: "#22C55E", cx: 225, cy: 150, r: 48 },
  { label: "> 365d",  color: "#EF4444", cx: 165, cy: 165, r: 32 },
];

export function DaysOpenChart({ data }: DaysOpenChartProps) {
  const { segments } = useMemo(() => {
    const { under30, d30to90, d90to365, over365 } = data;
    const total = under30 + d30to90 + d90to365 + over365 || 1;
    const segs: Segment[] = [
      { label: "< 30d",   count: under30,  color: "#22C55E", pct: Math.round((under30  / total) * 100) },
      { label: "30–90d",  count: d30to90,  color: "#FBBF24", pct: Math.round((d30to90  / total) * 100) },
      { label: "90–365d", count: d90to365, color: "#F97316", pct: Math.round((d90to365 / total) * 100) },
      { label: "> 365d",  count: over365,  color: "#EF4444", pct: Math.round((over365  / total) * 100) },
    ];
    return { segments: segs };
  }, [data]);

  const countByLabel: Record<string, number> = {};
  for (const s of segments) countByLabel[s.label] = s.count;

  return (
    <div>
      {/* Bubble cluster */}
      <div style={{ overflow: "visible" }}>
        <svg
          viewBox="0 0 300 200"
          width="100%"
          height="200"
          aria-label="Days open distribution bubbles"
          role="img"
          style={{ overflow: "visible" }}
        >
          <defs>
            {BUBBLES.map(({ label, cx, cy, r }) => (
              <clipPath key={label} id={`bc-${label.replace(/[^a-z0-9]/gi, "")}`}>
                <circle cx={cx} cy={cy} r={r - 1} />
              </clipPath>
            ))}
          </defs>
          {BUBBLES.map(({ label, color, cx, cy, r }) => {
            const countFs  = Math.round(r * 0.65);
            const labelFs  = Math.max(9, Math.round(r * 0.26));
            const clipId   = `bc-${label.replace(/[^a-z0-9]/gi, "")}`;
            // Center the count+label pair as a tight group around cy (~4px gap between texts)
            const halfGroup = Math.round(2 + labelFs / 4 + countFs / 4);
            return (
              <g key={label}>
                <circle cx={cx} cy={cy} r={r} fill={color} opacity="1" stroke="white" strokeWidth={3} />
                <text
                  x={cx} y={cy - halfGroup}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={countFs} fontWeight="800" fill="#111827"
                  clipPath={`url(#${clipId})`}
                >
                  {formatCount(countByLabel[label] ?? 0)}
                </text>
                <text
                  x={cx} y={cy + halfGroup}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={labelFs} fontWeight="600" fill="#374151"
                  clipPath={`url(#${clipId})`}
                >
                  {label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "#E5E7EB", margin: "14px 0 10px" }} />

      {/* Progress bar rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {segments.map((seg) => (
          <div key={seg.label}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 5,
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
                {seg.label}
                <span style={{ fontSize: 11, fontWeight: 400, color: "#9CA3AF", marginLeft: 6 }}>
                  {formatCount(seg.count)}
                </span>
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#374151", fontVariantNumeric: "tabular-nums" }}>
                {seg.pct}%
              </span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: "#E5E7EB", overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${seg.pct}%`,
                  background: seg.color,
                  borderRadius: 3,
                  transition: "width 500ms ease",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RemediationTrendChart() {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={REMEDIATION_TREND} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="gradOpened" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.18} />
            <stop offset="95%" stopColor="#EF4444" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="gradClosed" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22C55E" stopOpacity={0.18} />
            <stop offset="95%" stopColor="#22C55E" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
        <XAxis
          dataKey="week"
          tick={{ fontSize: 11, fill: "#9CA3AF" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#9CA3AF" }}
          axisLine={false}
          tickLine={false}
          width={36}
          allowDecimals={false}
          tickFormatter={(v: number) => formatCount(v)}
        />
        <Tooltip
          contentStyle={{
            fontSize: 12,
            border: "none",
            borderRadius: 8,
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            background: "#fff",
          }}
          cursor={{ stroke: "#E5E7EB", strokeWidth: 1 }}
          formatter={(value: number, name: string) => [formatCount(value), name]}
        />
        <Area
          type="monotone"
          dataKey="opened"
          name="Opened"
          stroke="#EF4444"
          strokeWidth={2.5}
          fill="url(#gradOpened)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
        <Area
          type="monotone"
          dataKey="closed"
          name="Closed"
          stroke="#22C55E"
          strokeWidth={2.5}
          fill="url(#gradClosed)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
        <Legend
          iconType="circle"
          iconSize={10}
          wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
          formatter={(value) => (
            <span style={{ color: "#6B7280", fontWeight: 500 }}>{value}</span>
          )}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function SlaComplianceChart() {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {/* Overall metric */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 12, marginBottom: 28 }}>
        <span
          style={{
            fontSize: 56,
            fontWeight: 800,
            color: "#111827",
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {SLA_OVERALL_COMPLIANCE}
          <span style={{ fontSize: 32, fontWeight: 700, color: "#6B7280" }}>%</span>
        </span>
        <div style={{ paddingBottom: 6 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>Overall SLA Compliance</div>
          <div style={{ fontSize: 12, color: "#EF4444", marginTop: 3, display: "flex", alignItems: "center", gap: 3 }}>
            <span>▼</span>
            <span>2% below 95% target</span>
          </div>
        </div>
      </div>

      {/* Priority rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        {SLA_COMPLIANCE_BY_PRIORITY.map((row) => {
          const onTarget = row.compliance >= row.target;
          const barColor = onTarget ? "#22C55E" : row.compliance >= row.target - 5 ? "#F97316" : "#EF4444";
          return (
            <div key={row.priority}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: 7,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
                    {row.priority}
                  </span>
                  <span style={{ fontSize: 11, color: "#9CA3AF" }}>{row.slaDays}-day SLA</span>
                </div>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: onTarget ? "#16A34A" : "#DC2626",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {row.compliance}%
                </span>
              </div>
              {/* Track with target marker */}
              <div style={{ position: "relative", height: 10, borderRadius: 5, background: "#EBEBEB" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${row.compliance}%`,
                    background: barColor,
                    borderRadius: 5,
                    transition: "width 600ms ease",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: -3,
                    left: `${row.target}%`,
                    width: 2,
                    height: 16,
                    background: "#374151",
                    borderRadius: 1,
                    transform: "translateX(-50%)",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Target legend */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginTop: 20,
          paddingTop: 16,
          borderTop: "1px solid #F3F4F6",
        }}
      >
        <div style={{ width: 2, height: 14, background: "#374151", borderRadius: 1 }} />
        <span style={{ fontSize: 12, color: "#6B7280" }}>95% target threshold</span>
      </div>
    </div>
  );
}
