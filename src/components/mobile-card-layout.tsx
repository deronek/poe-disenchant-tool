"use client";

import { MobileCard } from "./mobile-card";
import { Table } from "@tanstack/react-table";
import type { Item } from "@/lib/itemData";
import { League } from "@/lib/leagues";

interface MobileCardLayoutProps<TData extends Item> {
  table: Table<TData>;
  advancedSettings?: {
    minItemLevel: number;
    includeCorrupted: boolean;
  };
  league: League;
}

export function MobileCardLayout<TData extends Item>({
  table,
  advancedSettings,
  league,
}: MobileCardLayoutProps<TData>) {
  return (
    <div className="px-2 py-4 sm:px-3">
      {table.getRowModel().rows?.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {table.getRowModel().rows.map((row, index) => (
            <div key={row.id} className="relative">
              <MobileCard
                row={row}
                isSelected={row.getIsSelected()}
                advancedSettings={advancedSettings}
                league={league}
              />
              {/* Subtle order indicator for tablet two-column layout */}
              <div className="text-muted-foreground/60 absolute -top-1 -right-1 hidden text-[10px] font-medium md:block">
                {index + 1}
              </div>
            </div>
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
