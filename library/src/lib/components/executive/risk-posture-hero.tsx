
import { Card } from "../ui/card";
import { RiskGauge } from "./risk-gauge";
import { KpiTile } from "./kpi-tile";
import { KPI_TILES, RISK_POSTURE } from "../../lib/executive-data";

export function RiskPostureHero() {
  return (
    <Card className="overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-0">
        {/* Left 40% - Gauge */}
        <div className="md:col-span-2 border-b md:border-b-0 md:border-r border-border/60 p-5 flex items-center justify-center bg-muted/30">
          <RiskGauge score={RISK_POSTURE.score} delta={RISK_POSTURE.delta} />
        </div>
        {/* Right 60% - 2x2 KPI tiles */}
        <div className="md:col-span-3 p-4 grid grid-cols-2 gap-3">
          {KPI_TILES.map((t) => (
            <KpiTile
              key={t.label}
              label={t.label}
              value={t.value}
              delta={t.delta}
              spark={t.spark}
              accent={t.accent}
              invert={t.label !== "Resolved (30d)"}
            />
          ))}
        </div>
      </div>
    </Card>
  );
}
