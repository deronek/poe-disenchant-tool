"use client";

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
import { ExternalLink, Info } from "lucide-react";
import * as React from "react";
import { ChaosOrbIcon } from "./chaos-orb-icon";
import { DustIcon } from "./dust-icon";
import { DustInfo } from "./dust-info";
import { ItemMarkingInfo } from "./item-marking-info";

import type { AdvancedSettings } from "./advanced-settings-panel";

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
  NAME: "name",
  CHAOS: "chaos",
  CALCULATED_DUST_VALUE: "calculatedDustValue",
  DUST_PER_CHAOS: "dustPerChaos",
  TRADE_LINK: "tradeLink",
  SELECT: "select",
} as const;

export type ColumnId = (typeof COLUMN_IDS)[keyof typeof COLUMN_IDS];

import { League } from "@/lib/leagues";

export const createColumns = (
  advancedSettings: AdvancedSettings,
  league: League,
): ColumnDef<Item>[] => [
  {
    accessorKey: COLUMN_IDS.NAME,
    header: "Name",
    size: 210,
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
          <p className={`truncate font-medium tracking-[0.015em]`}>{name}</p>
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
    size: 110,
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
        <span className="block w-full">
          <span className="float-right inline-flex items-center gap-1">
            <span>{value}</span>
            <ChaosOrbIcon />
          </span>
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
            <span>{value}</span>
            <DustIcon />
          </span>
        </span>
      );
    },
  },
  {
    accessorKey: COLUMN_IDS.DUST_PER_CHAOS,
    header: () => <span>Dust per Chaos</span>,
    size: 140,
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
            <span>{value}</span>
            <DustIcon />
            <span className="text-muted-foreground">/</span>
            <ChaosOrbIcon />
          </span>
        </span>
      );
    },
  },
  {
    id: COLUMN_IDS.TRADE_LINK,
    header: "Trade Link",
    size: 110,
    enableSorting: false,
    cell: ({ row }) => {
      const name = row.getValue(COLUMN_IDS.NAME) as string;
      const link = createTradeLink(name, league, advancedSettings);
      return (
        <div className="flex w-full flex-1 items-center">
          <Button
            asChild
            variant="default"
            size="icon"
            className="text-primary bg-primary/10 hover:bg-primary/20 hover:outline-primary mx-auto size-10 outline-1 hover:outline-solid"
          >
            <a
              href={link}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open trade search for ${name} in new tab`}
              title={`Open trade search for ${name}`}
              className="inline-flex items-center"
            >
              <ExternalLink className="size-5" aria-hidden="true" />
            </a>
          </Button>
        </div>
      );
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
            onCheckedChange={(v) => row.toggleSelected(Boolean(v))}
            aria-label={`Mark ${name} as completed`}
          />
        </div>
      );
    },
  },
];
