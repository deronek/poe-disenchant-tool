"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Clock, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface LastUpdatedProps {
  timestamp: Date;
  league: string;
  revalidateData: (origin: string, league: string) => Promise<unknown>;
}

export default function LastUpdated({
  timestamp,
  league,
  revalidateData,
}: LastUpdatedProps) {
  const [relativeTime, setRelativeTime] = useState("...");
  const [absoluteTime, setAbsoluteTime] = useState("");
  const [isStale, setIsStale] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Feature flag to always show refresh button for development/testing
  // Only read from localStorage if it exists
  const [alwaysShowRefresh, setAlwaysShowRefresh] = useState(false);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(
        "poe-udt:always-show-refresh:v1",
      );
      if (item) {
        const parsedValue = JSON.parse(item);
        if (typeof parsedValue === "boolean") {
          setAlwaysShowRefresh(parsedValue);
        }
      }
    } catch (
      _ // eslint-disable-line @typescript-eslint/no-unused-vars
    ) {}
  }, []);

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
      setIsStale(diffInMinutes >= 5);
      setIsRefreshing(false);
    };

    updateTime();
    const interval = setInterval(updateTime, 30000);

    return () => clearInterval(interval);
  }, [timestamp]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Call the Server Action to revalidate data
      const res = await revalidateData(window.location.origin, league);
      console.debug("revalidateData response:", res);
    } catch (error) {
      console.error("Failed to refresh data:", error);
      toast.error("Failed to refresh data", {
        description:
          "Unable to refresh the price data. Please try again later.",
      });
      // Remove the loading state, since we don't get the updated data
      setIsRefreshing(false);
    } finally {
      // Not removing the loading state here, since there's a gap between setting this
      // and revalidation being reflected in the UI.
      // Updated date will hide the button.
      // If for some reason we get the same data from the server (e.g. because of Data Cache),
      // this will keep the "revalidating" state until next time update.
    }
  };

  const tooltipContent = (
    <div className="space-y-4">
      {/* Last Updated Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-semibold">Last Updated</span>
          {(isStale || alwaysShowRefresh) && (
            <Badge variant="destructive" className="text-xs">
              Needs refresh
            </Badge>
          )}
        </div>
        <div className="space-y-1">
          <div className="text-muted-foreground text-xs font-semibold">
            Absolute Time
          </div>
          <div className="text-sm font-semibold">{absoluteTime}</div>
        </div>
      </div>
      {/* Refresh Section - Only shown when data is stale */}
      {(isStale || alwaysShowRefresh) && (
        <div className="space-y-3 border-t pt-2">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-semibold">Refresh Data</span>
          </div>
          <div className="text-muted-foreground text-sm">
            Click the refresh button to get the latest price data.
          </div>
        </div>
      )}
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
      {(isStale || alwaysShowRefresh) && (
        <Button
          onClick={handleRefresh}
          disabled={isRefreshing}
          size="sm"
          className="ml-2 text-xs"
          aria-label={isRefreshing ? "Refreshing data..." : "Refresh data"}
        >
          <span
            className={`inline-block transition-transform duration-200 ${
              isRefreshing ? "animate-spin" : ""
            }`}
          >
            <RefreshCw />
          </span>
        </Button>
      )}
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
