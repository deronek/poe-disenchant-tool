import * as React from "react";
import { Row } from "@tanstack/react-table";
import { ExternalLink, Info, Orbit, PackageMinus } from "lucide-react";

import { EfficiencyUnit, useEfficiencySettings } from "@/components/efficiency";
import { ChaosOrbIcon, DustIcon, GoldIcon, Icon } from "@/components/icons";
import {
  CatalystInfo,
  DustInfo,
  GoldInfo,
  ItemMarkingInfo,
  LowStockInfo,
  TotalCostInfo,
} from "@/components/info-popovers";
import { useLeagueSession } from "@/components/league-session-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTradeLink } from "@/components/use-trade-link";
import { COLUMN_IDS } from "@/lib/column-ids";
import { EFFICIENCY_MODES } from "@/lib/efficiency";
import { ViewItem } from "@/lib/view-item";

// Compact number formatter for mobile cards
const compactFormatterGlobal = new Intl.NumberFormat("en", {
  notation: "standard",
  maximumFractionDigits: 1,
});

const compactFormatterPrice = new Intl.NumberFormat("en", {
  notation: "standard",
  maximumFractionDigits: 2,
});

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
      className="border-primary/30 hover:border-primary/40 size-7"
      checked={checked}
      onCheckedChange={(v) => onChange(v === true)}
      aria-label={label}
    />
  );
});

// Info button + popover as memo
const MarkInfoPopover = React.memo(function InfoPopover() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="size-6 p-0 text-blue-600 dark:text-blue-400"
          aria-label="Learn more about item marking"
        >
          <Info className="size-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="max-w-[280px] text-sm" side="left">
        <ItemMarkingInfo />
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
          className="hover:text-foreground size-6 p-0 text-blue-600 dark:text-blue-400"
          aria-label="Learn more about dust value calculation"
        >
          <Info className="size-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[min(var(--radix-popover-content-available-width,9999px),calc(var(--spacing)*84))] min-w-77 text-sm"
        side="bottom"
      >
        <DustInfo />
      </PopoverContent>
    </Popover>
  );
});

// Gold info button + popover as memo
const GoldInfoPopover = React.memo(function GoldInfoPopover() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="hover:text-foreground size-6 p-0 text-blue-600 dark:text-blue-400"
          aria-label="Learn more about gold fee"
        >
          <Info className="size-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[min(var(--radix-popover-content-available-width,9999px),calc(var(--spacing)*84))] min-w-77 text-sm"
        side="left"
      >
        <GoldInfo />
      </PopoverContent>
    </Popover>
  );
});

function TotalCostInfoPopover({
  itemName,
  acquisitionChaosCost,
  goldCost,
  goldValueChaosPer10k,
  effectiveChaosCost,
  shouldCatalyst,
}: {
  itemName: string;
  acquisitionChaosCost: number;
  goldCost: number;
  goldValueChaosPer10k: number;
  effectiveChaosCost: number;
  shouldCatalyst: boolean;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="hover:text-foreground size-6 p-0 text-blue-600 dark:text-blue-400"
          aria-label={`Show total cost breakdown for ${itemName}`}
        >
          <Info className="size-5" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[min(var(--radix-popover-content-available-width,9999px),calc(var(--spacing)*84))] min-w-77 text-sm"
        side="bottom"
        align="start"
      >
        <TotalCostInfo
          acquisitionChaosCost={acquisitionChaosCost}
          goldCost={goldCost}
          goldValueChaosPer10k={goldValueChaosPer10k}
          effectiveChaosCost={effectiveChaosCost}
          shouldCatalyst={shouldCatalyst}
        />
      </PopoverContent>
    </Popover>
  );
}

// Low stock badge with popover
function LowStockBadge({
  name,
  listingCount,
  lowStockThreshold,
}: {
  name: string;
  listingCount: number;
  lowStockThreshold: number;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Badge variant="amber" asChild>
          <Button
            className="mb-1 inline-flex place-self-end hover:bg-amber-100 hover:dark:bg-amber-900"
            size="sm"
            aria-label={`Low stock details for ${name}`}
          >
            <PackageMinus className="mr-1" />
            Low Stock
          </Button>
        </Badge>
      </PopoverTrigger>

      <PopoverContent className="max-w-[280px] text-sm">
        <LowStockInfo
          name={name}
          listingCount={listingCount}
          lowStockThreshold={lowStockThreshold}
        />
      </PopoverContent>
    </Popover>
  );
}

// Catalyst badge with popover
function CatalystBadge() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Badge variant="purple" asChild>
          <Button
            className="mb-1 inline-flex place-self-end hover:bg-purple-100 hover:dark:bg-purple-900"
            size="sm"
            aria-label="Catalyst recommendation details"
          >
            <Orbit className="mr-1" />
            Catalyst
          </Button>
        </Badge>
      </PopoverTrigger>

      <PopoverContent className="max-w-[280px] text-sm">
        <CatalystInfo />
      </PopoverContent>
    </Popover>
  );
}

// Header section with icon, name, variant, selection and info
function HeaderSection({
  name,
  variant,
  icon,
  isSelected,
  onSelect,
}: {
  name: string;
  variant?: string;
  icon: string;
  isSelected: boolean;
  onSelect: (v: boolean) => void;
}) {
  return (
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
            className="truncate font-semibold tracking-[0.015em]"
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
      <div className="flex items-center gap-3 pt-1.5">
        <SelectionCheckbox
          checked={isSelected}
          onChange={onSelect}
          label={`Mark ${name} as completed`}
        />
        <MarkInfoPopover />
      </div>
    </div>
  );
}

