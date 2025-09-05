"use client";

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
  Settings,
  ChevronDown,
  Zap,
  Tally1,
  Tally2,
  Tally3,
  Tally4,
} from "lucide-react";
import * as React from "react";
import { Separator } from "./ui/separator";
import { cn } from "@/lib/utils";
import { z } from "zod";

export const AdvancedSettingsSchema = z
  .object({
    minItemLevel: z.number().int().min(65).max(84).default(78),
    includeCorrupted: z.boolean().default(true),
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
              <div className="flex items-center gap-1">
                <Badge variant="secondary" className="text-xs">
                  Last 3 Days
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Live Data
                </Badge>
              </div>
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
                <Label htmlFor="min-item-level" className="text-sm font-medium">
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
                <span className="text-foreground leading-none font-medium">
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
                  <Label
                    htmlFor="include-corrupted"
                    className="cursor-pointer text-sm font-medium"
                  >
                    Include Corrupted Items
                  </Label>
                </div>
                <Checkbox
                  id="include-corrupted"
                  checked={settings.includeCorrupted}
                  onCheckedChange={handleIncludeCorruptedChange}
                  aria-label="Include corrupted items"
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
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onSettingsChange(DEFAULT_ADVANCED_SETTINGS);
              }}
              className="flex-1"
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
