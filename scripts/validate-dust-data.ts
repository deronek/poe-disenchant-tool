// Script to confirm if dust data is in correct shape
// Executed at build time

import { z } from "zod";

import data from "../data/dust/poe-dust.js";
import { ItemDataSchema } from "../src/lib/dust";

try {
  const validatedData = ItemDataSchema.parse(data);
  console.log(`✅ Dust data validated (${validatedData.length} items)`);
} catch (err) {
  console.error(
    `❌ Validation failed${err instanceof z.ZodError ? ` (${err.issues.length} issue(s))` : ""}`,
  );
  if (err instanceof z.ZodError) {
    console.error(err.issues);
  } else {
    console.error(err);
  }
  process.exit(1);
}
