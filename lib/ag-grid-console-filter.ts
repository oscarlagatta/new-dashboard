// Silences AG Grid Enterprise / AG Charts Enterprise trial banner.
//
// MUST be imported BEFORE `ag-grid-enterprise` / `ag-charts-enterprise` so this
// module's side effect (wrapping console.error) runs before AG Grid's
// module-level license-check code. JS import declarations evaluate in source
// order — keep this as the first import in `lib/ag-grid-setup.ts`.
//
// The banner is emitted via `console.error`, and Next.js 16's dev overlay
// surfaces every `console.error` call as a popup error — so without filtering,
// you get a noisy dev overlay even though the grid renders fine in trial mode.
// Only AG Grid / AG Charts banner messages are filtered. Every other
// `console.error` passes through unchanged, so real runtime errors still hit
// the overlay.

declare global {
  // eslint-disable-next-line no-var
  var __agGridConsoleFilterInstalled: boolean | undefined;
}

if (typeof window !== "undefined" && !globalThis.__agGridConsoleFilterInstalled) {
  globalThis.__agGridConsoleFilterInstalled = true;

  const origError = console.error.bind(console);
  const isAgGridBanner = (arg: unknown): boolean => {
    if (typeof arg !== "string") return false;
    if (arg.includes("****")) return true;
    if (arg.includes("AG Grid Enterprise")) return true;
    if (arg.includes("AG Charts Enterprise")) return true;
    if (arg.includes("License Key Not Found")) return true;
    if (arg.includes("Invalid License Key")) return true;
    if (arg.includes("Trial Period")) return true;
    if (arg.includes("ag-grid.com")) return true;
    return false;
  };
  console.error = (...args: unknown[]) => {
    if (args.some(isAgGridBanner)) return;
    origError(...args);
  };
}

export {};
