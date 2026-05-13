# Findings Remediation → `@bofa/feature-findings-remediation` migration plan

Manual lift-and-shift of this Next.js demo into an existing Nx monorepo as a non-buildable client-side React feature library. Optimized for fast, safe, same-day delivery.

---

## Target

| Item | Value |
|---|---|
| Workspace scope | `@bofa` |
| Host app | `apps/bps-hub` (owns Tailwind, shadcn/ui, global CSS, central router) |
| Library path | `libs/bps-findings-management/features/feature-findings-remediation/` |
| Library name | `feature-findings-remediation` |
| Import path | `@bofa/feature-findings-remediation` |
| Bundler | `none` (non-buildable; host compiles `src/` directly) |
| Linter | ESLint |
| Test runner | Vitest + React Testing Library |
| Tags | `scope:findings-management`, `type:feature` |

### Naming policy for today

**No internal renames.** The "Findings" terminology applies only to the names listed above (domain folder, lib name, import path, tags). Everything inside `src/lib/` keeps the demo's original identifiers on paste:

- `Vulnerability` interface, `mockVulnerabilities`, `CIO_TEAMS`, `TriageStatus`, `Disposition` — unchanged
- File names: `vulnerability-card.tsx`, `vulnerability-table.tsx`, `detail-sheet.tsx`, `ag-grid-table.tsx`, etc. — unchanged
- Folder names: `components/executive/`, `components/vulnerability/`, `components/dashboard/`, `components/ag-grid/` — unchanged
- Page default export: keep as `App` and re-export as `FindingsRemediationPage` from `src/index.ts`

The full identifier rename ("Vulnerability" → "Finding" where generic) is a follow-up PR.

---

## Code organization principle

Files inside `src/lib/` are organized by concern with each folder self-contained and exporting through its own local `index.ts`. Dependency direction is one-way:

```
pages → components → hooks → api → utils → types
                                     ↘ constants
```

Goal: any folder (shared hooks, utils, types) can be extracted into a separate utility library (`util-*`, `data-access-*`, `ui-*`) later with a folder relocation and minimal import rewiring.

---

## What was confirmed by inspecting the source

| Concern | Status |
|---|---|
| `next/link`, `next/image`, `next/router`, `next/navigation` | **None present** — no react-router-dom rewrites needed |
| `getServerSideProps` / `getStaticProps` / `pages/api/*` | **None** |
| `'use client'` directives | Present in ~30 files — delete on paste |
| `next/font/google` | Only in `app/layout.tsx` (DM Sans → CSS var `--font-dm-sans`, referenced once in `app/page.tsx`) |
| `process.env.NEXT_PUBLIC_*` | Only `NEXT_PUBLIC_AG_GRID_LICENSE_KEY` / `NEXT_PUBLIC_AG_CHARTS_LICENSE_KEY` in `lib/ag-grid-setup.ts` |
| `@vercel/analytics/next` | Only in `app/layout.tsx` — drop |
| `@/...` path-alias usages | 358 occurrences across 106 files |
| Inline `<style>{KEYFRAMES}</style>` in `page.tsx` | Already scoped via `.src-dashboard` — **keep as-is**, no library CSS file needed |
| Internal "routing" | Just a `currentPage` state in `page.tsx` switching between Dashboard/Vulnerabilities — no router |

This is a much simpler migration than a generic Next.js → Vite cheatsheet suggests.

---

## Verify in the host before starting (5 minutes)

Kill these unknowns before paste begins.

1. **shadcn primitives import path** — where does `bps-hub` keep its shadcn? Likely `@bofa/ui` or similar. Whatever it is, that's what every `@/components/ui/*` import in the demo rewrites to. If no shared shadcn lib exists yet: vendor a copy into `src/lib/ui/` inside the feature lib for today and extract later. **Do not** relative-import from `apps/bps-hub/src/components/ui/*` (cross-app coupling, breaks Nx boundaries).
2. **`cn()` location** — `@bofa/ui/utils` or similar? Otherwise the demo's `lib/utils.ts` `cn` moves to `src/lib/utils/cn.ts`.
3. **Host bundler** — Vite (`import.meta.env.VITE_*`) or Webpack/Next.js (`process.env.*`)? Decides the env-var transform.
4. **Tailwind version on host** — confirm v3. The demo's `globals.css` uses v4-only syntax that we drop entirely.
5. **Host already mounts `<Toaster />` and a `next-themes` `ThemeProvider`?** If yes, don't re-mount inside the feature page; drop `components/theme-provider.tsx` entirely.
6. **Shared `useViewport`-style hook in host?** Prefer it if it exists; otherwise migrate `lib/use-viewport.ts` into `src/lib/hooks/`.

