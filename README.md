# Vulnerability Remediation Executive Dashboard

A CIO-level executive dashboard for tracking enterprise vulnerability remediation posture, SLA compliance, severity-aged exposures, and burndown progress.

## Stack

- **Next.js 16** (App Router) with **React 19** and **TypeScript 5** (strict mode)
- **AG Grid Enterprise 32** + **AG Charts Enterprise 10** — primary data grid and severity heatmap
- **Recharts 2** — burndown line chart
- **Tailwind CSS v4** (PostCSS plugin)
- **shadcn/ui** components built on **Radix UI** primitives
- **next-themes** for dark/light mode (class strategy)
- **react-hook-form** + **Zod** for form validation

## Getting started

Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

### Environment variables

AG Grid and AG Charts Enterprise license keys are read from `.env.local`:

```
NEXT_PUBLIC_AG_GRID_LICENSE_KEY=your-ag-grid-license
NEXT_PUBLIC_AG_CHARTS_LICENSE_KEY=your-ag-charts-license
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js dev server on port 3000 |
| `npm run build` | Production build |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |

No test suite is configured.

## Project structure

```
app/
  page.tsx              # Main dashboard (client component)
  layout.tsx            # Root layout: fonts, Vercel Analytics, ResizeObserver fix
components/
  ui/                   # shadcn/Radix primitives (do not edit by hand)
  executive/            # Dashboard-specific components (RiskPostureHero, SlaStrip, ...)
  ag-grid/
    cell-renderers.tsx  # Custom AG Grid renderers (status, severity, CVE, owners)
  resize-observer-fix.tsx
lib/
  types.ts              # Core interfaces (Vulnerability, User, CioTeam)
  mock-data.ts          # Vulnerability rows, teams, users
  executive-data.ts     # KPI values, SLA stats, heatmap, burndown, top exposures
  ag-grid-setup.ts      # License registration, enterprise modules, sort comparators
  utils.ts              # cn() class merger
```

### Component hierarchy

```
RootLayout
└── ResizeObserverFix
    └── ExecutiveDashboard
        ├── Header                  — scope selector, user avatar, refresh
        ├── RiskPostureHero         — circular gauge + 4 KPI tiles
        ├── SlaStrip                — SLA %, MTTR by severity, oldest critical alert
        ├── SeverityAgeHeatmap | BurndownChart  (two-column grid)
        ├── TopExposures            — three worst vulnerabilities
        └── AgGridVulnerabilityTable
```

## Conventions

- **Mock data lives in two files:** `lib/executive-data.ts` (charts/KPIs) and `lib/mock-data.ts` (vulnerability rows). Data must be deterministic — no `Math.random()` — to avoid SSR/hydration mismatches. The AG Grid setup includes scaffolding for a Server-Side Row Model that will connect to a .NET backend.
- **Severity color palette** used across all components:
  - Critical `#DC2626` · High `#EA580C` · Medium `#D97706` · Low `#65A30D` · Resolved `#16A34A`
- `next.config.mjs` sets `typescript.ignoreBuildErrors: true` — the build will succeed even with TS errors. Fix errors anyway; don't rely on this flag.
- The `@/` path alias resolves to the repo root (configured in `tsconfig.json`).
