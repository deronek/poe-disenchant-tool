"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import type { Item } from "@/lib/itemData";
import { createTradeLink } from "@/lib/tradeLink";
import { Row } from "@tanstack/react-table";
import { ExternalLink, Info } from "lucide-react";
import { ChaosOrbIcon } from "./chaos-orb-icon";
import { DustIcon } from "./dust-icon";
import { DustInfo } from "./dust-info";
import { ItemMarkingInfo } from "./item-marking-info";
import { TradeSearchInfo } from "./trade-search-info";
import * as React from "react";

interface MobileCardProps<TData extends Item> {
  row: Row<TData>;
  isSelected: boolean;
}

function MobileCardComponent<TData extends Item>({
  row,
  isSelected,
}: MobileCardProps<TData>) {
  const name = row.getValue<string>("name");
  const variant = row.original.variant;
  const chaos = row.getValue<number>("chaos");
  const dustValIlvl84Q20 = row.getValue<number>("dustValIlvl84Q20");
  const dustPerChaos = row.getValue<number>("dustPerChaos");
  const tradeLink = createTradeLink(name);
  const calculatedDustValue = row.original.calculatedDustValue;
  const dustConfigString =
    row.original.type === "UniqueAccessory"
      ? "Dust value calculated at ilvl84, quality0"
      : "Dust value calculated at ilvl84, quality20";

  return (
    <div
      className={`space-y-3 rounded-lg border p-4 ${
        isSelected
          ? "bg-muted/60 border-primary/30 opacity-95"
          : "bg-card hover:bg-muted/40"
      } transition-colors`}
    >
      {/* Header with selection and name */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-medium tracking-[0.015em]">{name}</h3>
          {variant && (
            <p className="text-muted-foreground truncate text-sm">{variant}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            className="mt-0.5 size-5"
            checked={isSelected}
            onCheckedChange={(v) => row.toggleSelected(!!v)}
            aria-label={`Mark ${name} as completed`}
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="size-5 p-0 text-blue-500 dark:text-blue-400"
                aria-label={`Learn more about marking ${name}`}
              >
                <Info className="size-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="max-w-[280px] text-sm"
              side="bottom"
              align="start"
            >
              <ItemMarkingInfo itemName={name} />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Price and Dust Value */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <p className="text-muted-foreground text-sm">Price</p>
          <div className="flex items-center gap-1 text-sm font-medium">
            <span>{chaos}</span>
            <ChaosOrbIcon className="h-4 w-4" />
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-sm">Dust Value</p>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1 text-sm font-medium">
              <span>{calculatedDustValue}</span>
              <DustIcon className="h-4 w-4" />
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:text-foreground size-5 p-0 text-blue-500 dark:text-blue-400"
                  aria-label={`Learn more about dust value calculation`}
                >
                  <Info className="size-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="max-w-[400px] text-sm"
                side="bottom"
                align="start"
              >
                <DustInfo />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Dust per Chaos (Primary metric) */}
      <div className="space-y-1">
        <p className="text-muted-foreground text-sm">Dust per Chaos</p>
        <div className="text-primary flex items-center gap-1 text-left text-lg font-bold">
          <span className="">{dustPerChaos}</span>
          <DustIcon className="h-5 w-5" />
          <span className="text-muted-foreground">/</span>
          <ChaosOrbIcon className="h-5 w-5" />
        </div>
      </div>

      {/* Trade Link */}
      <div className="pt-2">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-muted-foreground text-sm">Trade Search</p>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="hover:text-foreground size-5 p-0 text-blue-500 dark:text-blue-400"
                aria-label={`Learn more about trade search for ${name}`}
              >
                <Info className="size-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="max-w-[280px] text-sm"
              side="bottom"
              align="start"
            >
              <TradeSearchInfo itemName={name} />
            </PopoverContent>
          </Popover>
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="w-full justify-center gap-2"
        >
          <a
            href={tradeLink}
            target="_blank"
            rel="noreferrer"
            aria-label={`Open trade search for ${name} in new tab`}
            className="inline-flex items-center gap-2"
          >
            <ExternalLink className="size-4" />
            Trade Search
          </a>
        </Button>
      </div>
    </div>
  );
}

export const MobileCard = React.memo(
  MobileCardComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.row.id === nextProps.row.id &&
      prevProps.isSelected === nextProps.isSelected
    );
  },
) as typeof MobileCardComponent;
