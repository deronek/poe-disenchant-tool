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
export function usePersistentRowSelection(storageKey = "poe-udt:selected:v1") {
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

  const setRowSelection = React.useCallback(
    (
      newSelection:
        | RowSelectionState
        | ((prev: RowSelectionState) => RowSelectionState),
    ) => {
      if (typeof newSelection === "function") {
        const updatedSelection = newSelection(rowSelection);
        const newSelectedIds = Object.entries(updatedSelection)
          .filter(([, v]) => Boolean(v))
          .map(([k]) => k);
        setSelectedIds(newSelectedIds);
        return;
      }

      const newSelectedIds = Object.entries(newSelection)
        .filter(([, v]) => Boolean(v))
        .map(([k]) => k);
      setSelectedIds(newSelectedIds);
    },
    [rowSelection, setSelectedIds],
  );

  const clearSelection = React.useCallback(() => {
    setSelectedIds([]);
  }, [setSelectedIds]);

  return { rowSelection, setRowSelection, clearSelection } as const;
}
