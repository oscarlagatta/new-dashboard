# @my-org/vuln-dashboard

A React library that ships the vulnerability remediation executive dashboard. Designed as a **non-buildable Nx library** consumed as TypeScript source by a host React app built with **Webpack 5**.

This directory mirrors `libs/vuln-dashboard/` in your Nx workspace. Drop `src/`, `package.json`, `project.json`, and `tsconfig.json` into place and you're done.

---

## Library shape

```
libs/vuln-dashboard/
├── package.json                 # name + version only (private, no main/module)
├── project.json                 # Nx project metadata (lint + test targets, NO build)
├── tsconfig.json                # extends workspace tsconfig.base.json
├── README.md                    # this file
├── scripts/
│   └── copy-sources.mjs         # re-sync from the original Next.js source
└── src/
    ├── index.ts                 # public API
    └── lib/
        ├── executive-dashboard.tsx   # top-level component
        ├── configure-dashboard.ts    # license-key setup (call once at host startup)
        ├── resize-observer-fix.tsx   # silences AG Grid's harmless ResizeObserver console error
        ├── components/               # all dashboard + shadcn primitives (verbatim from sandbox)
        ├── hooks/
        └── lib/                      # comparators, mocks, types, helpers, saved-views logic
```

**Zero CSS shipped.** The host already owns Tailwind v3 configuration, the shadcn color tokens (`primary`, `muted`, `border`, …), and the `:root` / `.dark` CSS variables. The dashboard's one extra base rule (`.src-dashboard * { border-color: var(--border); ... }`) is now injected at runtime via the component's existing `<style>` tag.

**Zero build step.** No Vite, no Rollup, no `dist/`. The host's Webpack 5 compiles `src/index.ts` along with the rest of the host's source.

---

## Wiring into your Nx workspace

### 1. Generate a non-buildable library scaffold

```bash
nx g @nx/react:library vuln-dashboard \
  --directory=libs/vuln-dashboard \
  --bundler=none \
  --unitTestRunner=jest \
  --linter=eslint \
  --importPath=@my-org/vuln-dashboard
```

`--bundler=none` is the critical flag — it skips Vite/Rollup config generation.

### 2. Copy the deliverable into place

```bash
rm -rf libs/vuln-dashboard/src
cp -r path/to/new-dashboard/library/src      libs/vuln-dashboard/src
cp     path/to/new-dashboard/library/scripts libs/vuln-dashboard/scripts -r
```

Keep the **Nx-generated** `package.json`, `project.json`, and `tsconfig.json` in `libs/vuln-dashboard/`. They're already wired into your workspace; the files in this directory are reference shapes only.

### 3. Workspace `tsconfig.base.json` path alias

Verify (or add) the path alias mapping for the importPath:

```jsonc
// tsconfig.base.json
{
  "compilerOptions": {
    "paths": {
      "@my-org/vuln-dashboard": ["libs/vuln-dashboard/src/index.ts"]
    }
  }
}
```

The `nx g` command in step 1 should have done this automatically — double-check that it landed.

### 4. Webpack 5 resolves the alias automatically

Standard Nx React workspaces use `@nx/webpack:webpack` (or `@nx/react:webpack`) which integrates `tsconfig-paths-webpack-plugin` under the hood — no manual webpack-config changes needed. If your host app uses a hand-rolled `webpack.config.js`, confirm it has:

```js
const { TsconfigPathsPlugin } = require('tsconfig-paths-webpack-plugin');

module.exports = {
  resolve: {
    plugins: [new TsconfigPathsPlugin({ configFile: 'tsconfig.base.json' })],
  },
};
```

### 5. Host Tailwind config — scan the library

Your host app's Tailwind v3 config needs to scan the library's source so utility classes used inside the library (`bg-primary`, `text-muted-foreground`, `border-border`, etc.) actually get emitted:

```ts
// apps/your-host/tailwind.config.ts
import { createGlobPatternsForDependencies } from '@nx/react/tailwind';
import { join } from 'node:path';

export default {
  content: [
    join(__dirname, 'src/**/*.{ts,tsx,html}'),
    // Auto-globs every Nx library this app depends on — picks up
    // libs/vuln-dashboard/src/**/*.{ts,tsx} without explicit listing.
    ...createGlobPatternsForDependencies(__dirname),
  ],
  // ...rest of your existing config: theme, plugins, etc.
};
```

If you don't use `createGlobPatternsForDependencies`, add the path explicitly:

```ts
content: [
  join(__dirname, 'src/**/*.{ts,tsx,html}'),
  'libs/vuln-dashboard/src/**/*.{ts,tsx}',
],
```

### 6. Add runtime dependencies to the workspace root `package.json`

These were in the sandbox's `package.json`. Merge them into your root `package.json`:

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

Most of these are likely already present if other apps in the workspace are shadcn-based.

### 7. Mount the dashboard in a host app

