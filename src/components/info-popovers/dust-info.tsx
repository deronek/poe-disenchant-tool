import { Sparkles, TrendingDown } from "lucide-react";

import { Badge } from "@/components/ui/badge";

export function DustInfo() {
  return (
    <div className="flex flex-col gap-3 text-wrap">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-green-600 dark:text-green-400" />
        <h4 className="text-sm font-semibold">Item Quality</h4>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm leading-relaxed">
          Dust value considers optimal quality investment based on real-time
          catalyst pricing.
        </p>

        <div className="grid grid-cols-[auto_auto] gap-x-3 gap-y-2">
          <div>
            <Badge variant="secondary">Weapons & Armors</Badge>
          </div>
          <div>
            <Badge variant="green">Always Quality to 20%</Badge>
          </div>
          <div>
            <Badge variant="secondary">Quivers</Badge>
          </div>
          <div>
            <Badge variant="amber">Cannot Have Quality</Badge>
          </div>
          <div>
            <Badge variant="secondary">Jewellery</Badge>
          </div>
          <div>
            <Badge variant="purple">Smart Quality Investment</Badge>
          </div>
        </div>

        <p className="text-muted-foreground space-y-1 text-xs leading-relaxed">
          <span className="block">
            • Dust scales 2:1 with quality — 20% quality → +40% dust
          </span>
          <span className="block">
            • Jewellery quality is considered using the cheapest catalyst on the
            market
          </span>
          <span className="block">
            • Items worth catalyst investment are highlighted in purple
          </span>
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <TrendingDown className="size-4 text-red-600 dark:text-red-400" />
          <h4 className="text-sm font-semibold">Item Level</h4>
        </div>

        <div className="grid grid-cols-[auto_auto] gap-x-3 gap-y-2">
          <div>
            <Badge variant="secondary">Best Case</Badge>
          </div>
          <div>
            <Badge variant="green">ilvl 84 (1x)</Badge>
          </div>

          <div>
            <Badge variant="secondary">Worst Case</Badge>
          </div>
          <div>
            <Badge variant="red">ilvl 65 (0.05x)</Badge>
          </div>
        </div>

        <p className="text-muted-foreground text-xs leading-relaxed">
          Use <strong>Trade</strong> settings to apply item level filters.
        </p>
      </div>
    </div>
  );
}
