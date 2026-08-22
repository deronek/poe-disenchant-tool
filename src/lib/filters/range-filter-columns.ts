import type { ColumnId } from "@/lib/column-ids";

import type { PersistedFilters } from "./persisted-filters";
import { COLUMN_IDS } from "@/lib/column-ids";

/**
 * Range-filtered columns, keyed by their persisted filter field name. Keys
 * are compile-checked against the persisted filters schema so the two
 * mappings can't drift apart.
 */
export const RANGE_FILTER_COLUMNS = {
  price: COLUMN_IDS.CHAOS,
  dust: COLUMN_IDS.CALCULATED_DUST_VALUE,
  gold: COLUMN_IDS.GOLD_FEE,
} as const satisfies Record<keyof PersistedFilters, ColumnId>;

/**
 * Column ids backed by range filters (price, dust, gold).
 */
export const RANGE_FILTER_COLUMN_IDS: readonly ColumnId[] =
  Object.values(RANGE_FILTER_COLUMNS);
