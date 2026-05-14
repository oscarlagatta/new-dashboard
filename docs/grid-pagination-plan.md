# Hybrid grid pagination: CSRM today, SSRM + cursor datasource later

> **Status:** plan — not yet implemented.
> **Date:** 2026-05-14.
> **Branch context:** drafted on `feature/migration-for-demo`.
> **Companion docs:** `MIGRATION.md` (Phase 9 in particular), `docs/lever-scope-discovery.md`.

---

## Context

The Findings grid (`components/executive/ag-grid-table.tsx`) currently uses **AG Grid Client-Side Row Model** with the full 50-row `mockVulnerabilities` array passed via `rowData`. Pagination is purely client-side (`pagination=true`, `paginationPageSize=50`).

When the .NET backend lands, the dataset is ~1.5 M findings. OFFSET-based pagination will not survive that volume — the production datasource must be **cursor / keyset-paginated**. Two TODO comments already flag this: `lib/ag-grid-setup.ts:7-10` and `components/executive/ag-grid-table.tsx:83-86`.

**Goal:** introduce a single abstraction (`FindingsSource`) that the grid consumes. Today it resolves to a mock implementation (preserves CSRM behaviour exactly). Tomorrow it resolves to a server implementation that conforms to AG Grid's `IServerSideDatasource` and speaks cursor pagination to the backend. The mode switch is one env var, not a code change in the grid component.

---

## Approach

Four phases. Each phase is independently shippable and reversible. Phase A is a pure refactor with zero user-visible change; Phase B is the load-bearing one; Phases C/D are downstream cleanup.

### Phase A — Introduce the `FindingsSource` abstraction (no behaviour change)

The grid stops importing `mockVulnerabilities` directly. It receives a `FindingsSource` instead and renders against it.

**New files**

- `lib/api/findings.ts` — defines the `FindingsSource` interface and exports `mockFindingsSource` and (later) `serverFindingsSource`.
- `lib/api/types.ts` — shared request/response types: `FindingsRequest`, `FindingsResponse`, `Cursor`.

**Interface shape**

```ts
export type Cursor = string | null; // opaque base64; server owns the format

export interface FindingsRequest {
  cursor: Cursor;              // null = first page
  limit: number;
  sort: { colId: string; sort: "asc" | "desc" }[];
  filterModel: Record<string, unknown>; // AG Grid native filter model, passed through
  externalScopes: {            // merged in by the grid before sending
    cioScope: string | null;
    leverScope: Lever | null;
    preset: FilterPresetId | null;
    quickFilter: string;
  };
}

export interface FindingsResponse {
  rows: Vulnerability[];
  nextCursor: Cursor;
  totalCount?: number;         // optional; absent means "unknown / very large"
}

export interface FindingsSource {
  mode: "client" | "server";   // tells the grid which row model to mount
  // client mode: synchronous handle to the full array (CSRM)
  getAll?: () => Vulnerability[];
  // server mode: AG Grid IServerSideDatasource shape
  getRows?: (req: FindingsRequest) => Promise<FindingsResponse>;
}
```

`mode` is the single source of truth the grid keys off to decide which AG Grid props to set.

**Mock implementation** (`mockFindingsSource`)

```ts
export const mockFindingsSource: FindingsSource = {
  mode: "client",
  getAll: () => mockVulnerabilities,
};
```

Reuses the existing `mockVulnerabilities` export from `lib/mock-data.ts`. Zero filtering/paging logic — CSRM handles that itself.

**Mode switch**

A single helper in `lib/api/findings.ts`:

```ts
export function getFindingsSource(): FindingsSource {
  return process.env.NEXT_PUBLIC_FINDINGS_BACKEND === "server"
    ? serverFindingsSource
    : mockFindingsSource;
}
```

Default falls back to mock so dev/prototype behaviour is unchanged with no `.env.local` edit.

**Grid refactor** (`components/executive/ag-grid-table.tsx`)

- Stop receiving `vulnerabilities` as a prop. Read `FindingsSource` from context or accept it as a prop from `VulnerabilitiesPage`.
- Conditional AG Grid props block:
  - `source.mode === "client"`: `rowData={source.getAll!()}` + existing pagination props
  - `source.mode === "server"`: `rowModelType="serverSide"` + `serverSideDatasource={adapter(source)}` + `cacheBlockSize={50}` + `serverSideStoreType="partial"` + existing pagination props
- The existing external filter callbacks (`isExternalFilterPresent`, `doesExternalFilterPass`) stay wired in *client mode only*. In server mode the same predicates are folded into the `filterModel` / `externalScopes` sent to the server (see Phase C).

**Acceptance for Phase A**

