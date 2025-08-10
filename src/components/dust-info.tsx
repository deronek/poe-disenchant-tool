"use client";

import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

interface DustInfoProps {
  itemType?: string;
}

export function DustInfo({ itemType }: DustInfoProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-green-600 dark:text-green-400" />
        <h4 className="text-sm font-medium">Dust Value</h4>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground text-xs leading-relaxed">
          Calculated based on item type, as applying quality varies in price.
        </p>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Weapons/Armors</Badge>
            <Badge variant="blue">ilvl84, q20</Badge>
            <Badge variant="green">Cheap Quality</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Jewellery</Badge>
            <Badge variant="blue">ilvl84, q0</Badge>
            <Badge variant="amber">Expensive Catalysts</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
