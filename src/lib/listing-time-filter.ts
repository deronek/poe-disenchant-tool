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

export const LISTING_TIME_LABELS: Record<ListingTimeFilter, string> = {
  "1hour": "Up to an hour ago",
  "3hours": "Up to 3 hours ago",
  "12hours": "Up to 12 hours ago",
  "1day": "Up to a day ago",
  "3days": "Up to 3 days ago",
  "1week": "Up to a week ago",
  any: "Any time",
};

export const LISTING_TIME_FILTER_OPTIONS = ListingTimeFilterSchema.options.map(
  (value) => ({
    value,
    label: LISTING_TIME_LABELS[value],
  }),
);

// Helper to get label from value
export const getListingTimeFilterLabel = (value: ListingTimeFilter): string => {
  return LISTING_TIME_LABELS[value];
};

// Helper to get value from label
export const getListingTimeFilterValue = (label: string): ListingTimeFilter => {
  const entry = Object.entries(LISTING_TIME_LABELS).find(
    ([, l]) => l === label,
  );

  if (!entry) {
    throw new Error(`Invalid listing time filter label: ${label}`);
  }

  return entry[0] as ListingTimeFilter;
};
