// Public API of @my-org/feature-vulnerability-remediation.
//
// This is a NON-BUILDABLE Nx library: the host app's Webpack compiles src/
// directly. No CSS is shipped — the host's existing shadcn/ui-based Tailwind
// config already defines every color token the dashboard uses (--primary,
// --muted-foreground, --border, etc.), so no separate stylesheet is needed.
//
// Host usage:
//   import { configureDashboard, ExecutiveDashboard } from "@my-org/feature-vulnerability-remediation";
//   configureDashboard({ agGridLicenseKey: "...", agChartsLicenseKey: "..." });
//   <ExecutiveDashboard />
//
// AG Grid's own CSS is side-effect-imported by the table component; the host's
// Webpack CSS rule will process it automatically — no extra host setup needed.

export { configureDashboard } from "./lib/configure-dashboard";
export { ExecutiveDashboard } from "./lib/executive-dashboard";
export { ResizeObserverFix } from "./lib/resize-observer-fix";

export type {
  Vulnerability,
  TriageStatus,
  SeverityRisk,
  SourceStatus,
  Disposition,
  OperatingEnvironment,
  Workstream,
  Source,
  Blocker,
  User,
  CioTeam,
} from "./lib/lib/types";
