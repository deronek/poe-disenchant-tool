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
        <Sparkles className="h-4 w-4 text-green-500 dark:text-green-400" />
        <h4 className="text-sm font-medium">Dust Value</h4>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground text-xs leading-relaxed">
          Calculated by item type with specific requirements:
        </p>
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <Badge variant="secondary" className="text-xs">
              Unique Weapons/Armors: ilvl84, quality20
            </Badge>
            <Badge
              variant="outline"
              className="text-xs text-green-600 dark:text-green-400"
            >
              Cheap Quality
            </Badge>
          </div>
          <div className="flex flex-col gap-1">
            <Badge variant="outline" className="text-xs">
              Unique Jewelry: ilvl84, quality0
            </Badge>
            <Badge
              variant="secondary"
              className="text-xs text-amber-600 dark:text-amber-400"
            >
              Expensive Catalysts
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
