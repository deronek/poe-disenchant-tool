import type { TotalCostDetails } from "@/lib/efficiency";
import { Orbit } from "lucide-react";

import { TotalCostIcon } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface TotalCostInfoProps {
  details: TotalCostDetails;
  acquisitionChaosCost: number;
  goldCost: number;
  goldValueChaosPer10k: number;
  shouldCatalyst: boolean;
}

const numberFormatter = new Intl.NumberFormat("en", {
  maximumFractionDigits: 1,
});

export function TotalCostInfo({
  details,
  acquisitionChaosCost,
  goldCost,
  goldValueChaosPer10k,
  shouldCatalyst,
}: TotalCostInfoProps) {
  return (
    <div className="flex flex-col gap-3 text-wrap">
      <div className="flex items-center gap-2">
        <TotalCostIcon
          size={16}
          className="text-blue-600 dark:text-blue-400"
          alt=""
        />
        <h4 className="text-sm font-semibold">Total Cost Breakdown</h4>
      </div>
      <p className="text-sm leading-relaxed">
        Total Cost combines item Price with your selected Chaos valuation of the
        Gold Fee.
      </p>
      <div className="grid grid-cols-[auto_auto] gap-x-3 gap-y-2">
        <div>
          <Badge variant="secondary">Price</Badge>
        </div>
        <div>
          <Badge variant="outline">
            {numberFormatter.format(acquisitionChaosCost)} Chaos
          </Badge>
        </div>
        <div>
          <Badge variant="secondary">Gold Fee</Badge>
        </div>
        <div>
          <Badge variant="amber">{numberFormatter.format(goldCost)} Gold</Badge>
        </div>
        <div>
          <Badge variant="secondary">Gold Equivalent</Badge>
        </div>
        <div>
          <Badge variant="blue">
            {numberFormatter.format(details.goldChaosCost)} Chaos
          </Badge>
        </div>
        <div>
          <Badge variant="secondary">Total Cost</Badge>
        </div>
        <div>
          <Badge variant="green">
            {numberFormatter.format(details.effectiveChaosCost)} Chaos
          </Badge>
        </div>
      </div>
      <p className="text-muted-foreground text-xs leading-relaxed">
        Gold is valued at {numberFormatter.format(goldValueChaosPer10k)} Chaos
        per 10,000 Gold. Fees are estimates and may vary for individual
        listings.
      </p>

      {shouldCatalyst && (
        <>
          <Separator />
          <div className="flex items-center gap-2">
            <Orbit className="h-4 w-4 text-purple-500 dark:text-purple-400" />
            <h4 className="text-sm font-semibold">Catalyst Recommendation</h4>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm leading-relaxed">
              As this jewellery item has a recommended Catalyst usage, Price
              also includes the cost of 20 Catalysts.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
