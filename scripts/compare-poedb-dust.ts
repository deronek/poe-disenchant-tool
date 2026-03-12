import fs from "fs";
import path from "path";

import poeDust from "../src/lib/dust/poe-dust-original";
import { ITEMS_TO_IGNORE } from "../src/lib/itemData/ignore-list";

interface ItemDust {
  name: string;
  dustVal: number;
}

const scrapedPath = path.join(
  process.cwd(),
  "src",
  "lib",
  "dust",
  "poedb_dust_values.json",
);

// Load scraped PoEDB dust data
const scrapedData: ItemDust[] = JSON.parse(
  fs.readFileSync(scrapedPath, "utf-8"),
);

const notFound: string[] = [];
const mismatched: { name: string; poeVal: number; poedbVal: number }[] = [];
let ignoredCount = 0;

// Pre-normalize ignore list for efficient lookup
const normalizedIgnoreList = new Set(
  ITEMS_TO_IGNORE.map((name) => name.toLowerCase()),
);

for (const item of scrapedData) {
  const normalizedName = item.name.trim().toLowerCase();

  // Skip items in the ignore list
  if (normalizedIgnoreList.has(normalizedName)) {
    ignoredCount++;
    continue;
  }

  const match = poeDust.find(
    (i: ItemDust) => i.name.trim().toLowerCase() === normalizedName,
  );

  if (!match) {
    notFound.push(item.name);
    continue;
  }

  const poeVal = Number(match.dustVal);
  const poedbVal = Number(item.dustVal);

  if (Math.abs(poeVal - poedbVal) > 0.0001) {
    mismatched.push({ name: item.name, poeVal, poedbVal });
  }
}

console.log("🔍 Comparison Complete");
console.log("====================================");

console.log(`⏭️  Ignored: ${ignoredCount} items from ignore list`);
console.log("====================================");

console.log(`❌ Not Found: ${notFound.length} items`);
if (notFound.length) {
  console.log("┌─────┬────────────────────────────────────────┐");
  console.log("│  #  │ Item Name                              │");
  console.log("├─────┼────────────────────────────────────────┤");
  notFound.forEach((name, index) => {
    const num = String(index + 1).padStart(3);
    const paddedName = name.padEnd(36);
    console.log(`│ ${num} │ ${paddedName} │`);
  });
  console.log("└─────┴────────────────────────────────────────┘");
} else {
  console.log("✅ All found");
}

console.log("====================================");

console.log(`⚠️  Mismatched Dust Values: ${mismatched.length} items`);
if (mismatched.length) {
  console.log("┌─────┬────────────────────────────────────────┬───────────┬────────────┬────────────┐");
  console.log("│  #  │ Item Name                              │ PoE Dust  │ PoEDB Dust │ Difference │");
  console.log("├─────┼────────────────────────────────────────┼───────────┼────────────┼────────────┤");
  mismatched.forEach((m, index) => {
    const num = String(index + 1).padStart(3);
    const paddedName = m.name.padEnd(36);
    const poeVal = String(m.poeVal).padStart(9);
    const poedbVal = String(m.poedbVal).padStart(10);
    const diff = Math.abs(m.poeVal - m.poedbVal).toFixed(4).padStart(10);
    console.log(`│ ${num} │ ${paddedName} │ ${poeVal} │ ${poedbVal} │ ${diff} │`);
  });
  console.log("└─────┴────────────────────────────────────────┴───────────┴────────────┴────────────┘");
} else {
  console.log("✅ All dust values match!");
}

console.log("====================================");
