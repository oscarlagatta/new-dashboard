
import { Card } from "../ui/card";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Button } from "../ui/button";
import { SLA, SEVERITY_COLORS } from "../../lib/executive-data";
import { AlertTriangle, ExternalLink } from "lucide-react";

export function SlaStrip() {
  const withinSlaUnder = SLA.withinSlaPct < SLA.targetPct;
  const slaColor = withinSlaUnder ? "#DC2626" : "#16A34A";

  // Find the largest MTTR for bar normalization
  const maxDays = Math.max(...SLA.mttr.map((m) => m.days));

  return (
    <Card className="px-5 py-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-border/60">
        {/* Within SLA */}
        <div className="pb-4 md:pb-0 md:pr-6 flex flex-col justify-center">
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Within SLA
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span
              className="text-3xl font-semibold tabular-nums tracking-tight"
              style={{ color: slaColor }}
            >
              {SLA.withinSlaPct}%
            </span>
            <span className="text-xs text-muted-foreground tabular-nums">
              target {SLA.targetPct}%
            </span>
          </div>
          {/* progress bar */}
          <div className="mt-3 h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${SLA.withinSlaPct}%`, backgroundColor: slaColor }}
            />
          </div>
        </div>

        {/* MTTR by severity */}
        <div className="py-4 md:py-0 md:px-6 flex flex-col justify-center">
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-2">
            MTTR by severity
          </div>
          <div className="space-y-1.5">
            {SLA.mttr.map((m) => {
              const widthPct = (m.days / maxDays) * 100;
              const color = SEVERITY_COLORS[m.severity];
              return (
                <div key={m.severity} className="flex items-center gap-2 text-xs">
                  <span className="w-14 text-muted-foreground shrink-0">{m.severity}</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden relative">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${widthPct}%`, backgroundColor: color }}
                    />
                  </div>
                  <span className="w-10 text-right font-medium tabular-nums">{m.days}d</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Oldest Open Critical */}
        <div className="pt-4 md:pt-0 md:pl-6 flex flex-col justify-center">
          <div className="flex items-center gap-1.5 mb-1">
            <AlertTriangle className="h-3 w-3 text-red-600" />
            <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Oldest Open Critical
            </div>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <Button
              variant="link"
              asChild
              className="p-0 h-auto text-sm font-mono font-medium"
              style={{ color: SEVERITY_COLORS.Critical }}
            >
              <a
                href={`https://nvd.nist.gov/vuln/detail/${SLA.oldestCritical.cve}`}
                target="_blank"
                rel="noreferrer noopener"
              >
                {SLA.oldestCritical.cve}
                <ExternalLink className="ml-1 h-3 w-3 inline" />
              </a>
            </Button>
          </div>
          <div className="text-xs text-muted-foreground truncate mt-0.5">
            {SLA.oldestCritical.title} · {SLA.oldestCritical.technology}
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span
              className="text-xl font-semibold tabular-nums leading-none animate-pulse-slow"
              style={{ color: SEVERITY_COLORS.Critical }}
            >
              {SLA.oldestCritical.daysOverdue}d
              <span className="text-xs font-normal ml-1 text-muted-foreground">overdue</span>
            </span>
            <div className="flex items-center gap-1.5 ml-auto">
              <Avatar className="h-5 w-5">
                <AvatarFallback className="text-[10px] bg-zinc-200 text-zinc-700">
                  {SLA.oldestCritical.ownerInitials}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium">{SLA.oldestCritical.owner}</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.65; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 2.4s ease-in-out infinite;
        }
      `}</style>
    </Card>
  );
}
