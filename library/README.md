# @my-org/feature-vulnerability-remediation

A React feature library that ships the vulnerability remediation executive dashboard. Designed as a **non-buildable Nx feature library** consumed as TypeScript source by the **`bps-hub`** application inside the **`bpsappreact`** Nx workspace, built with **Webpack 5**.

This directory mirrors `libs/vulnerability-management/features/feature-vulnerability-remediation/` in your Nx workspace. Drop `src/`, `package.json`, `project.json`, and `tsconfig.json` into place and you're done.

> **Domain folder**: I used `vulnerability-management` as the domain under `libs/`. This is where sibling libraries (`ui`, `hooks`, `utils`, `presenters`) will live when extracted later. For now, this feature is self-contained — it ships its own copy of shadcn/ui primitives, hooks, and helpers inside `src/lib/`.

---

## Where this library lives

```
bpsappreact/                                                ← Nx workspace root
├── apps/
│   └── bps-hub/                                            ← existing host app; will add a route mounting <ExecutiveDashboard />
└── libs/
    └── vulnerability-management/                           ← domain folder
        └── features/
            └── feature-vulnerability-remediation/          ← THIS library
                ├── package.json                            # name + version only (private)
                ├── project.json                            # Nx metadata: lint + test, NO build
                ├── tsconfig.json                           # extends workspace tsconfig.base.json
                ├── README.md                               # this file
                ├── scripts/
                │   └── copy-sources.mjs                    # re-sync from the original Next.js source
                └── src/
                    ├── index.ts                            # public API
                    └── lib/
                        ├── executive-dashboard.tsx         # top-level component
                        ├── configure-dashboard.ts          # license-key setup (call once at host startup)
                        ├── resize-observer-fix.tsx
                        ├── components/                     # dashboard + shadcn primitives
                        ├── hooks/
                        └── lib/                            # comparators, mocks, types, helpers, saved-views
```

**Zero CSS shipped.** `bps-hub` already owns Tailwind v3, the shadcn color tokens (`primary`, `muted`, `border`, …), and the `:root` / `.dark` CSS variables. The one dashboard-specific base rule (`.src-dashboard * { border-color: var(--border); … }`) is injected at runtime via the component's `<style>` tag.

**Zero build step.** No Vite, no Rollup, no `dist/`. The host's Webpack 5 compiles `src/index.ts` along with the rest of the host's source.

**Self-contained for now.** Until sibling libs (`libs/vulnerability-management/ui/`, `.../hooks/`, `.../utils/`) are extracted, all dependencies live inside this feature's `src/lib/`. When you extract them, rewrite the relative imports in this feature to import from `@my-org/vulnerability-management-ui`, `@my-org/vulnerability-management-hooks`, etc.

---

## Wiring into your Nx workspace

### 1. Generate the feature library

```bash
nx g @nx/react:library feature-vulnerability-remediation \
  --directory=libs/vulnerability-management/features/feature-vulnerability-remediation \
  --bundler=none \
  --unitTestRunner=jest \
  --linter=eslint \
  --tags="scope:vulnerability-management,type:feature" \
  --importPath=@my-org/feature-vulnerability-remediation
```

`--bundler=none` is the critical flag — it skips Vite/Rollup config generation so the host's Webpack owns compilation.

### 2. Copy the deliverable into place

```bash
rm -rf libs/vulnerability-management/features/feature-vulnerability-remediation/src
cp -r path/to/new-dashboard/library/src     libs/vulnerability-management/features/feature-vulnerability-remediation/src
cp -r path/to/new-dashboard/library/scripts libs/vulnerability-management/features/feature-vulnerability-remediation/scripts
```

Keep the **Nx-generated** `package.json`, `project.json`, and `tsconfig.json`. The matching files in this directory are reference shapes only — refer to them when adjusting the generated versions.

### 3. Workspace `tsconfig.base.json` path alias

