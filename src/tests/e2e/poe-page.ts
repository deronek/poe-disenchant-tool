import { expect, Locator, Page } from "@playwright/test";

type TestItem = {
  name: string;
  baseType: string;
  price: number;
  dustValue: number;
  dustPerChaos: number;
  dustPerChaosPerSlot: number;
};

export class PoEDisenchantPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ---------------------------
  // Navigation & Loading
  // ---------------------------

  async goto() {
    await this.page.goto("/", { waitUntil: "domcontentloaded" });
  }

  async waitForDataLoad(timeout = 15000) {
    await this.page
      .locator("table tbody tr")
      .first()
      .waitFor({ state: "visible", timeout });
  }

  // ---------------------------
  // Test Data Helpers
  // ---------------------------

  /**
   * Extracts table data into structured test items.
   * Assumes table columns:
   * [0]=Mark, [1]=Icon, [2]=Name, [3]=Price, [4]=Dust Value, [5]=Dust/Chaos, [6]=Dust/Chaos/Slot
   */
  async getTestItems(limit = 10): Promise<TestItem[]> {
    const rows = this.page.locator("tbody tr");
    const count = Math.min(await rows.count(), limit);
    expect(count).toBeGreaterThanOrEqual(2);
    const items = [];

    for (let i = 0; i < count; i++) {
      const cells = rows.nth(i).locator("td");

      const nameCell = cells.nth(1);
      const { name, baseType } = await nameCell.evaluate((cell) => {
        const pTags = cell.querySelectorAll("p");
        const name = pTags[0]?.textContent?.trim() ?? "";
        const baseType = pTags[1]?.textContent?.trim() ?? "";
        return { name, baseType };
      });

      const price = await this.extractFullValue(cells.nth(2));
      const dustValue = await this.extractFullValue(cells.nth(3));
      const dustPerChaos = await this.extractFullValue(cells.nth(4));
      const dustPerChaosPerSlot = await this.extractFullValue(cells.nth(5));

      items.push({
        name,
        baseType,
        price,
        dustValue,
        dustPerChaos,
        dustPerChaosPerSlot,
      });
    }
    return items;
  }

  private async extractFullValue(cell: Locator): Promise<number> {
    const attr = await cell
      .locator("[data-full-value]")
      .first()
      .getAttribute("data-full-value");
    const text = (await cell.innerText()).trim();
    return parseFloat(attr ?? text);
  }

  // ---------------------------
  // Selection & Marking
  // ---------------------------

  async selectItem(name: string) {
    const row = this.page.locator("tr").filter({ hasText: name });
    const checkbox = row.getByRole("checkbox");
    await checkbox.scrollIntoViewIfNeeded();
    await checkbox.click();
  }

  async selectItems(names: string[]) {
    for (const name of names) await this.selectItem(name);
  }

  async verifyItemSelected(name: string, selected: boolean) {
    const checkbox = this.page
      .locator("tr")
      .filter({ hasText: name })
      .getByRole("checkbox");

    if (selected) await expect(checkbox).toBeChecked();
    else await expect(checkbox).not.toBeChecked();
  }

  async expectRowSelectedStyle(name: string, selected = true) {
    const row = this.page.locator("tr").filter({ hasText: name });
    await expect(row).toHaveClass(
      selected ? /selected|data-selected/ : /^((?!selected).)*$/,
    );
  }

  // ---------------------------
  // Clear All Selections
  // ---------------------------

  get clearMarksButton() {
    return this.page.getByRole("button").filter({ hasText: /clear marks/i });
  }

  async clearAllSelections() {
    if (await this.clearMarksButton.isVisible()) {
      await this.clearMarksButton.click();
    }
  }

  // ---------------------------
  // Trade Links
  // ---------------------------

  async getTradeLink(itemName: string): Promise<string> {
    const row = this.page.locator("tr").filter({ hasText: itemName });
    const link = row
      .locator("a[href*='pathofexile.com/trade/search/']")
      .first();
    const href = await link.getAttribute("href");
    if (!href) throw new Error(`Trade link not found for item: ${itemName}`);
    return href;
  }

  // Returns the Locator for the trade link anchor in the given item row
  async getTradeLinkLocator(itemName: string) {
    const row = this.page
      .locator("table tbody tr")
      .filter({ hasText: itemName })
      .first();
    const a = row.locator("a[href*='pathofexile.com/trade/search/']").first();
    return a;
  }

  /**
   * Opens the trade link in a new tab and returns the opened Page.
   * Uses scrolling + visible wait, then clicks.
   */
  async openTradeLinkInNewTab(
    itemName: string,
    context: import("@playwright/test").BrowserContext,
  ) {
    const a = await this.getTradeLinkLocator(itemName);

    await a.scrollIntoViewIfNeeded();
    await a.waitFor({ state: "visible", timeout: 2000 });

    const newPagePromise = context.waitForEvent("page");
    await a.click();

    // Wait for the new page and ensure it's loaded
    const newPage = await newPagePromise;
    await newPage.waitForLoadState("domcontentloaded");
    return newPage;
  }

  // ---------------------------
  // Compact Number Helpers
  // ---------------------------

  async readCompactAndFullValue(
    name: string,
    columnName: string,
  ): Promise<{ compactValue: number; fullValue: number }> {
    const colIndex = await this.getColumnIndex(columnName);
    const cell = this.page
      .locator("tr")
      .filter({ hasText: name })
      .locator("td")
      .nth(colIndex);
    const text = (await cell.innerText()).trim();
    const attr = await cell
      .locator("[data-full-value]")
      .first()
      .getAttribute("data-full-value");
    return {
      compactValue: parseFloat(text.replace(/[^\d.-]/g, "")),
      fullValue: parseFloat(attr ?? text),
    };
  }

  async getCellValue(name: string, columnName: string): Promise<number> {
    const colIndex = await this.getColumnIndex(columnName);
    const cell = this.page
      .locator("tr")
      .filter({ hasText: name })
      .locator("td")
      .nth(colIndex);
    const attr = await cell
      .locator("[data-full-value]")
      .first()
      .getAttribute("data-full-value");
    return parseFloat(attr ?? (await cell.innerText()));
  }

  async getColumnValues(columnName: string): Promise<number[]> {
    const index = await this.getColumnIndex(columnName);
    const cells = this.page.locator(`tbody tr td:nth-child(${index + 1})`);
    const count = await cells.count();
    const values: number[] = [];
    for (let i = 0; i < count; i++) {
      const attr = await cells
        .nth(i)
        .locator("[data-full-value]")
        .first()
        .getAttribute("data-full-value");
      if (attr) values.push(parseFloat(attr));
    }
    return values;
  }

  async getColumnIndex(columnName: string): Promise<number> {
    const headers = this.page.locator("thead th");
    const count = await headers.count();
    for (let i = 0; i < count; i++) {
      const text = (await headers.nth(i).innerText()).trim();
      if (text == columnName) return i;
    }
    throw new Error(`Column "${columnName}" not found`);
  }

  async sortByColumn(columnName: string) {
    const index = await this.getColumnIndex(columnName);
    const header = this.page.locator("thead th").nth(index);
    await header.click();
  }

  // ---------------------------
  // Keyboard / Search
  // ---------------------------

  async searchItem(term: string) {
    const input = this.page.locator("input[type='search'], input").first();
    await input.fill(term);
    await input.press("Enter");
    await this.page.waitForTimeout(300); // debounce
  }

  async verifyItemDisplayed(name: string, shouldExist = true) {
    const row = this.page.locator("tr").filter({ hasText: name });
    if (shouldExist) await expect(row).toBeVisible();
    else await expect(row).toHaveCount(0);
  }
}
