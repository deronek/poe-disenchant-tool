import type { AppTable } from "@/lib/table-features";
import type { ViewItem } from "@/lib/view-item";

import { MobileCard } from "./mobile-card";

interface MobileCardLayoutProps<TData extends ViewItem> {
  table: AppTable<TData>;
}

export function MobileCardLayout<TData extends ViewItem>({
  table,
}: MobileCardLayoutProps<TData>) {
  return (
    <div className="px-2 py-4 sm:px-3">
      {table.getRowModel().rows?.length ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {table.getRowModel().rows.map((row, index) => (
            <div key={row.id} className="relative">
              <MobileCard row={row} />
              {/* Subtle order indicator for tablet two-column layout */}
              <div className="text-muted-foreground/60 absolute -top-1 -right-1 hidden text-[10px] font-semibold md:block">
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
