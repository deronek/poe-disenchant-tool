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
    cell: ({ row }) => {
      const name = row.getValue("name") as string;
      const variant = row.original.variant;
      return (
        <div className="">
          <p>{name}</p>
          {variant && <p className="text-muted-foreground">{variant}</p>}
        </div>
      );
    },
  },
  {
    accessorKey: "chaos",
    header: ({ column }) => {
      return (
        <div className="flex justify-between">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Chaos
            {getSortedIcon(column.getIsSorted())}
          </Button>
          <RangeFilter
            column={column}
            title="Price Range"
            description="Filter products by price range."
            min={0}
            max={600}
          />
        </div>
      );
    },
    filterFn: (row, columnId, filterValue) => {
      console.log(filterValue);
      const value = row.getValue(columnId) as number;
      return value >= filterValue.min && value <= filterValue.max;
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
    meta: {
      className: "bg-accent",
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
