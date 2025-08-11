"use client";

import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { Separator } from "./ui/separator";
import { AlertTriangle } from "lucide-react";

interface TradeSearchInfoProps {
  itemName?: string;
}

export function TradeSearchInfo({ itemName }: TradeSearchInfoProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-green-500 dark:text-green-400" />
        <h4 className="text-sm font-medium">Trade Search</h4>
      </div>
      <div className="flex flex-col gap-2">
        <p className="leading-relaxed">
          Search for {itemName ?? "this item"} on Path of Exile trade website.
        </p>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            Last 3 Days
          </Badge>
          <Badge variant="outline" className="text-xs">
            Live Data
          </Badge>
        </div>
        <p className="text-muted-foreground text-xs leading-relaxed">
          Does not filter by item level.
        </p>
      </div>

      <Separator />
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <h4 className="text-sm font-medium">Corrupted Items</h4>
        </div>

        <div className="flex flex-col gap-2">
          <p className="leading-relaxed">
            Corrupted items cannot have quality addded to them cheaply.
          </p>
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="text-xs">
              No Added Quality
            </Badge>
            <Badge variant="outline" className="text-xs">
              Tainted Currency
            </Badge>
          </div>

          <p className="text-muted-foreground text-xs leading-relaxed">
            However, items with corruption implicits might be inherently worth
            more.
          </p>
        </div>
      </div>
    </div>
  );
}
