import type { RangeFilterValue } from "@/lib/range-filter";
import type { ColumnFiltersState } from "@tanstack/react-table";
import * as React from "react";
import { z } from "zod";

import { COLUMN_IDS } from "@/components/columns";
import { useLocalStorage } from "@/lib/use-local-storage";

const PersistedFiltersSchema = z.object({
  price: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
    })
    .optional(),
  dust: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
    })
    .optional(),
  gold: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
    })
    .optional(),
});

type PersistedFilters = z.infer<typeof PersistedFiltersSchema>;

/**
 * Hook to persist and restore column filters.
 * Persists price, dust value, and gold fee filters; ignores name filter and any other filters.
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

      const dustFilter = columnFilters.find(
        (filter) =>
          filter.id === COLUMN_IDS.CALCULATED_DUST_VALUE && filter.value,
      );

      const goldFilter = columnFilters.find(
        (filter) => filter.id === COLUMN_IDS.GOLD_FEE && filter.value,
      );

      const filtersToUpdate: PersistedFilters = {};

      if (priceFilter?.value) {
        filtersToUpdate.price = priceFilter.value as RangeFilterValue;
      }

      if (dustFilter?.value) {
        filtersToUpdate.dust = dustFilter.value as RangeFilterValue;
      }

      if (goldFilter?.value) {
        filtersToUpdate.gold = goldFilter.value as RangeFilterValue;
      }

      if (Object.keys(filtersToUpdate).length > 0) {
        // Set the persisted filters with the active filters
        setPersistedFilters(filtersToUpdate);
      } else {
        // Clear persisted filters if there are no active filters
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
