"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { ColumnDef, SortDirection } from "@tanstack/react-table";
import { ArrowDown10, ArrowUp01, ArrowUpDown, Settings2 } from "lucide-react";

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
  },
  {
    accessorKey: "variant",
    header: "Variant",
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
          <Popover>
            <PopoverTrigger
              className={cn(
                column.getIsFiltered()
                  ? "bg-primary text-primary-foreground hover:bg-primary/80"
                  : "hover:bg-accent",
                "flex-none rounded-md px-2",
              )}
            >
              <Settings2 className="size-5" />
            </PopoverTrigger>
            <PopoverContent className="flex flex-col gap-8 p-6">
              <div className="grid gap-1.5">
                <div className="leading-none font-semibold">Filtering</div>
                <div className="text-muted-foreground text-sm">
                  Filter by minimum and maximum price in chaos.
                </div>
              </div>

              {/* TODO: add a reset button, and ability to turn off filtering */}
              <div className="grid gap-4">
                <Slider
                  max={100}
                  step={1}
                  value={column.getFilterValue() as number[]}
                  onValueChange={(value) => column.setFilterValue(value)}
                  minStepsBetweenThumbs={1}
                />
                <div className="flex justify-between pt-1 text-sm">
                  {(column.getFilterValue() as number[]).map((value, index) => (
                    <span key={index}>{value}</span>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      );
    },
    filterFn: "inNumberRange",
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
];
