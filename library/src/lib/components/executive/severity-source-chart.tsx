
import { useMemo } from "react";
import { Card, CardContent } from "../ui/card";
import type { Vulnerability, SeverityRisk, Source } from "../../lib/types";

const SEVERITIES: SeverityRisk[] = ["Priority 1", "Priority 2", "Priority 3", "Priority 4"];
const SOURCES: Source[] = [
  "ADSF",
  "MiddlewarePatch",
  "ESM",
  "BDNA",
  "Bladelogic patch",
  "CTI Manual Ingestion",
  "Cloud Config Compliance",
  "Nextgen BMP",
];

const SOURCE_COLORS: Record<string, string> = {
  ADSF: "#3b82f6",
  MiddlewarePatch: "#f59e0b",
  ESM: "#10b981",
  BDNA: "#8b5cf6",
  "Bladelogic patch": "#f97316",
  "CTI Manual Ingestion": "#06b6d4",
  "Cloud Config Compliance": "#ec4899",
  "Nextgen BMP": "#84cc16",
};

interface Props {
  data: Vulnerability[];
}

export function SeveritySourceChart({ data }: Props) {
  const matrix = useMemo(() => {
    return SEVERITIES.map((sev) => {
      const rows = data.filter((v) => v.severityRisk === sev);
      const bySource: Record<string, number> = {};
      let total = 0;
      for (const src of SOURCES) {
        const count = rows.filter((v) => v.source === src).length;
        bySource[src] = count;
        total += count;
      }
      return { sev, bySource, total };
    });
  }, [data]);

  const maxTotal = Math.max(...matrix.map((r) => r.total), 1);

  return (
    <Card className="shadow-none border-border/60">
      <CardContent className="p-4">
        <div className="space-y-3">
          {matrix.map(({ sev, bySource, total }) => (
            <div key={sev} className="flex items-center gap-3">
              <div className="w-20 text-xs text-muted-foreground flex-shrink-0 text-right">
                {sev}
              </div>
              <div className="flex-1 h-5 bg-muted/50 rounded-sm overflow-hidden flex">
                {SOURCES.map((src) => {
                  const count = bySource[src] ?? 0;
                  if (!count) return null;
                  const pct = (count / maxTotal) * 100;
                  return (
                    <div
                      key={src}
                      style={{
                        width: `${pct}%`,
                        backgroundColor: SOURCE_COLORS[src],
                        minWidth: count > 0 ? 2 : 0,
                      }}
                      title={`${src}: ${count}`}
                      role="img"
                      aria-label={`${src}: ${count} ${sev} vulnerabilities`}
                    />
                  );
                })}
              </div>
              <div className="w-8 text-xs tabular-nums text-muted-foreground flex-shrink-0">
                {total}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-4">
          {SOURCES.map((src) => (
            <div key={src} className="flex items-center gap-1.5">
              <div
                className="h-2.5 w-2.5 rounded-sm flex-shrink-0"
                style={{ backgroundColor: SOURCE_COLORS[src] }}
                aria-hidden="true"
              />
              <span className="text-[11px] text-muted-foreground">{src}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
