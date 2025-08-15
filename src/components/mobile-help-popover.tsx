import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { HelpCircle, Info } from "lucide-react";

export function MobileHelpPopover() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          aria-label="Get help using this app"
        >
          <HelpCircle className="h-4 w-4" />
          Help
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="max-w-[320px] text-sm"
        side="bottom"
        align="end"
      >
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500 dark:text-blue-400" />
            <div>
              <p className="font-medium">Mark Items</p>
              <p className="text-neutral-900 dark:text-neutral-100">
                Check the box to mark items you've traded recently. Marks are
                saved locally and can be cleared anytime.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500 dark:text-blue-400" />
            <div>
              <p className="font-medium">Trade Settings</p>
              <p className="text-neutral-900 dark:text-neutral-100">
                Advanced trade settings and search information are available in
                the Trade button dropdown. Configure filters and learn about
                trade search behavior.
              </p>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
