"use client"

import { useState } from "react"
import type { Column } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Filter, X } from "lucide-react"

export type RangeFilterValue = {
  min: number
  max: number
}

interface RangeFilterProps<TData> {
  column: Column<TData, unknown>
  title: string
  description: string
  min: number
  max: number
}

export function RangeFilter<TData>({ column, title, description, min, max }: RangeFilterProps<TData>) {
  const [isOpen, setIsOpen] = useState(false)

  // Get current filter value from TanStack Table
  const filterValue = column.getFilterValue() as RangeFilterValue | undefined
  const currentRange = filterValue ? [filterValue.min, filterValue.max] : [min, max]

  const hasActiveFilter = filterValue !== undefined && (filterValue.min !== min || filterValue.max !== max)

  const handleRangeChange = (newRange: number[], isLowerBound: boolean) => {
    const [lower, upper] = isLowerBound ? [newRange[0], currentRange[1]] : [currentRange[0], newRange[0]]

    // Update TanStack Table filter
    column.setFilterValue({ min: lower, max: upper })
  }

  const handleReset = () => {
    column.setFilterValue(undefined)
  }

  const handleApply = () => {
    setIsOpen(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="relative bg-transparent">
          <Filter className="w-4 h-4 mr-2" />
          {title}
          {hasActiveFilter && (
            <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
              1
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">{title}</h4>
              {hasActiveFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3 h-3 mr-1" />
                  Reset
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{description}</p>
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
                  className="w-full"
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>${min}</span>
                <span className="font-medium text-foreground">${currentRange[0]}</span>
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
                  className="w-full"
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className="font-medium text-foreground">${currentRange[1]}</span>
                <span>${max}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Current Range:</span>
              <span className="font-medium">
                ${currentRange[0]} - ${currentRange[1]}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Filter Status:</span>
              <Badge variant={hasActiveFilter ? "default" : "secondary"} className="text-xs">
                {hasActiveFilter ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Filtered Rows:</span>
              <span className="font-medium">{column.getFacetedUniqueValues().size}</span>
            </div>
            {hasActiveFilter && (
              <div className="text-xs text-muted-foreground">
                Showing items between ${currentRange[0]} and ${currentRange[1]}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button size="sm" onClick={handleApply} className="flex-1">
              Apply Filter
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