---

## Phase 1 — Setup

```bash
nx g @nx/react:library feature-findings-remediation \
  --directory=libs/bps-findings-management/features/feature-findings-remediation \
  --bundler=none \
  --linter=eslint \
  --unitTestRunner=vitest \
  --tags="scope:findings-management,type:feature"
```

Verify (in order):

- `libs/bps-findings-management/features/feature-findings-remediation/project.json` — tags applied; no `build` target; only `lint` and `test`
- `libs/.../tsconfig.lib.json` — `"jsx": "react-jsx"`, `"types": ["vitest/globals"]`
- `libs/.../vite.config.ts` — exists for Vitest only (not build)
- `tsconfig.base.json` — has `"@bofa/feature-findings-remediation": ["libs/bps-findings-management/features/feature-findings-remediation/src/index.ts"]`
- `apps/bps-hub/tailwind.config.{ts,js}` — add to `content`:
  ```js
  'libs/bps-findings-management/features/feature-findings-remediation/src/**/*.{ts,tsx}'
  ```
- `nx.json` — confirm `enforceModuleBoundaries` accepts the new tags (if other features use `scope:*` tags already, your tag is allowed by the same wildcard rule)

Create the skeleton — each folder gets its own `index.ts` barrel:

```
src/
  index.ts                          # top-level barrel — page + a couple of types
  lib/
    types/index.ts
    constants/index.ts
    utils/index.ts
    api/index.ts
    hooks/index.ts
    components/index.ts
    pages/index.ts
    ui/                              # only if vendoring shadcn primitives
      index.ts
```

---

## Phase 2 — Copy-paste order

Pasted bottom-up so every file's imports are already resolvable when you save it. After each folder, update its `index.ts`.

### Rule for the whole phase

**Literal moves only.** Every file moves with its content verbatim. No identifier renames, no splitting one file into two, no merging files, no API redesigns. The only "new" file in Phase 2 is `src/lib/api/saved-views.ts`, and its functions keep the original names from the source. If you find yourself wanting to rename or restructure something, stop — that belongs in a follow-up PR, not this one.

### 2.1 `types/` (no React, no I/O)

| Source | → | Destination | Notes |
|---|---|---|---|
| `lib/types.ts` | → | `src/lib/types/types.ts` | Move whole, content unchanged |

`src/lib/types/index.ts` re-exports everything from `./types`. Do not split the file. The `SavedView` interface stays where it currently lives (in `lib/saved-views.ts`); it does not move into `types/`.

### 2.2 `constants/` (static data, no React)

| Source | → | Destination | Notes |
|---|---|---|---|
| `lib/executive-data.ts` | → | `src/lib/constants/executive-data.ts` | Move whole |
| `lib/mock-data.ts` | → | `src/lib/constants/mock-data.ts` | Move whole |
| `lib/dashboard-settings.ts` | → | `src/lib/constants/dashboard-settings.ts` | Move whole |
| `lib/filter-presets.ts` | → | `src/lib/constants/filter-presets.ts` | Move whole |

`lib/saved-views.ts` is **not** split across folders — see 2.3.

### 2.3 `utils/` (pure functions, no React, no DOM)

| Source | → | Destination | Notes |
|---|---|---|---|
| `lib/utils.ts` | → | `src/lib/utils/utils.ts` | Move whole, keep both `cn` and `formatCount` together |
| `lib/saved-views.ts` | → | `src/lib/utils/saved-views.ts` | Move whole — interface, constants, factory function, and pure helpers all together. Untouched. |
| `lib/ag-grid-console-filter.ts` | → | `src/lib/utils/ag-grid-console-filter.ts` | Move whole |
| `lib/ag-grid-setup.ts` | → | `src/lib/utils/ag-grid-setup.ts` | Move whole; the only edit is the env-var transform (Phase 3) |

