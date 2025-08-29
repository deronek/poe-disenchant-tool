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
});

const ItemOverviewResponseSchema = z.object({
  lines: z.optional(z.array(LineSchema)),
});

type ItemOverviewResponse = z.infer<typeof ItemOverviewResponseSchema>;

export type Item = {
  type: AllowedUnique;
  name: string;
  chaos: number;
  baseType: string;
};

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
): Promise<Item[]> => {
  const url = `https://poe.ninja/api/data/itemoverview?type=${encodeURIComponent(type)}&league=${encodeURIComponent(leagueApiName)}`;
  try {
    const response = await fetch(url);
    const json = await response.json();
    const data = await ItemOverviewResponseSchema.parse(json);

    if (!data.lines) {
      console.warn(`No data returned for ${type} in ${leagueApiName}`);
      return [];
    }

    const items: Item[] = data.lines.map((line) => ({
      type,
      name: line.name,
      chaos: line.chaosValue,
      baseType: line.baseType,
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
): Promise<Item[]> => {
  if (isDevelopment) {
    return getDevDataForType(type);
  }

  return getProductionDataForType(type, leagueApiName);
};

const getDevDataForType = async (type: AllowedUnique): Promise<Item[]> => {
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
  }));
};

// Keep only the cheapest variant for items with the same name
const dedupeCheapestVariants = (lines: Item[]) => {
  const grouped = new Map<string, Item[]>();

  for (const line of lines) {
    grouped.set(line.name, [...(grouped.get(line.name) ?? []), line]);
  }

  const filtered: Item[] = [];

  for (const [, sameNameLines] of grouped.entries()) {
    if (sameNameLines.length === 1) {
      filtered.push(sameNameLines[0]);
      continue;
    }

    // Find the item with the lowest chaos value
    const cheapest = sameNameLines.reduce((min, current) =>
      current.chaos < min.chaos ? current : min,
    );

    filtered.push(cheapest);
  }

  return filtered;
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

  // We don't neccesarily dedupe 5Ls/6Ls/relics
  // We can just take cheapest item for multiple with the same name
  // For items with multiple base types, the dust value should be the same for all
  const cheapestVariants = dedupeCheapestVariants(combinedItems);

  return cheapestVariants;
};

export const getPriceData = uncached__getPriceData;
