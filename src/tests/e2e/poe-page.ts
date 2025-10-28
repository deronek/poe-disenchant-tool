import { getLeagueName, League } from "@/lib/leagues";
import { expect, Locator, Page } from "@playwright/test";
import type { TestItem, Theme, ThemeOption } from "./types";

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

  async setup() {
    await this.goto();
    await this.waitForDataLoad();
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

    // Resolve indices by header
    const headers = [
      "Name",
      "Price",
      "Dust Value",
      "Dust / Chaos",
      "Dust / Chaos / Slot",
    ];
    const indices = Object.fromEntries(
      await Promise.all(
        headers.map(async (h) => [h, await this.getColumnIndex(h)]),
      ),
    ) as Record<string, number>;

    const items: TestItem[] = [];
    for (const row of await rows.all()) {
      const cells = row.locator("td");

      const { name, baseType } = await cells
        .nth(indices["Name"])
        .evaluate((cell) => {
          const [nameEl, baseTypeEl] = cell.querySelectorAll("p");
          return {
            name: nameEl?.textContent?.trim() ?? "",
            baseType: baseTypeEl?.textContent?.trim() ?? "",
          };
        });

      const extract = (idx: number) => this.extractFullValue(cells.nth(idx));

      items.push({
        name,
        baseType,
        price: await extract(indices["Price"]),
        dustValue: await extract(indices["Dust Value"]),
        dustPerChaos: await extract(indices["Dust / Chaos"]),
        dustPerChaosPerSlot: await extract(indices["Dust / Chaos / Slot"]),
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
  getTradeLinkLocator(itemName: string) {
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
    const a = this.getTradeLinkLocator(itemName);

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
    const headers = await this.page.locator("thead th").allInnerTexts();
    const index = headers.findIndex((h) => h.trim() === columnName);
    if (index === -1) throw new Error(`Column "${columnName}" not found`);
    return index;
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

  // ---------------------------
  // Page Metadata
  // ---------------------------

  async verifyPageTitle(expectedTitle: string) {
    await expect(this.page).toHaveTitle(expectedTitle);
  }

  async verifyPageDescription(expectedDescription: string) {
    const metaDescription = this.page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute(
      "content",
      expectedDescription,
    );
  }

  // ---------------------------
  // League Selector
  // ---------------------------

  get leagueSelectorTrigger() {
    return this.page.getByRole("combobox", { name: /league/i });
  }

  get leagueSelector() {
    return this.page.locator("[role='listbox']");
  }

  get leagueSelectorSpinner() {
    return this.page.getByTestId("league-selector-spinner");
  }

  // Assumes league selector is open
  async getLeagueOption(league: League) {
    const option = this.page.getByRole("option", {
      name: getLeagueName(league),
      exact: true,
    });
    return option;
  }

  async selectLeague(league: League) {
    await this.leagueSelectorTrigger.click();
    const leagueOption = await this.getLeagueOption(league);
    await leagueOption.click();
  }

  async verifyLeagueSelected(league: League) {
    const expectedLeague = getLeagueName(league);
    const selectedValueLocator = this.leagueSelectorTrigger.locator(
      '[data-slot="select-value"]',
    );
    await expect(selectedValueLocator).toHaveText(expectedLeague);
    await expect(this.page).toHaveURL(new RegExp(league));
  }

  // ---------------------------
  // Theme Selector
  // ---------------------------

  get themeSelectorTrigger() {
    return this.page.getByRole("button", { name: /theme/i }).first();
  }

  get themeSelector() {
    return this.page.getByRole("menu");
  }

  async getSystemTheme(): Promise<Theme> {
    const theme = await this.page.evaluate(() => {
      if (
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
      ) {
        return "dark";
      }
      return "light";
    });
    return theme;
  }

  async getCurrentTheme(): Promise<Theme> {
    // Check for dark mode class on html or body element
    const html = this.page.locator("html");
    const classAttribute = await html.getAttribute("class");
    const hasDarkClass = classAttribute?.includes("dark") ?? false;
    return hasDarkClass ? "dark" : "light";
  }

  async selectTheme(theme: ThemeOption) {
    await this.themeSelectorTrigger.click();
    const themeOption = this.page.getByRole("menuitem", {
      name: new RegExp(theme, "i"),
    });
    await themeOption.click();
  }

  async verifyThemeApplied(expectedThemeOption: ThemeOption) {
    const expectedTheme =
      expectedThemeOption === "system"
        ? await this.getSystemTheme()
        : expectedThemeOption;
    const currentTheme = await this.getCurrentTheme();
    expect(currentTheme).toBe(expectedTheme);
  }

  // ---------------------------
  // Last Updated Functionality
  // ---------------------------

  get lastUpdatedElement() {
    return this.page.getByText(/last updated:/i).first();
  }

  get lastUpdatedRefreshButton() {
    return this.page
      .getByRole("button", {
        name: /refresh data/i,
      })
      .first();
  }

  async getLastUpdatedText(): Promise<string> {
    return (await this.lastUpdatedElement.innerText()).trim();
  }

  async getLastUpdatedTooltip() {
    // Trigger tooltip and get content
    await this.lastUpdatedElement.hover();
    await this.page.waitForTimeout(500); // Wait for tooltip to appear
    const tooltip = this.page.locator("[data-slot='tooltip-content']").first();
    return tooltip;
  }

  async verifyDateTimeAttribute(time: Locator) {
    const dateTime = await time.getAttribute("datetime");
    expect(dateTime).not.toBeNull();
    const date = new Date(dateTime!);
    expect(date.getTime()).not.toBeNaN();
  }

  async setAlwaysShowRefreshFlag(): Promise<void> {
    await this.page.evaluate(() => {
      localStorage.setItem("poe-udt:always-show-refresh:v1", "true");
    });
  }

  async clickRefreshButton(): Promise<void> {
    await this.lastUpdatedRefreshButton.click();
  }
  // ---------------------------
  // Data Table Functionality Helpers
  // ---------------------------

  async getColumnHeaderNames(): Promise<string[]> {
    const headers = await this.page.locator("thead th").allInnerTexts();
    return headers.map((h) => h.trim()).filter((h) => h !== "");
  }

  async getColumnHeaderWithTooltip(
    columnName: string,
  ): Promise<{ header: string; tooltip?: string }> {
    const colIndex = await this.getColumnIndex(columnName);
    const header = this.page.locator("thead th").nth(colIndex);

    const headerText = await header.innerText();
    const tooltip = header.locator("[role='tooltip']");
    const tooltipText =
      (await tooltip.count()) > 0 ? await tooltip.innerText() : undefined;

    return {
      header: headerText?.trim() || "",
      tooltip: tooltipText?.trim(),
    };
  }

  async getCompactAndFullValueForCell(
    itemName: string,
    columnName: string,
  ): Promise<{ compact: string; full: number }> {
    const colIndex = await this.getColumnIndex(columnName);
    const cell = this.page
      .locator("tr")
      .filter({ hasText: itemName })
      .locator("td")
      .nth(colIndex);

    const fullValueAttr = await cell
      .locator("[data-full-value]")
      .first()
      .getAttribute("data-full-value");
    expect(fullValueAttr).not.toBeNull();
    const fullValue = parseFloat(fullValueAttr!);

    // Extract only the compact number value by targeting the specific span
    // This avoids capturing "/" separators and icon text
    const compactNumberSpan = cell.locator("[data-full-value]").first();
    const compactText = (await compactNumberSpan.innerText()).trim();

    return {
      compact: compactText,
      full: fullValue,
    };
  }

  /**
   * Parses a compact value string (e.g., "1.2K", "3.5M", "2.1B", "1500") into a number
   * @param compactValue The compact value string with optional suffix
   * @returns The parsed number
   */
  parseCompactValue(compactValue: string): number {
    const cleanValue = compactValue.trim().toUpperCase();

    // Extract the numeric part and suffix, ignoring additional formatting characters
    const match = cleanValue.match(/([0-9]+(?:\.[0-9]+)?)\s*([KMB]?)\b/);
    if (!match) {
      throw new Error(`Invalid compact value format: ${compactValue}`);
    }

    const numericPart = parseFloat(match[1]);
    const suffix = match[2];

    // Apply multiplier based on suffix
    switch (suffix) {
      case "K":
        return numericPart * 1_000;
      case "M":
        return numericPart * 1_000_000;
      case "B":
        return numericPart * 1_000_000_000;
      default:
        return numericPart;
    }
  }

  /**
   * Compares compact and full values with appropriate tolerance for rounding
   * @param compactValue The compact value string
   * @param fullValue The full numeric value
   * @returns Whether the values match within tolerance
   */
  compareCompactAndFullValues(
    compactValue: string,
    fullValue: number,
  ): boolean {
    try {
      const parsedCompact = this.parseCompactValue(compactValue);
      // Extract the suffix to determine the appropriate tolerance
      const cleanValue = compactValue.trim().toUpperCase();
      const match = cleanValue.match(/([0-9]+(?:\.[0-9]+)?)\s*([KMB]?)\b/);
      const suffix = match?.[2] || "";

      // Calculate tolerance based on suffix-specific rounding loss with 1 decimal place
      // The tolerance represents half of the smallest unit (0.1 suffix value)
      let tolerance: number;
      switch (suffix) {
        case "K":
          tolerance = 50;
          break;
        case "M":
          tolerance = 50_000;
          break;
        case "B":
          tolerance = 50_000_000;
          break;
        default:
          tolerance = 0.5;
      }

      const difference = Math.abs(parsedCompact - fullValue);
      return difference <= tolerance;
    } catch (error) {
      console.error(`Error comparing values: ${error}`);
      return false;
    }
  }

  // ---------------------------
  // Pagination
  // ---------------------------

  get paginationContainer() {
    return this.page.locator('[data-testid="pagination-container"]').first();
  }

  // Showing X–Y of Z items
  get paginationSummary() {
    return this.page.locator('[data-testid="pagination-summary"]').first();
  }

  // Page X of Y
  get pageIndicator() {
    return this.page.locator('[data-testid="page-indicator"]').first();
  }

  get rowsPerPageSelectTrigger() {
    return this.page
      .locator('[data-testid="rows-per-page-select-trigger"]')
      .first();
  }

  // Assumes menu is open
  get rowsPerPageSelectContent() {
    return this.page
      .locator('[data-testid="rows-per-page-select-content"]')
      .first();
  }

  get prevPageButton() {
    return this.page
      .locator("button")
      .filter({ hasText: "Go to previous page" })
      .first();
  }

  get nextPageButton() {
    return this.page
      .locator("button")
      .filter({ hasText: "Go to next page" })
      .first();
  }

  get firstPageButton() {
    return this.page
      .locator("button")
      .filter({ hasText: "Go to first page" })
      .first();
  }

  get lastPageButton() {
    return this.page
      .locator("button")
      .filter({ hasText: "Go to last page" })
      .first();
  }

  async getPaginationInfo(): Promise<{
    start: number;
    end: number;
    total: number;
    currentPage: number;
    totalPages: number;
    rowsPerPage: number;
  }> {
    const paginationText = await this.paginationSummary.innerText();
    const pageText = await this.pageIndicator.innerText();

    // Extract "Showing X–Y of Z items"
    const showingMatch = paginationText.match(
      /Showing (\d+)[–](\d+) of (\d+) items/,
    );
    const start = showingMatch ? parseInt(showingMatch[1]) : 0;
    const end = showingMatch ? parseInt(showingMatch[2]) : 0;
    const total = showingMatch ? parseInt(showingMatch[3]) : 0;

    // Extract "Page X of Y"
    const pageMatch = pageText.match(/Page (\d+) of (\d+)/);
    const currentPage = pageMatch ? parseInt(pageMatch[1]) : 0;
    const totalPages = pageMatch ? parseInt(pageMatch[2]) : 0;

    // Extract Rows per page value
    const rowsPerPage = await this.getCurrentPageSize();

    return { start, end, total, currentPage, totalPages, rowsPerPage };
  }

  async getPageSizeOptions(): Promise<number[]> {
    const selectTrigger = this.rowsPerPageSelectTrigger;

    await selectTrigger.click();
    await this.page.waitForTimeout(200);

    const options = await this.rowsPerPageSelectContent
      .locator("[data-value]")
      .allInnerTexts();
    return options
      .map((opt) => parseInt(opt.trim()))
      .filter((num) => !isNaN(num));
  }

  async getCurrentPageSize(): Promise<number> {
    const selectValue = await this.rowsPerPageSelectTrigger
      .locator('[data-slot="select-value"]')
      .first()
      .innerText();
    return parseInt(selectValue.trim());
  }
}
