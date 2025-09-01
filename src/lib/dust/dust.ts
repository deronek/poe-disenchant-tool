import raw from "./poe-dust.json";
import type { Item } from "./schema";

type DeepReadonly<T> = T extends readonly (infer R)[]
  ? ReadonlyArray<DeepReadonly<R>>
  : T extends object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T;

export const getDustData = (): DeepReadonly<Item[]> => raw;
