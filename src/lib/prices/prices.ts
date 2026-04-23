import "server-only";

import fs from "fs";
import path from "path";
import { z } from "zod";

import { getLeagueApiName, League } from "../leagues";
import { isDevelopment } from "../utils-server";
import { USER_AGENT } from "./utils";

const allowedUniqueTypes = [
  "UniqueWeapon",
  "UniqueArmour",
  "UniqueAccessory",
] as const;

export type AllowedUnique = (typeof allowedUniqueTypes)[number];

/**
 * Ensures chaos price is always positive
 */
const ensureValidChaosPrice = (price: number): number => {
  return price <= 0 ? 0.01 : price;
};

const LineSchema = z.object({
  name: z.string(),
  chaosValue: z.number(),
  divineValue: z.number(),
  baseType: z.string(),
  icon: z.url(),
  listingCount: z.int(),
  detailsId: z.string(),
  itemType: z.string(),
});

const ItemOverviewResponseSchema = z.object({
  lines: z.optional(z.array(LineSchema)),
});

type ItemOverviewResponse = z.infer<typeof ItemOverviewResponseSchema>;

export type InternalItem = {
  type: AllowedUnique;
  name: string;
  chaos: number;
  divine: number;
  baseType: string;
  icon: string;
  listingCount: number;
  detailsId: string;
  itemType: string;
};

export type Item = Omit<InternalItem, "detailsId">;

// Parse dev data globally in development only
const devDataCache = {} as Record<AllowedUnique, ItemOverviewResponse>;

if (isDevelopment) {
  const loadData = (type: string): ItemOverviewResponse => {
    const filePath = path.join(
      process.cwd(),
      "data/prices/dev-data",
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
  const url = `https://poe.ninja/poe1/api/economy/stash/current/item/overview?type=${encodeURIComponent(type)}&league=${encodeURIComponent(leagueApiName)}`;
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
      },
    });
    const json = await response.json();
    const data = ItemOverviewResponseSchema.parse(json);

    if (!data.lines) {
      console.warn(`No data returned for ${type} in ${leagueApiName}`);
      return [];
    }

    const items: InternalItem[] = data.lines.map((line) => ({
      type,
      name: line.name,
      chaos: ensureValidChaosPrice(line.chaosValue),
      divine: line.divineValue,
      baseType: line.baseType,
      icon: line.icon,
      listingCount: line.listingCount,
      detailsId: line.detailsId,
      itemType: line.itemType,
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
    chaos: ensureValidChaosPrice(line.chaosValue),
    divine: line.divineValue,
    baseType: line.baseType,
    icon: line.icon,
    listingCount: line.listingCount,
    detailsId: line.detailsId,
    itemType: line.itemType,
  }));
};

/**
 * Dedupes items by name, preferring non-special variants where possible.
 *
 * - Unique names: pass through unchanged.
 * - Duplicates with non-special: select cheapest non-special, sum listingCounts.
 * - Duplicates only special: select cheapest special.
 * - Specials detected if detailsId ends with "-relic", "-5l", or "-6l".
 * For equal chaos, retains the first item's other properties.
 * - Foulborn handling:
 *   - "Foulborn " prefix denotes a Foulborn variant.
 *   - If only Foulborn or non-Foulborn exist → take whichever exists.
 *   - If both exist:
 *     - Take cheaper price but keep non-Foulborn name.
 *     - Listing counts are summed across both variants.
 *
 * @param lines Array of InternalItem objects
 * @returns Deduped array with modified listingCount where summed.
 * @throws Error if input is null or undefined.
 * @throws Runtime error if array contains null/undefined items.
 */

// Helper functions for Foulborn detection
const isFoulbornItem = (name: string | undefined): boolean =>
  !!name && name.startsWith("Foulborn ");

const extractBaseName = (name: string | undefined): string =>
  name && isFoulbornItem(name) ? name.substring(9) : (name ?? "");

const getCheapest = (items: InternalItem[]) =>
  items.reduce((min, curr) => (curr.chaos < min.chaos ? curr : min));

