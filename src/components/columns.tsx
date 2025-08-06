"use client";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { createTradeLink } from "@/lib/tradeLink";
import { ColumnDef, SortDirection } from "@tanstack/react-table";
import { ArrowDown10, ArrowUp01, ArrowUpDown, Info } from "lucide-react";
import { RangeFilter } from "./range-filter";
import { ChaosOrbIcon } from "./chaos-orb-icon";

export type Item = {
  id: number;
  name: string;
  variant?: string;
  chaos: number;
  dustValIlvl84Q20: number;
  dustPerChaos: number;
};

const getSortedIcon = (isSorted: false | SortDirection) => {
  if (isSorted === false) {
    return <ArrowUpDown className="ml-2 h-4 w-4" />;
  }
  if (isSorted === "asc") {
    return <ArrowUp01 className="ml-2 h-4 w-4" />;
  }
  // desc
  return <ArrowDown10 className="ml-2 h-4 w-4" />;
};

export const columns: ColumnDef<Item>[] = [
  {
    accessorKey: "name",
    header: "Name",
    size: 180,
    cell: ({ row }) => {
      const name = row.getValue("name") as string;
      const variant = row.original.variant;
      return (
        <div className="truncate">
          <p className="truncate">{name}</p>
          {variant && (
            <p className="text-muted-foreground truncate">{variant}</p>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "chaos",
    header: ({ column }) => {
      return (
        <div className="flex items-center">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Price
            {getSortedIcon(column.getIsSorted())}
          </Button>
          <div className="ml-auto">
            <RangeFilter
              column={column}
              title="Range Filter"
              description="Filter products by price range."
              min={0}
              max={600}
            />
          </div>
        </div>
      );
    },
    size: 200,
    meta: { className: "text-right tabular-nums" },
    filterFn: (row, columnId, filterValue) => {
      console.log(filterValue);
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
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Dust Value (ilvl 84, Q20)
          {getSortedIcon(column.getIsSorted())}
        </Button>
      );
    },
    size: 200,
    meta: { className: "text-right tabular-nums" },
    cell: ({ row }) => {
      const value = row.getValue("dustValIlvl84Q20") as number;
      return <span className="block w-full text-right">{value}</span>;
    },
  },
  {
    accessorKey: "dustPerChaos",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Dust per Chaos
          {getSortedIcon(column.getIsSorted())}
        </Button>
      );
    },
    size: 160,
    meta: {
      className: "bg-accent text-right tabular-nums",
    },
    cell: ({ row }) => {
      const value = row.getValue("dustPerChaos") as number;
      return <span className="block w-full text-right">{value}</span>;
    },
  },
  {
    accessorKey: "tradeLink",
    header: () => {
      return (
        <div className="flex items-center">
          <p>Trade Link</p>
          <Tooltip>
            <TooltipTrigger className="pl-4">
              <Info />
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
        <Button asChild variant="link">
          <a href={link} target="_blank" rel="noreferrer">
            Trade
          </a>
        </Button>
      );
    },
  },
];
