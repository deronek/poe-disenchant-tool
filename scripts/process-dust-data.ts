// Remove unused fields (raw dust value, data related to slots) from the dust data

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourcePath = path.join(__dirname, "../src/lib/dust/poe-dust.json");
const backupPath = path.join(
  __dirname,
  "../src/lib/dust/poe-dust-original.json",
);

try {
  // Read original file
  console.log("📖 Reading original file...");
  const rawData = fs.readFileSync(sourcePath, "utf8");
  const data = JSON.parse(rawData);

  if (!Array.isArray(data)) {
    throw new Error("Expected data to be an array");
  }

  const originalSize = Buffer.byteLength(rawData, "utf8");
  console.log(`✅ Found ${data.length} items to process`);

  // Create backup
  console.log("💾 Creating backup...");
  fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));
  const backupSize = fs.statSync(backupPath).size;
  console.log(`📁 Backup saved to: ${backupPath}`);

  // Process each item to remove specified fields
  console.log("🔧 Processing items...");
  const processedData = data.map((item: any) => {
    const { dustVal, dustPerSlot, w, h, slots, link, ...rest } = item;
    return rest;
  });

  // Save processed data
  console.log("💾 Saving processed data...");
  fs.writeFileSync(sourcePath, JSON.stringify(processedData, null, 2));
  const newSize = fs.statSync(sourcePath).size;

  console.log(`✅ Successfully processed ${data.length} items`);
  console.log(`📝 Removed fields: dustVal, dustPerSlot, w, h, slots, link`);
  console.log(`📁 Original file updated: ${sourcePath}`);
  console.log(
    `📏 Backup file size: ${(backupSize / 1024 / 1024).toFixed(2)} MB`,
  );
  console.log(`📏 New file size: ${(newSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(
    `📉 Size reduction: ${((originalSize - newSize) / 1024 / 1024).toFixed(2)} MB (${(((originalSize - newSize) / originalSize) * 100).toFixed(1)}%)`,
  );
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
