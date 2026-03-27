// @ts-nocheck
/* eslint-disable */
// Script to generate JS data from JSON data
// Executed one time during schema conversion

import { writeFileSync } from "fs";
import { createRequire } from "module";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

const inputPath = join(__dirname, "../data/dust/poe-dust-original.json");
const outputPath = join(__dirname, "../data/dust/poe-dust-original.js");

const data = require(inputPath);

// Process data to omit fields which are to be generated during processing
const processedData = data.map((item: any) => {
  const { name, baseType, dustVal, w, h, slots, link } = item ?? {};
  return { name, baseType, dustVal, w, h, slots, link };
});

// Create JS export text
const output = `const data = ${JSON.stringify(processedData, null, 2)};\nexport default data;\n`;

// Write it to a JS file
writeFileSync(outputPath, output, "utf8");

console.log("✅ poe-dust-original.js generated successfully!");
