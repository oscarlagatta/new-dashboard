"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AGE_BUCKETS, HEATMAP, type Severity } from "@/lib/executive-data";

const SEVERITIES: Severity[] = ["Critical", "High", "Medium", "Low"];

// Compute the max for color intensity scaling
const allValues = SEVERITIES.flatMap((s) => AGE_BUCKETS.map((b) => HEATMAP[s][b]));
const MAX_VAL = Math.max(...allValues, 1);

function cellColor(value: number, severity: Severity, bucket: string) {
  if (value === 0) return { bg: "#F9FAFB", text: "#9CA3AF" };
  // The Critical / 90+ cell pops the most.
  const isHottest = severity === "Critical" && bucket === "90+d";
  if (isHottest) return { bg: "#7F1D1D", text: "#FFFFFF" };

  // Color ramp from light → severity-color
  const intensity = value / MAX_VAL; // 0..1
  // Use red ramp for Critical/High, amber for Medium, green for Low
  if (severity === "Critical") {
    const a = 0.15 + intensity * 0.85;
    return { bg: `rgba(220, 38, 38, ${a})`, text: a > 0.55 ? "#FFFFFF" : "#7F1D1D" };
  }
  if (severity === "High") {
    const a = 0.12 + intensity * 0.7;
    return { bg: `rgba(234, 88, 12, ${a})`, text: a > 0.5 ? "#FFFFFF" : "#7C2D12" };
  }
  if (severity === "Medium") {
    const a = 0.12 + intensity * 0.65;
    return { bg: `rgba(217, 119, 6, ${a})`, text: a > 0.5 ? "#FFFFFF" : "#78350F" };
  }
  const a = 0.12 + intensity * 0.55;
  return { bg: `rgba(101, 163, 13, ${a})`, text: a > 0.45 ? "#FFFFFF" : "#365314" };
}

export function SeverityAgeHeatmap() {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Severity × Age</CardTitle>
        <p className="text-xs text-muted-foreground">
          Distribution of open vulnerabilities by severity and time since detection
        </p>
      </CardHeader>
      <CardContent className="flex-1 flex items-center">
        <TooltipProvider delayDuration={150}>
          <div className="w-full">
            <div
              className="grid gap-1.5 text-xs"
              style={{
                gridTemplateColumns: `auto repeat(${AGE_BUCKETS.length}, minmax(0, 1fr))`,
              }}
            >
              {/* Header row */}
              <div></div>
              {AGE_BUCKETS.map((b) => (
                <div
                  key={b}
                  className="text-center text-[11px] font-medium text-muted-foreground tabular-nums"
                >
                  {b}
                </div>
              ))}
              {/* Body */}
              {SEVERITIES.map((sev) => (
                <div key={`row-${sev}`} className="contents">
                  <div className="text-[11px] font-medium text-muted-foreground pr-2 flex items-center justify-end">
                    {sev}
                  </div>
                  {AGE_BUCKETS.map((b) => {
                    const v = HEATMAP[sev][b];
                    const { bg, text } = cellColor(v, sev, b);
                    const hottest = sev === "Critical" && b === "90+d";
                    return (
                      <Tooltip key={`${sev}-${b}`}>
                        <TooltipTrigger asChild>
                          <div
                            className="aspect-[2/1] rounded-md flex items-center justify-center font-medium tabular-nums cursor-default transition-transform hover:scale-[1.04]"
                            style={{
                              backgroundColor: bg,
                              color: text,
                              fontSize: hottest ? "16px" : "13px",
                              fontWeight: hottest ? 700 : 500,
                              boxShadow: hottest ? "0 0 0 1px rgba(127,29,29,0.4)" : undefined,
                            }}
                          >
                            {v}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs">
                            <div className="font-medium">
                              {sev} · {b}
                            </div>
                            <div className="text-muted-foreground">
                              {v} {v === 1 ? "vulnerability" : "vulnerabilities"}
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-end gap-2 mt-4 text-[11px] text-muted-foreground">
              <span>Less</span>
              <div className="flex gap-0.5">
                {[0.1, 0.3, 0.55, 0.8, 1].map((a) => (
                  <div
                    key={a}
                    className="w-4 h-3 rounded-sm"
                    style={{ backgroundColor: `rgba(220, 38, 38, ${a})` }}
                  />
                ))}
              </div>
              <span>More</span>
            </div>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
