export const COLUMN_IDS = {
  ICON: "icon",
  NAME: "name",
  CHAOS: "chaos",
  CALCULATED_DUST_VALUE: "calculatedDustValue",
  DUST_PER_CHAOS: "dustPerChaos",
  EFFICIENCY: "efficiency",
  GOLD_FEE: "goldCost",
  TRADE_LINK: "tradeLink",
  SELECT: "select",
} as const;

export type ColumnId = (typeof COLUMN_IDS)[keyof typeof COLUMN_IDS];
