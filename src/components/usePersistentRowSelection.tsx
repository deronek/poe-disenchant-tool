"use client";

import type { RowSelectionState } from "@tanstack/react-table";
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
    { timeout: 300 },
  );

  const rowSelection = React.useMemo(() => {
    const selection: RowSelectionState = {};
    for (const id of selectedIds) {
      selection[id] = true;
    }
    return selection;
  }, [selectedIds]);

  const rowSelectionRef = React.useRef<RowSelectionState>({});
  React.useEffect(() => {
    rowSelectionRef.current = rowSelection;
  }, [rowSelection]);

  const setRowSelection = React.useCallback(
    (
      newSelection:
        | RowSelectionState
        | ((prev: RowSelectionState) => RowSelectionState),
    ) => {
      const current =
        typeof newSelection === "function"
          ? newSelection(rowSelectionRef.current)
          : newSelection;
      const newSelectedIds = Object.keys(current).filter((k) => current[k]);
      setSelectedIds(newSelectedIds);
    },
    [setSelectedIds],
  );

  const clearSelection = React.useCallback(() => {
    setSelectedIds([]);
  }, [setSelectedIds]);

  return { rowSelection, setRowSelection, clearSelection } as const;
}