- `npm run dev` produces the same screen, the same filters, the same sort, the same pagination behaviour. No behaviour change.
- `npm run build` clean.
- The grid no longer imports `mockVulnerabilities` directly; everything routes through `getFindingsSource()`.

### Phase B — Server datasource implementation with cursor pagination

`serverFindingsSource` implements the server side of `FindingsSource` plus an adapter that conforms to AG Grid's `IServerSideDatasource`.

**Backend contract (must agree with Vipin's .NET API)**

- `POST /api/findings/list` — body is `FindingsRequest`, response is `FindingsResponse`. Using POST (not GET with querystring) because the filter model is too large for a querystring at production filter complexity.
- Cursor format: opaque base64-encoded JSON on the server side. Client never inspects it; just round-trips `nextCursor` back as the next request's `cursor`.
- Sort stability: cursor is keyed off the *requested sort columns* plus `id` as tie-breaker. Changing the sort invalidates the cursor — the grid will issue a new request from `cursor: null`.

**AG Grid → `FindingsRequest` translation**

AG Grid SSRM hands the datasource an `IServerSideGetRowsRequest` shaped around `startRow`/`endRow` (offset semantics). To bridge to cursors:

- Maintain a `Map<startRow, Cursor>` in the adapter's closure: every successful response records `{ endRow → nextCursor }`. The next sequential page reads `startRow` (which equals the previous `endRow`) and finds the cursor.
- Sequential pagination is free — Next/Prev reads from the map.
- **Random page jump** (e.g. user clicks "Page 47" cold): the map has no entry. Three options to surface to the user/backend team:
  1. Backend supports both modes — `cursor` *or* `offset`. We fall back to offset for cold jumps, knowing it's slower at high page numbers but rare.
  2. Walk cursors silently (issue N sequential fetches). Bad UX at high pages.
  3. Disable random page jumps in SSRM mode — show Prev/Next only. Cleanest, but changes the visible UI.
- Recommendation: **option 1**. Backend supports both; client prefers cursor; offset is the escape hatch. Negotiate this with Vipin in Phase B kickoff.

**External scope merge**

In server mode the `externalScopes` block (cioScope, leverScope, filterPreset, quickFilter) is merged into the request alongside `filterModel`. The grid's existing `isExternalFilterPresent` / `doesExternalFilterPass` callbacks are bypassed entirely in server mode — they only filter rows that the grid already has, which is wrong when rows are server-paged.

**Acceptance for Phase B**

- Set `NEXT_PUBLIC_FINDINGS_BACKEND=server` and point `NEXT_PUBLIC_FINDINGS_API_BASE` at a mock route handler that wraps `mockVulnerabilities` with cursor logic (or use msw).
- The grid renders identically with respect to columns, filters, sort, and pagination — only the data path differs.
- Inspecting network: one fetch per page change; cursor flows back and forth; filter changes reset the cursor.

### Phase C — Refactor downstream consumers for SSRM compatibility

Three call-sites assume the full dataset is in memory. They must be gated on `source.mode`.

**C.1 — Bulk actions** (`ag-grid-table.tsx:1044-1066`)

- Client mode: keep current `applyTransaction({ update })` on local rows.
- Server mode:
  - POST to `/api/findings/bulk-update` with the selected ids and the delta (owner / disposition).
  - On success, call `gridApi.refreshServerSide({ purge: true })` to re-fetch affected rows.
  - Optimistic update via `applyServerSideTransaction({ update })` is possible but adds rollback complexity. Skip it in v1 — just refresh.

**C.2 — Detail-sheet prev/next** (`detail-sheet.tsx:1179-1182`)

- Client mode: keep walking `allVulnerabilities` (the full filtered array).
- Server mode: `allVulnerabilities` only contains the current page. Either:
  - (a) Add a sibling fetch: `getSibling(currentId, direction): Promise<Vulnerability | null>` on the source. The detail sheet calls it on `j`/`k`. Recommended.
  - (b) Restrict navigation to the current page. Easier but breaks the keyboard UX.
- Recommendation: **(a)**. Backend endpoint `GET /api/findings/:id/sibling?direction=prev|next&sort=...&filter=...` returns the adjacent row under the same sort/filter.

**C.3 — External filters merged into the request**

- `matchesFilters` (`ag-grid-table.tsx:404`) and the `isExternalFilterPresent`/`doesExternalFilterPass` pair (lines 430-439) become **client-mode-only**.
- A new helper `buildFindingsRequest(gridState, scopes): FindingsRequest` collects:
  - AG Grid's native `filterModel` (via `api.getFilterModel()`)
  - The grid's native `sortModel` (via `api.getColumnState().filter(c => c.sort)`)
  - External scopes (cioScope, leverScope, filterPreset, quickFilter) from the existing React state
- The server adapter calls `buildFindingsRequest` each time the grid asks for rows.

**Acceptance for Phase C**

- In server mode: bulk Set Disposition / Assign Owner round-trips through the API, then the visible rows update without a full reload.
- In server mode: `j`/`k` in the detail sheet still navigates to the prev/next row under the current sort+filter, even when that row is on a different page.

### Phase D — Saved Views compatibility check

Saved views already abstract their persistence (`hooks/use-saved-views.ts:51-82`) — three functions (`loadFromStorage`, `saveToStorage`, `saveCurrentIdToStorage`) are the only I/O sites. Two questions to confirm:

- `SavedView.filterModel` is AG Grid's opaque JSON. The server must accept it as-is in `FindingsRequest.filterModel`. If the backend wants a translated form (e.g. SQL-ish DSL), the translation must happen client-side before send — flag this with Vipin.
- Saved views persist column order via `columnState`. The eventual API for saving views (`MIGRATION.md` Phase 2.4) just needs the three functions swapped to fetch calls; no change to the row-data path.

No code changes in Phase D unless the filterModel translation question lands "translate client-side".

---

## Decisions the user / Vipin still need to make before Phase B implementation

These are flagged here, not assumed:

1. **Cursor encoding**: client-side opaque or client-readable? Recommendation: opaque, server-owned.
2. **Cold page jump fallback**: cursor walk, offset fallback, or disable page jumps? Recommendation: offset fallback (option 1 above).
3. **`filterModel` translation**: does the backend accept AG Grid's native shape, or do we translate? Recommendation: backend accepts native — Roger's data share already speaks AG-Grid-compatible filtering per `docs/lever-scope-discovery.md`.
4. **Bulk update endpoint shape**: does it return the updated rows (so we can patch in place) or just a 204 (forcing a refresh)? Recommendation: return updated rows; cheaper UX.
5. **Sibling endpoint**: build it, or accept "navigation within current page only" as a v1 limitation? Recommendation: build it. The detail sheet is the only feature that breaks without it.

---

## Critical files

- **New**: `lib/api/findings.ts`, `lib/api/types.ts`
- **Modified**: `components/executive/ag-grid-table.tsx` (rowData supply, conditional props, bulk actions), `app/page.tsx` (replace `mockVulnerabilities` import with `getFindingsSource()` call), `components/vulnerability/detail-sheet.tsx` (sibling fetch under server mode)
- **Reused, unchanged**: `lib/mock-data.ts` (still the canonical mock source), `lib/saved-views.ts`, `hooks/use-saved-views.ts`, `lib/filter-presets.ts`, `lib/constants/levers.ts`
- **Doc updates**: `MIGRATION.md` Phase 2.4 (mention the new `lib/api/findings.ts` module), and a follow-on Phase 9.11 noting that the SSRM scaffolding is now wired

---

## Verification

End-to-end, by phase:

**Phase A** (refactor only)
- `npm run build` — clean.
- `npm run dev` — every existing UX path works identically: filters, floating filters, sort, search, pagination, bulk select, detail sheet, saved views, scope dropdowns. Diff-mode test: open the grid before and after, screenshot, compare.

**Phase B** (mock server)
- Add a Next.js route handler at `app/api/findings/list/route.ts` that takes `FindingsRequest`, filters/paginates `mockVulnerabilities` server-side, and returns a `FindingsResponse` with a synthetic cursor.
- Set `NEXT_PUBLIC_FINDINGS_BACKEND=server` in `.env.local`, restart dev server, exercise the grid. Watch Network panel: one fetch per page change, cursor round-trips.
- Sort change → first page fetched fresh with `cursor: null`.
- Filter change → ditto.
- Jump from page 1 → page 5 cold → uses offset fallback; verify by adding a server-side log.

**Phase C**
- Bulk Assign Owner across two pages of selection in server mode: rows update on next render.
- `j`/`k` from row 25 (page 1) → row 51 (page 2) in server mode: detail sheet shows row 51.

**Phase D**
- Save a view in server mode; reload the page; re-apply the view; rows return identically.

**Cross-cutting**
- AG Grid v32 deprecation-warning regression check (the `getColDef` family from `MIGRATION.md` Phase 9.2): browser console must stay clean across mode toggles.

---

## Effort estimate

| Phase | Time | Notes |
|---|---|---|
| A (abstraction + refactor) | 2-3 h | Pure refactor; biggest risk is the grid's filterModel/external-filter split |
| B (server datasource + mock route) | 3-4 h | Cursor↔offset adapter is the tricky bit |
| C (downstream refactors) | 2-3 h | Bulk + sibling endpoint contracts must be agreed with backend first |
| D (saved views check) | 30 min | Mostly verification |
| **Total** | **~8-10 h** | Plus backend negotiation time, which is parallelisable |
