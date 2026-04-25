import type { ItemDataStatus } from "@/lib/item-data";
import { AlertTriangle, Info, Orbit, TrendingDown } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { GITHUB_ISSUES_URL } from "@/lib/github";

type CurrencyDataStatusProps = {
  status: ItemDataStatus["currency"];
  divinePriceThreshold: number | null;
};

type PillProps = {
  children: React.ReactNode;
  content: React.ReactNode;
};

function StatusPill({ children, content }: PillProps) {
  return (
    <>
      {/* Desktop lg+: tooltip */}
      <span className="hidden items-center lg:inline-flex">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex cursor-help items-center gap-1">
              {children}
            </span>
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            variant="popover"
            className="max-w-xs text-sm text-wrap"
          >
            {content}
          </TooltipContent>
        </Tooltip>
      </span>

      {/* Mobile: popover */}
      <span className="inline-flex items-center lg:hidden">
        <Popover>
          <PopoverTrigger asChild>
            <span className="inline-flex cursor-pointer items-center gap-1">
              {children}
            </span>
          </PopoverTrigger>
          <PopoverContent className="max-w-xs text-sm">
            {content}
          </PopoverContent>
        </Popover>
      </span>
    </>
  );
}

const currencyContent = (
  <div className="flex flex-col gap-3">
    <div className="flex items-center gap-2">
      <TrendingDown className="size-4 text-amber-600 dark:text-amber-400" />
      <h4 className="text-sm font-semibold">Currency Rates Unavailable</h4>
    </div>
    <div className="flex flex-col gap-2">
      <p className="leading-relaxed">
        Exchange rate data could not be fetched. Divine price display is
        disabled until rates recover.
      </p>
      <p className="text-muted-foreground text-xs leading-relaxed">
        If this persists, please{" "}
        <a
          href={GITHUB_ISSUES_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          open an issue on GitHub
        </a>
        .
      </p>
    </div>
  </div>
);

const catalystContent = (
  <div className="flex flex-col gap-3">
    <div className="flex items-center gap-2">
      <Orbit className="size-4 text-blue-500 dark:text-blue-400" />
      <h4 className="text-sm font-semibold">Catalyst Price Unavailable</h4>
    </div>
    <div className="flex flex-col gap-2">
      <p className="leading-relaxed">
        Current catalyst market prices are unavailable. Price calculations are
        assuming a catalyst costs 1c.
      </p>
      <p className="text-muted-foreground text-xs leading-relaxed">
        Total price may be slightly off for items where catalyst investment is
        considered.
      </p>
    </div>
  </div>
);

export function CurrencyDataStatus({
  status,
  divinePriceThreshold,
}: CurrencyDataStatusProps) {
  const catalystDegraded = status.usedDefaultCatalystPrice;
  const currencyDegraded = divinePriceThreshold === null;

  if (!catalystDegraded && !currencyDegraded) {
    return null;
  }

  const currencyPill = currencyDegraded ? (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <span className="text-muted-foreground/50 select-none">·</span>
      <StatusPill content={currencyContent}>
        <AlertTriangle className="size-3.5 shrink-0 text-amber-600 dark:text-amber-500" />
        <span className="text-sm text-amber-600 dark:text-amber-500">
          Currency rates unavailable
        </span>
      </StatusPill>
    </span>
  ) : null;

  const catalystPill = catalystDegraded ? (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <span
        className={`text-muted-foreground/50 select-none ${currencyDegraded ? "inline" : "hidden lg:inline"}`}
      >
        ·
      </span>
      <StatusPill content={catalystContent}>
        <Info className="text-muted-foreground size-3.5 shrink-0" />
        <span className="text-muted-foreground text-sm">
          Catalyst price unavailable
        </span>
      </StatusPill>
    </span>
  ) : null;

  if (currencyDegraded && catalystDegraded) {
    // Both pills: wrap them in a single flex item so they travel together
    // relative to "Last updated", but can still wrap onto separate lines
    // internally at the very smallest screens.
    return (
      <span className="inline-flex flex-wrap items-center gap-2">
        {currencyPill}
        {catalystPill}
      </span>
    );
  }

  // Single pill: use contents so it's a direct flex item in the parent row
  return <span className="contents">{currencyPill ?? catalystPill}</span>;
}
