import fs from "fs";
import path from "path";

import poeDust from "../src/lib/dust/poe-dust-original";

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

for (const item of scrapedData) {
  const match = poeDust.find(
    (i: ItemDust) =>
      i.name.trim().toLowerCase() === item.name.trim().toLowerCase(),
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

console.log(`❌ Not Found (${notFound.length}):`);
console.log(notFound.length ? notFound.join(", ") : "✅ All found");

console.log("====================================");

console.log(`⚠️ Mismatched Dust Values (${mismatched.length}):`);
if (mismatched.length) {
  mismatched.forEach((m) => {
    console.log(`- ${m.name}: poe-dust=${m.poeVal} | poedb=${m.poedbVal}`);
  });
} else {
  console.log("✅ All dust values match!");
}

console.log("====================================");
