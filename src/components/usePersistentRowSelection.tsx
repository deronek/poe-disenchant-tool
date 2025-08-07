"use client";

import * as React from "react";
import type { RowSelectionState } from "@tanstack/react-table";

/**
 * Persist TanStack Table rowSelection to localStorage.
 * - Stores as an array of selected row ids (uniqueId strings).
 * - Restores to a RowSelectionState object.
 * - SSR safe: no localStorage access until mounted.
 */
export function usePersistentRowSelection(storageKey = "poe-udt:selected:v1") {
  const isClient = typeof window !== "undefined";

  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  // Load on mount
  React.useEffect(() => {
    if (!isClient) return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as string[] | null;
      if (Array.isArray(parsed)) {
        const restored: RowSelectionState = {};
        for (const id of parsed) restored[id] = true;
        setRowSelection(restored);
      }
    } catch {
      // ignore corrupted storage
    }
  }, [isClient, storageKey]);

  // Debounced persist
  const saveRef = React.useRef<number | null>(null);
  React.useEffect(() => {
    if (!isClient) return;
    if (saveRef.current) window.clearTimeout(saveRef.current);
    saveRef.current = window.setTimeout(() => {
      const ids = Object.entries(rowSelection)
        .filter(([, v]) => Boolean(v))
        .map(([k]) => k);
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(ids));
      } catch {
        // quota or other storage error – ignore
      }
    }, 150);
    return () => {
      if (saveRef.current) window.clearTimeout(saveRef.current);
    };
  }, [isClient, rowSelection, storageKey]);

  const clearSelection = React.useCallback(() => {
    setRowSelection({});
    if (isClient) {
      try {
        window.localStorage.removeItem(storageKey);
      } catch {
        // ignore
      }
    }
  }, [isClient, storageKey]);

  return { rowSelection, setRowSelection, clearSelection } as const;
}
