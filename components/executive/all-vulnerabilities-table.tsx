"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronDown, ChevronRight, ArrowUpRight } from "lucide-react";
import { SEVERITY_COLORS, STATUS_COLORS, type Severity } from "@/lib/executive-data";

interface Row {
  cve: string;
  severity: Severity;
  title: string;
  hostname: string;
  status: keyof typeof STATUS_COLORS;
  daysOverdue: number; // negative => not overdue
  owner: string;
}

const ROWS: Row[] = [
  {
    cve: "CVE-2024-29847",
    severity: "Critical",
    title: "Buffer Overflow in Transaction Parsing",
    hostname: "pay-gw-prd-001.bank.internal",
    status: "Awaiting",
    daysOverdue: 82,
    owner: "David Kim",
  },
  {
    cve: "CVE-2024-38213",
    severity: "Critical",
    title: "Authentication RCE in Module",
    hostname: "auth-svc-prd-003.bank.internal",
    status: "In Progress",
    daysOverdue: 5,
    owner: "Maria Garcia",
  },
  {
    cve: "CVE-2024-31982",
    severity: "Critical",
    title: "Authentication Bypass via JWT",
    hostname: "risk-rpt-prd-001.bank.internal",
    status: "Awaiting",
    daysOverdue: 18,
    owner: "James Wilson",
  },
  {
    cve: "CVE-2024-42156",
    severity: "High",
    title: "SQL Injection in Search Functionality",
    hostname: "auth-svc-prd-003.bank.internal",
    status: "In Progress",
    daysOverdue: -3,
    owner: "Emily Johnson",
  },
  {
    cve: "CVE-2024-37085",
    severity: "Medium",
    title: "Path Traversal in File Upload",
    hostname: "doc-mgmt-prd-001.bank.internal",
    status: "Pending",
    daysOverdue: -1,
    owner: "Lisa Anderson",
  },
  {
    cve: "CVE-2024-35218",
    severity: "Medium",
    title: "Cross-Site Scripting in Message Rendering",
    hostname: "portal-web-prd-002.bank.internal",
    status: "Pending",
    daysOverdue: -2,
    owner: "Michael Brown",
  },
  {
    cve: "CVE-2024-23334",
    severity: "Medium",
    title: "SSRF in Report Generation Module",
    hostname: "compliance-rpt-prd-003.bank.internal",
    status: "Awaiting",
    daysOverdue: -14,
    owner: "Sarah Chen",
  },
  {
    cve: "CVE-2024-28995",
    severity: "Low",
    title: "Information Disclosure in Error Messages",
    hostname: "acct-mgmt-prd-002.bank.internal",
    status: "In Progress",
    daysOverdue: -30,
    owner: "Robert Taylor",
  },
  {
    cve: "CVE-2024-40711",
    severity: "High",
    title: "Insecure Deserialization in Session Handler",
    hostname: "mobile-api-prd-004.bank.internal",
    status: "In Progress",
    daysOverdue: -10,
    owner: "Jennifer Davis",
  },
  {
    cve: "CVE-2024-45519",
    severity: "Low",
    title: "Template Injection in Email Rendering",
    hostname: "email-notify-prd-002.bank.internal",
    status: "Resolved",
    daysOverdue: -45,
    owner: "Kevin Park",
  },
  {
    cve: "CVE-2025-21234",
    severity: "High",
    title: "Privilege Escalation via API Endpoint",
    hostname: "pay-proc-prd-006.bank.internal",
    status: "In Progress",
    daysOverdue: -7,
    owner: "Nancy Adams",
  },
  {
    cve: "CVE-2025-18765",
    severity: "Medium",
    title: "Improper Access Control in Customer Portal",
    hostname: "crm-app-prd-001.bank.internal",
    status: "Pending",
    daysOverdue: -21,
    owner: "Thomas Lee",
  },
];

export function AllVulnerabilitiesTable() {
  const [open, setOpen] = useState(false);

  return (
    <Card className="overflow-hidden">
      <Button
        variant="ghost"
        onClick={() => setOpen(!open)}
        className="w-full justify-between rounded-none px-5 py-4 h-auto hover:bg-muted/50"
      >
        <div className="flex items-center gap-2">
          {open ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-sm font-semibold">All Vulnerabilities</span>
          <Badge variant="secondary" className="ml-1 h-5 text-[11px]">
            {ROWS.length}
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground font-normal">
          {open ? "Hide" : "Show all"}
        </span>
      </Button>

      {open && (
        <div className="border-t border-border/60 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="text-[11px] uppercase tracking-wider font-medium h-9">
                  Severity
                </TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-medium h-9">
                  CVE
                </TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-medium h-9">
                  Title
                </TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-medium h-9">
                  Host
                </TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-medium h-9">
                  Status
                </TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-medium h-9 text-right">
                  Due
                </TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-medium h-9">
                  Owner
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ROWS.map((r) => {
                const sev = SEVERITY_COLORS[r.severity];
                const stat = STATUS_COLORS[r.status];
                const overdue = r.daysOverdue > 0;
                return (
                  <TableRow key={r.cve} className="text-sm hover:bg-muted/30">
                    <TableCell className="py-2.5">
                      <Badge
                        className="h-5 px-1.5 text-[10px] uppercase tracking-wider font-medium border-0"
                        style={{ backgroundColor: `${sev}15`, color: sev }}
                      >
                        {r.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2.5">
                      <a
                        href={`https://nvd.nist.gov/vuln/detail/${r.cve}`}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="font-mono text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
                      >
                        {r.cve}
                        <ArrowUpRight className="h-3 w-3" />
                      </a>
                    </TableCell>
                    <TableCell className="py-2.5 max-w-[280px] truncate">{r.title}</TableCell>
                    <TableCell className="py-2.5 font-mono text-xs text-muted-foreground max-w-[220px] truncate">
                      {r.hostname}
                    </TableCell>
                    <TableCell className="py-2.5">
                      <span
                        className="inline-flex items-center gap-1.5 text-xs font-medium"
                        style={{ color: stat }}
                      >
                        <span
                          className="inline-block h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: stat }}
                        />
                        {r.status}
                      </span>
                    </TableCell>
                    <TableCell className="py-2.5 text-right tabular-nums text-xs">
                      {overdue ? (
                        <span className="text-red-600 font-medium">{r.daysOverdue}d overdue</span>
                      ) : (
                        <span className="text-muted-foreground">in {Math.abs(r.daysOverdue)}d</span>
                      )}
                    </TableCell>
                    <TableCell className="py-2.5 text-xs">{r.owner}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
}
