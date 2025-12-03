import { unstable_cache } from "next/cache";

import { Item as DustItem, getDustData } from "@/lib/dust";
import { League } from "@/lib/leagues";
import {
  AllowedUnique,
  getCheapestCatalyst,
  getPriceData,
  Item as PriceItem,
} from "@/lib/prices";
import { ITEMS_TO_IGNORE } from "./ignore-list";

export type Item = {
  name: string;
  id: number;
  uniqueId: string;
  chaos: number;
  listingCount: number;
  variant?: string;
  calculatedDustValue: number;
  dustPerChaos: number;
  slots: number;
  dustPerChaosPerSlot: number;
  goldCost: number;
  type: AllowedUnique;
  icon: string;
  shouldCatalyst: boolean;
};

const createUniqueId = (name: string, variant?: string) =>
  `${name}${variant ? `-${variant}` : ""}`;

const uncached__getItems = async (league: League) => {
  const dustData = getDustData();
  const dustMap = new Map(dustData.map((d) => [d.name, d]));

  const [priceData, maybeCatalystPrice] = await Promise.all([
    getPriceData(league),
    getCheapestCatalyst(league),
  ]);

  // Fallback to 1c if no data
  const catalystPrice = maybeCatalystPrice
    ? maybeCatalystPrice.primaryValue
    : 1;

  const merged: Item[] = [];
  let id = 0;

  for (const priceItem of priceData) {
    if (ITEMS_TO_IGNORE.includes(priceItem.name)) continue;
    const dustItem = dustMap.get(priceItem.name);

    if (dustItem === undefined) {
      // TODO: need to display this in the UI, as an information that something will be missing
      console.warn(`Warning: No dust data found for ${priceItem.name}`);
      continue;
    }

    const {
      dustValue: calculatedDustValue,
      dustPerChaos,
      catalyst: shouldCatalyst,
    } = calculateDustEfficiency(priceItem, dustItem, catalystPrice);

    merged.push({
      id: id++,
      uniqueId: createUniqueId(priceItem.name, priceItem.baseType),
      name: priceItem.name,
      chaos: priceItem.chaos,
      listingCount: priceItem.listingCount,
      variant: priceItem.baseType,
      calculatedDustValue,
      dustPerChaos: Math.round(dustPerChaos),
      slots: dustItem.slots,
      dustPerChaosPerSlot: Math.round(dustPerChaos / dustItem.slots),
      goldCost: dustItem.goldCost,
      type: priceItem.type,
      icon: priceItem.icon,
      shouldCatalyst: shouldCatalyst,
    });
  }

  // Calculate p10 of listingCounts
  const lowStockThreshold = calculateLowStockThreshold(merged);
  return {
    items: merged,
    lastUpdated: Date.now(),
    lowStockThreshold,
  };
};

function isQuiver(item: PriceItem) {
  return item.itemType === "Quiver";
}

function calculateDustEfficiency(
  priceItem: PriceItem,
  dustItem: DustItem,
  catalystPrice: number,
) {
  if (isQuiver(priceItem)) {
    // Quivers cannot have quality
    return {
      dustValue: dustItem.dustValIlvl84,
      dustPerChaos: dustItem.dustValIlvl84 / priceItem.chaos,
      catalyst: false,
    };
  }

  if (priceItem.type !== "UniqueAccessory") {
    // Weapon or Armor, always cheap to quality up
    return {
      dustValue: dustItem.dustValIlvl84Q20,
      dustPerChaos: dustItem.dustValIlvl84Q20 / priceItem.chaos,
      catalyst: false,
    };
  }

  const costToAddQuality = catalystPrice * 20; // 20 catalysts
  const defaultDustPerChaos = dustItem.dustValIlvl84 / priceItem.chaos;
  const catalystedDustPerChaos =
    dustItem.dustValIlvl84Q20 / (priceItem.chaos + costToAddQuality);

  if (catalystedDustPerChaos > defaultDustPerChaos) {
    // Quality up is worth it
    return {
      dustValue: dustItem.dustValIlvl84Q20,
      dustPerChaos: catalystedDustPerChaos,
      catalyst: true,
    };
  } else {
    // Quality up is not worth it
    return {
      dustValue: dustItem.dustValIlvl84,
      dustPerChaos: defaultDustPerChaos,
      catalyst: false,
    };
  }
}

/**
 * Calculates the low stock threshold as the 10th percentile of listing counts across items.
 * This value helps identify items with potentially low market availability.
 * Falls back to 1 for empty or invalid inputs to ensure a usable threshold.
 * @param merged - Array of merged item data containing listing counts.
 * @returns The calculated low stock threshold (minimum 1).
 */
function calculateLowStockThreshold(items: Item[]) {
  if (!Array.isArray(items) || items.length === 0) {
    return 1;
  }

  const listingCounts = items
    .map((item) => item.listingCount)
    .sort((a, b) => a - b);

  const PERCENTILE = 0.1;
  const index = Math.floor(PERCENTILE * (listingCounts.length - 1));
  const candidate = listingCounts[index];
  const lowStockThreshold = Math.max(1, candidate ?? 1);

  console.log("Low stock threshold:", lowStockThreshold);

  return lowStockThreshold;
}

export const getItems = async (league: League) => {
  return unstable_cache(async () => uncached__getItems(league), [league], {
    tags: [`items-${league}`],
    revalidate: 1800, // 30 minutes
  })();
};
