
import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

interface KpiTileProps {
  label: string;
  value: number;
  delta: number;
  spark: number[];
  accent: string;
  // For some KPIs (Resolved) up is good; for others (Awaiting) up is bad.
  invert?: boolean;
}

export function KpiTile({ label, value, delta, spark, accent, invert }: KpiTileProps) {
  const data = spark.map((y, i) => ({ x: i, y }));
  const goodWhenUp = !invert;
  const positiveSign = delta > 0;
  const isGood = delta === 0 ? null : goodWhenUp ? positiveSign : !positiveSign;
  const deltaColor = isGood === null ? "#6B7280" : isGood ? "#16A34A" : "#DC2626";
  const DeltaIcon = delta === 0 ? ArrowRight : positiveSign ? ArrowUp : ArrowDown;

  return (
    <div
      className="relative flex items-center gap-3 px-4 py-3 bg-card rounded-md border border-border/60 hover:border-border transition-colors"
      style={{ borderLeft: `3px solid ${accent}` }}
    >
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground truncate">
          {label}
        </div>
        <div className="flex items-baseline gap-2 mt-0.5">
          <span className="text-2xl font-semibold tabular-nums tracking-tight">{value}</span>
          <span
            className="inline-flex items-center gap-0.5 text-xs font-medium tabular-nums"
            style={{ color: deltaColor }}
          >
            <DeltaIcon className="h-3 w-3" />
            {Math.abs(delta)}
          </span>
        </div>
      </div>
      <div className="w-20 h-10 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
            <Line
              type="monotone"
              dataKey="y"
              stroke={accent}
              strokeWidth={1.75}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
