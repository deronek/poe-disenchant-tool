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
