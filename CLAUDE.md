# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (Next.js on port 3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint
```

No test suite is configured.

## Stack

- **Next.js 16 App Router** with React 19, TypeScript 5 (strict mode)
- **AG Grid Enterprise 32** + **AG Charts Enterprise 10** — primary data grid and heatmap
- **Recharts 2** — burndown line chart
- **Tailwind CSS v4** (PostCSS plugin, not the CLI)
- **shadcn/ui** over Radix UI primitives (`components/ui/`)
- **next-themes** for dark/light mode (class strategy)
- **react-hook-form + Zod** — wired up but not heavily used on the main dashboard

## Architecture

The app is a CIO-level **Vulnerability Remediation Executive Dashboard**. All data is currently static mock data; the AG Grid setup includes scaffolding for a Server-Side Row Model connecting to a .NET backend.

### Directory layout

```
app/
  page.tsx          # Main dashboard — "use client" client component
  layout.tsx        # Root layout: fonts, Vercel Analytics, ResizeObserver fix
components/
  ui/               # shadcn/Radix primitives (40+ components, do not edit by hand)
  executive/        # Dashboard-specific components (RiskPostureHero, SlaStrip, etc.)
  ag-grid/
    cell-renderers.tsx  # All custom AG Grid renderers (status, severity, CVE links, owners)
  resize-observer-fix.tsx  # Suppresses benign AG Grid ResizeObserver console error
lib/
  types.ts          # Core interfaces: Vulnerability (100+ fields), User, CioTeam
  mock-data.ts      # Vulnerability rows, teams, users
  executive-data.ts # KPI values, SLA stats, heatmap data, burndown series, top exposures
  ag-grid-setup.ts  # License key registration, enterprise module init, sort comparators
  utils.ts          # cn() class merger
```

### Component hierarchy (main page)

```
RootLayout (server)
└── ResizeObserverFix
    └── ExecutiveDashboard (client)
        ├── Header — scope selector, user avatar, refresh
        ├── RiskPostureHero — circular gauge + 4 KPI tiles
        ├── SlaStrip — SLA %, MTTR by severity, oldest critical alert
        ├── SeverityAgeHeatmap | BurndownChart (2-col grid)
        ├── TopExposures — 3 worst vulnerabilities
        └── AgGridVulnerabilityTable — full-width enterprise grid
```

### Key conventions

**All dashboard mock data lives in two files:** `lib/executive-data.ts` (chart/KPI data) and `lib/mock-data.ts` (vulnerability rows). Data must be deterministic (no `Math.random()`) to avoid SSR/hydration mismatches.

**AG Grid license keys** are read from `NEXT_PUBLIC_AG_GRID_LICENSE_KEY` and `NEXT_PUBLIC_AG_CHARTS_LICENSE_KEY` in `.env.local`. The `lib/ag-grid-setup.ts` module must be imported before any AG Grid component renders.

**Severity color palette** used across all components:
- Critical `#DC2626` · High `#EA580C` · Medium `#D97706` · Low `#65A30D` · Resolved `#16A34A`

**`next.config.mjs`** sets `typescript.ignoreBuildErrors: true` — the build will succeed even with TS errors. Fix errors anyway; don't rely on this flag.

**Path alias `@/`** resolves to the repo root (configured in `tsconfig.json`).
