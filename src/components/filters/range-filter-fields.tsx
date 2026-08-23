import type { ColumnId } from "@/lib/column-ids";
import type {
  FilterColumnTable,
  PersistedFilters,
  RangeFilterValue,
} from "@/lib/filters";
import type { ComponentType } from "react";

import { ChaosOrbIcon, DustIcon, GoldIcon } from "@/components/icons";
import { RANGE_FILTER_COLUMNS, useRangeFilterValue } from "@/lib/filters";

export type RangeFilterField = keyof PersistedFilters;

interface RangeFilterFieldConfig {
  columnId: ColumnId;
  icon: ComponentType<{ className?: string }>;
  /** Slider bounds and step size. */
  bounds: { min: number; max: number };
  step: number;
  /**
   * Full name used in the tab panel header and derived aria strings
   * (e.g. "Dust Value").
   */
  title: string;
  /** Short name shown on the tab trigger and the filter chip (e.g. "Dust"). */
  label: string;
}

export const RANGE_FILTER_FIELD_CONFIGS: Record<
  RangeFilterField,
  RangeFilterFieldConfig
> = {
  price: {
    columnId: RANGE_FILTER_COLUMNS.price,
    icon: ChaosOrbIcon,
    bounds: { min: 0, max: 500 },
    step: 1,
    title: "Price",
    label: "Price",
  },
  dust: {
    columnId: RANGE_FILTER_COLUMNS.dust,
    icon: DustIcon,
    bounds: { min: 2000, max: 5_000_000 },
    step: 50000,
    title: "Dust Value",
    label: "Dust",
  },
  gold: {
    columnId: RANGE_FILTER_COLUMNS.gold,
    icon: GoldIcon,
    bounds: { min: 1500, max: 80_000 },
    step: 500,
    title: "Gold Fee",
    label: "Gold",
  },
};

export const RANGE_FILTER_FIELD_LIST = Object.keys(
  RANGE_FILTER_FIELD_CONFIGS,
) as RangeFilterField[];

/**
 * One reactive subscription per configured range filter field. Hook calls are
 * spelled out because hooks cannot be called in loops; adding a field to
 * RANGE_FILTER_FIELD_CONFIGS means adding one line here.
 */
export function useRangeFilterFieldValues(
  table: FilterColumnTable,
): Record<RangeFilterField, Readonly<RangeFilterValue>> {
  return {
    price: useRangeFilterValue(
      table,
      RANGE_FILTER_FIELD_CONFIGS.price.columnId,
    ),
    dust: useRangeFilterValue(table, RANGE_FILTER_FIELD_CONFIGS.dust.columnId),
    gold: useRangeFilterValue(table, RANGE_FILTER_FIELD_CONFIGS.gold.columnId),
  };
}
