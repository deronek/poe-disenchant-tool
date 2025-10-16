import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox, type CheckedState } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Settings,
  ChevronDown,
  Zap,
  Tally1,
  Tally2,
  Tally3,
  Tally4,
  Clock,
} from "lucide-react";
import * as React from "react";
import { Separator } from "./ui/separator";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { ListingTimeFilterSchema } from "@/lib/listing-time-filter";
import type { ListingTimeFilter } from "@/lib/listing-time-filter";
import equal from "fast-deep-equal";

export const AdvancedSettingsSchema = z
  .object({
    minItemLevel: z.number().int().min(65).max(84).default(78),
    includeCorrupted: z.boolean().default(true),
    listingTimeFilter: ListingTimeFilterSchema.default("3days"),
  })
  .strict();

export type AdvancedSettings = z.infer<typeof AdvancedSettingsSchema>;

// Default values derived from schema
export const DEFAULT_ADVANCED_SETTINGS: AdvancedSettings =
  AdvancedSettingsSchema.parse({});
interface AdvancedSettingsPanelProps {
  settings: AdvancedSettings;
  onSettingsChange: (settings: AdvancedSettings) => void;
  className?: string;
}

const getMinimumItemLevelIcon: (iLvl: number) => React.ReactNode = (iLvl) => {
  if (iLvl < 70) {
    return <Tally1 className="size-4 text-red-600 dark:text-red-400" />;
  } else if (iLvl < 75) {
    return <Tally2 className="size-4 text-orange-600 dark:text-amber-400" />;
  } else if (iLvl < 80) {
    return <Tally3 className="size-4 text-yellow-600 dark:text-yellow-400" />;
  } else {
    return <Tally4 className="size-4 text-green-600 dark:text-green-400" />;
  }
};

export function AdvancedSettingsPanel({
  settings,
  onSettingsChange,
  className,
}: AdvancedSettingsPanelProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleMinItemLevelChange = (value: number[]) => {
    onSettingsChange({
      ...settings,
      minItemLevel: value[0],
    });
  };

  const handleIncludeCorruptedChange = (checked: CheckedState) => {
    onSettingsChange({
      ...settings,
      includeCorrupted: checked === true,
    });
  };

  const handleListingTimeFilterChange = (value: string) => {
    onSettingsChange({
      ...settings,
      listingTimeFilter: value as ListingTimeFilter,
    });
  };

  const dustValueLoss =
    (84 - Math.min(Math.max(settings.minItemLevel, 65), 84)) * 5;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn("group", className)}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Trade</span>
          <ChevronDown className="ml-1 h-3 w-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Trade Settings</h4>
              <Badge variant="outline" className="text-xs">
                Live Data
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">
              Configure trade search filters for Path of Exile trade website.
              Saved locally.
            </p>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {getMinimumItemLevelIcon(settings.minItemLevel)}
                <Label htmlFor="min-item-level" className="text-sm">
                  Minimum Item Level
                </Label>
              </div>
              <div className="px-2">
                <Slider
                  id="min-item-level"
                  min={65}
                  max={84}
                  step={1}
                  value={[settings.minItemLevel]}
                  onValueChange={handleMinItemLevelChange}
                  className="w-full py-1"
                  aria-label="Minimum item level"
                />
              </div>
              <div className="text-muted-foreground flex justify-between text-xs">
                <span className="leading-none">65</span>
                <span className="text-foreground leading-none font-semibold">
                  {settings.minItemLevel}
                </span>
                <span className="leading-none">84</span>
              </div>
              <div className="text-muted-foreground text-xs">
                Search will only include items with{" "}
                {dustValueLoss === 0 ? (
                  <span className="font-bold">no </span>
                ) : (
                  <span className="font-bold tabular-nums">
                    up to {dustValueLoss}%{" "}
                  </span>
                )}
                dust value loss.
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <Label htmlFor="include-corrupted" className="text-sm">
                    Include Corrupted Items
                  </Label>
                </div>
                <Checkbox
                  id="include-corrupted"
                  checked={settings.includeCorrupted}
                  onCheckedChange={handleIncludeCorruptedChange}
                  aria-label="Include corrupted items"
                  className="size-5"
                />
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="destructive" className="text-xs">
                  Cannot Add Quality
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Tainted Currency Only
                </Badge>
              </div>
              <p className="text-muted-foreground text-xs">
                Corrupted items cannot have quality added cheaply, but may have
                higher value from corruption implicits.
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <Label htmlFor="listing-time-filter" className="text-sm">
                  Listing Time
                </Label>
              </div>
              <Select
                value={settings.listingTimeFilter}
                onValueChange={handleListingTimeFilterChange}
              >
                <SelectTrigger id="listing-time-filter">
                  <SelectValue placeholder="Select time filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any time</SelectItem>
                  <SelectItem value="1hour">Up to an hour ago</SelectItem>
                  <SelectItem value="3hours">Up to 3 hours ago</SelectItem>
                  <SelectItem value="12hours">Up to 12 hours ago</SelectItem>
                  <SelectItem value="1day">Up to a day ago</SelectItem>
                  <SelectItem value="3days">Up to 3 days ago</SelectItem>
                  <SelectItem value="1week">Up to a week ago</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">
                Filter trade listings by when they were posted.
              </p>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onSettingsChange(DEFAULT_ADVANCED_SETTINGS);
              }}
              className="flex-1"
              disabled={equal(settings, DEFAULT_ADVANCED_SETTINGS)}
            >
              Reset
            </Button>
            <Button
              size="sm"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Close
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
