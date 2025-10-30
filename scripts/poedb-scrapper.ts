import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { JSDOM } from "jsdom";

interface ItemDust {
  name: string;
  dustVal: number;
}

async function scrapeDustValues() {
  const url = "https://poedb.tw/us/Kingsmarch#Disenchant";
  console.log(`🌐 Fetching: ${url}`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch page: ${response.status} ${response.statusText}`,
    );
  }

  const html = await response.text();
  const dom = new JSDOM(html);
  const document = dom.window.document;

  const items = document.querySelectorAll(
    "a.uniqueitem",
  ) as NodeListOf<HTMLAnchorElement>;
  const results: ItemDust[] = [];

  items.forEach((item) => {
    const name = item.textContent?.trim() || "";
    const dustCell = item.parentElement?.nextElementSibling;
    const dustVal = dustCell ? parseFloat(dustCell.textContent || "0") : 0;

    if (name && !isNaN(dustVal)) {
      results.push({ name, dustVal });
    }
  });

  // Define and ensure output directory
  const outputDir = join(process.cwd(), "src", "lib", "dust");
  mkdirSync(outputDir, { recursive: true });

  // Save JSON file
  const outputPath = join(outputDir, "poedb_dust_values.json");
  writeFileSync(outputPath, JSON.stringify(results, null, 2));

  console.log(`✅ Extracted ${results.length} items`);
  console.log(`💾 Saved to ${outputPath}`);
}

scrapeDustValues().catch((err) => {
  console.error("❌ Error:", err);
});
