"use client";

import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

export function DustInfo() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-green-600 dark:text-green-400" />
        <h4 className="text-sm font-medium">Dust Value</h4>
      </div>
      <div className="flex flex-col gap-2">
        <p className="leading-relaxed">
          Calculated based on item type, as applying quality varies in price.
        </p>
        <div className="flex gap-6">
          <div className="flex flex-col gap-1">
            <Badge variant="secondary">Weapons/Armors</Badge>
            <Badge variant="outline">Jewellery</Badge>
          </div>
          <div className="flex flex-col gap-1">
            <Badge variant="blue">ilvl84, q20</Badge>
            <Badge variant="blue">ilvl84, q0</Badge>
          </div>
          <div className="flex flex-col gap-1">
            <Badge variant="green">Cheap Quality</Badge>
            <Badge variant="amber">Expensive Catalysts</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
