"use client";

import type {
  ColumnFiltersState,
  ColumnSizingState,
  SortingState,
  Updater,
} from "@tanstack/react-table";
import React, { createContext, useCallback, useContext, useState } from "react";

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
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
    defaultState.columnFilters,
  );
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>(
    defaultState.columnSizing,
  );

  const updateSorting = useCallback((updater: Updater<SortingState>) => {
    setSorting(updater);
  }, []);

  const updateColumnFilters = useCallback(
    (updater: Updater<ColumnFiltersState>) => {
      setColumnFilters(updater);
    },
    [],
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
