"use client";

import { useState } from "react";
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

export type RangeFilterValue = {
  min: number;
  max: number;
};

interface RangeFilterProps<TData> {
  column: Column<TData, unknown> | undefined;
  title: string;
  description: string;
  min: number;
  max: number;
}

export function RangeFilter<TData extends Item>({
  column,
  title,
  description,
  min,
  max,
}: RangeFilterProps<TData>) {
  const [isOpen, setIsOpen] = useState(false);

  // Get current filter value from TanStack Table
  const filterValue = column?.getFilterValue() as RangeFilterValue | undefined;
  const currentRange = filterValue
    ? [filterValue.min, filterValue.max]
    : [min, max];

  // Active if filter exists and differs from defaults
  const hasActiveFilter =
    filterValue !== undefined &&
    (filterValue.min !== min || filterValue.max !== max);

  // Normalize: when range equals defaults, clear filter in table state
  const normalizeAndSet = (lower: number, upper: number) => {
    if (column) {
      if (lower === min && upper === max) {
        column.setFilterValue(undefined);
      } else {
        column.setFilterValue({ min: lower, max: upper });
      }
    }
  };

  const handleRangeChange = (newRange: number[], isLowerBound: boolean) => {
    const [lower, upper] = isLowerBound
      ? [newRange[0], currentRange[1]]
      : [currentRange[0], newRange[0]];

    // Update TanStack Table filter (auto-clear when equal to defaults)
    normalizeAndSet(lower, upper);
  };

  const handleReset = () => {
    column?.setFilterValue(undefined);
  };

  const handleApply = () => {
    // Ensure default-range equals cleared state
    const v = column?.getFilterValue() as RangeFilterValue | undefined;
    if (column && v && v.min === min && v.max === max) {
      column.setFilterValue(undefined);
    }
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="group relative bg-transparent">
          <Filter className="mr-2 h-4 w-4" />
          <span className="">{title}</span>
          <ChevronDown className="ml-1 h-3 w-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">{title}</h4>
            </div>
            <p className="text-muted-foreground text-sm">{description}</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lower-bound">Lower Bound</Label>
              <div className="px-2">
                <Slider
                  id="lower-bound"
                  min={min}
                  max={currentRange[1]}
                  step={10}
                  value={[currentRange[0]]}
                  onValueChange={(value) => handleRangeChange(value, true)}
                  className="w-full py-1"
                />
              </div>
              <div className="text-muted-foreground flex justify-between text-xs">
                <span className="inline-flex items-center gap-1">
                  <span className="leading-none">{min}</span>
                  <ChaosOrbIcon />
                </span>
                <span className="text-foreground inline-flex items-center gap-1 font-medium">
                  <span className="leading-none">{currentRange[0]}</span>
                  <ChaosOrbIcon />
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="upper-bound">Upper Bound</Label>
              <div className="px-2">
                <Slider
                  id="upper-bound"
                  min={currentRange[0]}
                  max={max}
                  step={10}
                  value={[currentRange[1]]}
                  onValueChange={(value) => handleRangeChange(value, false)}
                  className="w-full py-1"
                />
              </div>
              <div className="text-muted-foreground flex justify-between text-xs">
                <span className="text-foreground inline-flex items-center gap-1 font-medium">
                  <span className="leading-none">{currentRange[1]}</span>
                  <ChaosOrbIcon />
                </span>
                <span className="inline-flex items-center gap-1 align-middle">
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
                Showing items between{" "}
                <span className="inline-flex items-center gap-1">
                  <span className="leading-none">{currentRange[0]}</span>
                  <ChaosOrbIcon />
                </span>{" "}
                and{" "}
                <span className="inline-flex items-center gap-1">
                  <span className="leading-none">{currentRange[1]}</span>
                  <ChaosOrbIcon />
                </span>
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
