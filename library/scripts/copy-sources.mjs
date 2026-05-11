#!/usr/bin/env node
/**
 * copy-sources.mjs
 *
 * One-shot helper that copies the Next.js project's source files into the
 * library/src/lib/ structure and applies every surgical edit described in
 * the migration plan.
 *
 * Run from the project root:
 *   node library/scripts/copy-sources.mjs
 *
 * Idempotent — overwrites destination files each run, so you can iterate
 * on edits in the original Next.js source and re-run.
 */

import { cp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, "..", "..");
const LIB_SRC = resolve(__dirname, "..", "src", "lib");

const log = (msg) => console.log(`[copy-sources] ${msg}`);

// ── 1. Wipe & recreate the destination tree ────────────────────────────────
async function freshDir(path) {
  if (existsSync(path)) await rm(path, { recursive: true, force: true });
  await mkdir(path, { recursive: true });
}

await freshDir(join(LIB_SRC, "components"));
await freshDir(join(LIB_SRC, "hooks"));
await freshDir(join(LIB_SRC, "lib"));

// ── 2. Copy directory trees verbatim ────────────────────────────────────────
// Keep the original layout — that way the path alias `@/lib/types` (→
// src/lib/lib/types.ts) keeps resolving without rewriting 60+ imports.
log("copying components/, hooks/, lib/");
await cp(join(ROOT, "components"), join(LIB_SRC, "components"), { recursive: true });
await cp(join(ROOT, "hooks"), join(LIB_SRC, "hooks"), { recursive: true });
await cp(join(ROOT, "lib"), join(LIB_SRC, "lib"), { recursive: true });

// resize-observer-fix.tsx moves out of components/ so it can be re-exported
// from index.ts without the host having to dig.
log("moving resize-observer-fix.tsx to src/lib/");
await cp(
  join(ROOT, "components", "resize-observer-fix.tsx"),
  join(LIB_SRC, "resize-observer-fix.tsx"),
);

// ── 3. Rename app/page.tsx → src/lib/executive-dashboard.tsx with edits ────
log("transforming app/page.tsx → executive-dashboard.tsx");
let pageSource = await readFile(join(ROOT, "app", "page.tsx"), "utf-8");
pageSource = pageSource
  .replace(/^"use client";\r?\n/, "")
  .replace(/export default function App\(\)/, "export function ExecutiveDashboard()")
  .replace(
    /fontFamily: "var\(--font-dm-sans\), system-ui, sans-serif",/,
    "/* font: provided by host via Tailwind font-sans utility */",
  );

// Inject the `.src-dashboard *` border rule into the existing KEYFRAMES
// stylesheet so the library doesn't depend on the host's globals.css
// containing `@layer base { .src-dashboard * { @apply border-border ... } }`.
// The host's shadcn-style :root already defines --border and --ring.
pageSource = pageSource.replace(
  /const KEYFRAMES = `/,
  `const KEYFRAMES = \`
  /* Scoped border + outline defaults — equivalent of the v4 globals.css
     @layer base rule, but as raw CSS so the host's Tailwind config isn't
     required to apply it. */
  .src-dashboard *, .src-dashboard *::before, .src-dashboard *::after {
    border-color: var(--border);
    outline-color: color-mix(in oklab, var(--ring) 50%, transparent);
  }`,
);
await writeFile(join(LIB_SRC, "executive-dashboard.tsx"), pageSource);

// ── 4. Surgical edit: lib/ag-grid-setup.ts (drop env var license reads) ─────
// We just write the new file from scratch — it's 30 lines and the original
// has license-registration side effects we want to keep stripped.
log("rewriting lib/ag-grid-setup.ts (drop env reads, keep comparators)");
await writeFile(
  join(LIB_SRC, "lib", "ag-grid-setup.ts"),
  `// ag-grid-setup — comparators and sort order maps only.
//
// License registration moved to ./configure-dashboard.ts, which the host
// calls at app startup. No more process.env reads, no module-scope side
// effects beyond defining these constants.

// Priority 1 first, Priority 4 last
export const severityRiskOrder: Record<string, number> = {
  "Priority 1": 0,
  "Priority 2": 1,
  "Priority 3": 2,
  "Priority 4": 3,
};

export const triageStatusOrder: Record<string, number> = {
  "Awaiting Disposition": 0,
  "In Progress": 1,
  "Pending Clear Scan": 2,
  Resolved: 3,
};

export function severityRiskComparator(a: string, b: string): number {
  return (severityRiskOrder[a] ?? 99) - (severityRiskOrder[b] ?? 99);
}

// Kept for any remaining references in the codebase.
export const severityComparator = severityRiskComparator;
export const statusComparator = (a: string, b: string) =>
  (triageStatusOrder[a] ?? 99) - (triageStatusOrder[b] ?? 99);

export const gridInitialized = true;
`,
);

