import type { RangeFilterValue } from "@/lib/filters";
import type { AppTable } from "@/lib/table-features";
import type { RowData } from "@tanstack/react-table";
import { useState } from "react";
import { ChevronDown, Filter } from "lucide-react";

import type { RangeFilterField } from "./range-filter-fields";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { hasMaxFilter, hasMinFilter, resetRangeFilters } from "@/lib/filters";
import { cn } from "@/lib/utils";
import { ViewItem } from "@/lib/view-item";
import { FilterTabIndicator } from "./filter-tab-indicator";
import { RangeFilter } from "./range-filter";
import {
  RANGE_FILTER_FIELD_CONFIGS,
  RANGE_FILTER_FIELD_LIST,
  useRangeFilterFieldValues,
} from "./range-filter-fields";

interface TabbedFilterProps<TData extends RowData> {
  table: AppTable<TData>;
  className?: string;
}

const countActiveBounds = (range: Readonly<RangeFilterValue>): number =>
  (hasMinFilter(range) ? 1 : 0) + (hasMaxFilter(range) ? 1 : 0);

export function TabbedFilter<TData extends ViewItem>({
  table,
  className,
}: TabbedFilterProps<TData>) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<RangeFilterField>("price");

  // One reactive subscription per range filter field.
  const ranges = useRangeFilterFieldValues(table);
  const numberOfActiveFilters = RANGE_FILTER_FIELD_LIST.reduce(
    (sum, field) => sum + countActiveBounds(ranges[field]),
    0,
  );
  const isFilterActive = numberOfActiveFilters > 0;

  const handleReset = () => {
    resetRangeFilters(table);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  function getDotColor(activeTab: string) {
    if (activeTab === "price") {
      return "bg-radial-[var(--color-amber-900)_1px,transparent_1px] dark:bg-radial-[var(--color-amber-300)_1px,transparent_1px]";
    } else if (activeTab === "dust") {
      return "bg-radial-[var(--color-indigo-900)_1px,transparent_1px] dark:bg-radial-[var(--color-indigo-300)_1px,transparent_1px]";
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
            className={`rounded-full p-1 transition-colors ${isFilterActive ? "bg-primary/80" : ""}`}
          >
            <Filter className="h-4 w-4" />
          </span>
          <span className="">Filters</span>
          <ChevronDown className="ml-2 h-3 w-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
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
            onValueChange={(value) => setActiveTab(value as RangeFilterField)}
            className="relative"
          >
            {/* Halftone background pattern */}
            <div
              className={`pointer-events-none absolute inset-0 z-0 -mx-1 -my-1.5 ${dotColor} mask-[radial-gradient(circle_at_center,white_0%,rgba(255,255,255,0.3)_60%,rgba(255,255,255,0.12)_80%,transparent_100%)] bg-size-[3px_3px] opacity-30`}
            />

            <TabsList className="z-10 w-full">
              {RANGE_FILTER_FIELD_LIST.map((field) => {
                const config = RANGE_FILTER_FIELD_CONFIGS[field];
                const activeCount = countActiveBounds(ranges[field]);
                const isActive = activeCount > 0;
                return (
                  <TabsTrigger
                    key={field}
                    value={field}
                    aria-label={`Open ${config.title.toLowerCase()} filter tab`}
                    className="gap-2"
                  >
                    <config.icon className={isActive ? "" : "grayscale-80"} />

                    <span className="relative inline-flex items-center">
                      <span className="text-xs leading-none">
                        {config.label}
                      </span>

                      {isActive && (
                        <FilterTabIndicator count={activeCount} label={field} />
                      )}
                    </span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {RANGE_FILTER_FIELD_LIST.map((field) => {
              const config = RANGE_FILTER_FIELD_CONFIGS[field];
              return (
                <TabsContent
                  key={field}
                  value={field}
                  className="z-10 space-y-4"
                >
                  <RangeFilter
                    table={table}
                    columnId={config.columnId}
                    min={config.bounds.min}
                    max={config.bounds.max}
                    step={config.step}
                    icon={<config.icon />}
                    title={config.title}
                  />
                </TabsContent>
              );
            })}
          </Tabs>

          <div className="flex gap-2 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleReset}
              className="flex-1 tabular-nums"
              disabled={!isFilterActive}
            >
              Clear All ({numberOfActiveFilters})
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
