// Script to generate dust data for app logic - omit/generate fields
// Executed manually when source dataset for dust data changes

import { calculateDustValue, Item } from "@/lib/dust";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import data from "../src/lib/dust/poe-dust-original.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputJsPath = path.join(__dirname, "../src/lib/dust/poe-dust.js");

try {
  if (!Array.isArray(data) || !data.every((x) => x && typeof x === "object")) {
    throw new Error("Expected data to be an array of objects");
  }

  console.log(`✅ Found ${data.length} items to process`);

  // Process each item to calculate new fields
  console.log("🔧 Processing items...");
  const processedData = data.map((item: any, idx: number) => {
    const { name, baseType, dustVal, slots } = item ?? {};

    if (
      typeof name !== "string" ||
      typeof baseType !== "string" ||
      !Number.isFinite(dustVal) ||
      !Number.isFinite(slots)
    ) {
      throw new Error(
        `Item at index ${idx} is missing required fields or has wrong types`,
      );
    }

    // Calculate dust values using the calculateDustValue function
    const dustValIlvl84 = calculateDustValue(dustVal, 84, 0, 0, 0);
    const dustValIlvl84Q20 = calculateDustValue(dustVal, 84, 20, 0, 0);

    const outputItem: Item = {
      name,
      baseType,
      dustValIlvl84,
      dustValIlvl84Q20,
      slots,
    };

    return outputItem;
  });

  // Save processed data as JS module
  console.log("💾 Saving processed data as JS module...");
  const jsContent = `const data = ${JSON.stringify(processedData, null, 2)};\nexport default data;\n`;
  fs.writeFileSync(outputJsPath, jsContent);
  const jsSize = fs.statSync(outputJsPath).size;

  console.log(`✅ Successfully processed ${data.length} items`);
  console.log(`📝 Generated fields: dustValIlvl84, dustValIlvl84Q20`);
  console.log(`📁 JS module file: ${outputJsPath}`);
  console.log(`📏 JS file size: ${(jsSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`🎉 Processing complete!`);
} catch (error) {
  console.error("❌ Error processing dust data:");
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(String(error));
  }
  process.exit(1);
}