// Price and dust value display
function PriceAndDustSection({
  chaos,
  calculatedDustValue,
  goldCost,
  qualityType,
}: {
  chaos: number;
  calculatedDustValue: number;
  goldCost: number;
  qualityType: string;
}) {
  return (
    <div className="flex w-full gap-3">
      <div className="flex flex-30 flex-col gap-2">
        <div className="flex h-6 items-center">
          <p className="text-muted-foreground text-xs">Price</p>
        </div>
        <div className="flex items-center gap-1 text-xs font-semibold">
          <span>{compactFormatterPrice.format(chaos)}</span>
          <ChaosOrbIcon className="h-3 w-3" />
        </div>
      </div>
      <div className="flex flex-40 gap-2">
        <div className="flex flex-col gap-2">
          <div className="flex h-6 items-center">
            <p className="text-muted-foreground text-xs">Dust Value</p>
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold">
            <span>{compactFormatterGlobal.format(calculatedDustValue)}</span>
            <DustIcon className="h-3 w-3" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <DustInfoPopover />
          <span className="text-muted-foreground w-5 text-xs">
            ({qualityType})
          </span>
        </div>
      </div>
      <div className="flex flex-30 justify-end gap-1">
        <div className="flex flex-col gap-2">
          <div className="flex h-6 items-center">
            <p className="text-muted-foreground text-xs whitespace-nowrap">
              Gold Fee
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold">
            <span>{compactFormatterGlobal.format(goldCost)}</span>
            <GoldIcon className="h-3 w-3" />
          </div>
        </div>
        <div className="flex h-6 items-center">
          <GoldInfoPopover />
        </div>
      </div>
    </div>
  );
}

// Primary metric section (dust per chaos) with optional catalyst badge
function DustPerChaosSection({
  dustPerChaos,
  shouldCatalyst,
}: {
  dustPerChaos: number;
  shouldCatalyst: boolean;
}) {
  return (
    <div className="mt-1 flex justify-between">
      <div className="min-w-0 flex-1 space-y-2">
        <p className="text-muted-foreground text-sm">Dust per Chaos</p>

        <div className="text-primary flex items-center gap-1 text-lg font-bold">
          <span className="truncate">
            {compactFormatterGlobal.format(dustPerChaos)}
          </span>
          <DustIcon className="h-5 w-5" />
          <span className="text-muted-foreground">/</span>
          <ChaosOrbIcon className="h-5 w-5" />
        </div>
      </div>

      {shouldCatalyst && <CatalystBadge />}
    </div>
  );
}

// Secondary efficiency metric
function EfficiencySection({ item }: { item: ViewItem }) {
  const { settings } = useEfficiencySettings();
  const { lowStockThreshold } = useLeagueSession();

  return (
    <div className="flex justify-between gap-3">
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex h-6 items-center gap-1">
          <p className="text-muted-foreground min-w-0 truncate text-xs">
            Efficiency
            <span aria-hidden="true"> · </span>
            {EFFICIENCY_MODES[settings.mode].columnLabel}
          </p>

          {settings.mode === "total-cost" &&
            item.effectiveChaosCost !== null && (
              <TotalCostInfoPopover
                itemName={item.name}
                acquisitionChaosCost={item.acquisitionChaosCost}
                goldCost={item.goldCost}
                goldValueChaosPer10k={settings.goldValueChaosPer10k}
                effectiveChaosCost={item.effectiveChaosCost}
                shouldCatalyst={item.shouldCatalyst}
              />
            )}
        </div>

        <div className="flex items-center gap-1 text-xs">
          <span className="font-semibold tabular-nums">
            {compactFormatterGlobal.format(item.efficiency)}
          </span>

          <EfficiencyUnit mode={settings.mode} slots={item.slots} size="sm" />
        </div>
      </div>

      {item.listingCount < lowStockThreshold && (
        <LowStockBadge
          name={item.name}
          listingCount={item.listingCount}
          lowStockThreshold={lowStockThreshold}
        />
      )}
    </div>
  );
}

function TradeButtonSection({ name }: { name: string }) {
  const tradeLink = useTradeLink(name);
  return (
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
  );
}

interface MobileCardProps<TData extends ViewItem> {
  row: Row<TData>;
  isSelected: boolean;
}

function MobileCardComponent<TData extends ViewItem>({
  row,
  isSelected,
}: MobileCardProps<TData>) {
  "use memo";
  const name = row.getValue<string>(COLUMN_IDS.NAME);
  const variant = row.original.variant;
  const icon = row.getValue<string>(COLUMN_IDS.ICON);
  const chaos = row.getValue<number>(COLUMN_IDS.CHAOS);
  const dustPerChaos = row.getValue<number>(COLUMN_IDS.DUST_PER_CHAOS);
  const calculatedDustValue = row.original.calculatedDustValue;
  const goldCost = row.original.goldCost;

  const handleSelect = React.useCallback(
    (v: boolean) => row.toggleSelected(!!v),
    [row],
  );

  return (
    <div
      className={`flex min-w-78 flex-col gap-4 rounded-lg border p-5 ${
        isSelected ? "bg-muted/60 border-primary/30 opacity-95" : "bg-card"
      } transition-all`}
    >
      <HeaderSection
        name={name}
        variant={variant}
        icon={icon}
        isSelected={isSelected}
        onSelect={handleSelect}
      />

      <PriceAndDustSection
        chaos={chaos}
        calculatedDustValue={calculatedDustValue}
        goldCost={goldCost}
        qualityType={row.original.qualityType}
      />

      <DustPerChaosSection
        dustPerChaos={dustPerChaos}
        shouldCatalyst={row.original.shouldCatalyst}
      />

      <EfficiencySection item={row.original} />

      <TradeButtonSection name={name} />
    </div>
  );
}

export const MobileCard = React.memo(
  MobileCardComponent,
) as typeof MobileCardComponent;