Verify (the generator should have done this; if not, add it):

```jsonc
// tsconfig.base.json (workspace root)
{
  "compilerOptions": {
    "paths": {
      "@my-org/feature-vulnerability-remediation": [
        "libs/vulnerability-management/features/feature-vulnerability-remediation/src/index.ts"
      ]
    }
  }
}
```

### 4. Webpack 5 resolves the alias automatically

Standard Nx React workspaces use `@nx/webpack:webpack` (or `@nx/react:webpack`), which integrates `tsconfig-paths-webpack-plugin` under the hood — **no manual webpack-config changes**. If `bps-hub` uses a hand-rolled `webpack.config.js`, confirm it has:

```js
const { TsconfigPathsPlugin } = require('tsconfig-paths-webpack-plugin');

module.exports = {
  resolve: {
    plugins: [new TsconfigPathsPlugin({ configFile: 'tsconfig.base.json' })],
  },
};
```

### 5. Host Tailwind config — scan the feature

`apps/bps-hub`'s Tailwind v3 config needs to scan this library's source so utility classes used inside (`bg-primary`, `text-muted-foreground`, `border-border`, etc.) get emitted into the host's CSS bundle:

```ts
// apps/bps-hub/tailwind.config.ts
import { createGlobPatternsForDependencies } from '@nx/react/tailwind';
import { join } from 'node:path';

export default {
  content: [
    join(__dirname, 'src/**/*.{ts,tsx,html}'),
    // Auto-globs every Nx library this app depends on — picks up
    // libs/vulnerability-management/features/feature-vulnerability-remediation/src/**/*.{ts,tsx}
    // without needing an explicit entry.
    ...createGlobPatternsForDependencies(__dirname),
  ],
  // ...rest of your existing config: theme, plugins, etc.
};
```

If you don't use `createGlobPatternsForDependencies`, add the path explicitly:

```ts
content: [
  join(__dirname, 'src/**/*.{ts,tsx,html}'),
  'libs/vulnerability-management/features/feature-vulnerability-remediation/src/**/*.{ts,tsx}',
],
```

### 6. Add runtime dependencies to the workspace root `package.json`

Merge these into the `bpsappreact` root `package.json`. Most are likely already there if other apps in the workspace are shadcn-based.

```jsonc
{
  "dependencies": {
    "@hookform/resolvers": "^3.9.1",
    "@radix-ui/react-accordion": "1.2.12",
    "@radix-ui/react-alert-dialog": "1.1.15",
    "@radix-ui/react-aspect-ratio": "1.1.8",
    "@radix-ui/react-avatar": "1.1.11",
    "@radix-ui/react-checkbox": "1.3.3",
    "@radix-ui/react-collapsible": "1.1.12",
    "@radix-ui/react-context-menu": "2.2.16",
    "@radix-ui/react-dialog": "1.1.15",
    "@radix-ui/react-dropdown-menu": "2.1.16",
    "@radix-ui/react-hover-card": "1.1.15",
    "@radix-ui/react-label": "2.1.8",
    "@radix-ui/react-menubar": "1.1.16",
    "@radix-ui/react-navigation-menu": "1.2.14",
    "@radix-ui/react-popover": "1.1.15",
    "@radix-ui/react-progress": "1.1.8",
    "@radix-ui/react-radio-group": "1.3.8",
    "@radix-ui/react-scroll-area": "1.2.10",
    "@radix-ui/react-select": "2.2.6",
    "@radix-ui/react-separator": "1.1.8",
    "@radix-ui/react-slider": "1.3.6",
    "@radix-ui/react-slot": "1.2.4",
    "@radix-ui/react-switch": "1.2.6",
    "@radix-ui/react-tabs": "1.1.13",
    "@radix-ui/react-toast": "1.2.15",
    "@radix-ui/react-toggle": "1.1.10",
    "@radix-ui/react-toggle-group": "1.1.11",
    "@radix-ui/react-tooltip": "1.2.8",
    "ag-grid-community": "^32.3.0",
    "ag-grid-enterprise": "^32.3.0",
    "ag-grid-react": "^32.3.0",
    "ag-charts-enterprise": "^10.0.0",
    "ag-charts-react": "^10.0.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "1.1.1",
    "date-fns": "4.1.0",
    "embla-carousel-react": "8.6.0",
    "input-otp": "1.4.2",
    "lucide-react": "^0.564.0",
    "next-themes": "^0.4.6",
    "react-day-picker": "9.13.2",
    "react-hook-form": "^7.54.1",
    "react-resizable-panels": "^2.1.7",
    "recharts": "2.15.0",
    "sonner": "^1.7.1",
    "tailwind-merge": "^3.3.1",
    "vaul": "^1.1.2",
    "zod": "^3.24.1"
  }
}
```

