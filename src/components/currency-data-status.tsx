import type { ItemDataStatus } from "@/lib/item-data";
import { AlertTriangle } from "lucide-react";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type CurrencyDataStatusProps = {
  status: ItemDataStatus["currency"];
  divinePriceThreshold: number | null;
};

export function CurrencyDataStatus({
  status,
  divinePriceThreshold,
}: CurrencyDataStatusProps) {
  if (!status.usedDefaultCatalystPrice && divinePriceThreshold !== null) {
    return null;
  }

  const messages: string[] = [];

  if (status.usedDefaultCatalystPrice) {
    messages.push(
      "Catalyst calculations are using the default 1c fallback price.",
    );
  }

  if (divinePriceThreshold === null) {
    messages.push(
      "Divine price display is unavailable until currency rates recover.",
    );
  }

  return (
    <Card className="border-amber-500/40 bg-amber-50/60 dark:border-amber-400/40 dark:bg-amber-950/20">
      <CardHeader>
        <CardTitle>
          <span className="inline-flex items-center gap-2 text-amber-600 dark:text-amber-500">
            <AlertTriangle className="size-4 shrink-0" />
            Currency data is degraded
          </span>
        </CardTitle>
        <CardDescription>
          <p>{messages.join(" ")}</p>
          <p>
            If this persists, please create an issue on the app&apos;s GitHub
            repository.
          </p>
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
