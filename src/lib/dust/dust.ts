import raw from "./poe-dust.json";
import type { Item } from "./schema";

type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};

export const getDustData = (): DeepReadonly<Item[]> => raw;