### 7. Mount the dashboard in `bps-hub`

```tsx
// apps/bps-hub/src/main.tsx (or existing entry point)
import { configureDashboard } from '@my-org/feature-vulnerability-remediation';

configureDashboard({
  agGridLicenseKey: process.env.NX_AG_GRID_LICENSE_KEY,
  agChartsLicenseKey: process.env.NX_AG_CHARTS_LICENSE_KEY,
});
```

```tsx
// the route that handles the vulnerability remediation page in bps-hub's router
import {
  ExecutiveDashboard,
  ResizeObserverFix,
} from '@my-org/feature-vulnerability-remediation';

export function VulnerabilityRemediationRoute() {
  return (
    <div className="src-dashboard">
      <ResizeObserverFix />
      <ExecutiveDashboard />
    </div>
  );
}
```

**Notes**:

- `<ResizeObserverFix />` is optional — it silences the harmless `ResizeObserver loop completed with undelivered notifications` error AG Grid emits to the console. Mount it once anywhere in the tree.
- The `.src-dashboard` wrapper is **required** — it scopes the dashboard's keyframe animations and border defaults so they don't leak into the rest of `bps-hub`.
- No `import` of any CSS file from this library is needed. AG Grid's own CSS is side-effect-imported by the table component, so Webpack's CSS rule processes it automatically.

---

## Required host Webpack CSS rule

If other shadcn-based apps already build in this workspace, this is in place. Otherwise verify `bps-hub`'s CSS rule handles `.css` imports from `node_modules` (needed for AG Grid):

```js
// webpack.config.js (rule snippet)
{
  test: /\.css$/,
  use: ['style-loader', 'css-loader', 'postcss-loader'],
},
```

`postcss-loader` should reference your host's `postcss.config.js`, which runs `tailwindcss` and `autoprefixer`.

---

## Re-syncing from the original Next.js source

`scripts/copy-sources.mjs` regenerates `src/lib/` from the parent Next.js sandbox (`app/page.tsx` plus surrounding `components/`, `hooks/`, `lib/`). Run it whenever the sandbox is updated:

```bash
node libs/vulnerability-management/features/feature-vulnerability-remediation/scripts/copy-sources.mjs
```

The script:

- copies `components/`, `hooks/`, `lib/` into `src/lib/`
- renames `app/page.tsx` → `executive-dashboard.tsx` (`App` → `ExecutiveDashboard`)
- replaces the inline `var(--font-dm-sans)` style with a hint comment
- injects the `.src-dashboard *` border rule into the dashboard's `<style>` keyframes block
- rewrites `lib/ag-grid-setup.ts` to drop env-var license reads (comparators only)
- removes the side-effect import `import "@/lib/ag-grid-setup"` from `ag-grid-table.tsx`
- converts `<style jsx>` → `<style>` (one occurrence in `sla-strip.tsx`)
- strips every `"use client"` directive
- **converts every `@/foo/bar` import to a relative path** — required because the host's Webpack doesn't know about the library's internal alias
- removes six pre-existing dead-code legacy files

