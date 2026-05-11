
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { BURNDOWN } from "../../lib/executive-data";

export function BurndownChart() {
  // Use roughly every 10th tick to avoid clutter
  const tickInterval = Math.floor(BURNDOWN.length / 6);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">60-day Burndown</CardTitle>
        <p className="text-xs text-muted-foreground">
          Open vulnerabilities vs cumulative resolved
        </p>
      </CardHeader>
      <CardContent className="flex-1 pb-4 pl-2">
        <ResponsiveContainer width="100%" height="100%" minHeight={220}>
          <LineChart data={BURNDOWN} margin={{ top: 6, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#F3F4F6" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "#6B7280" }}
              tickLine={false}
              axisLine={{ stroke: "#E5E7EB" }}
              interval={tickInterval}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#6B7280" }}
              tickLine={false}
              axisLine={false}
              width={32}
            />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid #E5E7EB",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
              labelStyle={{ fontWeight: 500, color: "#111827", marginBottom: 4 }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              iconType="line"
              iconSize={14}
            />
            <Line
              type="monotone"
              dataKey="open"
              name="Open"
              stroke="#DC2626"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="resolved"
              name="Resolved (cumulative)"
              stroke="#16A34A"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
