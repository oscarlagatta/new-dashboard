// Per-disposition conditional-field rules — the single source of truth.
//
// Selecting a Disposition makes certain dependent fields visible AND required.
// Spec values drive the CIO ACTION/INFORM/REVIEW flow; legacy values preserve
// the original Fix/Defer/Mitigate/Accept Risk/False Positive UX.
//
// Consumed by the per-row triage form (detail-sheet) and the bulk-update
// toolbar (ag-grid-table) so both enforce the same rule.

import type { Disposition } from "./types";

/** Which conditional fields a Disposition reveals / requires. */
export interface DispositionFieldRules {
  patchWindow?: boolean;
  remediationDate?: boolean;
  crq?: boolean;
  blockers?: boolean;
  justification?: boolean;
  /** Shows the false-positive reason field — visibility only, not required. */
  falsePositive?: boolean;
}

export const dispositionFields: Record<Disposition, DispositionFieldRules> = {
  "CIO ACTION – Need Requested Patch Window": { patchWindow: true },
  "CIO ACTION – App Team will Remediate": { remediationDate: true, crq: true },
  "CIO ACTION – App Team identify blocker": { blockers: true },
  "CIO ACTION – Request Self-Service Package (Not Automatically Pushed by PCC)": { remediationDate: true, crq: true },
  "CIO INFORM – LLE force patch on Midweek at 10PM ET for AMRS (APAC 10AM ET, EMEA 8PM ET)": {},
  "CIO REVIEW – PCC will patch under established RMW": {},
  "NO IMMEDIATE ACTION – No Patch Available, waiting for patch": {},
  "NO IMMEDIATE ACTION – CTI AIT": {},
  "TEAM 1 ACTION – Baseline ESM-OS Remediation Team": {},
  // Legacy — preserve existing behaviour
  "Fix": { patchWindow: true, remediationDate: true },
  "Mitigate": { patchWindow: true, remediationDate: true },
  "Defer": { blockers: true, justification: true },
  "Accept Risk": { blockers: true, justification: true },
  "False Positive": { falsePositive: true },
  // Catch-all — its detail text is collected separately; no rule-gated fields.
  "Other (please provide detail)": {},
  "": {},
};