// ── 5. Surgical edit: ag-grid-table.tsx — remove side-effect import ─────────
log("rewriting components/executive/ag-grid-table.tsx (drop side-effect import)");
const grTablePath = join(LIB_SRC, "components", "executive", "ag-grid-table.tsx");
let grTable = await readFile(grTablePath, "utf-8");
grTable = grTable.replace(/import "@\/lib\/ag-grid-setup";\r?\n/, "");
await writeFile(grTablePath, grTable);

// ── 6a. styled-jsx → plain <style> tags (Next-specific syntax) ─────────────
log("converting <style jsx> → <style>");
async function* walkTsx(dir) {
  const { readdir } = await import("node:fs/promises");
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) yield* walkTsx(p);
    else if (/\.(tsx?|jsx?)$/.test(entry.name)) yield p;
  }
}
let jsxStripped = 0;
for await (const file of walkTsx(LIB_SRC)) {
  const content = await readFile(file, "utf-8");
  if (/<style\s+jsx\b/.test(content)) {
    await writeFile(file, content.replace(/<style\s+jsx\b/g, "<style"));
    jsxStripped++;
  }
}
log(`  converted ${jsxStripped} files`);

// ── 6b. Drop "use client" directives across all moved files ─────────────────
log('stripping "use client" directives');
async function* walk(dir) {
  const { readdir } = await import("node:fs/promises");
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(p);
    else if (/\.(tsx?|jsx?)$/.test(entry.name)) yield p;
  }
}
let strippedCount = 0;
for await (const file of walk(LIB_SRC)) {
  const content = await readFile(file, "utf-8");
  if (/^"use client";\r?\n/.test(content)) {
    await writeFile(file, content.replace(/^"use client";\r?\n/, ""));
    strippedCount++;
  }
}
log(`  stripped from ${strippedCount} files`);

// ── 6c. Convert @/ imports → relative paths ─────────────────────────────────
// In a non-buildable Nx library, the host's Webpack compiles the library's
// source. The host won't know about the library's internal `@/` alias, so we
// rewrite every `@/foo/bar` → relative path computed from each file's depth.
//
// Mapping: `@/x` → relative path from this file to LIB_SRC/x.
log("rewriting @/ aliases → relative paths");
import("node:path").then(); // ensure path available (already imported)
const { relative: pathRelative, dirname: pathDirname } = await import("node:path");

let aliasRewrites = 0;
for await (const file of walk(LIB_SRC)) {
  const content = await readFile(file, "utf-8");
  if (!/['"`]@\//.test(content)) continue;
  const fileDir = pathDirname(file);
  const updated = content.replace(
    /(['"`])@\/([^'"`]+)\1/g,
    (_match, quote, suffix) => {
      const target = join(LIB_SRC, suffix);
      let rel = pathRelative(fileDir, target).replace(/\\/g, "/");
      if (!rel.startsWith(".")) rel = "./" + rel;
      return `${quote}${rel}${quote}`;
    },
  );
  if (updated !== content) {
    await writeFile(file, updated);
    aliasRewrites++;
  }
}
log(`  rewrote @/ in ${aliasRewrites} files`);

// ── 7. Drop unused legacy files that have pre-existing TS errors ────────────
// These four files were dead code in the Next.js project (the dashboard
// never imports them). Removing them avoids polluting the library typecheck.
const LEGACY = [
  "components/vulnerability/charts-panel.tsx",
  "components/vulnerability/severity-status-chart.tsx",
  "components/vulnerability/status-badge.tsx",
  "components/vulnerability/vulnerability-table.tsx",
  "components/vulnerability/stat-cards.tsx",
  "components/vulnerability/filter-popover.tsx",
];
for (const rel of LEGACY) {
  const p = join(LIB_SRC, rel);
  if (existsSync(p)) {
    await rm(p);
    log(`  removed legacy: ${rel}`);
  }
}

log("done.");
log("");
log("Next steps:");
log("  1. cd library && npm install");
log("  2. npm run typecheck");
log("  3. npm run build");
log("  4. Inspect dist/ — copy library/* into your Nx workspace's libs/vuln-dashboard/");
