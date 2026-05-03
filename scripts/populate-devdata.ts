import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { DEFAULT_LEAGUE, LEAGUES } from "@/lib/leagues";
import { allowedUniqueTypes } from "@/lib/prices";
import type { AllowedUnique } from "@/lib/prices";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.join(__dirname, "..", "data", "prices", "dev-data");

type DevDataLine = Record<string, unknown>;
type DevDataResponse = {
  lines?: DevDataLine[];
  [key: string]: unknown;
};

type FieldKind =
  | "string"
  | "number"
  | "boolean"
  | "null"
  | "array"
  | "object"
  | "undefined"
  | "unknown";

function getFieldKind(value: unknown): FieldKind {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";

  switch (typeof value) {
    case "string":
    case "number":
    case "boolean":
    case "undefined":
      return value === undefined
        ? "undefined"
        : (typeof value as Extract<FieldKind, "string" | "number" | "boolean">);
    case "object":
      return "object";
    default:
      return "unknown";
  }
}

function typeFromKinds(fieldName: string, kinds: Set<FieldKind>): string {
  if (fieldName === "type") {
    return "AllowedUnique";
  }

  const ordered = [
    "string",
    "number",
    "boolean",
    "null",
    "array",
    "object",
    "undefined",
    "unknown",
  ] as const;
  const present = ordered.filter((kind) => kinds.has(kind));

  if (present.length === 1) {
    return present[0] === "undefined" ? "unknown" : present[0];
  }

  if (present.length === 2 && present.includes("undefined")) {
    const nonUndefined = present.find((kind) => kind !== "undefined");
    if (
      nonUndefined === "string" ||
      nonUndefined === "number" ||
      nonUndefined === "boolean" ||
      nonUndefined === "null" ||
      nonUndefined === "array" ||
      nonUndefined === "object"
    ) {
      return `${nonUndefined} | undefined`;
    }
  }

  return present.join(" | ");
}

function printSchema(obj: DevDataResponse, label: string): void {
  console.log(`  ${label} Schema:`);

  if (!Array.isArray(obj.lines) || obj.lines.length === 0) {
    console.log("    lines: unknown[];");
    console.log("");
    return;
  }

  const fieldKinds = new Map<string, Set<FieldKind>>();
  const missingCounts = new Map<string, number>();
  const fieldOrder: string[] = [];

  for (const line of obj.lines) {
    for (const key of Object.keys(line)) {
      if (!fieldKinds.has(key)) {
        fieldKinds.set(key, new Set<FieldKind>());
        fieldOrder.push(key);
      }

      fieldKinds.get(key)?.add(getFieldKind(line[key]));
    }

    for (const key of fieldKinds.keys()) {
      if (!(key in line)) {
        missingCounts.set(key, (missingCounts.get(key) ?? 0) + 1);
      }
    }
  }

  for (const key of fieldOrder) {
    const kinds = fieldKinds.get(key);
    if (!kinds) continue;

    const type = typeFromKinds(key, kinds);
    const missing = missingCounts.get(key) ?? 0;
    const discrepancy =
      missing > 0 ? ` // missing in ${missing}/${obj.lines.length} items` : "";
    console.log(`    ${key}: ${type};${discrepancy}`);
  }

  const extraKeys = Object.keys(obj)
    .filter((key) => key !== "lines")
    .sort();
  for (const key of extraKeys) {
    console.log(`    ${key}: ${getFieldKind(obj[key])};`);
  }

  console.log("");
}

async function fetchPoeNinjaData(
  type: AllowedUnique,
  leagueApiName: string,
): Promise<DevDataResponse | null> {
  const url = `https://poe.ninja/poe1/api/economy/stash/current/item/overview?type=${encodeURIComponent(type)}&league=${encodeURIComponent(leagueApiName)}`;

  try {
    console.log(`  Fetching ${type} for ${leagueApiName}...`);
    const response = await fetch(url, {
      signal: AbortSignal.timeout(120000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = (await response.json()) as DevDataResponse;
    printSchema(data, `${type} / ${leagueApiName}`);
    return data;
  } catch (err) {
    console.warn(
      `    Warning: Failed to fetch ${type} for ${leagueApiName}: ${(err as Error).message}`,
    );
    return null;
  }
}

function saveDevDataFile(fileName: string, data: DevDataResponse | null): void {
  const filePath = path.join(OUTPUT_DIR, fileName);

  if (data == null) {
    console.warn(`    No data to save for ${fileName}, skipping.`);
    return;
  }

  try {
    const lineCount = Array.isArray(data.lines) ? data.lines.length : 0;
    const json = JSON.stringify(data, null, 2);

    // Write atomically
    const tempFile = `${filePath}.tmp`;
    fs.writeFileSync(tempFile, json, "utf-8");
    fs.renameSync(tempFile, filePath);

    console.log(`    Saved ${fileName} (${lineCount} items)`);
  } catch (err) {
    console.error(
      `    Error: Failed to save ${fileName}: ${(err as Error).message}`,
    );
    const tempFile = `${filePath}.tmp`;
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
  }
}

async function main(): Promise<void> {
  console.log(`Output directory: ${OUTPUT_DIR}\n`);

  const league = LEAGUES[DEFAULT_LEAGUE];

  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  let totalFiles = 0;
  let totalItems = 0;
  let failedRequests = 0;

  console.log(`--- League: ${league.name} ---`);

  for (const type of allowedUniqueTypes) {
    const fileName = `${type}.json`;

    const data = await fetchPoeNinjaData(type, league.apiName);

    if (data != null) {
      saveDevDataFile(fileName, data);

      if (Array.isArray(data.lines)) {
        totalItems += data.lines.length;
      }
      totalFiles++;
    } else {
      failedRequests++;
    }

    // Small delay between requests
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log("");

  console.log("=== Summary ===");
  console.log(`Total files saved: ${totalFiles}`);
  console.log(`Total items fetched: ${totalItems}`);
  console.log(
    `Failed requests: ${failedRequests}`,
    failedRequests > 0 ? "⚠️" : "✅",
  );
  console.log(`\nDev data files are located in: ${OUTPUT_DIR}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
