// Lever scope — Jordan's authoritative option list.
//
// The dropdown's option values match the authoritative `Lever` field values
// on each finding so we can compare directly without an intermediate mapping.

import type { Lever } from "../types";

export type LeverScopeValue = "all" | Lever;

export const LEVER_SCOPE_ALL: LeverScopeValue = "all";

export interface LeverOption {
  value: Lever;
  label: string;
  description: string;
}

export const LEVER_OPTIONS: LeverOption[] = [
  {
    value: "CTI/APS&E/EET-Managed Remediation",
    label: "Lever 1 — CTI, APS&E or EET Managed",
    description: "CTO Initiated, Engage CIO if needed",
  },
  {
    value: "Assessment Underway",
    label: "Lever 2 — Assessment Underway",
    description:
      "New Titles without Responsibility Party Classification or Engagement Instructions",
  },
  {
    value: "CIO E2E",
    label: "Lever 3 — CIO Managed (E2E)",
    description: "CIO Initiated, drives testing in LLE and managed through Prod CRQs",
  },
  {
    value: "CIO/CTI Engagement",
    label: "Lever 4 — CIO / CTI or APS&E Engagement",
    description:
      "CIO Initiated, CTI remediates in LLE, Application dependent configuration level changes",
  },
];
