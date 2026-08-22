"use client";

import type { Atom } from "@tanstack/react-store";
import type {
  ColumnFiltersState,
  ColumnSizingState,
  SortingState,
} from "@tanstack/react-table";
import React, { createContext, useContext } from "react";
import { useCreateAtom } from "@tanstack/react-store";

import {
  mergePersistedFilters,
  persistedFiltersFromState,
  PersistedFiltersSchema,
} from "@/lib/filters";
import { usePersistedAtom } from "@/lib/use-persisted-atom";

interface DataTableState {
  sorting: Atom<SortingState>;
  columnFilters: Atom<ColumnFiltersState>;
  columnSizing: Atom<ColumnSizingState>;
}

const defaultSorting: SortingState = [{ id: "dustPerChaos", desc: true }];

const DataTableStateContext = createContext<DataTableState | null>(null);

/**
 * Persists the columnFilters atom to localStorage. Hosts usePersistedAtom in
 * this leaf child (rendering nothing) so the provider - which wraps the whole
 * app in the root layout - isn't re-rendered on every filter change.
 */
function ColumnFiltersPersistence({
  columnFilters,
}: {
  columnFilters: Atom<ColumnFiltersState>;
}) {
  usePersistedAtom(columnFilters, {
    storageKey: "poe-udt:filters:v1",
    initialState: {},
    schema: PersistedFiltersSchema,
    debounceDelay: 300,
    toStored: persistedFiltersFromState,
    applyStored: mergePersistedFilters,
  });
  return null;
}

export function DataTableStateProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const sorting = useCreateAtom(defaultSorting);
  const columnSizing = useCreateAtom<ColumnSizingState>({});
  const columnFilters = useCreateAtom<ColumnFiltersState>([]);

  return (
    <DataTableStateContext.Provider
      value={{ sorting, columnFilters, columnSizing }}
    >
      <ColumnFiltersPersistence columnFilters={columnFilters} />
      {children}
    </DataTableStateContext.Provider>
  );
}

export function useDataTableState() {
  const ctx = useContext(DataTableStateContext);
  if (!ctx) {
    throw new Error(
      "useDataTableState must be used within DataTableStateProvider",
    );
  }
  return ctx;
}
