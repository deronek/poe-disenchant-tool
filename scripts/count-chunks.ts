import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

import { DEFAULT_LEAGUE } from "../src/lib/leagues";

interface ChunkFile {
  path: string;
  size: number;
  rel: string;
}

const chunksDir = join(".next", "static", "chunks");
const htmlPath = join(".next", "server", "app", `${DEFAULT_LEAGUE}.html`);

const html = readFileSync(htmlPath, "utf-8");

// Scripts with src= (loaded in modern browsers, unless noModule)
const scriptTags = [
  ...html.matchAll(/<script\s+src="(\/_next\/static\/chunks\/[^"]+)"([^>]*)>/g),
];

const loadedFiles = new Set<string>();
const legacyFiles = new Set<string>();

for (const match of scriptTags) {
  const path = decodeURIComponent(
    match[1].replace("/_next/static/chunks/", ""),
  );
  const attrs = match[2];
  if (attrs.includes("noModule")) {
    legacyFiles.add(path);
  } else {
    loadedFiles.add(path);
  }
}

// Preloaded scripts (link rel=preload as=script)
const preloadTags = [
  ...html.matchAll(
    /<link[^>]+href="(\/_next\/static\/chunks\/[^"]+)"[^>]+as="script"[^>]*>/g,
  ),
];
for (const match of preloadTags) {
  const path = decodeURIComponent(
    match[1].replace("/_next/static/chunks/", ""),
  );
  if (!legacyFiles.has(path)) {
    loadedFiles.add(path);
  }
}

function walk(dir: string): { path: string; size: number }[] {
  const files: { path: string; size: number }[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) files.push(...walk(full));
    else if (entry.endsWith(".js")) files.push({ path: full, size: stat.size });
  }
  return files;
}

const allFiles = walk(chunksDir);

const loaded: ChunkFile[] = [];
const legacy: ChunkFile[] = [];
const notLoaded: ChunkFile[] = [];

for (const f of allFiles) {
  const rel = f.path
    .replace(chunksDir + "\\", "")
    .replace(chunksDir + "/", "")
    .replace(/\\/g, "/");
  const entry = { ...f, rel };
  if (loadedFiles.has(rel)) loaded.push(entry);
  else if (legacyFiles.has(rel)) legacy.push(entry);
  else notLoaded.push(entry);
}

loaded.sort((a, b) => b.size - a.size);
notLoaded.sort((a, b) => b.size - a.size);

function fmt(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

console.log(
  `\n=== LOADED ON /${DEFAULT_LEAGUE} PAGE VISIT (modern browser) — ${loaded.length} files ===\n`,
);
let loadedTotal = 0;
for (const f of loaded) {
  console.log(`  ${f.rel.padEnd(60)} ${fmt(f.size).padStart(10)}`);
  loadedTotal += f.size;
}
console.log(`  ${"TOTAL".padEnd(60)} ${fmt(loadedTotal).padStart(10)}`);

if (legacy.length) {
  console.log(
    `\n=== LEGACY ONLY (noModule — skipped by modern browsers) — ${legacy.length} files ===\n`,
  );
  for (const f of legacy) {
    console.log(`  ${f.rel.padEnd(60)} ${fmt(f.size).padStart(10)}`);
  }
}

console.log(
  `\n=== NOT LOADED ON INITIAL VISIT — ${notLoaded.length} files ===\n`,
);
let notLoadedTotal = 0;
for (const f of notLoaded) {
  console.log(`  ${f.rel.padEnd(60)} ${fmt(f.size).padStart(10)}`);
  notLoadedTotal += f.size;
}
console.log(`  ${"TOTAL".padEnd(60)} ${fmt(notLoadedTotal).padStart(10)}`);

console.log(`\n=== SUMMARY ===`);
console.log(`Loaded (modern):  ${loaded.length} files, ${fmt(loadedTotal)}`);
if (legacy.length) console.log(`Legacy only:      ${legacy.length} files`);
console.log(
  `Not loaded:       ${notLoaded.length} files, ${fmt(notLoadedTotal)}`,
);
console.log(
  `Total build:      ${allFiles.length} files, ${fmt(loadedTotal + notLoadedTotal)}`,
);
