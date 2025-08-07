import fs from "fs";
import path from "path";

import { z } from "zod";

// data is:
// const a = await fetch('https://poe.ninja/api/data/denseoverviews?league=Mercenaries')
// const b = await a.json()

const dataHardcoded = fs.readFileSync(
  path.join(process.cwd(), "src/lib/prices/prices.json"),
  "utf-8",
);

const jsonHardcoded = JSON.parse(dataHardcoded);

const LineSchema = z.object({
  name: z.string(),
  chaos: z.number(),
  graph: z.array(z.number().nullable()),
  variant: z.string().optional(),
});

const OverviewSchema = z.object({
  type: z.string(),
  lines: z.array(LineSchema),
});

const ApiResponseSchema = z.object({
  currencyOverviews: z.array(OverviewSchema),
  itemOverviews: z.array(OverviewSchema),
});

type ApiResponse = z.infer<typeof ApiResponseSchema>;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type Overview = z.infer<typeof OverviewSchema>;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type Line = z.infer<typeof LineSchema>;

const allowedUniqueTypes = [
  "UniqueWeapon",
  "UniqueArmor",
  "UniqueAccessory",
] as const;

type AllowedUnique = (typeof allowedUniqueTypes)[number];

const isAllowedUnique = (t: string): t is AllowedUnique =>
  (allowedUniqueTypes as readonly string[]).includes(t);

export type Item = {
  type: AllowedUnique;
  name: string;
  chaos: number;
  graph: (number | null)[];
  variant?: string;
};

// TODO: cache using ISR
const getPriceDataApi = async (): Promise<ApiResponse> => {
  try {
    // TODO: add league param
    const response = await fetch(
      "https://poe.ninja/api/data/denseoverviews?league=Mercenaries",
    );
    const json = await response.json();
    const data = await parseResponse(json);
    console.log("Successfully fetched price data");
    return data;
  } catch (error) {
    // TODO: need to show this info on page
    console.error(
      "Error fetching price data:",
      error,
      "Falling back to hardcoded data",
    );
    return jsonHardcoded;
  }
};

const parseResponse = async (json: unknown): Promise<ApiResponse> => {
  return ApiResponseSchema.parse(json);
};

// If we get a line with a variant containing 5L or 6L, we need to keep the base version only
const dedupeLinkedVariants = (lines: Item[]) => {
  const grouped = new Map<string, Item[]>();

  for (const line of lines) {
    grouped.set(line.name, [...(grouped.get(line.name) ?? []), line]);
  }

  const filtered: Item[] = [];

  for (const [, sameNameLines] of grouped.entries()) {
    const hasLinked = sameNameLines.some((line) =>
      /5L|6L/i.test(line.variant ?? ""),
    );
    const hasBase = sameNameLines.some(
      (line) => !(line.variant && /5L|6L/i.test(line.variant)),
    );

    if (hasLinked && hasBase) {
      const baseLines = sameNameLines.filter(
        (line) => !(line.variant && /5L|6L/i.test(line.variant)),
      );
      // Log removed linked variants
      // sameNameLines.forEach((line) => {
      //   if (line.variant && /5L|6L/i.test(line.variant)) {
      //     console.warn(`Removed linked variant due to base existing:`, line);
      //   }
      // });
      filtered.push(...baseLines);
    } else {
      filtered.push(...sameNameLines);
    }
  }

  return filtered;
};

// If we get a line with a relic, keep only the base variant
const dedupeRelics = (lines: Item[]) => {
  const grouped = new Map<string, Item[]>();

  for (const line of lines) {
    grouped.set(line.name, [...(grouped.get(line.name) ?? []), line]);
  }

  const filtered: Item[] = [];

  for (const [, sameNameLines] of grouped.entries()) {
    const hasRelic = sameNameLines.some((line) =>
      /, Relic/i.test(line.variant ?? ""),
    );
    const hasBase = sameNameLines.some(
      (line) => !(line.variant && /, Relic/i.test(line.variant)),
    );

    if (hasRelic && hasBase) {
      const baseLines = sameNameLines.filter(
        (line) => !(line.variant && /, Relic/i.test(line.variant)),
      );
      // Log removed relic variants
      // sameNameLines.forEach((line) => {
      //   if (line.variant && /, Relic/i.test(line.variant)) {
      //     console.warn(`Removed relic variant due to base existing:`, line);
      //   }
      // });
      filtered.push(...baseLines);
    } else {
      filtered.push(...sameNameLines);
    }
  }

  return filtered;
};

const getUniqueItemLines = async (json: unknown): Promise<Item[]> => {
  const data = await parseResponse(json);

  const items: Item[] = data.itemOverviews
    .filter((item) => isAllowedUnique(item.type))
    .flatMap((item) =>
      item.lines.map((line) => ({
        type: item.type as AllowedUnique,
        ...line,
      })),
    );

  const noLinked = dedupeLinkedVariants(items);
  const noRelic = dedupeRelics(noLinked);

  const filtered = noRelic;

  // Check for duplicate names
  // const seen = new Map<string, Line>();
  // for (const line of filtered) {
  //   const existing = seen.get(line.name);
  //   if (existing) {
  //     console.warn(`⚠️ Duplicate name found: "${line.name}"`);
  //     console.warn("First occurrence:", existing);
  //     console.warn("Second occurrence:", line);
  //   } else {
  //     seen.set(line.name, line);
  //   }
  // }

  return filtered;
};

const uncached__getPriceData = async (): Promise<Item[]> => {
  const data = await getPriceDataApi();
  const lines = await getUniqueItemLines(data);
  return lines;
};

// export const getPriceData = unstable_cache(
//   uncached__getPriceData,
//   ["poe.ninja"],
//   {
//     revalidate: 300, // 5 minutes
//   },
// );

export const getPriceData = uncached__getPriceData;
