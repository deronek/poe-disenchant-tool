import { getDustData } from "./dust";
import { AllowedUnique, getPriceData } from "./prices";

export type Item = {
  name: string;
  baseType: string;
  id: number;
  uniqueId: string;
  chaos: number;
  graph: (number | null)[];
  variant?: string;
  calculatedDustValue: number;
  dustPerChaos: number;
  type: AllowedUnique;
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
        name: priceItem.name,
        baseType: dustItem.baseType,
        chaos: priceItem.chaos,
        graph: priceItem.graph,
        variant: dustItem.baseType,
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
