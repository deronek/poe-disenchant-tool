import type { Item } from "@/lib/itemData";
import type { Column } from "@tanstack/react-table";
import { useCallback, useState } from "react";
import { ChevronDown, Filter } from "lucide-react";

import { RangeFilter } from "@/components/filters/range-filter";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  getCurrentFilterValue,
  hasMaxFilter,
  hasMinFilter,
} from "@/lib/range-filter";
import { cn } from "@/lib/utils";
import { DustIcon } from "./dust-icon";

interface DustFilterProps<TData> {
  column: Column<TData, unknown> | undefined;
  min: number;
  max: number;
  className?: string;
}

export function DustFilter<TData extends Item>({
  column,
  min,
  max,
  className,
}: DustFilterProps<TData>) {
  const [isOpen, setIsOpen] = useState(false);
  const currentRange = getCurrentFilterValue(column);
  const hasMin = hasMinFilter(currentRange);
  const hasMax = hasMaxFilter(currentRange);
  const isFilterActive = hasMin || hasMax;

  const handleApply = useCallback(() => {
    setIsOpen(false);
  }, []);

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
          <span className="">Dust Value</span>
          <ChevronDown className="ml-1 h-3 w-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Dust Value Filter</h4>
            </div>
            <p className="text-muted-foreground text-sm text-pretty">
              Filter items by dust value range. Saved locally.
            </p>
          </div>

          <RangeFilter
            column={column}
            min={min}
            max={max}
            step={50000}
            smallStep={10000}
            largeStep={100000}
            formatValue={(value: number) => value.toLocaleString()}
            icon={<DustIcon />}
            title="Dust Value"
          />

          <div className="flex gap-2 pt-2">
            <Button size="sm" onClick={handleApply} className="flex-1">
              Close
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