`src/lib/utils/index.ts` re-exports from each of the above. Even if the host ships its own `cn`, keep this library's `cn` as-is. Deduping `cn` is a follow-up PR, not this migration.

### 2.4 `api/` (I/O — fetch/localStorage; the future data-access lib)

Cut these three functions from `hooks/use-saved-views.ts` (lines 53–82 in the source) and paste them into a new file `src/lib/api/saved-views.ts`, with their original names and original signatures:

| Source identifier | Destination | Action |
|---|---|---|
| `function loadFromStorage(): { views: SavedView[]; currentId: string | null }` (lines 53–63) | `src/lib/api/saved-views.ts` | Cut and paste verbatim; add `export` |
| `function saveToStorage(views: SavedView[]): void` (lines 65–72) | `src/lib/api/saved-views.ts` | Cut and paste verbatim; add `export` |
| `function saveCurrentIdToStorage(id: string | null): void` (lines 74–82) | `src/lib/api/saved-views.ts` | Cut and paste verbatim; add `export` |

In the hook (Phase 2.5), replace the three local function definitions with:

```ts
import {
  loadFromStorage,
  saveToStorage,
  saveCurrentIdToStorage,
} from "../api/saved-views";
```

All hook call sites already use those exact names, so no further edits in the hook body. The two `STORAGE_KEY_*` constants and the `SavedView` type that these functions reference are imported from `../utils/saved-views` (their home after Phase 2.3) — same module path the source already uses, just relocated.

No renames. No new functions. No combined-loader split.

### 2.5 `hooks/`

| Source | → | Destination | Notes |
|---|---|---|---|
| `lib/use-viewport.ts` | → | `src/lib/hooks/use-viewport.ts` | Move whole; delete `'use client'` line |
| `hooks/use-saved-views.ts` | → | `src/lib/hooks/use-saved-views.ts` | Move whole; delete `'use client'` line; delete the three local function definitions (now imported from `../api/saved-views` per 2.4); update the `from "@/lib/saved-views"` import to `from "../utils/saved-views"` |
| `hooks/use-toast.ts` | → | drop if host has toast plumbing; otherwise `src/lib/hooks/use-toast.ts` | Move whole if kept |
| `hooks/use-mobile.ts` | → | unused on dashboard pages (only by `components/ui/sidebar.tsx` shadcn primitive); skip if not vendoring that primitive | — |

### 2.6 `components/` (leaves first, then composites)

Leaves (no internal deps beyond types/utils/constants):

- `components/resize-observer-fix.tsx`
- `components/executive/risk-gauge.tsx`
- `components/executive/kpi-tile.tsx`
- `components/executive/compact-stat-card.tsx`
- `components/executive/dashboard-stat-card.tsx`
- `components/executive/ranked-list/ranked-list-item.tsx` + `ranked-list-card.tsx` + `index.ts`
- `components/executive/user-guide-sheet.tsx` — header `?` button → right-side guide; see Phase 7
- `components/vulnerability/status-badge.tsx`
- `components/ag-grid/cell-renderers.tsx`

Mid-level (depend on leaves):

- `components/executive/no-remediation-date-card.tsx`
- `components/executive/awaiting-scan-card.tsx`
- `components/executive/risk-accepted-card.tsx`
- `components/executive/action-required-panel.tsx`
- `components/executive/vulnerability-card.tsx`
- `components/executive/sla-strip.tsx`
- `components/executive/top-exposures.tsx`
- `components/executive/top-unresolved-vulnerabilities.tsx`
- `components/executive/eol-exposures.tsx`
- `components/executive/severity-age-heatmap.tsx`
- `components/executive/severity-source-chart.tsx`
- `components/executive/burndown-chart.tsx`
- `components/executive/risk-posture-hero.tsx`
- `components/dashboard/charts.tsx`
- `components/dashboard/blockers-strip.tsx`
- `components/vulnerability/{filter-popover,export-dialog,saved-views-toolbar,severity-status-chart,stat-cards,charts-panel}.tsx`
- `components/vulnerability/detail-sheet.tsx`

