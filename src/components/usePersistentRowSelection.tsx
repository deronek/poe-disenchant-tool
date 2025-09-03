"use client";

import type { RowSelectionState, Updater } from "@tanstack/react-table";
import * as React from "react";
import { useLocalStorage } from "@/lib/use-local-storage";

/**
 * Persist TanStack Table rowSelection to localStorage.
 * - Stores as an array of selected row ids (uniqueId strings).
 * - Restores to a RowSelectionState object.
 * - SSR safe: no localStorage access until mounted.
 */
export function usePersistentRowSelection(storageKey: string) {
  if (!storageKey) {
    throw new Error("storageKey must be non-empty");
  }

  const [selectedIds, setSelectedIds] = useLocalStorage<string[]>(
    [],
    storageKey,
    { debounceDelay: 300 },
  );

  const rowSelection = React.useMemo(() => {
    const selection: RowSelectionState = {};
    for (const id of selectedIds) {
      selection[id] = true;
    }
    return selection;
  }, [selectedIds]);

  const setRowSelection = React.useCallback(
    (update: Updater<RowSelectionState>) => {
      setSelectedIds((prev) => {
        const prevSelection = Object.fromEntries(
          prev.map((id) => [id, true] as const),
        ) as RowSelectionState;
        const next =
          typeof update === "function" ? update(prevSelection) : update;
        return Object.entries(next)
          .filter(([, v]) => v)
          .map(([k]) => k);
      });
    },
    [setSelectedIds],
  );

  const clearSelection = React.useCallback(() => {
    setSelectedIds([]);
  }, [setSelectedIds]);

  return { rowSelection, setRowSelection, clearSelection } as const;
}
