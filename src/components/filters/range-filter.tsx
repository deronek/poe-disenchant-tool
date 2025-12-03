import type { Item } from "@/lib/itemData";
import type { RangeFilterValue } from "@/lib/range-filter";
import type { Column } from "@tanstack/react-table";
import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  createNormalizedFilterValue,
  getCurrentFilterValue,
  getLowerBoundLinearValue,
  getLowerBoundSliderValue,
  hasMaxFilter,
  hasMinFilter,
  setFilterValue,
  updateLowerBound,
  updateUpperBound,
} from "@/lib/range-filter";
import { cn } from "@/lib/utils";

interface RangeFilterProps<TData> {
  column: Column<TData, unknown> | undefined;
  min: number;
  max: number;
  step?: number;
  smallStep?: number;
  largeStep?: number;
  icon?: React.ReactNode;
  title: string;
}

interface RangeFilterStatusProps {
  range: RangeFilterValue;
  hasMin: boolean;
  hasMax: boolean;
  format: (value: number) => string;
  icon?: React.ReactNode;
  title: string;
}

export function RangeFilterStatus({
  range,
  hasMin,
  hasMax,
  format,
  icon,
  title,
}: RangeFilterStatusProps) {
  if (hasMin && hasMax) {
    return (
      <>
        Showing items between <span className="">{format(range.min!)}</span>{" "}
        {icon} and{" "}
        <span className="inline-flex items-center gap-1">
          <span className="">{format(range.max!)}</span>
          <span className="inline-flex items-center gap-0">
            {icon}
            <span className="">.</span>
          </span>
        </span>
      </>
    );
  }

  if (hasMin) {
    return (
      <>
        Showing items{" "}
        <span className="inline-flex items-center gap-1">
          <span className="leading-none">{format(range.min!)}</span>
          {icon}
        </span>{" "}
        and above.
      </>
    );
  }

  if (hasMax) {
    return (
      <>
        Showing items{" "}
        <span className="inline-flex items-center gap-1">
          <span className="leading-none">{format(range.max!)}</span>
          {icon}
        </span>{" "}
        and below.
      </>
    );
  }

  return <span>No {title.toLowerCase()} filter applied.</span>;
}

export function RangeFilter<TData extends Item>({
  column,
  min,
  max,
  step = 10,
  smallStep = 1,
  largeStep = 10,
  icon,
  title,
}: RangeFilterProps<TData>) {
  const defaults = useMemo(() => ({ min, max }), [min, max]);
  const currentRange = getCurrentFilterValue(column);
  const hasMin = hasMinFilter(currentRange);
  const hasMax = hasMaxFilter(currentRange);
  const isFilterActive = hasMin || hasMax;

  const commitRange = (updatedRange: RangeFilterValue) => {
    const normalized = createNormalizedFilterValue(updatedRange, defaults);
    setFilterValue(column, normalized);
  };

  const updateLowerBoundValue = (newValue: number) => {
    const effectiveMax = currentRange.max ?? max;
    const clamped = Math.round(Math.min(Math.max(newValue, min), effectiveMax));

    const updatedRange = updateLowerBound(clamped, currentRange, { max });
    commitRange(updatedRange);
  };

  const updateUpperBoundValue = (newValue: number) => {
    const updatedRange = updateUpperBound(newValue, currentRange, {
      max,
    });
    commitRange(updatedRange);
  };

  const handleLowerBoundChange = (sliderValue: number[]) => {
    const newLinearValue = getLowerBoundLinearValue(
      column,
      sliderValue[0],
      defaults,
    );
    updateLowerBoundValue(newLinearValue);
  };

  const handleUpperBoundChange = (sliderValue: number[]) => {
    updateUpperBoundValue(sliderValue[0]);
  };

  const handleResetLowerBound = () => {
    updateLowerBoundValue(min);
  };
  const handleResetUpperBound = () => {
    updateUpperBoundValue(max);
  };

  const handleLowerBoundKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Home and End keys handled by Radix correctly
    if (e.key === "Home" || e.key === "End") return;

    let delta = 0;
    switch (e.key) {
      case "ArrowRight":
      case "ArrowUp":
        delta = e.shiftKey ? largeStep : smallStep;
        break;
      case "ArrowLeft":
      case "ArrowDown":
        delta = e.shiftKey ? -largeStep : -smallStep;
        break;
      case "PageUp":
        delta = largeStep;
        break;
      case "PageDown":
        delta = -largeStep;
        break;
      default:
        return;
    }

    e.preventDefault();
    const effectiveMin = currentRange.min ?? min;
    const newValue = effectiveMin + delta;
    updateLowerBoundValue(newValue);
  };

  const format = (value: number) => value.toLocaleString();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between border-b leading-8 font-semibold">
        <div className="inline-flex items-center gap-2">
          {icon}
          {title}
        </div>

        <Badge
          variant={isFilterActive ? "default" : "secondary"}
          className="text-xs"
        >
          {isFilterActive ? "Active" : "Inactive"}
        </Badge>
      </div>
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
                getLowerBoundSliderValue(column, currentRange.min, defaults),
              ),
            ]}
            onValueChange={handleLowerBoundChange}
            onKeyDown={handleLowerBoundKeyDown}
            className="w-full py-1"
            aria-label={`Lower bound ${title.toLowerCase()} filter`}
          />
        </div>
        <div className="text-muted-foreground grid grid-cols-3 text-xs">
          <span className="inline-flex items-center gap-1">
            <span className="leading-none">{format(min)}</span>
            {icon}
          </span>
          <div className="flex justify-center">
            <Button
              size="sm"
              variant="secondary"
              disabled={!hasMin}
              onClick={handleResetLowerBound}
              className="bg-background dark:bg-background hover:bg-accent h-6 text-xs"
            >
              Reset
            </Button>
          </div>
          <span
            className={`inline-flex items-center justify-end gap-1 font-semibold ${hasMin ? "text-foreground" : "text-muted-foreground"}`}
          >
            <span className="leading-none font-normal">
              {hasMin ? format(currentRange.min!) : "No limit"}
            </span>
            {hasMin && icon}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="upper-bound">Upper Bound</Label>
        <div className="px-2">
          <Slider
            id="upper-bound"
            min={currentRange.min ?? min}
            max={max}
            step={step}
            value={[hasMax ? (currentRange.max as number) : max]}
            onValueChange={handleUpperBoundChange}
            className={cn("w-full py-1", !hasMax && "opacity-60")}
            aria-label={`Upper bound ${title.toLowerCase()} filter`}
          />
        </div>
        <div className="text-muted-foreground grid grid-cols-3 text-xs">
          <span
            className={`inline-flex items-center gap-1 font-semibold ${
              hasMax ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            <span className="leading-none font-normal">
              {hasMax ? format(currentRange.max!) : "No limit"}
            </span>
            {hasMax && icon}
          </span>
          <div className="flex justify-center">
            <Button
              size="sm"
              variant="secondary"
              disabled={!hasMax}
              onClick={handleResetUpperBound}
              className="bg-background dark:bg-background hover:bg-accent h-6 text-xs"
            >
              Reset
            </Button>
          </div>
          <span className="inline-flex items-center justify-end gap-1">
            <span className="leading-none">{format(max)}</span>
            {icon}
          </span>
        </div>
      </div>

      <div className="space-y-3 border-t pt-2">
        <div className="text-muted-foreground min-h-5 text-xs leading-[18px]">
          <RangeFilterStatus
            range={currentRange}
            hasMin={hasMin}
            hasMax={hasMax}
            format={format}
            icon={icon}
            title={title}
          />
        </div>
      </div>
    </div>
  );
}
