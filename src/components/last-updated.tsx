"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  calculateTimeDifferences,
  formatAbsoluteTime,
  formatRelativeTime,
} from "@/lib/dateUtils";

interface LastUpdatedProps {
  timestamp: Date;
}

export default function LastUpdated({ timestamp }: LastUpdatedProps) {
  const [relativeTime, setRelativeTime] = useState("...");
  const [absoluteTime, setAbsoluteTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const { diffInMinutes, diffInHours, diffInDays } =
        calculateTimeDifferences(timestamp, now);
      const relative = formatRelativeTime(
        diffInMinutes,
        diffInHours,
        diffInDays,
      );
      const absolute = formatAbsoluteTime(timestamp);

      setRelativeTime(relative);
      setAbsoluteTime(absolute);
    };

    updateTime();
    const interval = setInterval(updateTime, 30000);

    return () => clearInterval(interval);
  }, [timestamp]);

  const tooltipContent = (
    <div className="space-y-4">
      {/* Last Updated Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-semibold">Last Updated</span>
        </div>
        <div className="space-y-1">
          <div className="text-muted-foreground text-xs font-semibold">
            Absolute Time
          </div>
          <time
            className="text-sm font-semibold"
            dateTime={timestamp.toISOString()}
          >
            {absoluteTime}
          </time>
        </div>
      </div>
    </div>
  );

  const triggerElement = (
    <time
      dateTime={timestamp.toISOString()}
      className={
        "text-muted-foreground inline-flex h-8 cursor-help items-center text-sm transition-colors"
      }
    >
      Last updated: {relativeTime}
    </time>
  );

  return (
    <>
      <div className="hidden lg:block">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>{triggerElement}</TooltipTrigger>
            <TooltipContent
              side="bottom"
              className="max-w-sm"
              variant="popover"
            >
              {tooltipContent}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="lg:hidden">
        <Popover>
          <PopoverTrigger asChild>{triggerElement}</PopoverTrigger>
          <PopoverContent>{tooltipContent}</PopoverContent>
        </Popover>
      </div>
    </>
  );
}
