
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ColumnState } from "ag-grid-community";
import {
  DEFAULT_BUILTIN_VIEW_ID,
  STORAGE_KEY_CURRENT_VIEW,
  STORAGE_KEY_VIEWS,
  columnStatesEqual,
  filterModelsEqual,
  getBuiltInViews,
  makeViewId,
  type SavedView,
} from "../lib/saved-views";

// State captured from the grid + search input — the live "what does the user
// see right now" snapshot we compare against the applied view to decide if
// it's dirty.
export interface ViewSnapshot {
  filterModel: Record<string, unknown>;
  columnState: ColumnState[];
  searchTerm: string;
}

interface UseSavedViewsParams {
  // Grid is async — these getters may return null during initial mount.
  getCurrentSnapshot: () => ViewSnapshot | null;
  // Imperative grid actions invoked when applying a view.
  applySnapshot: (snapshot: ViewSnapshot) => void;
}

interface UseSavedViewsResult {
  views: SavedView[];                   // user-saved views
  builtInViews: SavedView[];            // ships with the app
  currentView: SavedView | null;        // whichever view was most recently applied
  hasUnsavedChanges: boolean;           // current grid state diverges from currentView
  hydrated: boolean;                    // true once localStorage has been read
  applyView: (id: string) => void;
  applyCurrentView: () => void;         // re-apply currentView; used after grid is ready
  saveCurrentAsNew: (name: string, description?: string, setAsDefault?: boolean) => void;
  updateCurrent: () => void;            // overwrite current view with live snapshot
  rename: (id: string, name: string, description?: string) => void;
  deleteView: (id: string) => void;
  setDefault: (id: string) => void;
  resetCurrent: () => void;             // re-apply the current view's saved state
  // Notify the hook that the underlying grid/search state changed — used to
  // recompute `hasUnsavedChanges`.
  notifyStateChanged: () => void;
}

// PRODUCTION NOTE: swap these two helpers for fetch() calls to your views API.
// They're the only places that touch storage, so a backend swap is local.
function loadFromStorage(): { views: SavedView[]; currentId: string | null } {
  if (typeof window === "undefined") return { views: [], currentId: null };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_VIEWS);
    const views = raw ? (JSON.parse(raw) as SavedView[]) : [];
    const currentId = window.localStorage.getItem(STORAGE_KEY_CURRENT_VIEW);
    return { views, currentId };
  } catch {
    return { views: [], currentId: null };
  }
}

function saveToStorage(views: SavedView[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY_VIEWS, JSON.stringify(views));
  } catch {
    // Storage full / blocked — silently ignore in the prototype.
  }
}

function saveCurrentIdToStorage(id: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (id) window.localStorage.setItem(STORAGE_KEY_CURRENT_VIEW, id);
    else window.localStorage.removeItem(STORAGE_KEY_CURRENT_VIEW);
  } catch {
    /* ignore */
  }
}

