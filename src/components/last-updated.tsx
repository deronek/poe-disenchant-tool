"use client";

import type { revalidateDataAction } from "@/app/actions/revalidate";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, RefreshCw } from "lucide-react";
import { toast } from "sonner";

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

const ERROR_TITLE = "Failed to refresh data";
const ERROR_DESCRIPTION =
  "Unable to refresh the price data. Please try again later.";

const displayErrorToast = () => {
  toast.error(ERROR_TITLE, {
    description: ERROR_DESCRIPTION,
  });
};

interface LastUpdatedProps {
  timestamp: Date;
  league: string;
  revalidateDataAction: typeof revalidateDataAction;
}

export default function LastUpdated({
  timestamp,
  league,
  revalidateDataAction,
}: LastUpdatedProps) {
  const [relativeTime, setRelativeTime] = useState("...");
  const [absoluteTime, setAbsoluteTime] = useState("");
  const [isStale, setIsStale] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Expected last updated timestamp, only for retrying refresh after manual revalidation
  const [expectedLastUpdated, setExpectedLastUpdated] = useState<number | null>(
    null,
  );
  const retryRef = useRef(0);
  const waitingForInitialRefreshRef = useRef(false);

  const router = useRouter();

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
    if (expectedLastUpdated == null) return;

    // Skip the first effect run right after calling router.refresh() in revalidation handler
    if (waitingForInitialRefreshRef.current) {
      retryRef.current = 1;
      waitingForInitialRefreshRef.current = false;
      return;
    }

    const currentTs = timestamp.getTime();
    const expectedTs = expectedLastUpdated - 5 * 1000; // Tolerance is 5 seconds

    // Timestamp has caught up — success!
    if (currentTs >= expectedTs) {
      console.debug("RSC caught up, cleaning up", currentTs, expectedTs);
      cleanUpManualRefresh();
      return;
    }

    // Stale — need another retry
    const attempt = retryRef.current;

    // Bail out after 5 attempts
    if (attempt >= 5) {
      console.error(
        `RSC still stale after ${attempt} retries (current=${currentTs}, expected=${expectedTs})`,
      );

      displayErrorToast();
      cleanUpManualRefresh();
      setIsRefreshing(false);
      return;
    }

    // Exponential backoff, max 2s
    const delay = Math.min(200 * Math.pow(2, attempt), 2000);
    console.debug(
      `RSC stale after refresh (current=${currentTs}, expected=${expectedTs}), retry #${attempt} in ${delay}ms`,
    );

    const timer = setTimeout(() => {
      retryRef.current++;
      router.refresh();
    }, delay);

    return () => clearTimeout(timer);
  }, [timestamp, expectedLastUpdated, router]);

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
      setIsStale(diffInMinutes >= 30);

      // If below condition is false, we are currently retrying the refresh
      // and should keep the refreshing state
      if (retryRef.current === 0) {
        setIsRefreshing(false);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 30000);

    return () => clearInterval(interval);
  }, [timestamp]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Call the Server Action to revalidate data
      const res = await revalidateDataAction(window.location.origin, league);
      console.debug("revalidateData response:", res);

      // Even if server should refresh automatically if revalidation happened,
      // handle manual refresh in case it doesn't
      waitingForInitialRefreshRef.current = true;
      setExpectedLastUpdated(res.lastUpdated);
      router.refresh();
    } catch (error) {
      console.error("Failed to refresh data:", error);
      displayErrorToast();
      // Remove the loading state, since we don't get the updated data
      setIsRefreshing(false);
    } finally {
      // Not removing the loading state here, since there's a gap between setting this
      // and revalidation being reflected in the UI.
      // Updating timestamp from parent will hide the button.
    }
  };

  const cleanUpManualRefresh = () => {
    retryRef.current = 0;
    setExpectedLastUpdated(null);
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
          <time
            className="text-sm font-semibold"
            dateTime={timestamp.toISOString()}
          >
            {absoluteTime}
          </time>
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
