import fs from "fs";

import { z } from "zod";

const data = fs.readFileSync("src/lib/prices/prices.json", "utf-8");
const json = JSON.parse(data);

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
export type Line = z.infer<typeof LineSchema>;

const parseResponse = async (json: unknown): Promise<ApiResponse> => {
  return ApiResponseSchema.parse(json);
};

// const getUniqueItemLines = async (json: unknown): Promise<Line[]> => {
//   const data = await parseResponse(json);

//   return data.itemOverviews
//     .filter((item) =>
//       ["UniqueWeapon", "UniqueArmor", "UniqueAccessory"].includes(item.type),
//     )
//     .flatMap((item) => item.lines);
// };

// If we get a line with a variant containing 5L or 6L, we need to keep the base version only
const dedupeLinkedVariants = (lines: Line[]): Line[] => {
  const grouped = new Map<string, Line[]>();

  for (const line of lines) {
    grouped.set(line.name, [...(grouped.get(line.name) ?? []), line]);
  }

  const filtered: Line[] = [];

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
const dedupeRelics = (lines: Line[]): Line[] => {
  const grouped = new Map<string, Line[]>();

  for (const line of lines) {
    grouped.set(line.name, [...(grouped.get(line.name) ?? []), line]);
  }

  const filtered: Line[] = [];

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

const getUniqueItemLines = async (json: unknown): Promise<Line[]> => {
  const data = await parseResponse(json);

  const lines = data.itemOverviews
    .filter((item) =>
      ["UniqueWeapon", "UniqueArmor", "UniqueAccessory"].includes(item.type),
    )
    .flatMap((item) => item.lines);

  const noLinked = dedupeLinkedVariants(lines);
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

export const getPriceData = async (): Promise<Line[]> => {
  const lines = await getUniqueItemLines(json);
  return lines;
};
