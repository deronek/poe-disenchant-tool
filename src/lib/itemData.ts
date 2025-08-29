import { unstable_cache } from "next/cache";
import { getDustData } from "./dust";
import { League } from "./leagues";
import { AllowedUnique, getPriceData } from "./prices";

export type Item = {
  name: string;
  id: number;
  uniqueId: string;
  chaos: number;
  variant?: string;
  calculatedDustValue: number;
  dustPerChaos: number;
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
        variant: priceItem.baseType,
        calculatedDustValue,
        dustPerChaos: dustPerChaos,
        type: priceItem.type,
        icon: priceItem.icon,
      });
    } else {
      // TODO: need to display this in the UI, as an information that something will be missing
      console.warn(`No dust data found for ${priceItem.name}`);
    }
  }

  return {
    items: merged,
    lastUpdated: Date.now(),
  };
};

export const getItems = async (league: League) => {
  return unstable_cache(async () => uncached__getItems(league), [league], {
    tags: [`items-${league}`],
    revalidate: 300, // 5 minutes
  })();
};