export function useSavedViews({
  getCurrentSnapshot,
  applySnapshot,
}: UseSavedViewsParams): UseSavedViewsResult {
  const [userViews, setUserViews] = useState<SavedView[]>([]);
  const [currentViewId, setCurrentViewId] = useState<string>(DEFAULT_BUILTIN_VIEW_ID);
  const [hydrated, setHydrated] = useState(false);
  // Bumping this re-runs the "is dirty?" calculation. We can't rely on grid
  // state directly because it lives in AG Grid, not React.
  const [dirtyTick, setDirtyTick] = useState(0);

  // Rebuilt on every render — cheap, and the closure captures "now" for the
  // date-based built-ins.
  const builtInViews = useMemo(() => getBuiltInViews(), []);

  // Hydrate from localStorage on mount.
  useEffect(() => {
    const { views, currentId } = loadFromStorage();
    setUserViews(views);
    if (currentId) {
      setCurrentViewId(currentId);
    } else {
      // First-load: pick the user's default if they marked one, otherwise the
      // built-in "All vulnerabilities" view.
      const userDefault = views.find((v) => v.isDefault);
      setCurrentViewId(userDefault?.id ?? DEFAULT_BUILTIN_VIEW_ID);
    }
    setHydrated(true);
  }, []);

  const allViews = useMemo(() => [...builtInViews, ...userViews], [builtInViews, userViews]);

  const currentView = useMemo(
    () => allViews.find((v) => v.id === currentViewId) ?? builtInViews[0] ?? null,
    [allViews, currentViewId, builtInViews],
  );

  // We don't auto-apply on mount here — the table coordinates that itself
  // (it has to wait until AG Grid is fully ready). It calls applyCurrentView()
  // when both `hydrated` is true and `gridApi` is set.
  const appliedOnceRef = useRef(false);

  const persistUserViews = useCallback((views: SavedView[]) => {
    setUserViews(views);
    saveToStorage(views);
  }, []);

  const applyView = useCallback(
    (id: string) => {
      const target = allViews.find((v) => v.id === id);
      if (!target) return;
      applySnapshot({
        filterModel: target.filterModel,
        columnState: target.columnState,
        searchTerm: target.searchTerm,
      });
      setCurrentViewId(id);
      saveCurrentIdToStorage(id);
      setDirtyTick((t) => t + 1);
    },
    [allViews, applySnapshot],
  );

  const saveCurrentAsNew = useCallback(
    (name: string, description?: string, setAsDefault?: boolean) => {
      const snap = getCurrentSnapshot();
      if (!snap) return;
      const id = makeViewId();
      const trimmedName = name.trim().slice(0, 50);
      const trimmedDesc = description?.trim().slice(0, 200) || undefined;
      const next: SavedView = {
        id,
        name: trimmedName,
        description: trimmedDesc,
        filterModel: snap.filterModel,
        columnState: snap.columnState,
        searchTerm: snap.searchTerm,
        isDefault: !!setAsDefault,
      };
      // Setting isDefault flips it off on every other user view — only one
      // default at a time.
      const cleared = setAsDefault
        ? userViews.map((v) => ({ ...v, isDefault: false }))
        : userViews;
      persistUserViews([...cleared, next]);
      setCurrentViewId(id);
      saveCurrentIdToStorage(id);
      setDirtyTick((t) => t + 1);
    },
    [getCurrentSnapshot, userViews, persistUserViews],
  );

  const updateCurrent = useCallback(() => {
    if (!currentView || currentView.isBuiltIn) return;
    const snap = getCurrentSnapshot();
    if (!snap) return;
    const updated = userViews.map((v) =>
      v.id === currentView.id
        ? {
            ...v,
            filterModel: snap.filterModel,
            columnState: snap.columnState,
            searchTerm: snap.searchTerm,
          }
        : v,
    );
    persistUserViews(updated);
    setDirtyTick((t) => t + 1);
  }, [currentView, getCurrentSnapshot, userViews, persistUserViews]);

  const rename = useCallback(
    (id: string, name: string, description?: string) => {
      const trimmedName = name.trim().slice(0, 50);
      const trimmedDesc = description?.trim().slice(0, 200) || undefined;
      const updated = userViews.map((v) =>
        v.id === id ? { ...v, name: trimmedName, description: trimmedDesc } : v,
      );
      persistUserViews(updated);
    },
    [userViews, persistUserViews],
  );

  const deleteView = useCallback(
    (id: string) => {
      const target = userViews.find((v) => v.id === id);
      if (!target) return; // built-ins can't be deleted
      const updated = userViews.filter((v) => v.id !== id);
      persistUserViews(updated);
      if (currentViewId === id) {
        // Fall back to user default, then to built-in "All".
        const fallback =
          updated.find((v) => v.isDefault)?.id ?? DEFAULT_BUILTIN_VIEW_ID;
        applyView(fallback);
      }
    },
    [userViews, persistUserViews, currentViewId, applyView],
  );

  const setDefault = useCallback(
    (id: string) => {
      // Only user-created views can be the default.
      const updated = userViews.map((v) => ({ ...v, isDefault: v.id === id }));
      persistUserViews(updated);
    },
    [userViews, persistUserViews],
  );

  const resetCurrent = useCallback(() => {
    if (!currentView) return;
    applySnapshot({
      filterModel: currentView.filterModel,
      columnState: currentView.columnState,
      searchTerm: currentView.searchTerm,
    });
    setDirtyTick((t) => t + 1);
  }, [currentView, applySnapshot]);

  // Public version of resetCurrent — used by the table on grid-ready to make
  // sure the saved view actually gets applied once everything is mounted.
  const applyCurrentView = useCallback(() => {
    if (!currentView) return;
    applySnapshot({
      filterModel: currentView.filterModel,
      columnState: currentView.columnState,
      searchTerm: currentView.searchTerm,
    });
    appliedOnceRef.current = true;
    setDirtyTick((t) => t + 1);
  }, [currentView, applySnapshot]);

  const notifyStateChanged = useCallback(() => {
    setDirtyTick((t) => t + 1);
  }, []);

  // Dirty calculation — recomputed when the tick changes (i.e. AG Grid fired
  // filterChanged/sortChanged/columnVisible or the search input updated).
  const hasUnsavedChanges = useMemo(() => {
    if (!currentView) return false;
    const snap = getCurrentSnapshot();
    if (!snap) return false;
    if (snap.searchTerm !== currentView.searchTerm) return true;
    if (!filterModelsEqual(snap.filterModel, currentView.filterModel)) return true;
    if (!columnStatesEqual(snap.columnState, currentView.columnState)) return true;
    return false;
    // dirtyTick is intentionally part of the dep array — it forces this memo
    // to recompute whenever the caller signals a change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView, dirtyTick]);

  return {
    views: userViews,
    builtInViews,
    currentView,
    hasUnsavedChanges,
    hydrated,
    applyView,
    applyCurrentView,
    saveCurrentAsNew,
    updateCurrent,
    rename,
    deleteView,
    setDefault,
    resetCurrent,
    notifyStateChanged,
  };
}
