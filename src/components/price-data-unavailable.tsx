import type { League } from "@/lib/leagues";

import { CurrencyDataStatus } from "@/components/currency-data-status";
import { SharedDataView } from "@/components/shared-data-view";

export function PriceDataUnavailable({ league }: { league: League }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="font-italic text-muted-foreground inline-flex flex-wrap items-center gap-x-2 text-sm">
        <CurrencyDataStatus
          status={{
            usedDefaultCatalystPrice: false,
            usedDefaultDivineRate: false,
          }}
          priceDataUnavailable
        />
      </div>
      <section className="py-1">
        <SharedDataView
          items={[]}
          league={league}
          lowStockThreshold={1}
          divinePriceThreshold={null}
        />
      </section>
    </div>
  );
}
