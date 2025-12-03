// Script to generate dust data for app logic - omit/generate fields
// Executed manually when source dataset for dust data changes

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import prettier from "prettier";
import { z } from "zod";

import { calculateDustValueFull, Item } from "@/lib/dust";
import { calculateGoldCost } from "@/lib/gold";
import { ITEMS_TO_IGNORE } from "@/lib/itemData/ignore-list";
import data from "../src/lib/dust/poe-dust-original.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputJsPath = path.join(__dirname, "../src/lib/dust/poe-dust.js");

const InputItemSchema = z.strictObject({
  name: z.string().trim().min(1),
  baseType: z.string().trim().min(1),
  dustVal: z.number().positive(),
  w: z.int().positive(),
  h: z.int().positive(),
  slots: z.int().positive(),
  link: z.url().optional(),
  influenceCount: z.int().min(0).optional().default(0),
});
const InputItemDataSchema = z.array(InputItemSchema);
type InputItem = z.infer<typeof InputItemSchema>;

async function main() {
  try {
    // Validate input data using Zod schema
    console.log("🔍 Validating input data");
    const validationResult = InputItemDataSchema.safeParse(data);
    if (!validationResult.success) {
      console.error("❌ Input validation failed:");
      console.error(JSON.stringify(validationResult.error, null, 2));
      throw new Error("Input data validation failed");
    }

    const validatedData = validationResult.data;
    console.log(`✅ ${validatedData.length} items validated`);

    // Verify that w * h == slots for all items
    console.log("🔍 Verifying w * h == slots...");
    const invalidItems = validatedData.filter((item: InputItem) => {
      return item.w * item.h !== item.slots;
    });

    if (invalidItems.length > 0) {
      console.error("❌ Found items where w * h != slots:");
      invalidItems.forEach((item, index) => {
        console.error(
          `${index + 1}. ${item.name}: w=${item.w}, h=${item.h}, slots=${item.slots} (${item.w} * ${item.h} = ${item.w * item.h})`,
        );
      });
      throw new Error(
        `Found ${invalidItems.length} items where w * h != slots`,
      );
    }
    console.log("✅ All items pass w * h == slots verification");

    // Filter out ignored items
    console.log("🚫 Filtering ignored items...");
    const filteredData = validatedData.filter(
      (item: InputItem) => !ITEMS_TO_IGNORE.includes(item.name),
    );
    const ignoredCount = validatedData.length - filteredData.length;
    console.log(
      `🗑️  ${ignoredCount} items ignored, ${filteredData.length} items remaining`,
    );

    // Process each item to calculate new fields
    console.log("🔧 Processing items...");
    const processedData = filteredData.map((item: InputItem) => {
      // Calculate dust values using the calculateDustValueFull function with influence count
      const dustValIlvl84 = calculateDustValueFull(
        item.dustVal,
        84,
        0,
        item.influenceCount,
      );
      const dustValIlvl84Q20 = calculateDustValueFull(
        item.dustVal,
        84,
        20,
        item.influenceCount,
      );

      // Calculate gold costs using the calculateGoldCost function
      const goldCost = calculateGoldCost(
        item.dustVal,
        0,
        item.influenceCount,
        0,
      );

      const outputItem: Item = {
        name: item.name,
        baseType: item.baseType,
        dustValIlvl84,
        dustValIlvl84Q20,
        goldCost,
        slots: item.slots,
      };
      return outputItem;
    });

    // Save processed data as JS module with Prettier formatting
    console.log("✨ Formatting with Prettier...");
    const jsContent = `const data = ${JSON.stringify(processedData, null, 2)};\nexport default data;\n`;
    const prettierConfig = await prettier.resolveConfig(outputJsPath);
    const formatted = await prettier.format(jsContent, {
      ...prettierConfig,
      filepath: outputJsPath,
    });
    console.log("💾 Saving processed data as JS module...");
    fs.writeFileSync(outputJsPath, formatted);

    const size = fs.statSync(outputJsPath).size;
    console.log(`✅ Done! (${(size / 1024 / 1024).toFixed(2)} MB)`);
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

main();
