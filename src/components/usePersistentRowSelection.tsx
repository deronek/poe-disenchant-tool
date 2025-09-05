"use client";

import type { RowSelectionState, Updater } from "@tanstack/react-table";
import * as React from "react";
import { z } from "zod";
import { useLocalStorage } from "@/lib/use-local-storage";

function idsToRowSelection(ids: readonly string[]): RowSelectionState {
  return ids.reduce<RowSelectionState>((acc, id) => {
    acc[id] = true;
    return acc;
  }, {});
}

const SelectedIdsSchema = z.array(z.string());
type SelectedIds = z.infer<typeof SelectedIdsSchema>;

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

  const [selectedIds, setSelectedIds] = useLocalStorage<SelectedIds>(
    [],
    storageKey,
    {
      debounceDelay: 300,
      schema: SelectedIdsSchema,
    },
  );

  const rowSelection = React.useMemo(
    () => idsToRowSelection(selectedIds),
    [selectedIds],
  );

  const setRowSelection = React.useCallback(
    (update: Updater<RowSelectionState>) => {
      setSelectedIds((prev) => {
        const next =
          typeof update === "function"
            ? update(idsToRowSelection(prev))
            : update;
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
