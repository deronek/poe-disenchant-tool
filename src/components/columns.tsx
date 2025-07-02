"use client";

import { ColumnDef, SortDirection } from "@tanstack/react-table";
import { Button } from "./ui/button";
import { ArrowUp01, ArrowDown10, ArrowUpDown } from "lucide-react";

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
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Chaos
          {getSortedIcon(column.getIsSorted())}
        </Button>
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
