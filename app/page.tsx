"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { RefreshCw, ShieldCheck } from "lucide-react";

import { RiskPostureHero } from "@/components/executive/risk-posture-hero";
import { SlaStrip } from "@/components/executive/sla-strip";
import { SeverityAgeHeatmap } from "@/components/executive/severity-age-heatmap";
import { BurndownChart } from "@/components/executive/burndown-chart";
import { TopExposures } from "@/components/executive/top-exposures";
import { AllVulnerabilitiesTable } from "@/components/executive/all-vulnerabilities-table";
import { SCOPES, RISK_POSTURE } from "@/lib/executive-data";

export default function ExecutiveDashboard() {
  const [scope, setScope] = useState(SCOPES[0]);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  return (
    <main className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b border-border/60">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-9 w-9 rounded-md bg-zinc-900 text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold tracking-tight leading-none">
                Vulnerability Remediation
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                Executive posture, SLA tracking, and exposure overview
              </p>
            </div>
            <div className="hidden md:block ml-3">
              <Select value={scope} onValueChange={setScope}>
                <SelectTrigger className="h-9 text-sm font-medium border-border/60 min-w-[260px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCOPES.map((s) => (
                    <SelectItem key={s} value={s} className="text-sm">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-[10px] bg-zinc-200 text-zinc-700">
                  SC
                </AvatarFallback>
              </Avatar>
              <div className="leading-tight">
                <div className="text-foreground font-medium">
                  Last attested by {RISK_POSTURE.attestedBy}
                </div>
                <div>{RISK_POSTURE.attestedAgo}</div>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="h-9 gap-2"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* 1. Risk posture hero */}
        <RiskPostureHero />

        {/* 2. SLA strip */}
        <SlaStrip />

        {/* 3. Two charts side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="min-h-[340px]">
            <SeverityAgeHeatmap />
          </div>
          <div className="min-h-[340px]">
            <BurndownChart />
          </div>
        </div>

        {/* 4. Top critical exposures */}
        <TopExposures />

        {/* 5. Collapsed table */}
        <AllVulnerabilitiesTable />

        <div className="text-[11px] text-muted-foreground pt-2 pb-6 text-center">
          Data refreshed every 15 minutes from Qualys, BMC Remedy, and the asset
          inventory of record. For triage detail and bulk actions, switch to the analyst view.
        </div>
      </div>
    </main>
  );
}