```tsx
// apps/console/src/main.tsx (or your existing entry point)
import { configureDashboard } from '@my-org/vuln-dashboard';

configureDashboard({
  agGridLicenseKey: process.env.NX_AG_GRID_LICENSE_KEY,
  agChartsLicenseKey: process.env.NX_AG_CHARTS_LICENSE_KEY,
});
```

```tsx
// any route component
import { ExecutiveDashboard, ResizeObserverFix } from '@my-org/vuln-dashboard';

export function DashboardRoute() {
  return (
    <div className="src-dashboard">
      <ResizeObserverFix />
      <ExecutiveDashboard />
    </div>
  );
}
```

**Notes**:

- `<ResizeObserverFix />` is optional. It silences the harmless `ResizeObserver loop completed with undelivered notifications` error AG Grid emits to the console. Mount it once anywhere in the tree.
- The `.src-dashboard` wrapper is required — it scopes the dashboard's keyframe animations and border defaults so they don't leak into the rest of your host app.
- No `import "@my-org/vuln-dashboard/styles.css"` is needed. The library doesn't ship a stylesheet. AG Grid's own CSS is side-effect-imported by the table component, so Webpack's CSS rule processes it automatically.

---

## Required host Webpack CSS rule

If your host already runs other shadcn-based apps, this is almost certainly in place. Otherwise verify the CSS rule handles `.css` imports from `node_modules` (needed for AG Grid):

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

`scripts/copy-sources.mjs` regenerates `src/lib/` from `../app/page.tsx` and the surrounding `components/`, `hooks/`, `lib/` directories of the parent Next.js sandbox. Run it whenever the sandbox is updated:

```bash
node libs/vuln-dashboard/scripts/copy-sources.mjs
```

The script:

- copies `components/`, `hooks/`, `lib/` into `src/lib/`
- renames `app/page.tsx` → `executive-dashboard.tsx` (`App` → `ExecutiveDashboard`)
- replaces the inline `var(--font-dm-sans)` style with a hint comment (font comes from host's `font-sans`)
- injects the `.src-dashboard *` border rule into the dashboard's `<style>` keyframes block
- rewrites `lib/ag-grid-setup.ts` to drop env-var license reads (comparators only)
- removes the side-effect import `import "@/lib/ag-grid-setup"` from `ag-grid-table.tsx`
- converts `<style jsx>` → `<style>` (one occurrence in `sla-strip.tsx`)
- strips every `"use client"` directive
- **converts every `@/foo/bar` import to a relative path** — required because the host's Webpack doesn't know about the library's internal alias
- removes six pre-existing dead-code legacy files that the dashboard never imported

Idempotent — overwrites the destination tree each run.

---

## How the public API is structured

```ts
// libs/vuln-dashboard/src/index.ts
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

If you need to expose more components (e.g. `<VulnerabilitiesPage />` as a standalone), add named exports here — they're available as inner functions in `executive-dashboard.tsx`.

---

## Verification checklist

1. **`nx lint vuln-dashboard`** — clean (or matches your workspace's normal warning level).
2. **`nx typecheck vuln-dashboard`** — no errors. The Nx React TypeScript plugin should pick up the library automatically.
3. **Host app dev server**: `nx serve console` — Webpack starts, no `Module not found` errors for relative imports inside the library.
4. **Browser smoke test**: navigate to the route mounting `<ExecutiveDashboard />`; confirm:
   - Header, sidebar, stat cards render with correct colors (shadcn tokens working).
   - AG Grid loads vulnerabilities with no license watermark (Saved Views toolbar visible).
   - Charts render without crashes.
   - Console clean of `process.env.NEXT_PUBLIC_*` warnings.
5. **Saved Views**: switch built-in views, create one custom view, reload — verify `localStorage` persists.
6. **Bundle inspect**: confirm no `_next/` paths, no `next/` runtime, no `@vercel/analytics` script in the host's production bundle.

---

## What was removed from the original Next.js project

| Removed | Why |
|---|---|
| `app/layout.tsx`, `app/page.tsx`, `app/globals.css` | Next-specific. Layout and globals are now host responsibility. |
| `next.config.mjs`, `next-env.d.ts` | Next-specific. |
| `@vercel/analytics` | Vercel-specific. Host can add its own analytics. |
| `next/font/google` imports | Font handled by host's existing Tailwind `font-sans` utility. |
| `process.env.NEXT_PUBLIC_*` reads | License keys now come through `configureDashboard()`. |
| `"use client"` directives | Harmless in plain React, removed for cleanliness. |
| Internal `@/foo/bar` aliases | Converted to relative imports for Webpack compatibility. |
| 6 dead-code legacy components | They had stale TS errors and were never imported. |

## What stayed unchanged

| Kept | Why |
|---|---|
| All shadcn/ui components | Pure Radix UI — framework-agnostic. |
| `next-themes` (the package) | Despite the name, it works in any React app. |
| AG Grid table, cell renderers, Saved Views | Pure React. |
| Recharts charts | Pure React. |
| All mock data | Deterministic — no `Math.random()` or live timestamps. |
