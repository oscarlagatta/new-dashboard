"use client";

import { useEffect } from "react";

/**
 * Suppresses the benign ResizeObserver loop error that occurs with AG Grid/Charts.
 * This error happens when resize observations are delivered late due to browser
 * event loop timing, but does not affect functionality.
 * 
 * See: https://github.com/WICG/resize-observer/issues/38
 */
export function ResizeObserverFix() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.message?.includes("ResizeObserver loop")) {
        event.stopImmediatePropagation();
        event.preventDefault();
      }
    };

    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, []);

  return null;
}
