import { z } from "zod";

export const ItemSchema = z
  .object({
    name: z.string().trim().min(1),
    baseType: z.string().trim().min(1),
    dustVal: z.number().positive(),
    dustValIlvl84: z.number().positive(),
    dustValIlvl84Q20: z.number().positive(),
    dustPerSlot: z.number().positive().optional(),
    w: z.number().int().positive(),
    h: z.number().int().positive(),
    slots: z.number().int().positive(),
    link: z.string().url(),
  })
  .superRefine((v, ctx) => {
    if (v.slots !== v.w * v.h) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["slots"],
        message: "slots must equal w*h",
      });
    }
  });

export const ItemDataSchema = z.array(ItemSchema);

export type Item = z.infer<typeof ItemSchema>;
export type ItemData = z.infer<typeof ItemDataSchema>;
