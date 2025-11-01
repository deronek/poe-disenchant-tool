import type { Item } from "@/lib/itemData";
import * as React from "react";
import {
  ColumnDef,
  ColumnDefTemplate,
  HeaderContext,
} from "@tanstack/react-table";
import { ExternalLink, Info, PackageMinus } from "lucide-react";

import type { AdvancedSettings } from "./advanced-settings-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { League } from "@/lib/leagues";
import { createTradeLink } from "@/lib/tradeLink";
import { CatalystIcon } from "./catalyst-icon";
import { CatalystInfo } from "./catalyst-info";
import { ChaosOrbIcon } from "./chaos-orb-icon";
import { DustIcon } from "./dust-icon";
import { DustInfo } from "./dust-info";
import { Icon } from "./icon";
import { ItemMarkingInfo } from "./item-marking-info";
import { LowStockInfo } from "./low-stock-info";

const DustValueHeader: ColumnDefTemplate<HeaderContext<Item, unknown>> =
  React.memo(
    function DustValueHeaderComponent() {
      return (
        <div className="flex w-full flex-1 items-center">
          <p>Dust Value</p>
          <Tooltip>
            <TooltipTrigger className="ml-auto">
              <Info className="size-5 text-blue-500 dark:text-blue-400" />
            </TooltipTrigger>
            <TooltipContent className="max-w-[400px] text-sm" variant="popover">
              <DustInfo />
            </TooltipContent>
          </Tooltip>
        </div>
      );
    },
    // Force memoization as we don't use header context,
    // and tooltip context is static
    () => true,
  );

const ChaosCell: ColumnDef<Item>["cell"] = function ChaosCellComponent({
  row,
}) {
  const value = row.getValue(COLUMN_IDS.CHAOS) as number;
  return (
    <span className="inline-flex w-full justify-end gap-1">
      <CompactNumberTooltip value={value} />
      <ChaosOrbIcon />
    </span>
  );
};

const CalculatedDustValueCell: ColumnDef<Item>["cell"] =
  function CalculatedDustValueCellComponent({ row }) {
    const value = row.getValue(COLUMN_IDS.CALCULATED_DUST_VALUE) as number;
    const shouldCatalyst = row.original.shouldCatalyst;
    if (shouldCatalyst) {
      return (
        <Tooltip>
          <TooltipTrigger asChild className="ml-auto">
            <div
              className={
                "flex w-full justify-between bg-radial from-purple-400/30 to-transparent to-80%"
              }
            >
              <CatalystIcon size={24} />
              <span className="ml-auto inline-flex items-center gap-1">
                <CompactNumberTooltip value={value} />
                <DustIcon />
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-[290px]" variant="popover">
            <CatalystInfo />
          </TooltipContent>
        </Tooltip>
      );
    }
    return (
      <div className={"flex w-full justify-between"}>
        <span className="ml-auto inline-flex items-center gap-1">
          <CompactNumberTooltip value={value} />
          <DustIcon />
        </span>
      </div>
    );
  };

const DustPerChaosCell: ColumnDef<Item>["cell"] =
  function DustPerChaosCellComponent({ row }) {
    const value = row.getValue(COLUMN_IDS.DUST_PER_CHAOS) as number;
    return (
      <span className="block w-full">
        <span className="float-right inline-flex items-center gap-1 align-baseline">
          <CompactNumberTooltip value={value} />
          <DustIcon />
          <span className="text-muted-foreground">/</span>
          <ChaosOrbIcon />
        </span>
      </span>
    );
  };

const DustPerChaosPerSlotCell: ColumnDef<Item>["cell"] =
  function DustPerChaosPerSlotCellComponent({ row }) {
    const value = row.getValue(COLUMN_IDS.DUST_PER_CHAOS_PER_SLOT) as number;
    const slots = row.original.slots;

    return (
      <span className="block w-full">
        <span className="float-right inline-flex items-center gap-1 align-baseline">
          <CompactNumberTooltip value={value} />
          <DustIcon />
          <span className="text-muted-foreground">/</span>
          <ChaosOrbIcon />
          <span className="text-muted-foreground">/</span>
          <span className="min-w-9 text-left text-xs">
            {slots} slot{slots !== 1 ? "s" : ""}
          </span>
        </span>
      </span>
    );
  };

