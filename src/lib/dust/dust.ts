import raw from "./poe-dust.json";
import type { Item } from "./schema";

export const getDustData = (): Item[] => raw;
