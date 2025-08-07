"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { createTradeLink } from "@/lib/tradeLink";
import { ExternalLink, Info } from "lucide-react";
import { ChaosOrbIcon } from "./chaos-orb-icon";
import { DustIcon } from "./dust-icon";
import type { Item } from "@/lib/itemData";
import { Row } from "@tanstack/react-table";

interface MobileCardProps {
  row: Row<Item>;
}

export function MobileCard({ row }: MobileCardProps) {
  const name = row.getValue("name") as string;
  const variant = row.original.variant;
  const chaos = row.getValue("chaos") as number;
  const dustValIlvl84Q20 = row.getValue("dustValIlvl84Q20") as number;
  const dustPerChaos = row.getValue("dustPerChaos") as number;
  const isSelected = row.getIsSelected();
  const tradeLink = createTradeLink(name);

  return (
    <div
      className={`space-y-3 rounded-lg border p-4 ${
        isSelected
          ? "bg-muted/60 border-primary/30"
          : "bg-card hover:bg-muted/50"
      } transition-colors`}
    >
      {/* Header with selection and name */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Checkbox
            className="mt-0.5 size-5"
            checked={isSelected}
            onCheckedChange={(v) => row.toggleSelected(Boolean(v))}
            aria-label={`Mark ${name} as completed`}
          />
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
