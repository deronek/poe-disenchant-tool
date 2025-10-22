// @ts-nocheck
/* eslint-disable */
const fs = require("fs");
const parse = require("csv-parse/sync").parse;

const dustDir = "src/lib/dust";

const inputCsvPath = `${dustDir}/poe-dust.csv`;
const outputJsonPath = `${dustDir}/poe-dust.json`;

const csvContent = fs.readFileSync(inputCsvPath, "utf-8");

const records = parse(csvContent, {
  columns: true,
  skip_empty_lines: true,
  trim: true,
});

// Coerce numeric fields
const parsedRecords = records.map((row: any) => ({
  name: row.name,
  baseType: row.baseType,
  dustVal: Number(row.dustVal),
  dustValIlvl84: Number(row.dustValIlvl84),
  dustValIlvl84Q20: Number(row.dustValIlvl84Q20),
  dustPerSlot: Number(row.dustPerSlot),
  w: Number(row.w),
  h: Number(row.h),
  slots: Number(row.slots),
  link: row.link,
}));

fs.writeFileSync(outputJsonPath, JSON.stringify(parsedRecords, null, 2));

console.log(`✅ CSV converted and saved to ${outputJsonPath}`);
