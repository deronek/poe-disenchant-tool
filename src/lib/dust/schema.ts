import { z } from "zod";

export const ItemSchema = z.strictObject({
  name: z.string().trim().min(1),
  baseType: z.string().trim().min(1),
  dustValIlvl84: z.number().positive(),
  dustValIlvl84Q20: z.number().positive(),
  goldCost: z.number().positive(),
  slots: z.int().positive(),
});

export const ItemDataSchema = z.array(ItemSchema);

export type Item = z.infer<typeof ItemSchema>;
export type ItemData = z.infer<typeof ItemDataSchema>;
