import type { PrecisionBand, RangeFilterValue } from "@/lib/filters";
import type { AppTable } from "@/lib/table-features";
import type { RowData } from "@tanstack/react-table";
import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ColumnId } from "@/lib/column-ids";
import {
  createNormalizedFilterValue,
  getEffectiveMax,
  getEffectiveMin,
  getLowerBoundLinearValue,
  getLowerBoundSliderValue,
  getRangeKeyboardDelta,
  getUpperBoundLinearValue,
  getUpperBoundSliderValue,
  hasMaxFilter,
  hasMinFilter,
  hasSubUnitRange,
  roundRangeValue,
  setColumnFilter,
  useRangeFilterValue,
} from "@/lib/filters";
import { cn } from "@/lib/utils";
import { ViewItem } from "@/lib/view-item";

interface RangeFilterProps<TData extends RowData> {
  table: AppTable<TData>;
  columnId: ColumnId;
  min: number;
  max: number;
  step: number;
  precision?: readonly PrecisionBand[];
  icon?: React.ReactNode;
  title: string;
}

interface RangeFilterStatusProps {
  range: Readonly<RangeFilterValue>;
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

export function RangeFilter<TData extends ViewItem>({
  table,
  columnId,
  min,
  max,
  step,
  precision = [],
  icon,
  title,
}: RangeFilterProps<TData>) {
  const defaults = useMemo(() => ({ min, max }), [min, max]);
  const currentRange = useRangeFilterValue(table, columnId);
  const hasMin = hasMinFilter(currentRange);
  const hasMax = hasMaxFilter(currentRange);
  const isFilterActive = hasMin || hasMax;

  const effectiveMin = getEffectiveMin(currentRange, defaults);
  const effectiveMax = getEffectiveMax(currentRange, defaults);
  const subUnitRange = hasSubUnitRange(min, max);
  // Hundredths of a position keep every integer price reachable without
  // taking more track from the rest of the scale.
  const subUnitSliderStep = 0.01;

  const roundSliderPosition = (position: number) =>
    subUnitRange ? Math.round(position * 100) / 100 : Math.round(position);

  const commitRange = (updatedRange: RangeFilterValue) => {
    setColumnFilter(
      table,
      columnId,
      createNormalizedFilterValue(updatedRange, defaults),
    );
  };

  const updateLowerBoundValue = (newValue: number) => {
    const clamped = Math.min(
      Math.max(roundRangeValue(newValue, precision), min),
      effectiveMax,
    );

    commitRange({ ...currentRange, min: clamped });
  };

  const updateUpperBoundValue = (newValue: number) => {
    const clamped = Math.min(
      Math.max(roundRangeValue(newValue, precision), effectiveMin),
      max,
    );

    commitRange({ ...currentRange, max: clamped });
  };

  const handleLowerBoundChange = (sliderValue: number[]) => {
    const newLinearValue = getLowerBoundLinearValue(
      currentRange,
      sliderValue[0],
      defaults,
    );
    updateLowerBoundValue(newLinearValue);
  };

  const handleUpperBoundChange = (sliderValue: number[]) => {
    const newValue = getUpperBoundLinearValue(
      currentRange,
      sliderValue[0],
      defaults,
    );
    updateUpperBoundValue(newValue);
  };

  const handleResetLowerBound = () => {
    updateLowerBoundValue(min);
  };
  const handleResetUpperBound = () => {
    updateUpperBoundValue(max);
  };

  const handleBoundKeyDown = (
    e: React.KeyboardEvent<HTMLDivElement>,
    currentValue: number,
    update: (value: number) => void,
  ) => {
    const delta = getRangeKeyboardDelta(
      e.key,
      currentValue,
      precision,
      step,
      e.shiftKey,
    );
    if (delta === undefined) return;

    e.preventDefault();
    update(currentValue + delta);
  };

  const upperSliderValue = roundSliderPosition(
    getUpperBoundSliderValue(currentRange, defaults),
  );

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
            step={subUnitRange ? subUnitSliderStep : 1}
            value={[
              roundSliderPosition(
                getLowerBoundSliderValue(currentRange, defaults),
              ),
            ]}
            onValueChange={handleLowerBoundChange}
            onKeyDown={
              subUnitRange
                ? (e) =>
                    handleBoundKeyDown(
                      e,
                      currentRange.min ?? min,
                      updateLowerBoundValue,
                    )
                : undefined
            }
            className="w-full py-1.5"
            aria-label={`Lower bound ${title.toLowerCase()} filter`}
            aria-valuetext={hasMin ? format(currentRange.min!) : "No limit"}
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
              aria-label={`Clear lower bound ${title.toLowerCase()} filter`}
            >
              Clear
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
            min={subUnitRange ? 0 : effectiveMin}
            max={subUnitRange ? 100 : max}
            step={subUnitRange ? subUnitSliderStep : step}
            value={[upperSliderValue]}
            onValueChange={handleUpperBoundChange}
            onKeyDown={
              subUnitRange
                ? (e) =>
                    handleBoundKeyDown(
                      e,
                      currentRange.max ?? max,
                      updateUpperBoundValue,
                    )
                : undefined
            }
            className={cn("w-full py-1.5", !hasMax && "opacity-60")}
            aria-label={`Upper bound ${title.toLowerCase()} filter`}
            aria-valuetext={hasMax ? format(currentRange.max!) : "No limit"}
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
              aria-label={`Clear upper bound ${title.toLowerCase()} filter`}
            >
              Clear
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
