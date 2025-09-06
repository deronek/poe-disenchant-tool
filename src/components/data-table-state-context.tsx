"use client";

import type {
  ColumnFiltersState,
  ColumnSizingState,
  SortingState,
  Updater,
} from "@tanstack/react-table";
import React, { createContext, useCallback, useContext, useState } from "react";
import { usePersistentFilters } from "./use-persistent-filters";

interface DataTableState {
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  columnSizing: ColumnSizingState;
  updateSorting: (updater: Updater<SortingState>) => void;
  updateColumnFilters: (updater: Updater<ColumnFiltersState>) => void;
  updateColumnSizing: (updater: Updater<ColumnSizingState>) => void;
}

const defaultState: DataTableState = {
  sorting: [{ id: "dustPerChaos", desc: true }],
  columnFilters: [],
  columnSizing: {},
  updateSorting: () => {},
  updateColumnFilters: () => {},
  updateColumnSizing: () => {},
};

const DataTableStateContext = createContext<DataTableState>(defaultState);

export function DataTableStateProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sorting, setSorting] = useState<SortingState>(defaultState.sorting);
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>(
    defaultState.columnSizing,
  );

  const { persistedFilters, updatePersistedFilters } =
    usePersistentFilters("poe-udt:filters:v1");

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
    defaultState.columnFilters,
  );

  // Restore persisted filters after mount
  React.useEffect(() => {
    // This write needs to be deferred.
    // As the provider is used in the layout (because it needs to persist state between league pages),
    // by the time the data table renders, filter value is already populated from localStorage,
    // which triggers hydration warnings.
    window.setTimeout(() => {
      setColumnFilters((prev) => {
        const persistedPrice = persistedFilters?.price;

        // If chaos filter needs to be applied
        if (persistedPrice != null) {
          const chaosFilter = { id: "chaos", value: persistedPrice };
          return [...prev.filter((f) => f.id !== "chaos"), chaosFilter];
        }

        // Otherwise, strip chaos filter if present
        return prev.filter((f) => f.id !== "chaos");
      });
    }, 0);
  }, [persistedFilters]);

  const updateSorting = useCallback((updater: Updater<SortingState>) => {
    setSorting(updater);
  }, []);

  const updateColumnFilters = useCallback(
    (updater: Updater<ColumnFiltersState>) => {
      setColumnFilters((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        updatePersistedFilters(next);
        return next;
      });
    },
    [updatePersistedFilters],
  );

  const updateColumnSizing = useCallback(
    (updater: Updater<ColumnSizingState>) => {
      setColumnSizing(updater);
    },
    [],
  );

  return (
    <DataTableStateContext.Provider
      value={{
        sorting,
        columnFilters,
        columnSizing,
        updateSorting,
        updateColumnFilters,
        updateColumnSizing,
      }}
    >
      {children}
    </DataTableStateContext.Provider>
  );
}

export function useDataTableState() {
  return useContext(DataTableStateContext);
}
