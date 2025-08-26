"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import type { Item } from "@/lib/itemData";
import {
  type PriceFilterContext,
  type PriceFilterValue,
  createNormalizedFilterValue,
  getCurrentRange,
  getLowerBoundLinearValue,
  getLowerBoundSliderValue,
  hasActiveFilter,
  resetFilter,
  setFilterValue,
  updateLowerBound,
  updateUpperBound,
} from "@/lib/price-filter";
import { cn } from "@/lib/utils";
import type { Column } from "@tanstack/react-table";
import { ChevronDown, Filter } from "lucide-react";
import { useState } from "react";
import { ChaosOrbIcon } from "./chaos-orb-icon";

export type { PriceFilterValue };

interface PriceFilterProps<TData> {
  column: Column<TData, unknown> | undefined;
  description: string;
  min: number;
  max: number;
  className?: string;
}

export function PriceFilter<TData extends Item>({
  column,
  description,
  min,
  max,
  className,
}: PriceFilterProps<TData>) {
  const [isOpen, setIsOpen] = useState(false);

  // Create filter context
  const filterContext: PriceFilterContext<TData> = { column, min, max };

  // Get current range state
  const currentRange = getCurrentRange(filterContext);

  // Handle lower bound changes with logarithmic scaling
  const handleLowerBoundChange = (sliderValue: number[]) => {
    const newLinearValue = getLowerBoundLinearValue(
      filterContext,
      sliderValue[0],
    );
    const updatedRange = updateLowerBound(
      filterContext,
      newLinearValue,
      currentRange,
    );
    const normalizedFilter = createNormalizedFilterValue(
      filterContext,
      updatedRange,
    );
    setFilterValue(filterContext, normalizedFilter);
  };

  // Handle upper bound changes with linear scaling
  const handleUpperBoundChange = (sliderValue: number[]) => {
    const updatedRange = updateUpperBound(
      filterContext,
      sliderValue[0], // Direct value since upper bound uses linear scaling
      currentRange,
    );
    const normalizedFilter = createNormalizedFilterValue(
      filterContext,
      updatedRange,
    );
    setFilterValue(filterContext, normalizedFilter);
  };

  // Check if there's an active filter
  const isFilterActive = hasActiveFilter(filterContext);

  // Handle reset
  const handleReset = () => {
    resetFilter(filterContext);
  };

  // Handle apply (close popover)
  const handleApply = () => {
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn("group relative", className)}>
          <Filter className="mr-2 h-4 w-4" />
          <span className="">Price</span>
          <ChevronDown className="ml-1 h-3 w-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 sm:w-96" align="start">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Price Filter</h4>
            </div>
            <p className="text-muted-foreground text-sm">{description}</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lower-bound">Lower Bound</Label>
              <div className="px-2">
                <Slider
                  id="lower-bound"
                  min={0}
                  max={100}
                  step={1}
                  value={[
                    getLowerBoundSliderValue(filterContext, currentRange.lower),
                  ]}
                  onValueChange={handleLowerBoundChange}
                  className="w-full py-1"
                  aria-label="Lower bound price filter"
                />
              </div>
              <div className="text-muted-foreground flex justify-between text-xs">
                <span className="inline-flex items-center gap-1">
                  <span className="leading-none">{min}</span>
                  <ChaosOrbIcon />
                </span>
                <span className="text-foreground inline-flex items-center gap-1 font-medium">
                  <span className="leading-none">{currentRange.lower}</span>
                  <ChaosOrbIcon />
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="upper-bound">Upper Bound</Label>
              <div className="px-2">
                <Slider
                  id="upper-bound"
                  min={currentRange.lower}
                  max={max}
                  step={10}
                  value={[currentRange.upper!]}
                  onValueChange={handleUpperBoundChange}
                  disabled={false}
                  className={cn(
                    "w-full py-1",
                    !currentRange.upperEnabled && "opacity-60",
                  )}
                  aria-label="Upper bound price filter"
                />
              </div>
              <div className="text-muted-foreground flex justify-between text-xs">
                <span
                  className={`inline-flex items-center gap-1 font-medium ${currentRange.upperEnabled ? "text-foreground" : "text-muted-foreground"}`}
                >
                  <span className="leading-none">
                    {currentRange.upperEnabled
                      ? currentRange.upper
                      : "No limit"}
                  </span>
                  {currentRange.upperEnabled && <ChaosOrbIcon />}
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="leading-none">{max}</span>
                  <ChaosOrbIcon />
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3 border-t pt-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Filter Status:</span>
              <Badge
                variant={isFilterActive ? "default" : "secondary"}
                className="text-xs"
              >
                {isFilterActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            {isFilterActive && (
              <div className="text-muted-foreground text-xs">
                {currentRange.upperEnabled ? (
                  <>
                    Showing items between{" "}
                    <span className="inline-flex items-center gap-1">
                      <span className="leading-none">{currentRange.lower}</span>
                      <ChaosOrbIcon />
                    </span>{" "}
                    and{" "}
                    <span className="inline-flex items-center gap-1">
                      <span className="leading-none">{currentRange.upper}</span>
                      <ChaosOrbIcon />
                    </span>
                  </>
                ) : (
                  <>
                    Showing items{" "}
                    <span className="inline-flex items-center gap-1">
                      <span className="leading-none">{currentRange.lower}</span>
                      <ChaosOrbIcon />
                    </span>{" "}
                    and above
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="flex-1"
              disabled={!isFilterActive}
            >
              Reset
            </Button>
            <Button size="sm" onClick={handleApply} className="flex-1">
              Close
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
