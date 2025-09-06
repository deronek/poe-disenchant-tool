"use client";

import type { ColumnFiltersState } from "@tanstack/react-table";
import * as React from "react";
import { z } from "zod";
import { useLocalStorage } from "@/lib/use-local-storage";
import type { PriceFilterValue } from "@/lib/price-filter";
import { COLUMN_IDS } from "./columns";

const PersistedFiltersSchema = z.object({
  price: z
    .object({
      min: z.number(),
      max: z.number().optional(),
    })
    .optional(),
});

type PersistedFilters = z.infer<typeof PersistedFiltersSchema>;

/**
 * Hook to persist and restore column filters.
 * Only persists price filter, ignores name filter and other filters.
 */
export function usePersistentFilters(storageKey: string) {
  if (!storageKey) {
    throw new Error("storageKey must be non-empty");
  }

  const [persistedFilters, setPersistedFilters] =
    useLocalStorage<PersistedFilters>({}, storageKey, {
      debounceDelay: 300,
      schema: PersistedFiltersSchema,
    });

  const updatePersistedFilters = React.useCallback(
    (columnFilters: ColumnFiltersState) => {
      const priceFilter = columnFilters.find(
        (filter) => filter.id === COLUMN_IDS.CHAOS && filter.value,
      );

      if (priceFilter?.value) {
        // Set the persisted filters with the price filter
        setPersistedFilters({
          price: priceFilter.value as PriceFilterValue,
        });
      } else {
        // Clear persisted filters if there's no price filter
        setPersistedFilters({});
      }
    },
    [setPersistedFilters],
  );

  return {
    persistedFilters,
    updatePersistedFilters,
  };
}
