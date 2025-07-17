"use client";

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
      const lastUpdate = new Date(timestamp);

      const diffInMs = now.getTime() - lastUpdate.getTime();
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

      const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
      const relative = rtf.format(-diffInMinutes, "minute");

      setRelativeTime(relative);

      // Format absolute time with timezone - client locale-aware but in English
      const clientLocale = navigator.language || "en-US";
      const localeForFormatting = clientLocale.startsWith("en")
        ? clientLocale
        : `en-${clientLocale.split("-")[1] || "US"}`;

      const absolute = new Intl.DateTimeFormat(localeForFormatting, {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZoneName: "short",
      }).format(lastUpdate);

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
