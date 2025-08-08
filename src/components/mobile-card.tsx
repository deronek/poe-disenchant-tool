"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { createTradeLink } from "@/lib/tradeLink";
import { ExternalLink, Info } from "lucide-react";
import { ChaosOrbIcon } from "./chaos-orb-icon";
import { DustIcon } from "./dust-icon";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Item } from "@/lib/itemData";
import { Row } from "@tanstack/react-table";

interface MobileCardProps<TData extends Item> {
  row: Row<TData>;
}

export function MobileCard<TData extends Item>({
  row,
}: MobileCardProps<TData>) {
  const name = row.getValue<string>("name");
  const variant = row.original.variant;
  const chaos = row.getValue<number>("chaos");
  const dustValIlvl84Q20 = row.getValue<number>("dustValIlvl84Q20");
  const dustPerChaos = row.getValue<number>("dustPerChaos");
  const isSelected = row.getIsSelected();
  const tradeLink = createTradeLink(name);

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
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="flex items-center gap-2">
            <Checkbox
              className="mt-0.5 size-5"
              checked={isSelected}
              onCheckedChange={(v) => row.toggleSelected(!!v)}
              aria-label={`Mark ${name} as completed`}
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-foreground h-6 w-6 p-0"
                  aria-label={`Learn more about marking ${name}`}
                >
                  <Info className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                className="max-w-[280px] text-sm"
                side="bottom"
                align="start"
              >
                <p>
                  Mark items you&apos;ve already traded recently. Marks are
                  visual-only and saved to this device.
                </p>
                <p className="mt-1 text-neutral-100">
                  Use &quot;Clear marks&quot; in the toolbar to remove all
                  marks.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-medium tracking-[0.015em]">{name}</h3>
            {variant && (
              <p className="text-muted-foreground truncate text-sm">
                {variant}
              </p>
            )}
          </div>
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
          <div className="flex items-center gap-1 text-sm font-medium">
            <span>{dustValIlvl84Q20}</span>
            <DustIcon className="h-4 w-4" />
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
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground h-6 w-6 p-0"
                aria-label={`Learn more about trade search for ${name}`}
              >
                <Info className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              className="text-foreground bg-primary dark:bg-primary max-w-[280px] text-sm"
              side="bottom"
              align="start"
            >
              <p>Search for this item on Path of Exile trade website.</p>
              <p className="mt-1 text-neutral-100">
                Displays only listings from the last 3 days.
              </p>
            </TooltipContent>
          </Tooltip>
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