const sumListings = (items: InternalItem[]) =>
  items.reduce((sum, i) => sum + i.listingCount, 0);

export const dedupeCheapestVariants = (
  lines: InternalItem[],
): InternalItem[] => {
  if (lines.length === 0) return [];

  const specialSuffixes = ["-relic", "-5l", "-6l"];
  const isSpecialSuffix = (item: InternalItem): boolean =>
    specialSuffixes.some((suffix) => item.detailsId.endsWith(suffix));

  // Step 1: Group by name and dedupe base + special suffixes
  const groupsByName = new Map<string, InternalItem[]>();
  for (const item of lines) {
    const name = item.name;
    if (!groupsByName.has(name)) groupsByName.set(name, []);
    groupsByName.get(name)!.push(item);
  }

  const result: InternalItem[] = [];

  for (const [, group] of groupsByName) {
    if (group.length === 1) {
      // Unique name - pass through unchanged
      result.push(group[0]);
      continue;
    }

    const nonSpecialItems = group.filter((item) => !isSpecialSuffix(item));
    let chosenItem: InternalItem;
    let totalListingCount: number;

    if (nonSpecialItems.length > 0) {
      // Keep only non-special items: take cheapest and merge their listing counts
      chosenItem = getCheapest(nonSpecialItems);
      totalListingCount = sumListings(nonSpecialItems);
    } else {
      // Only special suffix items exist: keep cheapest special's own listing count
      chosenItem = getCheapest(group);
      totalListingCount = chosenItem.listingCount;
    }

    result.push({
      ...chosenItem,
      listingCount: totalListingCount,
    });
  }

  // Step 2: Deduplicate Foulborn variants based on base name
  const hasFoulbornItems = result.some((item) => isFoulbornItem(item.name));
  if (hasFoulbornItems) {
    const foulbornGroups = new Map<string, InternalItem[]>();
    for (const item of result) {
      const baseName = extractBaseName(item.name);
      if (!foulbornGroups.has(baseName)) foulbornGroups.set(baseName, []);
      foulbornGroups.get(baseName)!.push(item);
    }

    const finalResult: InternalItem[] = [];

    for (const [, items] of foulbornGroups.entries()) {
      const regulars = items.filter((i) => !isFoulbornItem(i.name));
      const foulborns = items.filter((i) => isFoulbornItem(i.name));

      // Case 1: Only one type exists → use base name (without Foulborn prefix)
      if (regulars.length === 0 || foulborns.length === 0) {
        const cheapestItem = getCheapest(items);
        finalResult.push({
          ...cheapestItem,
          name: extractBaseName(cheapestItem.name),
          listingCount: sumListings(items),
        });
        continue;
      }

      // Case 2: Both exist → merge into one, using cheaper price
      const cheapestRegular = getCheapest(regulars);
      const cheapestFoulborn = getCheapest(foulborns);
      const cheapestChaos = Math.min(
        cheapestRegular.chaos,
        cheapestFoulborn.chaos,
      );

      // Get the divine price corresponding to the cheapest chaos price
      let cheapestDivine: number;
      if (cheapestRegular.chaos <= cheapestFoulborn.chaos) {
        cheapestDivine = cheapestRegular.divine;
      } else {
        cheapestDivine = cheapestFoulborn.divine;
      }

      finalResult.push({
        ...(cheapestRegular.chaos <= cheapestFoulborn.chaos
          ? cheapestRegular
          : cheapestFoulborn),
        name: cheapestRegular.name, // always keep non-Foulborn name
        chaos: cheapestChaos,
        divine: cheapestDivine, // ensure we set the correct divine price
        listingCount: sumListings(items), // aggregate listings across both
      });
    }

    result.length = 0;
    result.push(...finalResult);
  }

  // Step 3: Dev verification
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
      divine: item.divine,
      baseType: item.baseType,
      icon: item.icon,
      listingCount: item.listingCount,
      itemType: item.itemType,
    }),
  );
};

export const getPriceData = uncached__getPriceData;
