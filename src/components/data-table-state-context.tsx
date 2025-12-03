"use client";

import type {
  ColumnFiltersState,
  ColumnSizingState,
  SortingState,
  Updater,
} from "@tanstack/react-table";
import React, { createContext, useCallback, useContext, useState } from "react";

import { usePersistentFilters } from "@/components/filters";
import { COLUMN_IDS } from "./columns";

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

const chaosColumnId = COLUMN_IDS.CHAOS;
const goldColumnId = COLUMN_IDS.GOLD_FEE;

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
    const timeout = window.setTimeout(() => {
      setColumnFilters((prev) => {
        const filtersToRestore = prev.filter(
          (f) =>
            f.id !== chaosColumnId &&
            f.id !== COLUMN_IDS.CALCULATED_DUST_VALUE &&
            f.id !== goldColumnId,
        );

        // If chaos filter needs to be applied
        if (persistedFilters?.price != null) {
          const chaosFilter = {
            id: chaosColumnId,
            value: persistedFilters.price,
          };
          filtersToRestore.push(chaosFilter);
        }

        // If dust filter needs to be applied
        if (persistedFilters?.dust != null) {
          const dustFilter = {
            id: COLUMN_IDS.CALCULATED_DUST_VALUE,
            value: persistedFilters.dust,
          };
          filtersToRestore.push(dustFilter);
        }

        // If gold filter needs to be applied
        if (persistedFilters?.gold != null) {
          const goldFilter = {
            id: goldColumnId,
            value: persistedFilters.gold,
          };
          filtersToRestore.push(goldFilter);
        }

        return filtersToRestore;
      });
    }, 0);
    return () => window.clearTimeout(timeout);
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
