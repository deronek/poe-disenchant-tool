import { ChevronDown, Gauge } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { EfficiencySettingsPanel } from "./efficiency-settings-panel";

export function EfficiencySettingsControl({
  className,
}: {
  className?: string;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("group gap-3 whitespace-nowrap", className)}
          aria-label="Configure the Efficiency metric"
        >
          <Gauge className="size-4 shrink-0" aria-hidden="true" />

          <span>Efficiency</span>

          <ChevronDown className="ml-1 h-3 w-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80" align="end">
        <EfficiencySettingsPanel />
      </PopoverContent>
    </Popover>
  );
}
