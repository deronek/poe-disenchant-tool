"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { createTradeLink } from "@/lib/tradeLink";
import { ColumnDef } from "@tanstack/react-table";
import { Info, ExternalLink } from "lucide-react";
import { ChaosOrbIcon } from "./chaos-orb-icon";
import { DustIcon } from "./dust-icon";

export type Item = {
  id: number;
  name: string;
  variant?: string;
  chaos: number;
  dustValIlvl84Q20: number;
  dustPerChaos: number;
};

export const columns: ColumnDef<Item>[] = [
  {
    accessorKey: "name",
    header: "Name",
    size: 210,
    // Make the Name column filter match both name and variant when a filter value is provided.
    filterFn: (row, _columnId, filterValue) => {
      const query = String(filterValue ?? "")
        .trim()
        .toLowerCase();
      if (query === "") return true;
      const nameVal = String(row.getValue("name") ?? "").toLowerCase();
      const variantVal = String(
        (row.original as Item).variant ?? "",
      ).toLowerCase();
      return nameVal.includes(query) || variantVal.includes(query);
    },
    cell: ({ row }) => {
      const name = row.getValue("name") as string;
      const variant = row.original.variant;
      return (
        <div
          className="truncate"
          title={name + (variant ? ` — ${variant}` : "")}
        >
          <p className="truncate font-medium tracking-[0.015em]">{name}</p>
          {variant && (
            <p className="text-muted-foreground truncate">{variant}</p>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "chaos",
    header: ({}) => {
      return <span>Price</span>;
    },
    size: 120,
    meta: { className: "text-right tabular-nums" },
    filterFn: (row, columnId, filterValue) => {
      const value = row.getValue(columnId) as number;
      return value >= filterValue.min && value <= filterValue.max;
    },
    cell: ({ row }) => {
      const value = row.getValue("chaos") as number;
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
    accessorKey: "dustValIlvl84Q20",
    header: ({}) => {
      return <span>Dust Value (ilvl 84, Q20)</span>;
    },
    size: 140,
    meta: { className: "text-right tabular-nums" },
    cell: ({ row }) => {
      const value = row.getValue("dustValIlvl84Q20") as number;
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
    accessorKey: "dustPerChaos",
    header: ({}) => {
      return <span>Dust per Chaos</span>;
    },
    size: 160,
    meta: {
      className:
        "text-right tabular-nums sticky left-0 z-10 " +
        "bg-primary/3 dark:bg-primary/5 " +
        "shadow-[inset_10px_0_12px_-14px_rgba(0,0,0,0.12)] " +
        "dark:shadow-[inset_10px_0_12px_-12px_rgba(0,0,0,0.8)] " +
        "after:content-[''] after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-border",
    },
    cell: ({ row }) => {
      const value = row.getValue("dustPerChaos") as number;
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
    accessorKey: "tradeLink",
    header: () => {
      return (
        <div className="flex w-full flex-1 items-center">
          <p>Trade Link</p>
          <Tooltip>
            <TooltipTrigger className="ml-auto">
              <Info className="size-5" />
            </TooltipTrigger>
            <TooltipContent>
              Search for this item on Path of Exile trade website, displaying
              only listing from last 3 days.
            </TooltipContent>
          </Tooltip>
        </div>
      );
    },
    size: 140,
    cell: ({ row }) => {
      const name = row.getValue("name") as string;
      const link = createTradeLink(name);
      return (
        <Button
          asChild
          variant="ghost"
          className="text-primary hover:text-primary focus:text-primary hover:border-primary/70 focus:border-primary/70 hover:bg-primary/5 focus:bg-primary/10 aspect-square border border-transparent transition-colors"
        >
          <a
            href={link}
            target="_blank"
            rel="noreferrer"
            aria-label={`Open trade search for ${name} in new tab`}
            title={`Open trade search for ${name}`}
            className="inline-flex items-center"
          >
            <ExternalLink
              className="size-4 align-baseline"
              aria-hidden="true"
            />
          </a>
        </Button>
      );
    },
    enableSorting: false,
  },
];
