import { z } from "zod";

export const ItemSchema = z.object({
  name: z.string(),
  baseType: z.string(),
  dustVal: z.number(),
  dustValIlvl84: z.number(),
  dustValIlvl84Q20: z.number(),
  dustPerSlot: z.number().optional(),
  w: z.number(),
  h: z.number(),
  slots: z.number(),
  link: z.string().url(),
});

export const ItemDataSchema = z.array(ItemSchema);

export type Item = z.infer<typeof ItemSchema>;