Largest composite (paste **last** — imports 19 modules):

- `components/executive/ag-grid-table.tsx`

**Skip entirely:**

- `components/ui/*` — all 52 shadcn files (import from host or vendor into `src/lib/ui/`)
- `components/theme-provider.tsx` — host owns next-themes
- `app/layout.tsx` — host owns layout
- `app/globals.css` — host owns Tailwind + theme

### 2.7 `pages/`

- `app/page.tsx` (1751 lines, default export `function App()`) → `src/lib/pages/page.tsx`. **Source identifier stays `App` — do not rename inside the file.** Keep it monolithic on first paste; do not split. Keep the `<style>{KEYFRAMES}</style>` block and `.src-dashboard` wrapper className — that's the library's CSS isolation.

### 2.8 Barrel exports

- Per-folder `index.ts`: re-export only what crosses the folder boundary, using the original identifier names.
- Top-level `src/index.ts`: the only library-public name allowed is `FindingsRemediationPage` (this is part of "naming the library" — the public symbol of the lib). Write it as a barrel-only alias of the unchanged source default export:
  ```ts
  export { default as FindingsRemediationPage } from "./lib/pages/page";
  ```
  The `App` function in `page.tsx` stays `App`.

### 2.9 Wire into bps-hub

In the host's central routing file, add a route mounting `<FindingsRemediationPage />` from `@bofa/feature-findings-remediation`. Follow the existing pattern verbatim — no new routing setup.

---

## Phase 3 — Transformations that actually apply here

Skip the cheatsheet rows for things this codebase doesn't use. The full transform list:

| Find | Replace | Where it appears |
|---|---|---|
| `'use client';` (and `"use client";`) line at top of file | delete the line | ~30 files |
| `@/components/ui/<x>` | host shadcn path (e.g. `@bofa/ui`) or `../ui/<x>` if vendored | wide |
| `@/components/<x>` | relative path inside `src/lib/components/...` | wide |
| `@/lib/types` | `../types` (or alias via tsconfig) | many |
| `@/lib/utils` | `../utils/utils` | many |
| `@/lib/executive-data` | `../constants/executive-data` | many |
| `@/lib/mock-data` | `../constants/mock-data` | many |
| `@/lib/dashboard-settings` | `../constants/dashboard-settings` | many |
| `@/lib/filter-presets` | `../constants/filter-presets` | many |
| `@/lib/saved-views` | `../utils/saved-views` | `hooks/use-saved-views.ts` |
| `@/lib/ag-grid-setup` (incl. `import "@/lib/ag-grid-setup"`) | `../utils/ag-grid-setup` | `ag-grid-table.tsx` |
| `@/lib/use-viewport` | `../hooks/use-viewport` | `ag-grid-table.tsx`, page |
| `@/hooks/use-saved-views` | `../hooks/use-saved-views` | `ag-grid-table.tsx` |
| `process.env.NEXT_PUBLIC_AG_GRID_LICENSE_KEY` | **Vite host:** `import.meta.env.VITE_AG_GRID_LICENSE_KEY` (and rename in `apps/bps-hub/.env`). **Webpack host:** keep `process.env.*` but rename to host's prefix convention | only `utils/ag-grid-setup.ts` (2 occurrences) |
| `next/font/google` (DM Sans → `--font-dm-sans`) | drop in lib; either register DM Sans in host body or change page's `fontFamily: "var(--font-dm-sans), system-ui, sans-serif"` to `"system-ui, sans-serif"` | one usage in `page.tsx` line 1696 |
| `@vercel/analytics/next` import | drop | only `app/layout.tsx` (not migrated) |
| `<Toaster />` from `app/layout.tsx` | drop if host mounts one; else mount once at top of `FindingsRemediationPage` | one usage |
| `ResizeObserverFix` (currently in `app/layout.tsx`) | render once near the top of `FindingsRemediationPage` | one usage |

**Not needed:** `react-router-dom`, `React.lazy`, `import.meta.env.VITE_*` for anything except AG Grid license keys.

