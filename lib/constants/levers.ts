// Lever scope — Jordan's authoritative option list.
//
// Data wiring (raw-value mapping, Unclassified handling, query integration) is
// intentionally NOT here yet — pending field-name confirmation from Roger and
// design decisions from Jordan. See docs/lever-scope-discovery.md.

export type LeverScopeValue =
  | "all"
  | "lever-1"
  | "lever-2"
  | "lever-3"
  | "lever-4";

export const LEVER_SCOPE_ALL: LeverScopeValue = "all";

export interface LeverOption {
  value: LeverScopeValue;
  label: string;
  description: string;
}

export const LEVER_OPTIONS: LeverOption[] = [
  {
    value: "lever-1",
    label: "Lever 1 — CTI, APS&E or EET Managed",
    description: "CTO Initiated, Engage CIO if needed",
  },
  {
    value: "lever-2",
    label: "Lever 2 — Assessment Underway",
    description:
      "New Titles without Responsibility Party Classification or Engagement Instructions",
  },
  {
    value: "lever-3",
    label: "Lever 3 — CIO Managed (E2E)",
    description: "CIO Initiated, drives testing in LLE and managed through Prod CRQs",
  },
  {
    value: "lever-4",
    label: "Lever 4 — CIO / CTI or APS&E Engagement",
    description:
      "CIO Initiated, CTI remediates in LLE, Application dependent configuration level changes",
  },
];
