"use client";

import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";

interface LowStockInfoProps {
  name: string;
  listingCount: number;
  lowStockThreshold: number;
}

export function LowStockInfo({
  name,
  listingCount,
  lowStockThreshold,
}: LowStockInfoProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <h4 className="text-sm font-semibold">Low Stock</h4>
      </div>
      <div className="flex flex-col gap-2">
        <p className="leading-relaxed">
          <strong>{name}</strong> is scarce on the market. No online sellers
          might be available.
        </p>
        <div className="flex items-center gap-2">
          <Badge variant="destructive" className="text-xs font-medium">
            {listingCount} available
          </Badge>
          <span className="text-xs">(below {lowStockThreshold} threshold)</span>
        </div>

        <p className="text-muted-foreground text-xs leading-relaxed">
          This item is among the lowest 10% in the listing count (10th
          percentile - p10).
        </p>
      </div>
    </div>
  );
}
