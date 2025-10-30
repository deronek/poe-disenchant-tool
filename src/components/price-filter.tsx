import type { Item } from "@/lib/itemData";
import type { Column } from "@tanstack/react-table";
import { useCallback, useMemo, useState } from "react";
import { ChevronDown, Filter } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import {
  createNormalizedFilterValue,
  getCurrentRange,
  getLowerBoundLinearValue,
  getLowerBoundSliderValue,
  hasActiveFilter,
  hasMaxFilter,
  hasMinFilter,
  resetFilter,
  setFilterValue,
  updateLowerBound,
  updateUpperBound,
} from "@/lib/price-filter";
import { cn } from "@/lib/utils";
import { ChaosOrbIcon } from "./chaos-orb-icon";

export type { PriceFilterValue } from "@/lib/price-filter";

interface PriceFilterProps<TData> {
  column: Column<TData, unknown> | undefined;
  min: number;
  max: number;
  className?: string;
}

export function PriceFilter<TData extends Item>({
  column,
  min,
  max,
  className,
}: PriceFilterProps<TData>) {
  const [isOpen, setIsOpen] = useState(false);

  // Defaults object to pass into logic helpers
  const defaults = useMemo(() => ({ min, max }), [min, max]);

  const currentRange = getCurrentRange(column, defaults);

  // Shared helper to update lower bound using a linear price value (in chaos)
  const updateLowerBoundPrice = useCallback(
    (newPrice: number) => {
      const effectiveMax = currentRange.max ?? defaults.max;
      const clamped = Math.round(
        Math.min(Math.max(newPrice, defaults.min), effectiveMax),
      );

      const updatedRange = updateLowerBound(clamped, currentRange, {
        max: defaults.max,
      });
      const normalizedFilter = createNormalizedFilterValue(
        updatedRange,
        defaults,
      );
      setFilterValue(column, normalizedFilter);
    },
    [column, currentRange, defaults],
  );

  // Handles slider (mouse/touch) interaction — converts from slider value (0–100) to log scale
  const handleLowerBoundChange = useCallback(
    (sliderValue: number[]) => {
      const newLinearValue = getLowerBoundLinearValue(
        column,
        sliderValue[0],
        defaults,
      );
      updateLowerBoundPrice(newLinearValue);
    },
    [column, defaults, updateLowerBoundPrice],
  );

  const handleUpperBoundChange = useCallback(
    (sliderValue: number[]) => {
      const updatedRange = updateUpperBound(
        sliderValue[0], // Direct value since upper bound uses linear scaling
        currentRange,
        {
          max,
        },
      );
      const normalizedFilter = createNormalizedFilterValue(
        updatedRange,
        defaults,
      );
      setFilterValue(column, normalizedFilter);
    },
    [column, currentRange, defaults, max],
  );

  const isFilterActive = hasActiveFilter(column, defaults);

  const handleReset = useCallback(() => {
    resetFilter(column);
  }, [column]);

  // Handle apply (close popover)
  const handleApply = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Handles keyboard events on the slider
  const handleLowerBoundKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      // let Home/End behave as usual
      if (e.key === "Home" || e.key === "End") return;

      const SMALL_STEP = 1;
      const LARGE_STEP = 10;

      let delta = 0;
      switch (e.key) {
        case "ArrowRight":
        case "ArrowUp":
          delta = e.shiftKey ? LARGE_STEP : SMALL_STEP;
          break;
        case "ArrowLeft":
        case "ArrowDown":
          delta = e.shiftKey ? -LARGE_STEP : -SMALL_STEP;
          break;
        case "PageUp":
          delta = LARGE_STEP;
          break;
        case "PageDown":
          delta = -LARGE_STEP;
          break;
        default:
          return; // let all other keys pass through
      }

      e.preventDefault();
      const newPrice = currentRange.min + delta;
      updateLowerBoundPrice(newPrice);
    },
    [currentRange.min, updateLowerBoundPrice],
  );

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
          <span className="">Price</span>
          <ChevronDown className="ml-1 h-3 w-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Price Filter</h4>
            </div>
            <p className="text-muted-foreground text-sm text-pretty">
              Filter items by chaos price range. Saved locally.
            </p>
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
                    Math.round(
                      getLowerBoundSliderValue(
                        column,
                        currentRange.min,
                        defaults,
                      ),
                    ),
                  ]}
                  onValueChange={handleLowerBoundChange}
                  onKeyDown={handleLowerBoundKeyDown}
                  className="w-full py-1"
                  aria-label="Lower bound price filter"
                />
              </div>
              <div className="text-muted-foreground flex justify-between text-xs">
                <span className="inline-flex items-center gap-1">
                  <span className="leading-none">{min}</span>
                  <ChaosOrbIcon />
                </span>
                <span
                  className={`inline-flex items-center gap-1 font-semibold ${hasMinFilter(currentRange, { min }) ? "text-foreground" : "text-muted-foreground"}`}
                >
                  <span className="leading-none">{currentRange.min}</span>
                  <ChaosOrbIcon />
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="upper-bound">Upper Bound</Label>
              <div className="px-2">
                <Slider
                  id="upper-bound"
                  min={currentRange.min}
                  max={max}
                  step={10}
                  value={[
                    hasMaxFilter(currentRange, { max })
                      ? (currentRange.max as number)
                      : max,
                  ]}
                  onValueChange={handleUpperBoundChange}
                  disabled={false}
                  className={cn(
                    "w-full py-1",
                    !hasMaxFilter(currentRange, { max }) && "opacity-60",
                  )}
                  aria-label="Upper bound price filter"
                />
              </div>
              <div className="text-muted-foreground flex justify-between text-xs">
                <span
                  className={`inline-flex items-center gap-1 font-semibold ${
                    hasMaxFilter(currentRange, { max })
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  <span className="leading-none">
                    {hasMaxFilter(currentRange, { max })
                      ? currentRange.max
                      : "No limit"}
                  </span>
                  {hasMaxFilter(currentRange, { max }) && <ChaosOrbIcon />}
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
            <div className="text-muted-foreground text-xs leading-[18px]">
              {isFilterActive ? (
                hasMaxFilter(currentRange, { max }) ? (
                  <>
                    Showing items between{" "}
                    <span className="inline-flex items-center gap-1">
                      <span className="leading-none">{currentRange.min}</span>
                      <ChaosOrbIcon />
                    </span>{" "}
                    and{" "}
                    <span className="inline-flex items-center gap-1">
                      <span className="leading-none">{currentRange.max}</span>
                      <ChaosOrbIcon />
                    </span>
                    .
                  </>
                ) : (
                  <>
                    Showing items{" "}
                    <span className="inline-flex items-center gap-1">
                      <span className="leading-none">{currentRange.min}</span>
                      <ChaosOrbIcon />
                    </span>{" "}
                    and above.
                  </>
                )
              ) : (
                <span className="inline-flex items-center gap-1">
                  Showing all items.
                </span>
              )}
            </div>
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
