"use client";

import { useState, useEffect } from "react";
import type { Column } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Filter } from "lucide-react";
import { ChaosOrbIcon } from "./chaos-orb-icon";
import type { Item } from "@/lib/itemData";
import { cn } from "@/lib/utils";

export type PriceFiltervalue = {
  min: number;
  max?: number; // Optional for single bound filtering
};

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

  // Get current filter value from TanStack Table
  const filterValue = column?.getFilterValue() as PriceFiltervalue | undefined;
  const currentMin = filterValue?.min ?? min;
  const currentMax = filterValue?.max ?? max;
  const currentRange = [currentMin, currentMax];

  // Initialize upper bound enabled state based on existing filter
  const [upperBoundEnabled, setUpperBoundEnabled] = useState(false);

  // Handle upper bound changes - always interactive, enable/disable based on value
  const handleUpperBoundChange = (value: number[]) => {
    const newUpperValue = value[0];
    const shouldEnable = newUpperValue !== max;

    // Update visual state
    setUpperBoundEnabled(shouldEnable);

    // Handle the range change with explicit enable state to avoid async state issues
    const lower = currentMin;
    const upper = shouldEnable ? newUpperValue : undefined;

    // Update TanStack Table filter with explicit enabled state
    normalizeAndSet(lower, upper, shouldEnable);
  };

  // Logarithmic scale transformation for better low-value precision
  const linearToLog = (
    linearValue: number,
    min: number,
    max: number,
  ): number => {
    if (linearValue <= min) return 0;
    // Use log scale that gives more precision to low values
    const logMin = Math.log(min + 1);
    const logMax = Math.log(max + 1);
    const logValue = Math.log(linearValue + 1);
    return ((logValue - logMin) / (logMax - logMin)) * 100;
  };

  const logToLinear = (logValue: number, min: number, max: number): number => {
    const logMin = Math.log(min + 1);
    const logMax = Math.log(max + 1);
    const linearValue =
      Math.exp(logMin + (logValue / 100) * (logMax - logMin)) - 1;
    return Math.round(linearValue);
  };

  // Get the effective slider range (logarithmic for lower bound, linear for upper bound)
  const getSliderValue = (
    linearValue: number,
    isLowerBound: boolean,
  ): number => {
    if (isLowerBound) {
      // Use the effective range for logarithmic scaling to ensure proper full-width usage
      const effectiveMax = upperBoundEnabled ? currentMax : max;
      return linearToLog(linearValue, min, effectiveMax);
    }
    return linearValue;
  };

  const getLinearValue = (
    sliderValue: number,
    isLowerBound: boolean,
  ): number => {
    if (isLowerBound) {
      // Use the effective range for logarithmic scaling
      const effectiveMax = upperBoundEnabled ? currentMax : max;
      return logToLinear(sliderValue, min, effectiveMax);
    }
    return sliderValue;
  };

  // Sync upper bound enabled state with filter value changes
  useEffect(() => {
    if (filterValue?.max !== undefined) {
      // Enable if there's a max value and it's different from the default
      setUpperBoundEnabled(filterValue.max !== max);
    } else {
      // Disable by default when no filter is set
      setUpperBoundEnabled(false);
    }
  }, [filterValue?.max, max]);

  // Active if filter exists and differs from defaults
  const hasActiveFilter =
    filterValue !== undefined &&
    (filterValue.min !== min || (upperBoundEnabled && filterValue.max !== max));

  // Normalize: when range equals defaults, clear filter in table state
  const normalizeAndSet = (
    lower: number,
    upper?: number,
    enabled?: boolean,
  ) => {
    if (column) {
      if (lower === min && (!(enabled ?? upperBoundEnabled) || upper === max)) {
        column.setFilterValue(undefined);
      } else {
        column.setFilterValue({
          min: lower,
          max: (enabled ?? upperBoundEnabled) ? upper : undefined,
        });
      }
    }
  };

  const handleRangeChange = (newRange: number[], isLowerBound: boolean) => {
    const lower = isLowerBound ? newRange[0] : currentMin;
    const upper = isLowerBound
      ? upperBoundEnabled
        ? currentMax
        : undefined
      : upperBoundEnabled
        ? newRange[0]
        : undefined;

    // Update TanStack Table filter (auto-clear when equal to defaults)
    normalizeAndSet(lower, upper);
  };

  const handleReset = () => {
    column?.setFilterValue(undefined);
    setUpperBoundEnabled(false);
  };

  const handleApply = () => {
    // Ensure default-range equals cleared state
    const v = column?.getFilterValue() as PriceFiltervalue | undefined;
    if (column && v && v.min === min && (!upperBoundEnabled || v.max === max)) {
      column.setFilterValue(undefined);
    }
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
                  value={[getSliderValue(currentMin, true)]}
                  onValueChange={(value) => {
                    const newValue = getLinearValue(value[0], true);
                    // Ensure lower bound doesn't exceed upper bound when upper bound is enabled
                    const constrainedValue = upperBoundEnabled
                      ? Math.min(newValue, currentMax)
                      : newValue;
                    handleRangeChange([constrainedValue], true);
                  }}
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
                  <span className="leading-none">{currentMin}</span>
                  <ChaosOrbIcon />
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="upper-bound">Upper Bound</Label>
              <div className="px-2">
                <Slider
                  id="upper-bound"
                  min={currentMin}
                  max={max}
                  step={10}
                  value={[currentMax]}
                  onValueChange={handleUpperBoundChange}
                  disabled={false}
                  className={cn(
                    "w-full py-1",
                    !upperBoundEnabled && "opacity-60",
                  )}
                  aria-label="Upper bound price filter"
                />
              </div>
              <div className="text-muted-foreground flex justify-between text-xs">
                <span
                  className={`inline-flex items-center gap-1 font-medium ${upperBoundEnabled ? "text-foreground" : "text-muted-foreground"}`}
                >
                  <span className="leading-none">
                    {upperBoundEnabled ? currentMax : "No limit"}
                  </span>
                  {upperBoundEnabled && <ChaosOrbIcon />}
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
                variant={hasActiveFilter ? "default" : "secondary"}
                className="text-xs"
              >
                {hasActiveFilter ? "Active" : "Inactive"}
              </Badge>
            </div>
            {hasActiveFilter && (
              <div className="text-muted-foreground text-xs">
                {upperBoundEnabled ? (
                  <>
                    Showing items between{" "}
                    <span className="inline-flex items-center gap-1">
                      <span className="leading-none">{currentMin}</span>
                      <ChaosOrbIcon />
                    </span>{" "}
                    and{" "}
                    <span className="inline-flex items-center gap-1">
                      <span className="leading-none">{currentMax}</span>
                      <ChaosOrbIcon />
                    </span>
                  </>
                ) : (
                  <>
                    Showing items{" "}
                    <span className="inline-flex items-center gap-1">
                      <span className="leading-none">{currentMin}</span>
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
