"use client";

import { MobileCard } from "./mobile-card";
import { Table } from "@tanstack/react-table";
import type { Item } from "@/lib/itemData";

interface MobileCardLayoutProps<TData extends Item> {
  table: Table<TData>;
  advancedSettings?: {
    minItemLevel: number;
    includeCorrupted: boolean;
  };
}

export function MobileCardLayout<TData extends Item>({
  table,
  advancedSettings,
}: MobileCardLayoutProps<TData>) {
  return (
    <div className="px-3 py-4">
      {table.getRowModel().rows?.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {table.getRowModel().rows.map((row) => (
            <MobileCard
              key={row.id}
              row={row}
              isSelected={row.getIsSelected()}
              advancedSettings={advancedSettings}
            />
          ))}
        </div>
      ) : (
        <div className="py-8 text-center">
          <p className="text-muted-foreground">No results.</p>
        </div>
      )}
    </div>
  );
}