---

## Phase 4 — Styling migration (`app/globals.css` line-by-line)

The file is 123 lines. Verdict for each block:

| Lines | Block | Action |
|---|---|---|
| 1–2 | `@import 'tailwindcss'` / `@import 'tw-animate-css'` | **Drop** — host owns Tailwind |
| 4 | `@custom-variant dark (...)` | **Drop** — Tailwind v4-only, host owns dark mode strategy |
| 6–40 | `:root { --background: ...; ... }` | **Drop** — host owns shadcn CSS variables |
| 42–75 | `.dark { ... }` | **Drop** — same reason |
| 77–116 | `@theme inline { ... }` | **Drop** — Tailwind v4-only theme config; host owns |
| 118–122 | `@layer base { .src-dashboard * { @apply border-border outline-ring/50; } }` | **Drop**. Decorative reset; AG Grid sets its own borders, shadcn primitives carry border classes. If a regression appears post-migration, re-introduce as a tiny CSS module imported only by the page wrapper — verify the regression first. |

**Do NOT create a `global.css` in the library.** The KEYFRAMES block already living inside `page.tsx` (lines 65–144) is the library-scoped CSS — wrapped in `.src-dashboard`, perfect as-is.

### shadcn components actually used

From import grep — host must provide these (either via shared shadcn lib or vendored into `src/lib/ui/`):

`avatar`, `badge`, `breadcrumb`, `button`, `card`, `checkbox`, `dialog`, `dropdown-menu`, `input`, `label`, `popover`, `select`, `sheet`, `sonner` (toast), `switch`, `table`, `tabs`, `tooltip`, `command`, `calendar`.

---

## Phase 5 — Verification

```bash
nx lint feature-findings-remediation
nx test feature-findings-remediation   # one smoke test rendering <FindingsRemediationPage />
nx build bps-hub
nx graph                                # confirm bps-hub → feature-findings-remediation edge
```

Then visual check in the running host app. Diff `apps/bps-hub/src/**/global*.css` against `HEAD~1`: must be **zero** content changes (only `content` array entry in `tailwind.config.*` may differ).

---

## Phase 6 — Gotchas specific to this dashboard

1. **AG Grid license env-var prefix.** Host's bundler decides. Rename `.env` keys in `apps/bps-hub/.env.local` accordingly. Empty keys are fine — `ag-grid-setup.ts` already handles missing keys.
2. **`ag-grid-setup.ts` has top-level side effects** (license registration + `import "./ag-grid-console-filter"`). It's imported via `import "@/lib/ag-grid-setup"` from `components/executive/ag-grid-table.tsx`. Keep that side-effect import on the table component — runs once on mount.
3. **`--font-dm-sans` CSS var.** Used at `page.tsx:1696`. After deleting `next/font` it'll be undefined. Either register the same var in host body, or simplify page's `fontFamily` to `"system-ui, sans-serif"`. Pick simpler.
4. **`.src-dashboard` wrapper class is load-bearing.** Every `@keyframes` and responsive override in the KEYFRAMES block is scoped to `.src-dashboard .vrd-*`. The page renders that wrapper internally; if you later split the page, keep the wrapper at the outermost element.
5. **`ResizeObserverFix`** suppresses a benign AG Grid console error. Listens once on window. Render at the top of `FindingsRemediationPage` and nowhere else.
6. **`useSavedViewsToolbarUi` import.** `ag-grid-table.tsx` imports it from `components/vulnerability/saved-views-toolbar.tsx` — paste that file before `ag-grid-table.tsx`.
7. **No `next/headers`, no `cookies()`, no `fs`, no `path` anywhere** — confirmed by grep. No accidental server-only code to extract.
8. **`Math.random()` calls.** `lib/saved-views.ts:189` (`makeViewId`) uses it; fine on the client. `lib/mock-data.ts` is purely literal data — deterministic, no SSR/hydration risk.
9. **`useEffect` accessing `document`** in `page.tsx:1641-1647`. Fine in client-side builds.
10. **Cross-folder coupling to avoid.** `components/executive/ranked-list/` already has its own `index.ts` — re-export through `components/index.ts` so siblings never reach in via `./ranked-list/ranked-list-item`.
11. **Sidebar shadcn primitive (`components/ui/sidebar.tsx`)** — the demo's *page-level* sidebar is hand-rolled in `page.tsx`, NOT using the shadcn `sidebar` primitive. Host does not need to ship that one.

