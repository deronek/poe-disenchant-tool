import { Coins, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";

export function GoldInfo() {
  return (
    <div className="flex flex-col gap-3 text-wrap">
      <div className="flex items-center gap-2">
        <Coins className="size-4 text-yellow-600 dark:text-yellow-400" />
        <h4 className="text-sm font-semibold">Gold Fee</h4>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm leading-relaxed">
          Gold fee for asynchronous trading, based on item value.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="size-4 text-red-600 dark:text-red-400" />
          <h4 className="text-sm font-semibold">Gold Fee Modifiers</h4>
        </div>

        <p className="text-muted-foreground text-xs leading-relaxed">
          Gold fee is increased by quality, influence types, and corruption.
        </p>

        <div className="grid grid-cols-[auto_auto] gap-x-3 gap-y-2">
          <div>
            <Badge variant="secondary" className="text-xs">
              Quality
            </Badge>
          </div>
          <div>
            <Badge variant="green" className="text-xs font-medium">
              +2% per 1%
            </Badge>
          </div>

          <div>
            <Badge variant="secondary" className="text-xs">
              Influence & Corruption
            </Badge>
          </div>
          <div>
            <Badge variant="amber" className="text-xs font-medium">
              +50% per modifier
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
