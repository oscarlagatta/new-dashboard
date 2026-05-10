"use client";

import { useEffect, useState } from "react";

export type Viewport = "mobile" | "tablet" | "desktop";

const MOBILE_MAX = 768;
const TABLET_MAX = 1024;

/**
 * Tracks the current responsive bucket. Defaults to "desktop" on first render
 * so SSR markup matches a desktop client; the effect re-evaluates on mount.
 */
export function useViewport(): Viewport {
  const [viewport, setViewport] = useState<Viewport>("desktop");

  useEffect(() => {
    const compute = (): Viewport => {
      const w = window.innerWidth;
      if (w < MOBILE_MAX) return "mobile";
      if (w < TABLET_MAX) return "tablet";
      return "desktop";
    };
    const onResize = () => setViewport(compute());
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return viewport;
}
