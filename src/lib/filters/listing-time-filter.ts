import { z } from "zod";

export const ListingTimeFilterSchema = z.enum([
  "any",
  "1hour",
  "3hours",
  "12hours",
  "1day",
  "3days",
  "1week",
]);

export type ListingTimeFilter = z.infer<typeof ListingTimeFilterSchema>;

export const LISTING_TIME_LABELS = {
  "1hour": "Up to an hour ago",
  "3hours": "Up to 3 hours ago",
  "12hours": "Up to 12 hours ago",
  "1day": "Up to a day ago",
  "3days": "Up to 3 days ago",
  "1week": "Up to a week ago",
  any: "Any time",
} as const satisfies Record<ListingTimeFilter, string>;