Idempotent — overwrites the destination tree each run.

---

## Public API

```ts
// src/index.ts
export { configureDashboard } from './lib/configure-dashboard';
export { ExecutiveDashboard }  from './lib/executive-dashboard';
export { ResizeObserverFix }   from './lib/resize-observer-fix';

export type {
  Vulnerability,
  TriageStatus,
  SeverityRisk,
  /* ...etc */
} from './lib/lib/types';
```

If you need to expose more components (e.g. `<VulnerabilitiesPage />` as a standalone export), add named exports here — they're available as inner functions in `executive-dashboard.tsx`.

---

## Verification checklist

1. **`nx lint feature-vulnerability-remediation`** — clean (or matches workspace's normal warning level).
2. **`nx typecheck feature-vulnerability-remediation`** — no errors.
3. **`bps-hub` dev server** (`nx serve bps-hub`) — Webpack starts, no `Module not found` errors for relative imports inside the library.
4. **Browser smoke test**: navigate to the route mounting `<ExecutiveDashboard />`; confirm:
   - Header, sidebar, stat cards render with correct colors (shadcn tokens working).
   - AG Grid loads vulnerabilities with no license watermark; Saved Views toolbar visible.
   - Charts render without crashes.
   - Console clean of `process.env.NEXT_PUBLIC_*` warnings.
5. **Saved Views**: switch built-in views, create one custom view, reload — verify `localStorage` persists.
6. **Bundle inspect**: no `_next/` paths, no `next/` runtime, no `@vercel/analytics` script.

---

## Roadmap: extracting sibling libraries

Once a second feature joins `libs/vulnerability-management/`, plan these extractions to stop duplicating code:

| Today (inside this feature) | Tomorrow (sibling lib) | Import path |
|---|---|---|
| `src/lib/components/ui/` (shadcn primitives) | `libs/vulnerability-management/ui/` | `@my-org/vulnerability-management-ui` |
| `src/lib/hooks/` | `libs/vulnerability-management/hooks/` | `@my-org/vulnerability-management-hooks` |
| `src/lib/lib/utils.ts` + `use-viewport.ts` | `libs/vulnerability-management/utils/` | `@my-org/vulnerability-management-utils` |
| `src/lib/lib/types.ts` | `libs/vulnerability-management/types/` | `@my-org/vulnerability-management-types` |
| `src/lib/lib/mock-data.ts` + `executive-data.ts` | `libs/vulnerability-management/data-access-mock/` | `@my-org/vulnerability-management-data-access-mock` |

When you extract, the feature's relative imports (`../ui/button`, `../../lib/utils`) become package imports — find-and-replace inside `src/lib/`.

---

## What was removed from the original Next.js project

| Removed | Why |
|---|---|
| `app/layout.tsx`, `app/page.tsx`, `app/globals.css` | Next-specific. Layout + globals are `bps-hub`'s responsibility. |
| `next.config.mjs`, `next-env.d.ts` | Next-specific. |
| `@vercel/analytics` | Vercel-specific. `bps-hub` adds its own analytics if needed. |
| `next/font/google` imports | Font handled by host's existing Tailwind `font-sans` utility. |
| `process.env.NEXT_PUBLIC_*` reads | License keys now flow through `configureDashboard()`. |
| `"use client"` directives | Harmless in plain React, removed for cleanliness. |
| Internal `@/foo/bar` aliases | Converted to relative imports for Webpack compatibility. |
| 6 dead-code legacy components | Had stale TS errors and were never imported. |

## What stayed unchanged

| Kept | Why |
|---|---|
| All shadcn/ui components | Pure Radix UI — framework-agnostic. |
| `next-themes` package | Despite the name, it works in any React app. |
| AG Grid table, cell renderers, Saved Views | Pure React. |
| Recharts charts | Pure React. |
| All mock data | Deterministic — no `Math.random()` or live timestamps. |
