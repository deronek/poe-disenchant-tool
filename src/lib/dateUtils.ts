export const calculateTimeDifferences = (
  timestamp: Date,
  now: Date = new Date(),
) => {
  const diffInMs = now.getTime() - timestamp.getTime();

  return {
    diffInMinutes: Math.floor(diffInMs / (1000 * 60)),
    diffInHours: Math.floor(diffInMs / (1000 * 60 * 60)),
    diffInDays: Math.floor(diffInMs / (1000 * 60 * 60 * 24)),
  };
};

export const formatRelativeTime = (
  diffInMinutes: number,
  diffInHours: number,
  diffInDays: number,
) => {
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (diffInMinutes === 0) {
    return "just now";
  } else if (diffInDays > 0) {
    return rtf.format(-diffInDays, "day");
  } else if (diffInHours > 0) {
    return rtf.format(-diffInHours, "hour");
  } else {
    return rtf.format(-diffInMinutes, "minute");
  }
};

export const formatAbsoluteTime = (timestamp: Date) => {
  const localeForFormatting = navigator.language;

  return new Intl.DateTimeFormat(localeForFormatting, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  }).format(timestamp);
};
