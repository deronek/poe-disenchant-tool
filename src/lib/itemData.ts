import { getDustData, Item as DustItem } from "./dust";
import { AllowedUnique, getPriceData } from "./prices";

export function getCorrectDustValue(item: Item): number {
  if (item.type === "UniqueAccessory") {
    return item.dustValIlvl84;
  }
  return item.dustValIlvl84Q20;
}

export function getDustConfigurationString(item: Item): string {
  if (item.type === "UniqueAccessory") {
    return "Dust value calculated at ilvl84, quality0";
  }
  return "Dust value calculated at ilvl84, quality20";
}

export type Item = DustItem & {
  id: number;
  uniqueId: string;
  chaos: number;
  graph: (number | null)[];
  variant?: string;
  dustPerChaos: number;
  type: AllowedUnique;
  calculatedDustValue: number;
};

const ITEMS_TO_IGNORE = [
  "Curio of Consumption",
  "Curio of Absorption",
  "Curio of Potential",
  "Curio of Decay",
];

const createUniqueId = (name: string, variant?: string) =>
  `${name}${variant ? `-${variant}` : ""}`;

export const getItems = async (): Promise<Item[]> => {
  const dustData = getDustData();
  const priceData = await getPriceData();

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

      merged.push({
        id: id++,
        uniqueId: createUniqueId(priceItem.name, priceItem.variant),
        ...dustItem,
        chaos: priceItem.chaos,
        graph: priceItem.graph,
        variant: priceItem.variant,
        calculatedDustValue,
        dustPerChaos: Math.round(calculatedDustValue / priceItem.chaos),
        type: priceItem.type,
      });
    } else {
      // TODO: need to display this in the UI, as an information that something will be missing
      console.warn(`No dust data found for ${priceItem.name}`);
    }
  }

  return merged;
};
