"use client";

import { MobileCard } from "./mobile-card";
import { Table } from "@tanstack/react-table";
import type { Item } from "@/lib/itemData";

interface MobileCardLayoutProps<TData extends Item> {
  table: Table<TData>;
}

export function MobileCardLayout<TData extends Item>({
  table,
}: MobileCardLayoutProps<TData>) {
  return (
    <div className="space-y-3 px-3 py-4">
      {table.getRowModel().rows?.length ? (
        table
          .getRowModel()
          .rows.map((row) => (
            <MobileCard
              key={row.id}
              row={row}
              isSelected={row.getIsSelected()}
            />
          ))
      ) : (
        <div className="py-8 text-center">
          <p className="text-muted-foreground">No results.</p>
        </div>
      )}
    </div>
  );
}
