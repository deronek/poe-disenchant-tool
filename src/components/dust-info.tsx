"use client";

import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { Separator } from "./ui/separator";

export function DustInfo() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-green-600 dark:text-green-400" />
        <h4 className="text-sm font-medium">Dust Value</h4>
      </div>
      <div className="flex flex-col gap-3">
        <p className="leading-relaxed">
          Calculated based on item type, as applying quality varies in price.
        </p>

        {/* Mobile: 2 cols × 3 rows. Desktop (md+): 3 auto-width cols × 2 rows */}
        <div className="grid grid-cols-[auto_min-content_auto] grid-rows-3 items-start justify-items-start gap-x-6 gap-y-2 md:grid-cols-[auto_auto_auto] md:grid-rows-2 md:gap-x-0 md:gap-y-2">
          {/* Left column (mobile): Weapons/Armors, ilvl84 q20, Cheap Quality */}
          <div className="col-start-1 row-start-1 md:col-start-1 md:row-start-1">
            <Badge variant="secondary">Weapons/Armors</Badge>
          </div>

          <div className="col-start-1 row-start-2 md:col-start-2 md:row-start-1">
            <Badge variant="blue">ilvl84, q20</Badge>
          </div>

          <div className="col-start-1 row-start-3 md:col-start-3 md:row-start-1">
            <Badge variant="green">Cheap Quality</Badge>
          </div>

          {/* Mobile-only vertical separator */}
          <div className="col-start-2 row-span-3 h-full items-stretch justify-center md:hidden">
            <Separator orientation="vertical" />
          </div>
          {/* Right column (mobile): Jewellery, ilvl84 q0, Expensive Catalysts */}
          <div className="col-start-3 row-start-1 md:col-start-1 md:row-start-2">
            <Badge variant="outline">Jewellery</Badge>
          </div>

          <div className="col-start-3 row-start-2 md:col-start-2 md:row-start-2">
            <Badge variant="blue">ilvl84, q0</Badge>
          </div>

          <div className="col-start-3 row-start-3 md:col-start-3 md:row-start-2">
            <Badge variant="amber">Expensive Catalysts</Badge>
          </div>
        </div>

        <p className="text-muted-foreground text-xs leading-relaxed">
          Quality affects dust value one-for-one — e.g., 20% quality → +20%
          dust.
        </p>
      </div>
    </div>
  );
}
