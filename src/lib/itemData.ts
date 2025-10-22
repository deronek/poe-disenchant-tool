import { unstable_cache } from "next/cache";
import { getDustData } from "./dust";
import { League } from "./leagues";
import { AllowedUnique, getPriceData } from "./prices";

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
  type: AllowedUnique;
  icon: string;
};

const ITEMS_TO_IGNORE = [
  "Curio of Consumption",
  "Curio of Absorption",
  "Curio of Potential",
  "Curio of Decay",
];

const createUniqueId = (name: string, variant?: string) =>
  `${name}${variant ? `-${variant}` : ""}`;

const uncached__getItems = async (league: League) => {
  const dustData = getDustData();
  const priceData = await getPriceData(league);

  const merged: Item[] = [];
  let id = 0;

  for (const priceItem of priceData) {
    if (ITEMS_TO_IGNORE.includes(priceItem.name)) continue;
    const dustItem = dustData.find((d) => d.name === priceItem.name);

    if (dustItem) {
      const calculatedDustValue =
        priceItem.type === "UniqueAccessory"
          ? dustItem.dustValIlvl84
          : dustItem.dustValIlvl84Q20;

      const dustPerChaos =
        priceItem.chaos > 0
          ? Math.round(calculatedDustValue / priceItem.chaos)
          : 0;

      merged.push({
        id: id++,
        uniqueId: createUniqueId(priceItem.name, priceItem.baseType),
        name: priceItem.name,
        chaos: priceItem.chaos,
        listingCount: priceItem.listingCount,
        variant: priceItem.baseType,
        calculatedDustValue,
        dustPerChaos: dustPerChaos,
        slots: dustItem.slots,
        dustPerChaosPerSlot: Math.round(dustPerChaos / dustItem.slots),
        type: priceItem.type,
        icon: priceItem.icon,
      });
    } else {
      // TODO: need to display this in the UI, as an information that something will be missing
      console.warn(`No dust data found for ${priceItem.name}`);
    }
  }

  // Calculate p10 of listingCounts
  const lowStockThreshold = calculateLowStockThreshold(merged);
  return {
    items: merged,
    lastUpdated: Date.now(),
    lowStockThreshold,
  };
};

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
    revalidate: 900, // 15 minutes
  })();
};
