"use client";

import { MobileCard } from "./mobile-card";
import { Table } from "@tanstack/react-table";

interface MobileCardLayoutProps<TData> {
  table: Table<TData>;
}

export function MobileCardLayout<TData>({
  table,
}: MobileCardLayoutProps<TData>) {
  return (
    <div className="space-y-4 p-4">
      {table.getRowModel().rows?.length ? (
        table
          .getRowModel()
          .rows.map((row) => <MobileCard key={row.id} row={row} />)
      ) : (
        <div className="py-8 text-center">
          <p className="text-muted-foreground">No results.</p>
        </div>
      )}
    </div>
  );
}
