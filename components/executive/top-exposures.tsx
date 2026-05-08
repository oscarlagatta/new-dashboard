"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowUpRight, ChevronRight, Server } from "lucide-react";
import { TOP_EXPOSURES, SEVERITY_COLORS } from "@/lib/executive-data";

export function TopExposures() {
  return (
    <section>
      <div className="flex items-end justify-between mb-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Requires Attention</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Top 3 critical exposures with the highest age + severity risk
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {TOP_EXPOSURES.map((e) => {
          const sevColor = SEVERITY_COLORS[e.severity];
          return (
            <Card
              key={e.id}
              className="group relative overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* left severity stripe */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1"
                style={{ backgroundColor: sevColor }}
              />
              <CardContent className="p-4 pl-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <a
                      href={`https://nvd.nist.gov/vuln/detail/${e.cve}`}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-xs font-mono font-medium text-blue-600 hover:underline flex items-center gap-1 truncate"
                    >
                      {e.cve}
                      <ArrowUpRight className="h-3 w-3 shrink-0" />
                    </a>
                    <Badge
                      variant="outline"
                      className="h-5 px-1.5 text-[10px] uppercase tracking-wider font-medium border-0"
                      style={{
                        backgroundColor: `${sevColor}15`,
                        color: sevColor,
                      }}
                    >
                      {e.severity}
                    </Badge>
                  </div>
                </div>

                <div className="mt-2 text-sm font-medium leading-snug text-pretty line-clamp-2">
                  {e.title}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{e.technology}</div>

                <div className="flex items-center gap-1.5 mt-2 text-[11px] text-muted-foreground">
                  <Server className="h-3 w-3 shrink-0" />
                  <span className="font-mono truncate">{e.hostname}</span>
                </div>

                <div className="flex items-end justify-between mt-3 pt-3 border-t border-border/60">
                  <div>
                    <div
                      className="text-2xl font-semibold tabular-nums leading-none"
                      style={{ color: sevColor }}
                    >
                      {e.daysOverdue}d
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      overdue · due {e.dueDate}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1.5">
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="text-[10px] bg-zinc-200 text-zinc-700">
                          {e.ownerInitials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium">{e.owner}</span>
                    </div>
                    <a
                      href={`https://remedy.bank.internal/crq/${e.crq}`}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-[11px] font-mono text-blue-600 hover:underline"
                    >
                      {e.crq}
                    </a>
                  </div>
                </div>

                <div className="mt-3 -mx-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between text-xs h-8 hover:bg-muted"
                  >
                    View detail
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