const MarkHeader: ColumnDefTemplate<HeaderContext<Item, unknown>> = React.memo(
  function MarkHeaderComponent() {
    return (
      <div className="flex w-full items-center">
        <p>Mark</p>
        <Tooltip>
          <TooltipTrigger className="ml-auto">
            <Info className="size-5 text-blue-500 dark:text-blue-400" />
          </TooltipTrigger>
          <TooltipContent className="max-w-[280px] text-sm" variant="popover">
            <ItemMarkingInfo />
          </TooltipContent>
        </Tooltip>
      </div>
    );
  },
  // Force memoization as we don't use header context,
  // and tooltip context is static
  () => true,
);

const compactFormatter = new Intl.NumberFormat("en", {
  notation: "compact",
  compactDisplay: "short",
  maximumFractionDigits: 1,
});

const standardFormatter = new Intl.NumberFormat("en", {
  notation: "standard",
  maximumFractionDigits: 1,
});

// Reusable tooltip wrapper for compact numbers
const CompactNumberTooltip = React.memo(function CompactNumberTooltip({
  value,
}: {
  value: number;
}) {
  const compact = renderCompactNumber(value);
  const full = standardFormatter.format(value);

  return (
    <Tooltip>
      <TooltipTrigger>{compact}</TooltipTrigger>
      <TooltipContent variant="popover" className="px-3 py-1.5 text-xs">
        {full}
      </TooltipContent>
    </Tooltip>
  );
});

const ItemIcon = React.memo(function ItemIcon({ src }: { src: string }) {
  return (
    <div className="flex items-center justify-center">
      <Icon src={src} size={36} loading="lazy" className="rounded-sm" />
    </div>
  );
});

export function renderCompactNumber(value: number) {
  const parts = compactFormatter.formatToParts(value);

  return (
    <span data-full-value={value}>
      {parts.map(({ type, value: partValue }, index) => {
        if (type === "compact") {
          return (
            <span key={index} className="text-muted-foreground ml-1 text-xs">
              {partValue}
            </span>
          );
        }
        return <span key={index}>{partValue}</span>;
      })}
    </span>
  );
}

export const COLUMN_IDS = {
  ICON: "icon",
  NAME: "name",
  CHAOS: "chaos",
  CALCULATED_DUST_VALUE: "calculatedDustValue",
  DUST_PER_CHAOS: "dustPerChaos",
  DUST_PER_CHAOS_PER_SLOT: "dustPerChaosPerSlot",
  TRADE_LINK: "tradeLink",
  SELECT: "select",
} as const;

export type ColumnId = (typeof COLUMN_IDS)[keyof typeof COLUMN_IDS];

