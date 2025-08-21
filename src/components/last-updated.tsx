"use client";

import {
  calculateTimeDifferences,
  formatAbsoluteTime,
  formatRelativeTime,
} from "@/lib/dateUtils";
import { useState, useEffect } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLocalStorage } from "@/lib/use-local-storage";
import { useRouter } from "next/navigation";

interface LastUpdatedProps {
  timestamp: string;
  showRefreshButton?: boolean;
  revalidateData?: () => Promise<void>;
}

export default function LastUpdated({
  timestamp,
  showRefreshButton = false,
  revalidateData,
}: LastUpdatedProps) {
  const router = useRouter();
  const [relativeTime, setRelativeTime] = useState("...");
  const [absoluteTime, setAbsoluteTime] = useState("");
  const [isStale, setIsStale] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Feature flag to always show refresh button for development/testing
  const [alwaysShowRefresh] = useLocalStorage(
    false,
    "poe-udt:always-show-refresh",
    { timeout: 300 },
  );

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
      setIsStale(diffInMinutes > 5);
    };

    updateTime();
    const interval = setInterval(updateTime, 30000);

    return () => clearInterval(interval);
  }, [timestamp]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Call the Server Action to revalidate data
      if (revalidateData) {
        await revalidateData();
      }
      // Then refresh the current route to get fresh data
      router.refresh();
    } catch (error) {
      console.error("Failed to refresh data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const tooltipContent = (
    <div className="space-y-2 text-sm">
      <div>
        <strong>Last updated:</strong> {absoluteTime}
      </div>
      <div>
        <strong>Time since update:</strong> {relativeTime}
      </div>
      <div>
        <strong>Data source:</strong> poe.ninja API
      </div>
      <div>
        <strong>Revalidation:</strong> Every 5 minutes (ISR)
      </div>
      {isStale && (
        <div className="border-t pt-2">
          <div className="text-amber-600 dark:text-amber-400">
            <strong>Note:</strong> Data may be stale. Manual refresh might not
            get the latest data due to caching.
          </div>
          {showRefreshButton && (
            <div className="mt-2">
              <strong>Tip:</strong> Use the refresh button to request fresh data
              directly.
            </div>
          )}
        </div>
      )}
      {alwaysShowRefresh && (
        <div className="border-t pt-2">
          <div className="text-blue-600 dark:text-blue-400">
            <strong>Dev Mode:</strong> Refresh button is always visible due to
            feature flag.
          </div>
        </div>
      )}
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <time
            dateTime={timestamp}
            className={`text-muted-foreground cursor-help text-sm transition-colors ${
              isStale ? "text-amber-600 dark:text-amber-400" : ""
            }`}
          >
            Last updated: {relativeTime}
            {(isStale || alwaysShowRefresh) && showRefreshButton && (
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="bg-primary text-primary-foreground hover:bg-primary/90 ml-2 rounded px-2 py-1 text-xs transition-colors disabled:opacity-50"
                aria-label="Refresh data"
              >
                {isRefreshing ? "..." : "↻"}
              </button>
            )}
          </time>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-sm">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
