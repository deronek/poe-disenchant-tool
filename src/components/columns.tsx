import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Item } from "@/lib/itemData";
import { createTradeLink } from "@/lib/tradeLink";
import {
  ColumnDef,
  ColumnDefTemplate,
  HeaderContext,
} from "@tanstack/react-table";
import { ExternalLink, Info, PackageMinus } from "lucide-react";
import * as React from "react";
import { ChaosOrbIcon } from "./chaos-orb-icon";
import { DustIcon } from "./dust-icon";
import { DustInfo } from "./dust-info";
import { Icon } from "./icon";
import { ItemMarkingInfo } from "./item-marking-info";
import { LowStockInfo } from "./low-stock-info";

import type { AdvancedSettings } from "./advanced-settings-panel";

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
function CompactNumberTooltip({
  value,
  children,
}: {
  value: number;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger>{children}</TooltipTrigger>
      <TooltipContent variant="popover" className="px-3 py-1.5 text-xs">
        {standardFormatter.format(value)}
      </TooltipContent>
    </Tooltip>
  );
}

export function renderCompactNumber(value: number) {
  const parts = compactFormatter.formatToParts(value);

  return (
    <>
      {parts.map(({ type, value }, index) => {
        if (type === "compact") {
          return (
            <span key={index} className="text-muted-foreground ml-1 text-xs">
              {value}
            </span>
          );
        }
        return <span key={index}>{value}</span>;
      })}
    </>
  );
}

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
            <TooltipContent className="text-sm" variant="popover">
              <DustInfo />
            </TooltipContent>
          </Tooltip>
        </div>
      );
    },
    () => true,
  );

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
  () => true,
);

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

import { League } from "@/lib/leagues";

export const createColumns = (
  advancedSettings: AdvancedSettings,
  lowStockThreshold: number,
  league: League,
): ColumnDef<Item>[] => [
  {
    accessorKey: COLUMN_IDS.ICON,
    header: "",
    size: 40,
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }) => {
      const icon = row.getValue(COLUMN_IDS.ICON) as string;
      return (
        <div className="flex items-center justify-center">
          <Icon src={icon} size={36} loading="lazy" className="rounded-sm" />
        </div>
      );
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
      const nameVal = String(row.getValue(COLUMN_IDS.NAME) ?? "").toLowerCase();
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
          <p className={`truncate font-semibold tracking-[0.015em]`}>{name}</p>
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
    cell: ({ row }) => {
      const value = row.getValue(COLUMN_IDS.CHAOS) as number;

      return (
        <span className="inline-flex w-full justify-end gap-1">
          <CompactNumberTooltip value={value}>
            <span>{renderCompactNumber(value)}</span>
          </CompactNumberTooltip>
          <ChaosOrbIcon />
        </span>
      );
    },
  },
  {
    accessorKey: COLUMN_IDS.CALCULATED_DUST_VALUE,
    header: DustValueHeader,
    size: 140,
    meta: { className: "text-right tabular-nums" },
    cell: ({ row }) => {
      const value = row.getValue(COLUMN_IDS.CALCULATED_DUST_VALUE) as number;
      return (
        <span className="block w-full">
          <span className="float-right inline-flex items-center gap-1">
            <CompactNumberTooltip value={value}>
              <span>{renderCompactNumber(value)}</span>
            </CompactNumberTooltip>
            <DustIcon />
          </span>
        </span>
      );
    },
  },
  {
    accessorKey: COLUMN_IDS.DUST_PER_CHAOS,
    header: () => <span>Dust / Chaos</span>,
    size: 130,
    meta: {
      className:
        "text-right tabular-nums relative " +
        "bg-primary/3 dark:bg-primary/5 " +
        "shadow-[inset_10px_0_12px_-14px_rgba(0,0,0,0.12)] " +
        "dark:shadow-[inset_10px_0_12px_-12px_rgba(0,0,0,0.8)] " +
        "after:content-[''] after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-border",
    },
    cell: ({ row }) => {
      const value = row.getValue(COLUMN_IDS.DUST_PER_CHAOS) as number;
      return (
        <span className="block w-full">
          <span className="float-right inline-flex items-center gap-1 align-baseline">
            <CompactNumberTooltip value={value}>
              <span>{renderCompactNumber(value)}</span>
            </CompactNumberTooltip>
            <DustIcon />
            <span className="text-muted-foreground">/</span>
            <ChaosOrbIcon />
          </span>
        </span>
      );
    },
  },
  {
    accessorKey: COLUMN_IDS.DUST_PER_CHAOS_PER_SLOT,
    header: () => <span>Dust / Chaos / Slot</span>,
    size: 160,
    meta: {
      className:
        "text-right tabular-nums relative " +
        "bg-primary/3 dark:bg-primary/5 " +
        "shadow-[inset_10px_0_12px_-14px_rgba(0,0,0,0.12)] " +
        "dark:shadow-[inset_10px_0_12px_-12px_rgba(0,0,0,0.8)] " +
        "after:content-[''] after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-border",
    },
    cell: ({ row }) => {
      const value = row.getValue(COLUMN_IDS.DUST_PER_CHAOS_PER_SLOT) as number;
      const slots = row.original.slots;

      return (
        <span className="block w-full">
          <span className="float-right inline-flex items-center gap-1 align-baseline">
            <CompactNumberTooltip value={value}>
              <span>{renderCompactNumber(value)}</span>
            </CompactNumberTooltip>
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
    },
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
            className="size-6"
            checked={row.getIsSelected()}
            onCheckedChange={(v) => row.toggleSelected(v === true)}
            aria-label={`Mark ${name} as completed`}
          />
        </div>
      );
    },
  },
];
