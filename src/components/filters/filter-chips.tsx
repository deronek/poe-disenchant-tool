import type { Item } from "@/lib/item-data";
import { Table } from "@tanstack/react-table";

import type { RangeFilterChipProps } from "./range-filter-chip";
import { COLUMN_IDS } from "@/components/data-table";
import { ChaosOrbIcon, DustIcon, GoldIcon } from "@/components/icons";
import { NameFilterChip } from "./name-filter-chip";
import { RangeFilterChip } from "./range-filter-chip";

interface FilterChipsProps<TData extends Item> {
  table: Table<TData>;
}

export function FilterChips<TData extends Item>({
  table,
}: FilterChipsProps<TData>) {
  const chaosColumn = table.getColumn(COLUMN_IDS.CHAOS);
  const dustColumn = table.getColumn(COLUMN_IDS.CALCULATED_DUST_VALUE);
  const goldColumn = table.getColumn(COLUMN_IDS.GOLD_FEE);

  const rangeFilterChips = [
    chaosColumn && {
      column: chaosColumn,
      title: "Price",
      icon: <ChaosOrbIcon />,
      testId: "price-filter-chip",
      ariaLabel: "Clear price filter",
    },
    dustColumn && {
      column: dustColumn,
      title: "Dust",
      icon: <DustIcon />,
      testId: "dust-filter-chip",
      ariaLabel: "Clear dust filter",
    },
    goldColumn && {
      column: goldColumn,
      title: "Gold",
      icon: <GoldIcon />,
      testId: "gold-filter-chip",
      ariaLabel: "Clear gold filter",
    },
  ].filter(Boolean) as RangeFilterChipProps<TData>[];

  return (
    <div className="flex flex-wrap gap-x-1">
      <NameFilterChip column={table.getColumn(COLUMN_IDS.NAME)} />
      {rangeFilterChips.map((chip, index) => (
        <RangeFilterChip key={index} {...chip} />
      ))}
    </div>
  );
}
