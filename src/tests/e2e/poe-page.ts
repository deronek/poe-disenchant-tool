import type { EfficiencyMode } from "@/lib/efficiency";
import type { ListingTimeFilter, OnlineStatus } from "@/lib/filters";
import type { TradeLinkPayload } from "@/lib/trade-link";
import type { BrowserContext, Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

import type { TestItem, Theme, ThemeOption } from "./types";
import { DEFAULT_ADVANCED_SETTINGS } from "@/lib/advanced-settings";
import {
  EFFICIENCY_MODES,
  GOLD_VALUATION_MAX,
  GOLD_VALUATION_MIN,
} from "@/lib/efficiency";
import {
  LISTING_TIME_LABELS,
  MIN_ITEM_LEVEL_RANGE,
  ONLINE_STATUS_LABELS,
} from "@/lib/filters";
import { getLeagueName, League } from "@/lib/leagues";

class SettingsPanel {
  constructor(
    private readonly trigger: Locator,
    private readonly popover: Locator,
    private readonly closeButton: Locator,
    private readonly scrollTriggerIntoView = true,
  ) {}

  async open(): Promise<void> {
    if (this.scrollTriggerIntoView) {
      // Position the trigger at the top of viewport to show the full popover
      await this.trigger.evaluate((el) =>
        el.scrollIntoView({ block: "start", behavior: "instant" }),
      );
    }
    await this.trigger.click();
    await expect(this.popover).toBeVisible();
  }

  async close(): Promise<void> {
    await this.closeButton.click();
    await expect(this.popover).not.toBeVisible();
  }
}

export class PoEDisenchantPage {
  readonly page: Page;

  private readonly advancedSettingsPanel: SettingsPanel;
  private readonly efficiencySettingsPanel: SettingsPanel;
  private readonly tabbedFilterPanel: SettingsPanel;

  constructor(page: Page) {
    this.page = page;
    this.advancedSettingsPanel = new SettingsPanel(
      this.advancedSettingsTrigger,
      this.advancedSettingsPopover,
      this.advancedSettingsCloseButton,
    );
    this.efficiencySettingsPanel = new SettingsPanel(
      this.efficiencySettingsTrigger,
      this.efficiencySettingsPopover,
      this.efficiencySettingsCloseButton,
    );
    this.tabbedFilterPanel = new SettingsPanel(
      this.tabbedFilterButton,
      this.tabbedFilterPopover,
      this.tabbedFilterCloseButton,
      false,
    );
  }

  // ---------------------------
  // Navigation & Loading
  // ---------------------------

  async goto(path: string = "/") {
    await this.page.goto(path, { waitUntil: "domcontentloaded" });
  }

  async waitForDataLoad(timeout = 15000) {
    await this.page
      .locator("table tbody tr")
      .first()
      .waitFor({ state: "visible", timeout });
  }

  async waitForHydration(timeout = 15000) {
    await this.page.waitForSelector("html[data-hydrated='true']", {
      timeout,
    });
  }

  async setup() {
    await this.goto();
    await this.waitForDataLoad();
    await this.waitForHydration();
  }

  async refreshPage() {
    await this.page.reload({ waitUntil: "domcontentloaded" });
    await this.waitForDataLoad();
    await this.waitForHydration();
  }

  get pageTitle() {
    return this.page.locator("h1");
  }

  // ---------------------------
  // Console Helpers
  // ---------------------------

  async verifyNoConsoleErrors() {
    const consoleMessages = await this.page.consoleMessages();
    expect(consoleMessages.filter((m) => m.type() === "error")).toHaveLength(0);
  }

  // ---------------------------
  // Test Data Helpers
  // ---------------------------

  // With toolbar and pagination Controls
  get leagueTable() {
    return this.page.locator("[data-testid='league-table']");
  }

  // Headers + Rows only
  get dataTable() {
    return this.page.locator("table");
  }

  get dataTableRows() {
    return this.page.locator("tbody tr");
  }

  get dataTableHeaders() {
    return this.page.locator("thead th");
  }

  dataColumnHeaders = [
    "Name",
    "Price",
    "Dust Value",
    "Dust / Chaos",
    "Efficiency",
    "Gold Fee",
  ] as const;

  numericalDataColumnHeaders = [
    "Price",
    "Dust Value",
    "Dust / Chaos",
    "Efficiency",
    "Gold Fee",
  ] as const;

  /**
   * Extracts table data into structured test items.
   * Assumes table columns:
   * [0]=Mark, [1]=Icon, [2]=Name, [3]=Price, [4]=Dust Value,
   * [5]=Dust/Chaos, [6]=Dust/Chaos/Slot, [7]=Gold Fee
   */
  async getTestItems(limit = 10): Promise<TestItem[]> {
    const rows = this.dataTableRows;
    const count = Math.min(await rows.count(), limit);
    expect(count).toBeGreaterThan(0); // at least one item

    // Resolve indices by header

    const indices = Object.fromEntries(
      await Promise.all(
        this.dataColumnHeaders.map(async (h) => [
          h,
          await this.getColumnIndex(h),
        ]),
      ),
    ) as Record<string, number>;

    const items: TestItem[] = [];
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
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

      // Extract qualityType from dust value cell
      const dustValueCell = cells.nth(indices["Dust Value"]);
      const dustValueText = await dustValueCell.innerText();
      const qualityTypeMatch = dustValueText.match(/\(([^)]+)\)$/);
      const qualityType = qualityTypeMatch ? qualityTypeMatch[1] : "";

      items.push({
        name,
        baseType,
        price: await extract(indices["Price"]),
        dustValue: await extract(indices["Dust Value"]),
        dustPerChaos: await extract(indices["Dust / Chaos"]),
        efficiency: await extract(indices["Efficiency"]),
        goldCost: await extract(indices["Gold Fee"]),
        qualityType,
      });
    }
    return items;
  }

  getItemRow(itemName: string) {
    return this.dataTableRows.filter({ hasText: itemName }).first();
  }

  async getCell(itemName: string, columnName: string) {
    const colIndex = await this.getColumnIndex(columnName);
    return this.getItemRow(itemName).locator("td").nth(colIndex);
  }

  private async extractFullValue(cell: Locator): Promise<number> {
    const attr = await cell
      .locator("[data-full-value]")
      .first()
      .getAttribute("data-full-value");
    const text = (await cell.innerText()).trim();
    const value = parseFloat(attr ?? text);
    expect(value).not.toBeNaN();
    return value;
  }

  getItemFieldFromHeaderName(item: TestItem, headerName: string) {
    switch (headerName) {
      case "Name":
        return item.name;
      case "Price":
        return item.price;
      case "Dust Value":
        return item.dustValue;
      case "Dust / Chaos":
        return item.dustPerChaos;
      case "Efficiency":
        return item.efficiency;
      case "Gold Fee":
        return item.goldCost;
      default:
        throw new Error(`Unknown header name: ${headerName}`);
    }
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

  async verifyClearMarksCount(count: number): Promise<void> {
    const button = this.clearMarksButton;
    await expect(button).toContainText(`(${count})`);
  }

  // ---------------------------
  // Trade Links
  // ---------------------------

  /**
   * Parses a trade link to extract its query payload
   */
  async parseTradeLinkPayload(tradeLink: string): Promise<TradeLinkPayload> {
    const queryIndex = tradeLink.indexOf("?q=");
    if (queryIndex === -1)
      throw new Error("Invalid trade link format - missing query parameter");
    const payload = decodeURIComponent(tradeLink.slice(queryIndex + 3));
    try {
      return JSON.parse(payload);
    } catch (error) {
      throw new Error(
        `Failed to parse trade link payload: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Gets the first item's trade link and parses its payload
   */
  async getFirstTradeLinkPayload(): Promise<TradeLinkPayload> {
    const items = await this.getTestItems(1);
    const tradeLink = await this.getTradeLink(items[0].name);
    return this.parseTradeLinkPayload(tradeLink);
  }

  /**
   * Verifies that trade link settings match the expected values
   */
  async verifyTradeLinkSettings(expectedSettings: {
    minItemLevel?: number;
    includeCorrupted?: boolean;
    listingTimeFilter?: ListingTimeFilter;
    onlineStatus?: OnlineStatus;
  }): Promise<void> {
    const payload = await this.getFirstTradeLinkPayload();

    if (expectedSettings.minItemLevel !== undefined) {
      const ilvl = payload.query.filters.misc_filters.filters.ilvl;
      expect(ilvl.min).toBe(expectedSettings.minItemLevel);
    }

    if (expectedSettings.includeCorrupted !== undefined) {
      if (expectedSettings.includeCorrupted) {
        expect(
          payload.query.filters.misc_filters.filters.corrupted,
        ).toBeUndefined();
      } else {
        expect(
          payload.query.filters.misc_filters.filters.corrupted!.option,
        ).toBe(false);
      }
    }

    if (expectedSettings.listingTimeFilter !== undefined) {
      if (expectedSettings.listingTimeFilter === "any") {
        expect(
          payload.query.filters.trade_filters.filters.indexed,
        ).toBeUndefined();
      } else {
        const indexed = payload.query.filters.trade_filters.filters.indexed;
        expect(indexed).toBeDefined();
        expect(indexed?.option).toBe(expectedSettings.listingTimeFilter);
      }
    }

    if (expectedSettings.onlineStatus !== undefined) {
      expect(payload.query.status.option).toBe(expectedSettings.onlineStatus);
    }
  }

  async getTradeLink(itemName: string): Promise<string> {
    const row = this.getItemRow(itemName);
    const link = row
      .locator("a[href*='pathofexile.com/trade/search/']")
      .first();
    const href = await link.getAttribute("href");
    if (!href) throw new Error(`Trade link not found for item: ${itemName}`);
    return href;
  }

  // Returns the Locator for the trade link anchor in the given item row
  getTradeLinkLocator(itemName: string) {
    const row = this.getItemRow(itemName);
    const a = row.locator("a[href*='pathofexile.com/trade/search/']").first();
    return a;
  }

  /**
   * Opens the trade link in a new tab and returns the opened Page.
   * Uses scrolling + visible wait, then clicks.
   */
  async openTradeLinkInNewTab(itemName: string, context: BrowserContext) {
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
    const cell = await this.getCell(name, columnName);
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
    const cell = await this.getCell(name, columnName);
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
    const headers = await this.dataTableHeaders.allInnerTexts();
    const normalized = headers.map((h) => h.trim());
    // The Efficiency column header is dynamic (depends on the selected mode),
    // e.g. "Efficiency · Slot", so match it by prefix. All others match exactly.
    const index =
      columnName === "Efficiency"
        ? normalized.findIndex((h) => h.startsWith("Efficiency"))
        : normalized.findIndex((h) => h === columnName);
    if (index === -1) throw new Error(`Column "${columnName}" not found`);
    return index;
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
    return this.page.getByTestId("league-selector-spinner").first();
  }

  // Assumes league selector is open
  async getLeagueOption(league: League) {
    // Matches exactly the league name, optionally followed by whitespace and "New"
    const escapedName = getLeagueName(league).replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&",
    );
    const option = this.page.getByRole("option", {
      name: new RegExp(`^${escapedName}(?:\\s*New)?$`),
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
    const themeOption = this.page.getByRole("menuitemradio", {
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

  async setAlwaysShowNewLeaguesFlag(): Promise<void> {
    await this.page.evaluate(() => {
      localStorage.setItem("poe-udt:always-show-new-leagues:v1", "true");
    });
  }

  async clearAlwaysShowNewLeaguesFlag(): Promise<void> {
    await this.page.evaluate(() => {
      localStorage.removeItem("poe-udt:always-show-new-leagues:v1");
    });
  }

  get newLeaguesBadge() {
    return this.page.getByTestId("new-leagues-info-badge");
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

  async getFullValueAndDisplayedTextForCell(
    itemName: string,
    columnName: string,
  ): Promise<{ displayed: string; full: number }> {
    const cell = await this.getCell(itemName, columnName);

    const fullValueAttr = await cell
      .locator("[data-full-value]")
      .first()
      .getAttribute("data-full-value");
    expect(fullValueAttr).not.toBeNull();
    const fullValue = parseFloat(fullValueAttr!);

    // Extract only the compact number value by targeting the specific span
    // This avoids capturing "/" separators and icon text
    const compactNumberSpan = cell.locator("[data-full-value]").first();
    const displayedText = (await compactNumberSpan.innerText()).trim();

    return {
      displayed: displayedText,
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

  async expectCurrentPage(currentPage: number) {
    let paginationInfo!: Awaited<ReturnType<typeof this.getPaginationInfo>>;
    await expect(async () => {
      paginationInfo = await this.getPaginationInfo();
      expect(paginationInfo.currentPage).toBe(currentPage);
    }).toPass({ timeout: 5000 });
    return paginationInfo;
  }

  async goToNextPage() {
    const { currentPage } = await this.getPaginationInfo();
    await this.nextPageButton.click();
    return this.expectCurrentPage(currentPage + 1);
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

  // ---------------------------
  // Name Filter Functionality
  // ---------------------------

  get nameFilterInput() {
    return this.page
      .getByRole("textbox", { name: "Filter by name or variant" })
      .first();
  }

  get nameFilterClearButton() {
    return this.page.getByRole("button", { name: "Clear name filter" }).first();
  }

  get nameFilterChip() {
    return this.page.getByTestId("name-filter-chip").first();
  }

  async setNameFilter(value: string): Promise<void> {
    await this.nameFilterInput.fill(value);
  }

  async clearNameFilter(): Promise<void> {
    // If button is not visible, filter should be empty
    if (await this.nameFilterClearButton.isVisible())
      await this.nameFilterClearButton.click();
  }

  async getNameFilterValue(): Promise<string> {
    return await this.nameFilterInput.inputValue();
  }

  async verifyItemDisplayed(name: string, shouldExist = true) {
    const row = this.page.locator("tr").filter({ hasText: name });
    if (shouldExist) await expect(row).toBeVisible();
    else await expect(row).toHaveCount(0);
  }

  async verifyItemsDisplayed(
    names: string[],
    shouldExist = true,
  ): Promise<void> {
    for (const itemName of names) {
      await this.verifyItemDisplayed(itemName, shouldExist);
    }
  }

  async verifyNoNameFilterActive(): Promise<void> {
    await expect(this.nameFilterChip).not.toBeVisible();
    const filterValue = await this.getNameFilterValue();
    expect(filterValue).toBe("");
  }

  async verifyNoItemsDisplayed(): Promise<void> {
    const visibleRows = await this.dataTableRows.count();
    expect(visibleRows).toBe(1);
    expect(this.dataTableRows).toHaveText(/No results/);
  }

  // ---------------------------
  // Filtering Helpers
  // ---------------------------

  async waitForFilterDebounce(timeout = 300): Promise<void> {
    await this.page.waitForTimeout(timeout);
  }

  async verifyFilterChipVisible(
    type: "name" | "price" | "dust" | "gold",
    visible: boolean = true,
  ): Promise<void> {
    let chip;
    switch (type) {
      case "name":
        chip = this.nameFilterChip;
        break;
      case "price":
        chip = this.priceFilterChip;
        break;
      case "dust":
        chip = this.dustFilterChip;
        break;
      case "gold":
        chip = this.goldFilterChip;
        break;
    }

    if (visible) await expect(chip).toBeVisible();
    else await expect(chip).not.toBeVisible();
  }

  async clearFilterChip(
    type: "name" | "price" | "dust" | "gold",
  ): Promise<void> {
    let chip;
    switch (type) {
      case "name":
        chip = this.nameFilterChip;
        break;
      case "price":
        chip = this.priceFilterChip;
        break;
      case "dust":
        chip = this.dustFilterChip;
        break;
      case "gold":
        chip = this.goldFilterChip;
        break;
    }

    // Find the X button within the chip and click it
    const clearButton = chip.getByLabel("Clear");
    await expect(clearButton).toBeVisible();
    await clearButton.click();
  }

  async verifyDustFilterChipVisible(visible: boolean = true): Promise<void> {
    await this.verifyFilterChipVisible("dust", visible);
  }

  // ---------------------------
  // Tabbed Filter Functionality
  // ---------------------------

  get tabbedFilterButton() {
    return this.page.getByRole("button", { name: "Filters", exact: true });
  }

  get tabbedFilterPopover() {
    return this.page
      .locator('[role="dialog"]')
      .filter({ hasText: /apply filter/i });
  }

  get priceTabTrigger() {
    return this.page.getByRole("tab", { name: "Open price filter tab" });
  }

  get dustValueTabTrigger() {
    return this.page.getByRole("tab", { name: "Open dust value filter tab" });
  }

  get goldFeeTabTrigger() {
    return this.page.getByRole("tab", { name: "Open gold fee filter tab" });
  }

  get priceFilterChip() {
    return this.page.getByTestId("price-filter-chip").first();
  }

  get dustFilterChip() {
    return this.page.getByTestId("dust-filter-chip").first();
  }

  get goldFilterChip() {
    return this.page.getByTestId("gold-filter-chip").first();
  }

  // All below assume tabbed filter is open and correct tab is active.
  private sliderTrackByName(name: string): Locator {
    return this.page.getByLabel(name, { exact: true });
  }

  get tabbedFilterResetAllButton() {
    return this.tabbedFilterPopover.getByRole("button", { name: "Clear All" });
  }

  get tabbedFilterCloseButton() {
    return this.tabbedFilterPopover.getByRole("button", { name: "Close" });
  }

  async openTabbedFilter(): Promise<void> {
    await this.tabbedFilterPanel.open();
  }

  async closeTabbedFilter(): Promise<void> {
    await this.tabbedFilterPanel.close();
  }

  // Assumes popover is open
  async switchToTab(tabName: "price" | "dust" | "gold"): Promise<void> {
    const tab = (() => {
      switch (tabName) {
        case "price":
          return this.priceTabTrigger;
        case "dust":
          return this.dustValueTabTrigger;
        case "gold":
          return this.goldFeeTabTrigger;
      }
    })();
    await tab.click();
    await expect(tab).toHaveAttribute("data-state", "active");
  }

  // Assumes popover is open
  async verifyTabActive(tabName: "price" | "dust" | "gold"): Promise<void> {
    const tab = (() => {
      switch (tabName) {
        case "price":
          return this.priceTabTrigger;
        case "dust":
          return this.dustValueTabTrigger;
        case "gold":
          return this.goldFeeTabTrigger;
      }
    })();
    await expect(tab).toHaveAttribute("data-state", "active");
  }

  getRangeFilterRange(chipText: string): { min?: number; max?: number } {
    const normalize = (v: string) => parseInt(v.replace(/,/g, ""), 10);

    // Pattern 1: Between (min–max)
    const betweenMatch = chipText.match(/([\d,.]+)\s*[–-]\s*([\d,.]+)/);
    if (betweenMatch) {
      const [, rawMin, rawMax] = betweenMatch;
      return {
        min: normalize(rawMin),
        max: normalize(rawMax),
      };
    }

    // Pattern 2: Lower-only (≥ X or >= X)
    const lowerOnlyMatch = chipText.match(/(?:≥|>=)\s*([\d,.]+)/);
    if (lowerOnlyMatch) {
      return {
        min: normalize(lowerOnlyMatch[1]),
        max: undefined,
      };
    }

    // Pattern 3: Upper-only (≤ X or <= X)
    const upperOnlyMatch = chipText.match(/(?:≤|<=)\s*([\d,.]+)/);
    if (upperOnlyMatch) {
      return {
        min: undefined,
        max: normalize(upperOnlyMatch[1]),
      };
    }

    throw new Error(`Unrecognized range filter chip format: "${chipText}"`);
  }

  async getPriceFilterRange(): Promise<{ min?: number; max?: number }> {
    const chipText = (await this.priceFilterChip.innerText()).trim();

    return this.getRangeFilterRange(chipText);
  }

  async getDustFilterRange(): Promise<{ min?: number; max?: number }> {
    const chipText = (await this.dustFilterChip.innerText()).trim();

    return this.getRangeFilterRange(chipText);
  }

  async getGoldFilterRange(): Promise<{ min?: number; max?: number }> {
    const chipText = (await this.goldFilterChip.innerText()).trim();

    return this.getRangeFilterRange(chipText);
  }

  async verifyPriceFilterRange(min: number, max: number): Promise<void> {
    const range = await this.getPriceFilterRange();
    expect(range.min).toBe(min);
    expect(range.max).toBe(max);
  }

  async verifyDustFilterRange(min: number, max: number): Promise<void> {
    const range = await this.getDustFilterRange();
    expect(range.min).toBe(min);
    expect(range.max).toBe(max);
  }

  // Private helper method to set filter value by percentage.
  // Assumes the tabbed filter popover is already open.
  private async setFilterValuePercent(
    filterType: "price" | "dust" | "gold",
    bound: "lower" | "upper",
    percent: number,
  ): Promise<void> {
    if (percent < 0 || percent > 100) {
      throw new Error("Percent must be between 0 and 100");
    }
    await this.switchToTab(filterType);

    const boundLabel = bound === "lower" ? "Lower" : "Upper";
    const track = this.sliderTrackByName(
      `${boundLabel} bound ${this.getFilterLabelName(filterType).toLowerCase()} filter`,
    );

    const boundingBox = (await track.boundingBox())!;

    // Calculate press point based on percent
    const clickX = Math.round((percent * boundingBox.width) / 100);
    const clickY = boundingBox.height / 2;

    await track.focus();
    await track.hover({ force: true, position: { x: 0, y: clickY } });
    await this.page.mouse.down();
    await track.hover({ force: true, position: { x: clickX, y: clickY } });
    await this.page.mouse.up();
  }

  // Percent should be between 0 and 100
  async setPriceFilterValuePercent(
    bound: "lower" | "upper",
    percent: number,
  ): Promise<void> {
    await this.setFilterValuePercent("price", bound, percent);
  }

  // Percent should be between 0 and 100
  async setDustFilterValuePercent(
    bound: "lower" | "upper",
    percent: number,
  ): Promise<void> {
    await this.setFilterValuePercent("dust", bound, percent);
  }

  // Percent should be between 0 and 100
  async setGoldFilterValuePercent(
    bound: "lower" | "upper",
    percent: number,
  ): Promise<void> {
    await this.setFilterValuePercent("gold", bound, percent);
  }

  async setAllFilters(): Promise<void> {
    // Set price filter
    await this.setPriceFilterValuePercent("lower", 10);
    await this.setPriceFilterValuePercent("upper", 90);
    await this.verifyFilterChipVisible("price", true);

    // Set dust filter
    await this.setDustFilterValuePercent("lower", 10);
    await this.setDustFilterValuePercent("upper", 90);
    await this.verifyFilterChipVisible("dust", true);

    // Set gold fee filter
    await this.setGoldFilterValuePercent("lower", 10);
    await this.setGoldFilterValuePercent("upper", 90);
    await this.verifyFilterChipVisible("gold", true);
  }

  getFilterLabelName(name: "price" | "dust" | "gold") {
    switch (name) {
      case "price":
        return "Price";
      case "dust":
        return "Dust Value";
      case "gold":
        return "Gold Fee";
    }
  }
  async getLowerBoundResetButton(
    name: "price" | "dust" | "gold",
  ): Promise<Locator> {
    const labelName = this.getFilterLabelName(name).toLowerCase();
    return this.page.getByRole("button", {
      name: `Clear lower bound ${labelName} filter`,
    });
  }

  async getUpperBoundResetButton(
    name: "price" | "dust" | "gold",
  ): Promise<Locator> {
    const labelName = this.getFilterLabelName(name).toLowerCase();
    return this.page.getByRole("button", {
      name: `Clear upper bound ${labelName} filter`,
    });
  }

  // ---------------------------
  // Column Sorting Functionality
  // ---------------------------

  async getColumnSortState(
    columnName: string,
  ): Promise<"none" | "asc" | "desc"> {
    const colIndex = await this.getColumnIndex(columnName);
    const header = this.dataTableHeaders.nth(colIndex);

    const ariaSort = await header.getAttribute("aria-sort");
    switch (ariaSort) {
      case "ascending":
        return "asc";
      case "descending":
        return "desc";
      default:
        return "none";
    }
  }

  async sortByColumn(
    columnName: string,
    direction?: "asc" | "desc",
  ): Promise<void> {
    const colIndex = await this.getColumnIndex(columnName);
    const header = this.dataTableHeaders.nth(colIndex);

    // Click header to initiate sorting
    await header.click();

    // If specific direction requested, cycle until we get it
    if (direction) {
      let currentDirection = await this.getColumnSortState(columnName);
      while (currentDirection !== direction) {
        await header.click();
        currentDirection = await this.getColumnSortState(columnName);
        await this.page.waitForTimeout(100);
      }
    }

    await this.page.waitForTimeout(300); // Wait for sort animation
  }

  async verifyColumnSorted(
    columnName: string,
    direction: "asc" | "desc",
    type: "number" | "string" = "number",
  ): Promise<void> {
    const sortState = await this.getColumnSortState(columnName);
    expect(sortState).toBe(direction);

    // Verify values are in order
    await this.verifyColumnValuesOrdered(columnName, direction, type);
  }

  async verifyColumnValuesOrdered(
    columnName: string,
    direction: "asc" | "desc" = "asc",
    type: "number" | "string" = "number",
  ): Promise<void> {
    const tableData = await this.getTestItems();
    expect(tableData.length).toBeGreaterThanOrEqual(2);

    // Extract numeric values for the target column
    const rawValues = tableData.map((item) =>
      this.getItemFieldFromHeaderName(item, columnName),
    );
    // Normalize based on explicit type
    const values =
      type === "number"
        ? rawValues.map((v) => Number(v))
        : rawValues.map((v) => String(v).toLowerCase().trim());

    // Sort copy for comparison
    const sortedValues = [...values].sort((a, b) => {
      if (a === b) return 0;
      if (direction === "asc") return a > b ? 1 : -1;
      return a < b ? 1 : -1;
    });

    expect(values).toEqual(sortedValues);
  }

  // ---------------------------
  // Advanced Settings Panel
  // ---------------------------

  get advancedSettingsTrigger() {
    return this.page.getByRole("button", { name: /trade/i }).first();
  }

  get advancedSettingsPopover() {
    return this.page
      .locator('[role="dialog"]')
      .filter({ hasText: /trade settings/i });
  }

  get advancedSettingsCloseButton() {
    return this.advancedSettingsPopover.getByRole("button", { name: "Close" });
  }

  get advancedSettingsResetButton() {
    return this.advancedSettingsPopover.getByRole("button", { name: "Reset" });
  }

  async openAdvancedSettings(): Promise<void> {
    await this.advancedSettingsPanel.open();
  }

  async closeAdvancedSettings(): Promise<void> {
    await this.advancedSettingsPanel.close();
  }

  // Minimum Item Level Slider
  get minItemLevelSlider() {
    return this.page.getByLabel("Minimum Item Level", { exact: true });
  }

  get minItemLevelValue() {
    return this.advancedSettingsPopover.getByTestId("min-item-level-value");
  }

  get minItemLevelRangeMin() {
    return this.advancedSettingsPopover.getByTestId("min-item-level-range-min");
  }

  get minItemLevelRangeMax() {
    return this.advancedSettingsPopover.getByTestId("min-item-level-range-max");
  }

  async getMinItemLevel(): Promise<number> {
    const valueText = await this.minItemLevelValue.innerText();
    return parseInt(valueText.trim(), 10);
  }

  private async setSliderValueByKeys(
    slider: Locator,
    value: number,
    min: number,
    max: number,
  ): Promise<void> {
    const fromMin = value - min;
    const fromMax = max - value;
    const startAtMin = fromMin <= fromMax;

    await slider.focus();
    await slider.press(startAtMin ? "Home" : "End");
    for (let steps = startAtMin ? fromMin : fromMax; steps > 0; steps--) {
      await slider.press(startAtMin ? "ArrowRight" : "ArrowLeft");
    }
  }

  async setMinItemLevel(value: number): Promise<void> {
    const min = MIN_ITEM_LEVEL_RANGE.min;
    const max = MIN_ITEM_LEVEL_RANGE.max;
    if (value < min || value > max) {
      throw new Error(`Min item level must be between ${min} and ${max}`);
    }

    await this.setSliderValueByKeys(this.minItemLevelSlider, value, min, max);
  }

  async verifyMinItemLevel(value: number): Promise<void> {
    await expect(this.minItemLevelValue).toHaveText(String(value));
  }

  // Include Corrupted Items Checkbox
  get includeCorruptedCheckbox() {
    return this.page.getByRole("checkbox", {
      name: /include corrupted items/i,
    });
  }

  async isIncludeCorruptedChecked(): Promise<boolean> {
    return await this.includeCorruptedCheckbox.isChecked();
  }

  async setIncludeCorrupted(checked: boolean): Promise<void> {
    const isChecked = await this.isIncludeCorruptedChecked();
    if (isChecked !== checked) {
      await this.includeCorruptedCheckbox.click();
    }
  }

  async verifyIncludeCorrupted(checked: boolean): Promise<void> {
    const isChecked = await this.isIncludeCorruptedChecked();
    expect(isChecked).toBe(checked);
  }

  // Listing Time Filter
  get listingTimeFilterTrigger() {
    return this.page.locator("#listing-time-filter");
  }

  get listingTimeFilterContent() {
    return this.page.getByTestId("listing-time-filter-content");
  }

  async getListingTimeFilterValue(): Promise<string> {
    const valueText = await this.listingTimeFilterTrigger
      .locator('[data-slot="select-value"]')
      .innerText();
    return valueText.trim();
  }

  async selectListingTimeFilter(value: ListingTimeFilter): Promise<void> {
    const label = LISTING_TIME_LABELS[value];
    await this.listingTimeFilterTrigger.click();
    await this.page.waitForTimeout(300);

    const option = this.page.getByRole("option", { name: label, exact: true });
    await option.scrollIntoViewIfNeeded();
    await option.click();
  }

  async verifyListingTimeFilter(value: ListingTimeFilter): Promise<void> {
    const label = LISTING_TIME_LABELS[value];
    const currentValue = await this.getListingTimeFilterValue();
    expect(currentValue).toContain(label);
  }

  // Online Status Filter
  get onlineStatusFilterTrigger() {
    return this.page.locator("#online-status-filter");
  }

  get onlineStatusFilterContent() {
    return this.page.getByTestId("online-status-filter-content");
  }

  async getOnlineStatusFilterValue(): Promise<string> {
    const valueText = await this.onlineStatusFilterTrigger
      .locator('[data-slot="select-value"]')
      .innerText();
    return valueText.trim();
  }

  async selectOnlineStatusFilter(value: OnlineStatus): Promise<void> {
    const label = ONLINE_STATUS_LABELS[value];
    await this.onlineStatusFilterTrigger.click();
    await this.page.waitForTimeout(300);

    const option = this.page.getByRole("option", {
      name: label,
      exact: true,
    });
    await option.scrollIntoViewIfNeeded();
    await option.click();
  }

  async verifyOnlineStatusFilter(value: OnlineStatus): Promise<void> {
    const label = ONLINE_STATUS_LABELS[value];
    const currentValue = await this.getOnlineStatusFilterValue();
    expect(currentValue).toContain(label);
  }

  // Reset Button State
  async isResetButtonDisabled(): Promise<boolean> {
    return await this.advancedSettingsResetButton.isDisabled();
  }

  async verifyResetButtonDisabled(disabled: boolean): Promise<void> {
    const isDisabled = await this.isResetButtonDisabled();
    expect(isDisabled).toBe(disabled);
  }

  async resetAdvancedSettings(): Promise<void> {
    await this.advancedSettingsResetButton.scrollIntoViewIfNeeded();
    await this.advancedSettingsResetButton.click();
  }

  async verifyAllDefaultSettings(): Promise<void> {
    await this.verifyMinItemLevel(DEFAULT_ADVANCED_SETTINGS.minItemLevel);
    await this.verifyIncludeCorrupted(
      DEFAULT_ADVANCED_SETTINGS.includeCorrupted,
    );
    await this.verifyListingTimeFilter(
      DEFAULT_ADVANCED_SETTINGS.listingTimeFilter,
    );
    await this.verifyOnlineStatusFilter(DEFAULT_ADVANCED_SETTINGS.onlineStatus);
    await this.verifyResetButtonDisabled(true);
  }

  // ---------------------------
  // Efficiency Settings Panel
  // ---------------------------

  get efficiencySettingsTrigger() {
    return this.page
      .getByRole("button", { name: /configure the efficiency metric/i })
      .first();
  }

  get efficiencySettingsPopover() {
    return this.page
      .locator('[role="dialog"]')
      .filter({ hasText: /efficiency metric/i });
  }

  get efficiencySettingsCloseButton() {
    return this.efficiencySettingsPopover.getByRole("button", {
      name: "Close",
    });
  }

  async openEfficiencySettings(): Promise<void> {
    await this.efficiencySettingsPanel.open();
  }

  async closeEfficiencySettings(): Promise<void> {
    await this.efficiencySettingsPanel.close();
  }

  // Efficiency Metric Radio Group
  get efficiencyModeRadioGroup() {
    return this.efficiencySettingsPopover.getByRole("radiogroup", {
      name: "Efficiency metric",
    });
  }

  getEfficiencyModeRadio(mode: EfficiencyMode) {
    return this.efficiencySettingsPopover.getByRole("radio", {
      name: new RegExp(`^${EFFICIENCY_MODES[mode].label}`),
    });
  }

  async selectEfficiencyMode(mode: EfficiencyMode): Promise<void> {
    const radio = this.getEfficiencyModeRadio(mode);
    await radio.click();
  }

  async verifyEfficiencyMode(mode: EfficiencyMode): Promise<void> {
    const radio = this.getEfficiencyModeRadio(mode);
    await expect(radio).toBeChecked();
  }

  async setEfficiencyMode(mode: EfficiencyMode): Promise<void> {
    await this.openEfficiencySettings();
    await this.selectEfficiencyMode(mode);
    await this.closeEfficiencySettings();
  }

  async verifyEfficiencyColumnHeader(
    expectedColumnLabel: string,
  ): Promise<void> {
    const headers = await this.getColumnHeaderNames();
    const efficiencyHeader = headers.find((h) => h.startsWith("Efficiency"));
    expect(efficiencyHeader).toBe(`Efficiency · ${expectedColumnLabel}`);
  }

  async getEfficiencyHeaderAriaLabel(): Promise<string | null> {
    const colIndex = await this.getColumnIndex("Efficiency");
    const header = this.dataTableHeaders.nth(colIndex);
    return header
      .locator("span[aria-label]")
      .first()
      .getAttribute("aria-label");
  }

  // Gold Valuation Slider (visible in total-cost mode only)
  get goldValuationSlider() {
    return this.efficiencySettingsPopover.getByLabel(
      "Chaos value per ten thousand Gold",
      { exact: true },
    );
  }

  get goldValuationThumb() {
    return this.goldValuationSlider.getByRole("slider");
  }

  get goldValuationResetButton() {
    return this.efficiencySettingsPopover.getByRole("button", {
      name: "Reset gold valuation to default",
    });
  }

  async verifyGoldValuation(value: number): Promise<void> {
    await expect(this.goldValuationThumb).toHaveAttribute(
      "aria-valuenow",
      String(value),
    );
  }

  async setGoldValuation(value: number): Promise<void> {
    const min = GOLD_VALUATION_MIN;
    const max = GOLD_VALUATION_MAX;
    if (value < min || value > max) {
      throw new Error(`Gold valuation must be between ${min} and ${max}`);
    }

    await this.setSliderValueByKeys(this.goldValuationSlider, value, min, max);
  }

  // Total Cost Breakdown Tooltip (total-cost mode only)
  async openTotalCostBreakdown(itemName: string) {
    const row = this.getItemRow(itemName);
    const trigger = row.getByRole("button", {
      name: `Show total cost breakdown for ${itemName}`,
    });
    await trigger.scrollIntoViewIfNeeded();
    await trigger.hover();
    const tooltip = this.page.locator("[data-slot='tooltip-content']").first();
    await expect(tooltip).toBeVisible();
    return tooltip;
  }

  async closeTotalCostBreakdown(tooltip: Locator): Promise<void> {
    await this.pageTitle.click();
    await expect(tooltip).not.toBeVisible({ timeout: 500 });
  }

  async parseTotalCostBreakdown(tooltip: Locator): Promise<{
    price: number;
    goldFee: number;
    goldEquivalent: number;
    totalCost: number;
  }> {
    const text = await tooltip.innerText();
    const parse = (label: string, suffix: string) => {
      const match = text.match(
        new RegExp(`${label}\\s+([\\d,.]+)\\s+${suffix}`),
      );
      if (!match) {
        throw new Error(`Missing "${label}" value in: ${text}`);
      }
      return parseFloat(match[1].replace(/,/g, ""));
    };
    return {
      price: parse("Price", "Chaos"),
      goldFee: parse("Gold Fee", "Gold"),
      goldEquivalent: parse("Gold Equivalent", "Chaos"),
      totalCost: parse("Total Cost", "Chaos"),
    };
  }

  // localStorage
  async expectStorageKey(key: string, expected: string | null): Promise<void> {
    const stored = await this.page.evaluate(
      (k) => localStorage.getItem(k),
      key,
    );
    expect(stored).toBe(expected);
  }

  async expectStorageKeyContains(
    key: string,
    expected: Record<string, unknown>,
  ): Promise<void> {
    const stored = await this.page.evaluate(
      (k) => localStorage.getItem(k),
      key,
    );
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored!)).toMatchObject(expected);
  }
}
