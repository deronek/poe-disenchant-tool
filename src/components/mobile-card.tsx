"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Item } from "@/lib/itemData";
import { createTradeLink } from "@/lib/tradeLink";
import { Row } from "@tanstack/react-table";
import { ExternalLink, Info } from "lucide-react";
import * as React from "react";
import { ChaosOrbIcon } from "./chaos-orb-icon";
import { DustIcon } from "./dust-icon";
import { DustInfo } from "./dust-info";
import { ItemMarkingInfo } from "./item-marking-info";
import { AdvancedSettings } from "./advanced-settings-panel";
import { COLUMN_IDS } from "./columns";
import { Icon } from "./icon";
// Checkbox with memo
const SelectionCheckbox = React.memo(function SelectionCheckbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <Checkbox
      className="size-6"
      checked={checked}
      onCheckedChange={onChange}
      aria-label={label}
    />
  );
});

// Info button + popover as memo
const MarkInfoPopover = React.memo(function InfoPopover({
  name,
}: {
  name: string;
}) {
  return (
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
      <PopoverContent className="max-w-[280px] text-sm" side="left">
        <ItemMarkingInfo itemName={name} />
      </PopoverContent>
    </Popover>
  );
});

// Dust info button + popover as memo
const DustInfoPopover = React.memo(function DustInfoPopover() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="hover:text-foreground size-5 p-0 text-blue-500 dark:text-blue-400"
          aria-label="Learn more about dust value calculation"
        >
          <Info className="size-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[min(var(--radix-popover-content-available-width,9999px),calc(var(--spacing)*84))] min-w-77 text-sm"
        side="left"
      >
        <DustInfo />
      </PopoverContent>
    </Popover>
  );
});

import { League } from "@/lib/leagues";

interface MobileCardProps<TData extends Item> {
  row: Row<TData>;
  isSelected: boolean;
  advancedSettings?: AdvancedSettings;
  league: League;
}

function MobileCardComponent<TData extends Item>({
  row,
  isSelected,
  advancedSettings,
  league,
}: MobileCardProps<TData>) {
  const name = row.getValue<string>(COLUMN_IDS.NAME);
  const variant = row.original.variant;
  const icon = row.getValue<string>(COLUMN_IDS.ICON);
  const chaos = row.getValue<number>(COLUMN_IDS.CHAOS);
  const dustPerChaos = row.getValue<number>(COLUMN_IDS.DUST_PER_CHAOS);
  const tradeLink = createTradeLink(name, league, advancedSettings);
  const calculatedDustValue = row.original.calculatedDustValue;

  const handleSelect = React.useCallback(
    (v: boolean) => row.toggleSelected(!!v),
    [row],
  );

  return (
    <div
      className={`space-y-4 rounded-lg border p-5 ${
        isSelected ? "bg-muted/60 border-primary/30 opacity-95" : "bg-card"
      } transition-all`}
    >
      {/* Header with selection and name */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Icon
            src={icon}
            size={56}
            loading="lazy"
            className="flex-shrink-0 rounded-sm"
          />
          <div className="min-w-0 flex-1">
            <h3
              className="truncate font-medium tracking-[0.015em]"
              title={name}
            >
              {name}
            </h3>
            {variant && (
              <p
                className="text-muted-foreground truncate text-sm"
                title={variant}
              >
                {variant}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 pt-1.5">
          <SelectionCheckbox
            checked={isSelected}
            onChange={handleSelect}
            label={`Mark ${name} as completed`}
          />
          <MarkInfoPopover name={name}></MarkInfoPopover>
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
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-muted-foreground text-sm">Dust Value</p>
            <div className="flex items-center gap-1 text-sm font-medium">
              <span>{calculatedDustValue}</span>
              <DustIcon className="h-4 w-4" />
            </div>
          </div>
          <DustInfoPopover />
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
      <div className="pt-3">
        <Button
          asChild
          variant="default"
          className="bg-primary/10 hover:bg-primary/20 text-foreground border-input w-full justify-center gap-2 border border-solid"
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
      prevProps.isSelected === nextProps.isSelected &&
      JSON.stringify(prevProps.advancedSettings) ===
        JSON.stringify(nextProps.advancedSettings)
    );
  },
) as typeof MobileCardComponent;
