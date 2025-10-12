"use client";

import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingDown } from "lucide-react";
import { Separator } from "./ui/separator";

export function DustInfo() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-green-600 dark:text-green-400" />
        <h4 className="text-sm font-semibold">Quality</h4>
      </div>
      <div className="flex flex-col gap-3">
        <p className="leading-relaxed">
          Calculated dust value is based on the item type, as applying quality
          varies in price.
        </p>

        {/* Mobile: 2 cols × 3 rows. Desktop (lg+): 3 auto-width cols × 2 rows */}
        <div className="grid grid-cols-[auto_auto_min-content] grid-rows-3 items-start justify-items-start gap-x-3 gap-y-2 lg:grid-cols-[auto_auto_auto] lg:grid-rows-2 lg:gap-x-0 lg:gap-y-2">
          {/* Left column (mobile): Weapons/Armors, ilvl84 q20, Cheap Quality */}
          <div className="col-start-1 row-start-1 lg:col-start-1 lg:row-start-1">
            <Badge variant="secondary">Weapons/Armors</Badge>
          </div>

          <div className="col-start-1 row-start-2 lg:col-start-2 lg:row-start-1">
            <Badge variant="blue">Quality 20%</Badge>
          </div>

          <div className="col-start-1 row-start-3 lg:col-start-3 lg:row-start-1">
            <Badge variant="green">Cheap Quality</Badge>
          </div>

          {/* Mobile-only vertical separator */}
          <div className="col-start-2 row-span-3 h-full items-stretch justify-center lg:hidden">
            <Separator orientation="vertical" />
          </div>
          {/* Right column (mobile): Jewellery, ilvl84 q0, Expensive Catalysts */}
          <div className="col-start-3 row-start-1 lg:col-start-1 lg:row-start-2">
            <Badge variant="outline">Jewellery</Badge>
          </div>

          <div className="col-start-3 row-start-2 lg:col-start-2 lg:row-start-2">
            <Badge variant="blue">Quality 0%</Badge>
          </div>

          <div className="col-start-3 row-start-3 lg:col-start-3 lg:row-start-2">
            <Badge variant="amber">Expensive Catalysts</Badge>
          </div>
        </div>

        <p className="text-muted-foreground text-xs leading-relaxed">
          Quality affects the dust value one-for-one — e.g., 20% quality → +20%
          dust.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <TrendingDown className="size-4 text-red-600 dark:text-red-400" />
          <h4 className="text-sm font-semibold">Item Level</h4>
        </div>
        <div className="flex flex-col gap-3">
          <p className="leading-relaxed">
            Calculations use ilvl 84, however the actual item level
            significantly impacts the dust value.
          </p>

          <div className="grid grid-cols-[auto_auto_auto] grid-rows-3 items-start justify-items-start gap-x-3 gap-y-2 lg:grid-cols-[auto_auto_auto] lg:grid-rows-2 lg:gap-x-0 lg:gap-y-2">
            {/* Left column (mobile): Best case, ilvl84 */}
            <div className="col-start-1 row-start-1 lg:col-start-1 lg:row-start-1">
              <Badge variant="secondary">Best Case</Badge>
            </div>

            <div className="col-start-1 row-start-2 lg:col-start-2 lg:row-start-1">
              <Badge variant="green">ilvl 84</Badge>
            </div>

            <div className="col-start-1 row-start-3 lg:col-start-3 lg:row-start-1">
              <Badge variant="outline">1x multiplier</Badge>
            </div>

            {/* Mobile-only vertical separator */}
            <div className="col-start-2 row-span-3 h-full items-stretch justify-center lg:hidden">
              <Separator orientation="vertical" />
            </div>
            {/* Right column (mobile): Worst case, ilvl65 */}
            <div className="col-start-3 row-start-1 lg:col-start-1 lg:row-start-2">
              <Badge variant="secondary">Worst Case</Badge>
            </div>

            <div className="col-start-3 row-start-2 lg:col-start-2 lg:row-start-2">
              <Badge variant="destructive">ilvl 65</Badge>
            </div>

            <div className="col-start-3 row-start-3 lg:col-start-3 lg:row-start-2">
              <Badge variant="outline">0.05x multiplier</Badge>
            </div>
          </div>

          <p className="text-muted-foreground text-xs leading-relaxed">
            Use <span className="font-bold">Trade</span> settings to apply item
            level filter to trade search.
          </p>
        </div>
      </div>
    </div>
  );
}
