import type { TotalCostDetails } from "@/lib/efficiency";

import { Item } from "@/lib/item-data";

/**
 * Client-side row model. Extends the server `Item` with fields derived from
 * user settings. Everything downstream of
 * SharedDataView — table, columns, filters, cards, toolbars — is typed on
 * ViewItem.
 */
export type ViewItem = Item & {
  efficiency: number;
  /** Only present when efficiency mode === 'total-cost'. */
  totalCostDetails: TotalCostDetails | null;
};
