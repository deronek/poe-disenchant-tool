import { z } from "zod";
import * as fs from "fs";
import path from "path";

const raw = fs.readFileSync(
  path.join(process.cwd(), "src/lib/dust/poe-dust.json"),
  "utf-8",
);

const ItemSchema = z.object({
  name: z.string(),
  baseType: z.string(),
  dustVal: z.number(),
  dustValIlvl84: z.number(),
  dustValIlvl84Q20: z.number(),
  dustPerSlot: z.number(),
  w: z.number(),
  h: z.number(),
  slots: z.number(),
  link: z.string().url(),
});

export type Item = z.infer<typeof ItemSchema>;

export const getDustData = (): Item[] => {
  const parsed = JSON.parse(raw);
  return z.array(ItemSchema).parse(parsed);
};
