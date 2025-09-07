import "server-only";

import fs from "fs";
import path from "path";

import { z } from "zod";
import { getLeagueApiName, League } from "../leagues";

import { isDevelopment } from "../utils-server";

const allowedUniqueTypes = [
  "UniqueWeapon",
  "UniqueArmour",
  "UniqueAccessory",
] as const;

export type AllowedUnique = (typeof allowedUniqueTypes)[number];

const LineSchema = z.object({
  name: z.string(),
  chaosValue: z.number(),
  baseType: z.string(),
  icon: z.string().url(),
  listingCount: z.number().int(),
  detailsId: z.string(),
});

const ItemOverviewResponseSchema = z.object({
  lines: z.optional(z.array(LineSchema)),
});

type ItemOverviewResponse = z.infer<typeof ItemOverviewResponseSchema>;

export type InternalItem = {
  type: AllowedUnique;
  name: string;
  chaos: number;
  baseType: string;
  icon: string;
  listingCount: number;
  detailsId: string;
};

export type Item = Omit<InternalItem, "detailsId">;

// Parse dev data globally in development only
const devDataCache = {} as Record<AllowedUnique, ItemOverviewResponse>;

if (isDevelopment) {
  const loadData = (type: string): ItemOverviewResponse => {
    const filePath = path.join(
      process.cwd(),
      "src/lib/prices/dev-data",
      `${type}.json`,
    );

    try {
      const data = fs.readFileSync(filePath, "utf-8");
      const json = JSON.parse(data);
      return ItemOverviewResponseSchema.parse(json);
    } catch (error) {
      console.warn(
        `Could not load dev data for ${type}, returning empty data`,
        error,
      );
      return { lines: [] };
    }
  };

  // Load all dev data at startup
  allowedUniqueTypes.forEach((type) => {
    devDataCache[type] = loadData(type);
  });
}

const getDevData = async (
  type: AllowedUnique,
): Promise<ItemOverviewResponse> => {
  // Return cached dev data
  return devDataCache[type];
};

const getProductionDataForType = async (
  type: AllowedUnique,
  leagueApiName: string,
): Promise<InternalItem[]> => {
  const url = `https://poe.ninja/api/data/itemoverview?type=${encodeURIComponent(type)}&league=${encodeURIComponent(leagueApiName)}`;
  try {
    const response = await fetch(url);
    const json = await response.json();
    const data = ItemOverviewResponseSchema.parse(json);

    if (!data.lines) {
      console.warn(`No data returned for ${type} in ${leagueApiName}`);
      return [];
    }

    const items: InternalItem[] = data.lines.map((line) => ({
      type,
      name: line.name,
      chaos: line.chaosValue,
      baseType: line.baseType,
      icon: line.icon,
      listingCount: line.listingCount,
      detailsId: line.detailsId,
    }));

    console.log(
      `Successfully fetched price data for ${type} in ${leagueApiName}`,
    );
    return items;
  } catch (error) {
    console.error(
      `Error fetching price data for ${type} in ${leagueApiName}:`,
      error,
    );
    return [];
  }
};

const getPriceDataForType = async (
  type: AllowedUnique,
  leagueApiName: string,
): Promise<InternalItem[]> => {
  if (isDevelopment) {
    return getDevDataForType(type);
  }

  return getProductionDataForType(type, leagueApiName);
};

const getDevDataForType = async (
  type: AllowedUnique,
): Promise<InternalItem[]> => {
  const data = await getDevData(type);
  if (!data.lines) {
    console.warn(`No dev data returned for ${type}`);
    return [];
  }

  return data.lines.map((line) => ({
    type,
    name: line.name,
    chaos: line.chaosValue,
    baseType: line.baseType,
    icon: line.icon,
    listingCount: line.listingCount,
    detailsId: line.detailsId,
  }));
};

/**
 * Dedupes items by name, preferring non-special variants where possible.
 * - Unique names: pass through unchanged.
 * - Duplicates with non-special: select cheapest non-special, sum listingCounts.
 * - Duplicates only special: select cheapest special.
 * Specials detected if detailsId ends with "-relic", "-5l", or "-6l".
 * For equal chaos, retains the first item's other properties.
 * @param lines Array of InternalItem objects
 * @returns Deduped array with modified listingCount where summed.
 * @throws Error if input is null or undefined.
 * @throws Runtime error if array contains null/undefined items (property access).
 */
export const dedupeCheapestVariants = (
  lines: InternalItem[],
): InternalItem[] => {
  if (lines.length === 0) return [];

  const specialSuffixes = ["-relic", "-5l", "-6l"];

  const isSpecialSuffix = (item: InternalItem): boolean => {
    return specialSuffixes.some((suffix) => item.detailsId.endsWith(suffix));
  };

  // Group all items by name
  const groupsByName = new Map<string, InternalItem[]>();
  for (const item of lines) {
    const name = item.name;
    if (!groupsByName.has(name)) {
      groupsByName.set(name, []);
    }
    groupsByName.get(name)!.push(item);
  }

  const result: InternalItem[] = [];

  for (const [, group] of groupsByName) {
    if (group.length === 1) {
      // Unique name - pass through unchanged
      result.push(group[0]);
    } else {
      // Non-unique name - handle duplicates
      const nonSpecialItems = group.filter((item) => !isSpecialSuffix(item));

      let chosenItem: InternalItem;
      let totalListingCount: number;

      if (nonSpecialItems.length > 0) {
        // Keep only non-special items: take cheapest and merge their listing counts
        chosenItem = nonSpecialItems.reduce((min, curr) =>
          curr.chaos < min.chaos ? curr : min,
        );
        totalListingCount = nonSpecialItems.reduce(
          (sum, item) => sum + item.listingCount,
          0,
        );
      } else {
        // Only special suffix items exist: keep cheapest special suffix item
        chosenItem = group.reduce((min, curr) =>
          curr.chaos < min.chaos ? curr : min,
        );
        totalListingCount = chosenItem.listingCount;
      }

      // Create the result item
      result.push({
        ...chosenItem,
        listingCount: totalListingCount,
      });
    }
  }

  // Dev-only verification
  if (isDevelopment) {
    const names = result.map((i) => i.name);
    const uniqueNames = new Set(names);
    if (uniqueNames.size !== names.length) {
      console.warn("Duplicate names after deduping:", [
        ...new Set(names.filter((n, i) => names.indexOf(n) !== i)),
      ]);
    } else {
      console.log(`Deduping successful: ${uniqueNames.size} unique names`);
    }
  }

  return result;
};

const uncached__getPriceData = async (league: League): Promise<Item[]> => {
  const leagueApiName = getLeagueApiName(league);
  const allTypes = allowedUniqueTypes as readonly AllowedUnique[];

  // Fetch data for each type in parallel
  const typePromises = allTypes.map((type) =>
    getPriceDataForType(type, leagueApiName),
  );

  const allItems = await Promise.all(typePromises);
  const combinedItems = allItems.flat();

  const cheapestVariants = dedupeCheapestVariants(combinedItems);

  // Map to public Item type, excluding detailsId
  return cheapestVariants.map(
    (item): Item => ({
      type: item.type,
      name: item.name,
      chaos: item.chaos,
      baseType: item.baseType,
      icon: item.icon,
      listingCount: item.listingCount,
    }),
  );
};

export const getPriceData = uncached__getPriceData;
