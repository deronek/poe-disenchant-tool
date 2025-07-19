"use client";

import {
  calculateTimeDifferences,
  formatAbsoluteTime,
  formatRelativeTime,
} from "@/lib/dateUtils";
import { useState, useEffect } from "react";

interface LastUpdatedProps {
  timestamp: string;
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

  return (
    <time
      dateTime={timestamp}
      title={absoluteTime}
      className="text-muted-foreground cursor-help text-sm"
    >
      Last updated: {relativeTime}
    </time>
  );
}