export const createColumns = (
  advancedSettings: AdvancedSettings,
  lowStockThreshold: number,
  league: League,
): ColumnDef<Item>[] => {
  return [
    {
      accessorKey: COLUMN_IDS.ICON,
      header: "",
      size: 40,
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const icon = row.getValue(COLUMN_IDS.ICON) as string;
        return <ItemIcon src={icon} />;
      },
    },
    {
      accessorKey: COLUMN_IDS.NAME,
      header: "Name",
      size: 180, // Reduced from 210 to account for icon column
      filterFn: (row, _columnId, filterValue) => {
        const query = String(filterValue ?? "")
          .trim()
          .toLowerCase();
        if (query === "") return true;
        const nameVal = String(
          row.getValue(COLUMN_IDS.NAME) ?? "",
        ).toLowerCase();
        const variantVal = String(
          (row.original as Item).variant ?? "",
        ).toLowerCase();
        return nameVal.includes(query) || variantVal.includes(query);
      },
      cell: ({ row }) => {
        const name = row.getValue(COLUMN_IDS.NAME) as string;
        const variant = row.original.variant;
        return (
          <div
            className="truncate"
            title={name + (variant ? ` — ${variant}` : "")}
          >
            <p className={`truncate font-semibold tracking-[0.015em]`}>
              {name}
            </p>
            {variant && (
              <p className={`text-muted-foreground truncate`}>{variant}</p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: COLUMN_IDS.CHAOS,
      header: () => <span>Price</span>,
      size: 100,
      meta: { className: "text-right tabular-nums" },
      filterFn: (row, columnId, filterValue) => {
        if (!filterValue) return true;

        const value = row.getValue(columnId) as number;
        const minCheck = value >= filterValue.min;
        const maxCheck =
          filterValue.max === undefined || value <= filterValue.max;

        return minCheck && maxCheck;
      },
      cell: ChaosCell,
    },
    {
      accessorKey: COLUMN_IDS.CALCULATED_DUST_VALUE,
      header: DustValueHeader,
      size: 140,
      meta: { className: "text-right tabular-nums" },
      cell: CalculatedDustValueCell,
    },
    {
      accessorKey: COLUMN_IDS.DUST_PER_CHAOS,
      header: () => <span>Dust / Chaos</span>,
      size: 130,
      meta: {
        className:
          "text-right tabular-nums relative " +
          "bg-gradient-to-l from-primary/6 to-transparent dark:from-primary/7 dark:to-transparent " +
          "after:content-[''] after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-border",
      },
      cell: DustPerChaosCell,
    },
    {
      accessorKey: COLUMN_IDS.DUST_PER_CHAOS_PER_SLOT,
      header: () => <span>Dust / Chaos / Slot</span>,
      size: 160,
      meta: {
        className:
          "text-right tabular-nums bg-gradient-to-r from-primary/6 to-transparent dark:from-primary/7 dark:to-transparent",
      },
      cell: DustPerChaosPerSlotCell,
    },
    {
      id: COLUMN_IDS.TRADE_LINK,
      header: "Trade Link",
      size: 100,
      enableSorting: false,
      cell: ({ row }) => {
        const name = row.getValue(COLUMN_IDS.NAME) as string;
        const link = createTradeLink(name, league, advancedSettings);
        const listingCount = row.original.listingCount;
        const isLowStock = listingCount < lowStockThreshold;

        // Reusable link element
        const linkElement = (
          <a
            href={link}
            target="_blank"
            rel="noreferrer"
            aria-label={`Open trade search for ${name} in new tab${isLowStock ? " (low stock warning)" : ""}`}
            title={`Open trade search for ${name}`}
            className="inline-flex items-center gap-2"
          >
            <ExternalLink className="size-5" aria-hidden="true" />
            {isLowStock && (
              <Badge
                variant="amber"
                className="absolute -top-1 -right-2 size-4 border-none bg-transparent p-0"
                aria-hidden="true"
              >
                <PackageMinus />
              </Badge>
            )}
          </a>
        );

        const button = (
          <Button
            asChild
            variant="default"
            size="lg"
            className="text-primary bg-primary/10 hover:bg-primary/20 border-input hover:border-primary relative mx-auto gap-2 border border-solid"
          >
            {linkElement}
          </Button>
        );

        const content = isLowStock ? (
          <Tooltip>
            <TooltipTrigger asChild className="cursor-pointer">
              {button}
            </TooltipTrigger>
            <TooltipContent className="max-w-[280px] text-sm" variant="popover">
              <LowStockInfo
                name={name}
                listingCount={listingCount}
                lowStockThreshold={lowStockThreshold}
              />
            </TooltipContent>
          </Tooltip>
        ) : (
          button
        );

        return <div className="flex w-full flex-1 items-center">{content}</div>;
      },
    },
    {
      id: COLUMN_IDS.SELECT,
      header: MarkHeader,
      size: 80,
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const name = row.getValue(COLUMN_IDS.NAME) as string;
        return (
          <div className="flex items-center justify-center">
            <Checkbox
              className="border-primary/30 hover:border-primary/40 size-7"
              checked={row.getIsSelected()}
              onCheckedChange={(v) => row.toggleSelected(v === true)}
              aria-label={`Mark ${name} as completed`}
            />
          </div>
        );
      },
    },
  ];
};
