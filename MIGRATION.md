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
| `lib/constants/levers.ts` | → | `src/lib/constants/levers.ts` | Move whole — note source already nested under `lib/constants/`. UI-only feature; see Phase 8. |

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

## Phase 8 — Lever scope dropdown (UI only; data wiring deferred)

> **Update (2026-05-14):** Phase 9.3 supersedes the "UI only" status below. The Lever scope is now wired against `mockVulnerabilities` end-to-end, and `LEVER_OPTIONS` values changed from the `"lever-N"` internal IDs to the `Lever` strings. Read Phase 9.3 *before* Phase 8 when planning the paste.

A new **Lever** scope dropdown sits in the page header immediately to the right of the CIO selector. The dropdown is **UI-only on this branch**: it carries Jordan's four lever options plus an *All Levers* sentinel, but selecting a value does **not yet** filter the grid, KPIs, charts, or side-panel pager. The full integration (raw-value mapping, server-vs-client filtering, URL state, *Unclassified* bucket logic, and the meta-row / inner-header text decisions) is captured in `docs/lever-scope-discovery.md` and lands as a follow-up PR once Roger confirms the field name and raw values.

### 8.1 New constants file

Already listed in Phase 2.2 — no special handling. Three exports only: the `LeverScopeValue` string-literal union, the `LEVER_SCOPE_ALL` sentinel, and the `LEVER_OPTIONS` array (Jordan's four entries with `value`, `label`, `description`). No helpers, no mapping functions yet.

### 8.2 `page.tsx` edits to preserve on paste

`app/page.tsx` (now `src/lib/pages/page.tsx`) carries five small additions that must come across verbatim:

- **Import** — `import { LEVER_OPTIONS, LEVER_SCOPE_ALL, type LeverScopeValue } from "@/lib/constants/levers";` (rewrite alias per Phase 3).
- **App state** — `const [selectedLever, setSelectedLever] = useState<LeverScopeValue>(LEVER_SCOPE_ALL);` next to `selectedCio`.
- **`HeaderCard` props** — `selectedLever: LeverScopeValue` and `onSelectLever: (value: LeverScopeValue) => void` added to the props interface, threaded through from `App`.
- **`HeaderCard` locals** — `const [leverOpen, setLeverOpen] = useState(false);` next to `cioOpen`, plus the `leverTriggerShort` derivation. The derivation strips the redundant leading "Lever " from the option label so the chip reads `Lever: 1 — CTI, APS&E or EET Managed` instead of the duplicated `Lever: Lever 1 — …`.
- **Lever Popover** — rendered immediately after the CIO Popover in the right-side actions row. Same chip styling as CIO (`vrd-header-cio-btn` class, border, radius, padding, background, hover) **plus** `minHeight: 44` and `boxSizing: "border-box"` so the chip matches the CIO chip's avatar-driven 44px height. Popover items are two-line (label + description), with *All Levers* first, a 1px divider, then the four levers. `maxWidth: 320` keeps the longer trigger labels visible before ellipsis kicks in.

No new runtime dependency. The dropdown uses the existing `Popover` primitive (already on Phase 4's shadcn list as `popover`) and the `Check` / `ChevronDown` icons from `lucide-react`.

### 8.3 Discovery doc

| Source | → | Destination | Notes |
|---|---|---|---|
| `docs/lever-scope-discovery.md` | → | `libs/bps-findings-management/features/feature-findings-remediation/docs/lever-scope-discovery.md` *(or keep at repo root — decide during migration)* | Phase-1 spec for the deferred data wiring. Required reading for whoever picks up Phase 2 of the lever feature in the host. |

### 8.4 Verification

After `nx serve bps-hub`:

- Two side-by-side chips in the header: the existing `CIO: …` selector and the new `Lever: All` chip. They must read as a matched pair — same height, border, radius, background, and hover treatment.
- Open the Lever popover. *All Levers* appears first, followed by a divider, then the four lever options each rendered two-line (bold label on top, muted description below). The selected row carries a blue checkmark.
- Selecting each option updates the trigger to `Lever: {N} — {description}` for numbered levers and `Lever: All` for the sentinel.
- Selecting a lever has **no effect** on the grid, KPIs, charts, or side-panel pager. This is intentional until the Phase-2 data wiring lands — flag immediately if any filtering is observed (it would indicate an accidental wiring).

### 8.5 Follow-up work (NOT in this migration)

Captured in `docs/lever-scope-discovery.md` §4. Open at the time of the migration: build target (host-only vs demo-port), the field name on the wire (`Lever From VMART` vs `Levers`), raw-value mapping, the *Unclassified* bucket rule, URL state strategy (`nuqs` in the host), and the meta-row / Findings inner-header text decisions.

---

## Phase 9 — Post-discovery feature work (added 2026-05-14)

> **Status:** committed to `feature/migration-for-demo` after the original migration plan was drafted. Everything below must come across to the host — most of it can ride on the file-paste sweep in Phase 2, but a few items need explicit attention. This phase **supersedes Phase 8.5's "deferred" status for the Lever scope**: the scope is now wired end-to-end against `mockVulnerabilities`.
>
> **Source commits on this branch:** `9317fb4`, `d0fc1d8`, `8fa69fe`. Use `git log -p <hash>` if a paste discrepancy needs to be triaged.

### 9.1 Filter preset extensions (commit `9317fb4`)

`lib/filter-presets.ts` gained four new triage-status presets:

```ts
export type FilterPresetId =
  | "noRemediationDate"
  | "validationPendingOverThreshold"
  | "awaitingScan"
  | "riskAccepted"
  | "awaitingDisposition"
  | "inProgress"
  | "pendingClearScan"
  | "resolved";
```

Each new case is a one-line `v.triageStatus === "..."` check in `matchesPreset`. Corresponding entries are also in `FILTER_PRESETS` (label + id).

In `app/page.tsx`, the four primary dashboard `StatCard`s now derive their preset from the card's `triageStatus` via a small lookup table at module scope:

```ts
const TRIAGE_STATUS_TO_PRESET: Record<TriageStatus, FilterPresetId> = {
  "Awaiting Disposition": "awaitingDisposition",
  "In Progress": "inProgress",
  "Pending Clear Scan": "pendingClearScan",
  Resolved: "resolved",
};
```

Each card's `onNavigate` is wrapped so a card click calls `onApplyFilterPreset(preset)` (which already navigates internally) instead of the bare `onNavigate("vulnerabilities")` used before. Do not call both — calling `onNavigate` redundantly queues a duplicate `setCurrentPage` state update and was implicated in the AG Grid mount race fixed in §9.2.

**`noRemediationDate` semantics changed.** The matchesPreset case now checks `v.dueDate` (the SLA Due Date column the CIO scans) instead of `v.expectedRemediationDate`. The old field was empty whenever no CRQ had been raised, which made the filter match almost every row. Paired with this, mock data was adjusted so rows with `triageStatus === "Awaiting Disposition"` have `dueDate: ""` — that gives the filter a meaningful subset to scope to (see §9.7).

### 9.2 AG Grid 32 selection-API migration (commit `9317fb4`)

**This is the most migration-critical item in Phase 9. Read before pasting `ag-grid-table.tsx`.**

The grid was mixing AG Grid 32's new object-form `rowSelection` API with three legacy column/grid props from v31. AG Grid logs deprecation warnings for each and, more importantly, ends up with null entries in its internal column model, causing `TypeError: Cannot read properties of null (reading 'getColDef')` at first render whenever a code path forces a remount with an external filter already active (e.g., navigating to the grid via a dashboard stat-card click).

**Removed** from `components/executive/ag-grid-table.tsx`:

- The leading explicit checkbox column in `columnDefs` — it had `checkboxSelection: true` and `headerCheckboxSelection: true`. AG Grid 32's `rowSelection={{ mode: "multiRow", checkboxes: true, headerCheckbox: true }}` auto-generates an equivalent pinned-left checkbox column.
- `suppressRowClickSelection={true}` prop — superseded by `rowSelection.enableClickSelection: false`.
- `enableRangeSelection={true}` prop — superseded by the existing `cellSelection={true}`.

**Kept (with no changes):** the `rowSelection={{ mode: "multiRow", checkboxes: true, headerCheckbox: true, enableClickSelection: false }}` block and `cellSelection={true}`.

**Added** defensive null guards at the two `cols.map(col => col.getColDef())` call sites (the viewport-driven column-state useEffect at ~line 902 and `getExportColumns` at ~line 997):

```ts
.map((col: any) => {
  if (!col || typeof col.getColDef !== "function") return null;
  // ...
  const def = col.getColDef() as ColDef<Vulnerability>;
  const field = def?.field as string | undefined;
  if (!field) return null;
  // ...
})
.filter((s: ColumnState | null): s is ColumnState => s !== null);
```

Both guards are cheap and protect against the same class of bug if AG Grid hands back a transient null during future state transitions.

**Verification:** the AG Grid console warnings (`checkboxSelection is deprecated`, `headerCheckboxSelection is only supported with rowSelection=multiple`, `suppressRowClickSelection is deprecated`, `enableRangeSelection is deprecated`) must all be gone after paste. If any one reappears, search the host file for the offending prop — the migration likely re-pasted a legacy snippet.

### 9.3 Lever scope wiring (supersedes Phase 8.5; commit `d0fc1d8`)

The Lever scope dropdown documented in Phase 8 as "UI only" is now functional against `mockVulnerabilities`. Five changes span the type, constants, mock data, and grid:

1. **`lib/types.ts`** — added the authoritative `Lever` union (the four exact strings) plus a `LEVERS: Lever[]` value, and added `lever: Lever` to the `Vulnerability` interface:

   ```ts
   export type Lever =
     | "CTI/APS&E/EET-Managed Remediation"
     | "Assessment Underway"
     | "CIO E2E"
     | "CIO/CTI Engagement";

   export const LEVERS: Lever[] = [/* same four, in same order */];
   ```

2. **`lib/constants/levers.ts`** — `LeverScopeValue` was `"all" | "lever-1" | "lever-2" | "lever-3" | "lever-4"` and is now `"all" | Lever`. `LEVER_OPTIONS[].value` values were changed from the `"lever-N"` internal IDs to the four `Lever` strings directly, so the dropdown's selected value can be compared against `row.lever` without an intermediate mapping table. Display labels in `LEVER_OPTIONS` are unchanged (still `"Lever 1 — CTI, APS&E or EET Managed"`, etc.) — only the option `value` field moved.

3. **`lib/mock-data.ts`** — every row now has a `lever`. A 4-cycle `LEVER_DISTRIBUTION` array assigns one of the four values via `i % 4` so the four buckets are ~25% each across the 50 mock rows.

4. **`app/page.tsx`** — derives a nullable `leverScope` from `selectedLever`:

   ```ts
   const leverScope: Lever | null = selectedLever === "all" ? null : selectedLever;
   ```

   Passed through `VulnerabilitiesPage` to `AgGridTriageTable` along with an `onClearLeverScope` callback that resets `selectedLever` to `LEVER_SCOPE_ALL`.

5. **`components/executive/ag-grid-table.tsx`** — new optional props `leverScope?: Lever | null` and `onClearLeverScope?: () => void`. `matchesFilters` adds `if (leverScope && v.lever !== leverScope) return false;`. `isExternalFilterPresent` and the `onFilterChanged` re-fire useEffect include `leverScope` in their dependency arrays. The filter chip strip renders an additional removable chip when `leverScope` is set.

When porting, the docstring in Phase 8.1 ("No helpers, no mapping functions yet") no longer applies — Phase 9 stores the field's authoritative values inside the type union itself, which is the helper.

### 9.4 CIO scope wiring (commit `d0fc1d8`)

The header CIO selector was previously cosmetic (changed two pieces of display text — confirmed in `docs/lever-scope-discovery.md` §1.3). It now filters the grid alongside the Lever scope and any filter preset.

- `selectedCio` state is now `(typeof CIO_TEAMS)[0] | null` defaulting to `null` (was `CIO_TEAMS[0]!` — first CIO).
- "All CIOs" sentinel option added at the top of the CIO popover (mirrors "All Levers"), selecting it sets `selectedCio` to `null`.
- `HeaderCard` renders no avatar when `selectedCio` is `null`; the trigger text reads `CIO: All CIOs`.
- `MetaRow`'s `department` text is empty when `selectedCio` is `null` (the old `CIO_DEPARTMENTS` lookup is null-guarded).
- `VulnerabilitiesPage` inner-header line collapses to `All CIOs · {N} records total` when scope is null.
- `cioScope: string | null = selectedCio?.name ?? null` is derived in `App`, passed through with `onClearCioScope`, and feeds `matchesFilters` (`if (cioScope && v.cioDisplayName !== cioScope) return false;`).

CIO + Lever + preset all AND together — three independent constraints, no precedence.

### 9.5 Visible Lever column in the grid (commit `8fa69fe`)

`components/executive/ag-grid-table.tsx` gained a visible column at position 8 (immediately after Workstream — both are categorisation/routing fields):

```ts
{
  headerName: "Lever",
  field: "lever",
  width: 220,
  filter: "agSetColumnFilter",
  filterParams: { values: LEVERS },
  tooltipField: "lever",
}
```

The 220px width fits the widest value (`"CTI/APS&E/EET-Managed Remediation"`) without clipping; the `tooltipField` is a safety net for narrower resizes. `LEVERS` is imported as a value from `@/lib/types`. Not added to `TABLET_VISIBLE_FIELDS` — the tablet allowlist is already at 8 entries; users surface the column via the side-panel Columns tool.

### 9.6 Per-field activity log entries (commit `8fa69fe`)

`TriageForm.handleSave` in `components/vulnerability/detail-sheet.tsx` now appends one `ActivityLogEntry` to `vuln.activityLog` per changed field on each save. This is the audit-trail value proposition of the tool, not a UI nicety — port verbatim.

Mechanics:

- The "before" values come from the `vuln` prop, which the form's `useState` initializer captured at mount time. The parent only updates `vuln` *after* `onSave` (the form closes immediately on save), so `vuln` is a stable snapshot of what the user opened the form with.
- A `diffSpecs` table pairs eleven user-facing labels with their model field names and before/after values: Disposition, CTI Remediation, Identified Blockers, Requested Patch Window, Expected Remediation Date, Re-evaluate by, CRQ #, Remediation Complete and pending clear scan?, Health Check Time, Health Check Complete?, Finding Owner.
- `expectedRemediationDate` and `reEvaluateBy` are diffed independently — they're sibling fields under different disposition branches, and each carries the label the user actually saw.
- Array equality (Identified Blockers) uses `JSON.stringify`; scalars use `!==`.
- `formatValue` renders `(empty)` for empty strings / null / undefined, `(none)` for empty arrays, and comma-separated for non-empty arrays.
- Action string format: `changed {Label} from "{old}" to "{new}"`. Does **not** include the user name — the `ActivityTab` renders `entry.userName` separately. Prefixing the action would double-print the user.
- Entry shape exactly matches existing seeded entries in `lib/mock-data.ts`: `id`, `userId`, `userName`, `userInitials`, `action`, `field`, `oldValue`, `newValue`, `timestamp`. IDs are unique per save via `Date.now() + index`.
- If no fields changed, no entries are appended.

### 9.7 Mock-data adjustments (commits `9317fb4`, `d0fc1d8`)

Two field-level changes inside the `Array.from({ length: 50 }, ...)` factory in `lib/mock-data.ts`:

- `dueDate` is empty when `triageStatus === "Awaiting Disposition"`:

  ```ts
  dueDate:
    triageStatus === "Awaiting Disposition"
      ? ""
      : daysOpen > 90
      ? "2026-04-15"
      : `2026-0${5 + (i % 3)}-${String(10 + (i % 18)).padStart(2, "0")}`,
  ```

  This drives the "No Remediation Date" dashboard card preset (§9.1). Semantic: a finding still awaiting triage has no SLA Due Date yet.

- `lever` is assigned from `LEVER_DISTRIBUTION` via `i % LEVER_DISTRIBUTION.length` (length 4, ~25% each).

Both changes survive a literal copy of `mock-data.ts` — no special host handling.

### 9.8 Discoverable defects flagged but not addressed in Phase 9

These came out of the UI verification checklist walked on 2026-05-14 and are scope for follow-up PRs, not this migration:

- Dashboard counts (`DASHBOARD_STATS` in `lib/executive-data.ts`) are static. The grid filters now produce real subsets but the stat-card numbers don't recompute from `mockVulnerabilities`. The two should be reconciled in a follow-up.
- The Top Unresolved component's title still reads "Top Unresolved Vulnerabilities" — should be "Top Unresolved Findings" per the terminology audit.
- `components/vulnerability/severity-status-chart.tsx`, `charts-panel.tsx`, `status-badge.tsx`, `vulnerability-table.tsx` are orphans (no live consumers; flagged in the audit; produce the only typecheck errors in the repo). They should be deleted before or during migration.
- The header meta-row Overdue and Priority 1 numbers route to the grid without applying a filter preset. Wiring them mirrors the §9.1 pattern.
- The "Open in Remedy" button in the detail sheet renders even when CRQ is empty; should be hidden.

### 9.9 Phase 2 paste-order addenda

Slot these into the existing Phase 2 subsections — they don't introduce new file categories, just new content inside existing categories:

| Existing subsection | Addendum |
|---|---|
| **2.1 `types/`** | `lib/types.ts` now exports `Lever` (type) and `LEVERS` (value array). Both belong in the same `types/` paste batch. |
| **2.2 `constants/`** | `lib/constants/levers.ts` — values changed (per §9.3); no new files. |
| **2.2 `constants/`** | `lib/filter-presets.ts` — four new preset ids and one revised case (per §9.1). |
| **2.5 `hooks/`** | No change. |
| **2.6 `components/`** | `components/executive/ag-grid-table.tsx` and `components/vulnerability/detail-sheet.tsx` carry the bulk of Phase 9's runtime changes. Paste after the dashboard cards, before pages. |
| **2.7 `pages/`** | `app/page.tsx` gains `TRIAGE_STATUS_TO_PRESET`, `cioScope`/`leverScope` derivation, and updated `HeaderCard` / `VulnerabilitiesPage` props (all per §9.1, §9.3, §9.4). |

### 9.10 Verification checklist for the host (delta from Phase 5)

After Phase 5's standard lint/test/build sweep, additionally confirm:

- [ ] No AG Grid deprecation warnings in the browser console (catches §9.2 regressions).
- [ ] Clicking each of the four primary dashboard stat cards filters the grid to the corresponding triage status and lands a filter chip with the preset label.
- [ ] Selecting a CIO in the header reduces the grid rows; "All CIOs" restores. Chip appears/disappears accordingly.
- [ ] Selecting a Lever in the header reduces the grid rows; "All Levers" restores. Chip appears/disappears accordingly.
- [ ] CIO + Lever + a stat-card preset combined show the intersection of all three constraints.
- [ ] A Lever column is visible in the grid at position 8 with the correct four-value set filter.
- [ ] Editing the triage form, saving, and opening the Activity tab shows one entry per changed field (not one combined entry). Re-saving with no changes adds no entries.
- [ ] The "No Remediation Date" dashboard card click filters the grid to rows with empty Due Date (the Awaiting Disposition subset in the seeded mock data).

---

## Phase 10 — Left navigation menu restructure (added 2026-05-18)

> **Status:** uncommitted on `feature/migration-for-demo` at the time of writing — a working-tree change to `app/page.tsx` only. Rides entirely on the Phase 2.7 page paste; no new files, no new runtime dependencies, no routing changes.

The hand-rolled page-level sidebar (Phase 6 gotcha #11 — the one *not* built on the shadcn `sidebar` primitive) was restructured into a six-item "Main Pages" menu with two-line nav entries. Every change is confined to `app/page.tsx` (→ `src/lib/pages/page.tsx`).

### 10.1 What changed in `page.tsx`

- **Branding label** — the sidebar header text changed from `Vulnerability Remediation` to `Vulnerability Command & Control`. It still renders through the existing uppercase + letter-spacing style, so it displays as `VULNERABILITY COMMAND & CONTROL`.
- **Section label** — the nav section heading changed from `Menu` to `Main Pages` (the existing style uppercases it → `MAIN PAGES`).
- **`NAV_ITEMS` rebuilt** — the module-scope array now holds six entries, each with `id`, `label`, `subtitle`, and `Icon`:

  | `id` | label | subtitle | navigable |
  |---|---|---|---|
  | `dashboard` | Executive Dashboard | Overview of remediation | yes → Executive Dashboard page |
  | `_cio` | CIO Cockpit | CIO remediation summary | no (placeholder) |
  | `vulnerabilities` | Work Queue | Backlog to remediate | yes → Work Queue / findings grid |
  | `_validation` | Validation Pending | Remediation pending validation | no (placeholder) |
  | `_insights` | Insight Dashboards | Placeholder for Tableau | no (placeholder) |
  | `_weekend` | Weekend C2 | Weekend activity dashboard | no (placeholder) |

  Only `dashboard` and `vulnerabilities` are real pages — the `Page` union is unchanged (`"dashboard" | "vulnerabilities"`). The four `_`-prefixed ids are non-navigable placeholders, exactly the pattern the old `_remediation` / `_reports` / `_settings` entries used. No new routing, no new page components.
- **`SidebarNavItem` two-line rendering** — the component gained a `subtitle` prop and now renders the label in semibold (600) above a smaller (12px) muted subtitle. The active item now has a **filled solid blue background** (`#2563EB`) with white label and translucent-white subtitle, replacing the old pale `#EFF6FF` tint. Item `minHeight` grew from 44px to 54px to fit two lines; collapsed mode is unchanged (icon-only, 44px, with `label — subtitle` moved to `title` / `aria-label`).
- **Default landing page** — the `useState<Page>` initial value changed from `"dashboard"` to `"vulnerabilities"`, so **Work Queue is the active/selected page on load** (matches the nav spec's "Active/selected by default" note).
- **Icon imports** — in the `lucide-react` import block: removed now-unused `ShieldAlert`, `Wrench`, `Settings`; added `Gauge`, `ListChecks`, `ClipboardCheck`, `CalendarClock`. `LayoutDashboard` and `BarChart3` are retained.

### 10.2 Migration notes

- This is a **literal change inside one file** — it comes across on the Phase 2.7 paste of `page.tsx` with no special handling. No alias rewrites are involved; the changed lines touch no `@/` imports.
- The default-page change means the **AG Grid findings table mounts on first load** instead of the dashboard. The §9.2 selection-API cleanup is now a hard prerequisite: verify it landed before relying on this, or the grid will throw the `getColDef` null error on initial render. (Previously the grid only mounted after a navigation; it is now the entry point.)
- The shadcn `sidebar` primitive remains unused — Phase 6 gotcha #11 still holds, the host does not need to ship it.

### 10.3 Phase 2 paste-order addendum

| Existing subsection | Addendum |
|---|---|
| **2.7 `pages/`** | `app/page.tsx` carries the rebuilt `NAV_ITEMS`, the two-line `SidebarNavItem`, the new branding/section labels, and the `"vulnerabilities"` default-page state — all verbatim on paste. |

### 10.4 Verification checklist for the host (delta from Phase 5)

- [ ] Sidebar header reads `VULNERABILITY COMMAND & CONTROL`; the section label reads `MAIN PAGES`.
- [ ] Six nav items appear in order: Executive Dashboard, CIO Cockpit, Work Queue, Validation Pending, Insight Dashboards, Weekend C2 — each a bold label over a muted subtitle.
- [ ] On load, **Work Queue** is the active item (filled solid-blue background) and the findings grid is the visible page.
- [ ] Clicking Executive Dashboard switches pages; the four `_`-prefixed items are non-interactive (dimmed, no navigation).
- [ ] Collapsing the sidebar shows icon-only items; hovering a collapsed item surfaces `label — subtitle` as a tooltip.

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
| 8 (lever dropdown — UI only) | 10 min — one constants file + five `page.tsx` insertions; data wiring is a separate follow-up |
| 9 (post-discovery feature work) | 30–45 min — most of it rides on the Phase 2 file paste; the AG Grid v32 selection-API cleanup in §9.2 needs explicit verification |
| 10 (left nav restructure) | 5 min — rides on the Phase 2.7 page paste; verify only |
| **Total** | ~4–5 hours assuming the host already has the shadcn set listed in Phase 4 |

Biggest time sink: alias rewrites. After the folder skeleton is in place, a single find-and-replace pass per alias covers most of the 358 occurrences:

- `@/components/ui/` → host path
- `@/lib/` → `../`
- `@/components/executive/` → `./` or `../components/executive/`
- `@/components/vulnerability/` → `./` or `../components/vulnerability/`
- `@/components/dashboard/` → `./` or `../components/dashboard/`
- `@/hooks/` → `../hooks/`