---

## Phase 7 — User Guide sheet wiring

The Header now hosts a `?` icon between the notifications bell and the CIO selector that opens a right-side user guide (overview, dashboard tour, findings-grid walkthrough, triage workflow, field dictionary, keyboard shortcuts). The integration is one new leaf component plus four small edits inside `page.tsx`.

### 7.1 New file

| Source | → | Destination | Notes |
|---|---|---|---|
| `components/executive/user-guide-sheet.tsx` | → | `src/lib/components/executive/user-guide-sheet.tsx` | Leaf — imports `Sheet*` primitives from `@/components/ui/sheet`, `lucide-react` icons, and React's `ReactNode` type only. Move whole; delete `'use client'`; rewrite the `@/components/ui/sheet` alias per Phase 3. |

No new runtime dependency. The shadcn `sheet` primitive is already on the Phase 4 list and is also used by `components/vulnerability/detail-sheet.tsx`.

### 7.2 `page.tsx` edits to preserve on paste

`app/page.tsx` (now `src/lib/pages/page.tsx`) carries four small additions that must come across verbatim:

- **Imports** — add `HelpCircle` to the existing `lucide-react` import block, and add `import { UserGuideSheet } from "@/components/executive/user-guide-sheet";` next to the other executive-component imports. Rewrite the alias per Phase 3.
- **`HeaderCard` state** — add `const [guideOpen, setGuideOpen] = useState(false);` alongside the existing `cioOpen` state.
- **Help button** — render an `IconCircleBtn` containing `<HelpCircle />` between the notifications bell wrapper and the CIO `Popover`. The existing `IconCircleBtn` was extended with an optional `onClick?: () => void` prop — keep that signature; do not refactor back to a no-onClick variant.
- **Sheet mount** — `HeaderCard` returns a Fragment (`<>...</>`) wrapping the existing top-bar `<div>` plus `<UserGuideSheet open={guideOpen} onOpenChange={setGuideOpen} />` as a sibling. Do not move the sheet element outside `HeaderCard` — it relies on the local `guideOpen` state.

No new hooks, no new context, no new global state. The sheet renders inside the `.src-dashboard` wrapper, so the existing CSS scope continues to apply.

### 7.3 Verification

After `nx serve bps-hub`:

- Click the `?` icon in the header — the sheet should slide in from the right.
- Confirm the in-sheet TOC anchor links (`#overview`, `#findings`, `#dictionary`, etc.) scroll within the sheet body. The sheet container handles scrolling, not the page; if anchors no-op after the lift-and-shift, the cause is a missing `overflow-y-auto` on `SheetContent` from the host's shadcn primitive.
- Resize the viewport — the sheet uses the host's standard `Sheet` width (`sm:max-w-2xl w-full`); no library-specific override applies.

---

## Rough effort budget

| Phase | Time |
|---|---|
| 1 (setup) | 15 min |
| 2 (paste ~50 files) | 90–120 min — most time is mechanical alias rewrites |
| 3 (env + font tweaks) | 15 min |
| 4 (verify globals.css is dropped) | 5 min |
| 5 (lint/test/build/visual) | 30 min for first green run; budget another 30 for stray import fixes |
| 7 (user guide sheet wiring) | 10 min — one new file + four `page.tsx` insertions |
| **Total** | ~3–4 hours assuming the host already has the shadcn set listed in Phase 4 |

Biggest time sink: alias rewrites. After the folder skeleton is in place, a single find-and-replace pass per alias covers most of the 358 occurrences:

- `@/components/ui/` → host path
- `@/lib/` → `../`
- `@/components/executive/` → `./` or `../components/executive/`
- `@/components/vulnerability/` → `./` or `../components/vulnerability/`
- `@/components/dashboard/` → `./` or `../components/dashboard/`
- `@/hooks/` → `../hooks/`
