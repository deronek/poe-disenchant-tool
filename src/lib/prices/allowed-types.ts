export const allowedUniqueTypes = [
  "UniqueWeapon",
  "UniqueArmour",
  "UniqueAccessory",
] as const;

export type AllowedUnique = (typeof allowedUniqueTypes)[number];
