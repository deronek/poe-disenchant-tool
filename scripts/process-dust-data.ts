// Script to generate dust data for app logic - omit/generate fields
// Executed manually when source dataset for dust data changes

import { calculateDustValue, Item } from "@/lib/dust";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import data from "../src/lib/dust/poe-dust-original.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputJsPath = path.join(__dirname, "../src/lib/dust/poe-dust.js");

// Schema for input data
const InputItemSchema = z.strictObject({
  name: z.string().trim().min(1),
  baseType: z.string().trim().min(1),
  dustVal: z.number().positive(),
  w: z.int().positive(),
  h: z.int().positive(),
  slots: z.int().positive(),
  link: z.url().optional(),
});

const InputItemDataSchema = z.array(InputItemSchema);

type InputItem = z.infer<typeof InputItemSchema>;

try {
  // Validate input data using Zod schema
  console.log("🔍 Validating input data with Zod schema...");
  const validationResult = InputItemDataSchema.safeParse(data);

  if (!validationResult.success) {
    console.error("❌ Input data validation failed:");
    console.error(JSON.stringify(validationResult.error, null, 2));
    throw new Error("Input data validation failed");
  }

  const validatedData = validationResult.data;
  console.log(`✅ Successfully validated ${validatedData.length} items`);

  // Process each item to calculate new fields
  console.log("🔧 Processing items...");
  const processedData = validatedData.map((item: InputItem) => {
    // Calculate dust values using the calculateDustValue function
    const dustValIlvl84 = calculateDustValue(item.dustVal, 84, 0);
    const dustValIlvl84Q20 = calculateDustValue(item.dustVal, 84, 20);

    const outputItem: Item = {
      name: item.name,
      baseType: item.baseType,
      dustValIlvl84,
      dustValIlvl84Q20,
      slots: item.slots,
    };

    return outputItem;
  });

  // Save processed data as JS module
  console.log("💾 Saving processed data as JS module...");
  const jsContent = `const data = ${JSON.stringify(processedData, null, 2)};\nexport default data;\n`;
  fs.writeFileSync(outputJsPath, jsContent);
  const jsSize = fs.statSync(outputJsPath).size;

  console.log(`✅ Successfully processed ${validatedData.length} items`);
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
