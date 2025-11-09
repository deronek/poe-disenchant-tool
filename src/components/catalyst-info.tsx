import { DollarSign, Orbit } from "lucide-react";

import { Badge } from "@/components/ui/badge";

export function CatalystInfo() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Orbit className="h-4 w-4 text-purple-500 dark:text-purple-400" />
        <h4 className="text-sm font-semibold">Catalyst Recommendation</h4>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm leading-relaxed">
          This jewellery item should be valuable enough to justify catalyst
          investment.
        </p>

        <div className="grid grid-cols-[auto_auto] gap-x-3 gap-y-2">
          <div>
            <Badge variant="secondary">Investment</Badge>
          </div>
          <div>
            <Badge variant="outline">20 Catalysts</Badge>
          </div>

          <div>
            <Badge variant="secondary">Returns</Badge>
          </div>
          <div>
            <Badge variant="green">+40% Dust</Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 flex-none text-green-600 dark:text-green-400" />
          <p className="text-muted-foreground text-xs leading-relaxed text-pretty">
            Use cheapest catalyst available on the market.
          </p>
        </div>
      </div>
    </div>
  );
}
