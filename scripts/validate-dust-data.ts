import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";
import { ItemDataSchema } from "../src/lib/dust";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const jsonPath = path.join(__dirname, "../src/lib/dust/poe-dust.json");
const raw = fs.readFileSync(jsonPath, "utf8");

let parsed: unknown;
try {
  parsed = JSON.parse(raw);
} catch (err) {
  console.error("❌ Invalid JSON", err);
  process.exit(1);
}

try {
  const data = ItemDataSchema.parse(parsed);
  console.log(`✅ Dust data validated (${data.length} items)`);
} catch (err) {
  console.error("❌ Schema validation failed");
  if (err instanceof z.ZodError) {
    console.error(err.errors);
  } else {
    console.error(err);
  }
  process.exit(1);
}
