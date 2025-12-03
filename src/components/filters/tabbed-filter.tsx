import type { Item } from "@/lib/itemData";
import type { Column } from "@tanstack/react-table";
import { useState } from "react";
import { ChevronDown, Filter } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getCurrentFilterValue,
  hasMaxFilter,
  hasMinFilter,
} from "@/lib/range-filter";
import { cn } from "@/lib/utils";
import { ChaosOrbIcon } from "../chaos-orb-icon";
import { DustIcon } from "../dust-icon";
import { GoldIcon } from "../gold-icon";
import { RangeFilter } from "./range-filter";

interface TabbedFilterProps<TData> {
  priceColumn: Column<TData, unknown> | undefined;
  dustColumn: Column<TData, unknown> | undefined;
  goldColumn: Column<TData, unknown> | undefined;
  priceMin: number;
  priceMax: number;
  dustMin: number;
  dustMax: number;
  goldMin: number;
  goldMax: number;
  className?: string;
}

export function TabbedFilter<TData extends Item>({
  priceColumn,
  dustColumn,
  goldColumn,
  priceMin,
  priceMax,
  dustMin,
  dustMax,
  goldMin,
  goldMax,
  className,
}: TabbedFilterProps<TData>) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("price");

  const priceRange = getCurrentFilterValue(priceColumn);
  const dustRange = getCurrentFilterValue(dustColumn);
  const goldRange = getCurrentFilterValue(goldColumn);

  const priceHasMin = hasMinFilter(priceRange);
  const priceHasMax = hasMaxFilter(priceRange);
  const dustHasMin = hasMinFilter(dustRange);
  const dustHasMax = hasMaxFilter(dustRange);
  const goldHasMin = hasMinFilter(goldRange);
  const goldHasMax = hasMaxFilter(goldRange);

  const isPriceFilterActive = priceHasMin || priceHasMax;
  const isDustFilterActive = dustHasMin || dustHasMax;
  const isGoldFilterActive = goldHasMin || goldHasMax;
  const isFilterActive =
    isPriceFilterActive || isDustFilterActive || isGoldFilterActive;
  const numberOfActiveFilters =
    (isPriceFilterActive ? 1 : 0) +
    (isDustFilterActive ? 1 : 0) +
    (isGoldFilterActive ? 1 : 0);

  const handleReset = () => {
    if (priceColumn) {
      priceColumn.setFilterValue(undefined);
    }
    if (dustColumn) {
      dustColumn.setFilterValue(undefined);
    }
    if (goldColumn) {
      goldColumn.setFilterValue(undefined);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  function getDotColor(activeTab: string) {
    if (activeTab === "price") {
      return "bg-radial-[var(--color-amber-900)_1px,transparent_1px] dark:bg-radial-[var(--color-amber-300)_1px,transparent_1px]";
    } else if (activeTab === "dust") {
      return "bg-radial-[var(--color-purple-900)_1px,transparent_1px] dark:bg-radial-[var(--color-purple-300)_1px,transparent_1px]";
    } else {
      return "bg-radial-[var(--color-yellow-900)_1px,transparent_1px] dark:bg-radial-[var(--color-yellow-300)_1px,transparent_1px]";
    }
  }

  const dotColor = getDotColor(activeTab);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "group relative gap-2 has-[>svg]:px-2 has-[>svg]:pr-3",
            className,
          )}
        >
          <span
            className={`mr-1 rounded-full p-1 transition-colors ${isFilterActive ? "bg-primary/80" : ""}`}
          >
            <Filter className="h-4 w-4" />
          </span>
          <span className="">Filters</span>
          <ChevronDown className="ml-1 h-3 w-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Apply Filter</h4>
            </div>
            <p className="text-muted-foreground text-sm text-pretty">
              Filter items by price, dust value, or gold fee. Saved locally.
            </p>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="relative"
          >
            {/* Halftone background pattern */}
            <div
              className={`pointer-events-none absolute inset-0 z-0 -mx-1 -my-1.5 ${dotColor} mask-[radial-gradient(circle_at_center,white_0%,rgba(255,255,255,0.3)_60%,rgba(255,255,255,0.12)_80%,transparent_100%)] bg-size-[3px_3px] opacity-30`}
            />

            <TabsList className="z-10 w-full">
              <TabsTrigger value="price" aria-label="Open price filter tab">
                <ChaosOrbIcon
                  className={isPriceFilterActive ? "" : "grayscale-80"}
                />

                <span className="relative inline-flex items-center">
                  <span className="text-xs leading-none">Price</span>

                  {isPriceFilterActive && (
                    <span
                      aria-hidden="true"
                      className="bg-primary absolute left-full size-1.5 translate-x-1 -translate-y-1 rounded-full"
                    />
                  )}
                </span>
              </TabsTrigger>

              <TabsTrigger value="dust" aria-label="Open dust value filter tab">
                <DustIcon
                  className={isDustFilterActive ? "" : "grayscale-80"}
                />

                <span className="relative inline-flex items-center">
                  <span className="text-xs leading-none">Dust</span>

                  {isDustFilterActive && (
                    <span
                      aria-hidden="true"
                      className="bg-primary absolute left-full size-1.5 translate-x-1 -translate-y-1 rounded-full"
                    />
                  )}
                </span>
              </TabsTrigger>

              <TabsTrigger value="gold" aria-label="Open gold fee filter tab">
                <GoldIcon
                  className={isGoldFilterActive ? "" : "grayscale-80"}
                />

                <span className="relative inline-flex items-center">
                  <span className="text-xs leading-none">Gold</span>

                  {isGoldFilterActive && (
                    <span
                      aria-hidden="true"
                      className="bg-primary absolute left-full size-1.5 translate-x-1 -translate-y-1 rounded-full"
                    />
                  )}
                </span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="price" className="z-10 space-y-4">
              <RangeFilter
                column={priceColumn}
                min={priceMin}
                max={priceMax}
                step={1}
                icon={<ChaosOrbIcon />}
                title="Price"
              />
            </TabsContent>

            <TabsContent value="dust" className="z-10 space-y-4">
              <RangeFilter
                column={dustColumn}
                min={dustMin}
                max={dustMax}
                step={50000}
                icon={<DustIcon />}
                title="Dust Value"
              />
            </TabsContent>

            <TabsContent value="gold" className="z-10 space-y-4">
              <RangeFilter
                column={goldColumn}
                min={goldMin}
                max={goldMax}
                step={500}
                icon={<GoldIcon />}
                title="Gold Fee"
              />
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleReset}
              className="flex-1 tabular-nums"
              disabled={!isFilterActive}
            >
              Reset All ({numberOfActiveFilters})
            </Button>
            <Button size="sm" onClick={handleClose} className="flex-1">
              Close
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
