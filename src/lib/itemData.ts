import { getDustData, Item as DustItem } from "./dust";
import { AllowedUnique, getPriceData } from "./prices";

export type Item = DustItem & {
  id: number;
  chaos: number;
  graph: (number | null)[];
  variant?: string;
  dustPerChaos: number;
  type: AllowedUnique;
};

const ITEMS_TO_IGNORE = [
  "Curio of Consumption",
  "Curio of Absorption",
  "Curio of Potential",
  "Curio of Decay",
];

export const getItems = async (): Promise<Item[]> => {
  const dustData = getDustData();
  const priceData = await getPriceData();

  const merged: Item[] = [];
  let id = 0;

  for (const priceItem of priceData) {
    if (ITEMS_TO_IGNORE.includes(priceItem.name)) continue;
    const dustItem = dustData.find((d) => d.name === priceItem.name);

    if (dustItem) {
      merged.push({
        id: id++,
        ...dustItem,
        chaos: priceItem.chaos,
        graph: priceItem.graph,
        variant: priceItem.variant,
        dustPerChaos: Math.round(dustItem.dustValIlvl84Q20 / priceItem.chaos),
        type: priceItem.type,
      });
    } else {
      // TODO: need to display this in the UI, as an information that something will be missing
      console.warn(`No dust data found for ${priceItem.name}`);
    }
  }

  return merged;
};
