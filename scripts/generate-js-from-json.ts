// @ts-nocheck
// Script to generate JS data from JSON data
// Executed one time during schema conversion

import { writeFileSync } from "fs";
import data from "../src/lib/dust/poe-dust-original.json" assert { type: "json" };

// Process data to omit fields which are to be generated during processing
const processedData = data.map((item: any) => {
  const { name, baseType, dustVal, w, h, slots, link } = item ?? {};
  return { name, baseType, dustVal, w, h, slots, link };
});

// Create JS export text
const output = `const data = ${JSON.stringify(processedData, null, 2)};\nexport default data;\n`;

// Write it to a JS file
writeFileSync("./src/lib/dust/poe-dust-original.js", output, "utf8");

console.log("✅ poe-dust-original.js generated successfully!");
