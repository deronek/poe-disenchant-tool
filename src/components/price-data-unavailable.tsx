import { AlertTriangle } from "lucide-react";

export function PriceDataUnavailable() {
  return (
    <section
      aria-labelledby="price-data-unavailable-title"
      className="border-border bg-muted/30 mt-4 flex gap-3 rounded-lg border p-4"
    >
      <AlertTriangle
        aria-hidden="true"
        className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-500"
      />
      <div className="space-y-1">
        <h2 id="price-data-unavailable-title" className="font-semibold">
          Price data unavailable
        </h2>
        <p className="text-muted-foreground text-sm">
          poe.ninja returned no usable prices when this page was generated. The
          page will update automatically after the service recovers.
        </p>
      </div>
    </section>
  );
}
