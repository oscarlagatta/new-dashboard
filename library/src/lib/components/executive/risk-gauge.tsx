
import { TrendingUp, TrendingDown } from "lucide-react";

interface RiskGaugeProps {
  score: number; // 0..100
  delta: number;
}

function gaugeColor(score: number) {
  if (score < 50) return "#DC2626"; // red
  if (score < 75) return "#D97706"; // amber
  return "#16A34A"; // green
}

function gaugeLabel(score: number) {
  if (score < 50) return "At Risk";
  if (score < 75) return "Elevated";
  return "Healthy";
}

export function RiskGauge({ score, delta }: RiskGaugeProps) {
  const color = gaugeColor(score);
  const label = gaugeLabel(score);
  // Half-doughnut: 180deg arc. Stroke-dasharray on a circle.
  const radius = 70;
  const circumference = Math.PI * radius; // half circle
  const offset = circumference - (score / 100) * circumference;

  const deltaPositive = delta > 0;
  const DeltaIcon = deltaPositive ? TrendingUp : TrendingDown;
  const deltaColor = deltaPositive ? "#16A34A" : "#DC2626";

  return (
    <div className="flex flex-col items-center justify-center w-full h-full py-2">
      <div className="relative" style={{ width: 200, height: 120 }}>
        <svg width="200" height="120" viewBox="0 0 200 120">
          {/* Background track */}
          <path
            d="M 20 110 A 80 80 0 0 1 180 110"
            fill="none"
            stroke="#F3F4F6"
            strokeWidth="14"
            strokeLinecap="round"
          />
          {/* Foreground arc */}
          <circle
            cx="100"
            cy="110"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(180 100 110)"
            style={{ transition: "stroke-dashoffset 800ms ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-0.5">
          <div className="text-4xl font-semibold tabular-nums tracking-tight" style={{ color }}>
            {score}
            <span className="text-lg text-muted-foreground font-normal">/100</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-center gap-1 mt-1">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Risk Posture · {label}
        </div>
        <div
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
          style={{ backgroundColor: `${deltaColor}15`, color: deltaColor }}
        >
          <DeltaIcon className="h-3 w-3" />
          {deltaPositive ? "+" : ""}
          {delta} from last week
        </div>
      </div>
    </div>
  );
}
