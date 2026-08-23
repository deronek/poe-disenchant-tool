import type { EfficiencyMode } from "@/lib/efficiency";
import type { ListingTimeFilter, OnlineStatus } from "@/lib/filters";
import type { TradeLinkPayload } from "@/lib/trade-link";
import type { BrowserContext, Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

import type { Theme, ThemeOption } from "../types";
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

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export class SettingsPanel {
  constructor(
    private readonly trigger: Locator,
    private readonly popover: Locator,
    private readonly closeButton: Locator,
  ) {}

  async open(): Promise<void> {
    // Position the trigger at the top of viewport to show the full popover
    await this.trigger.evaluate((el) =>
      el.scrollIntoView({ block: "start", behavior: "instant" }),
    );
    await this.trigger.click();
    await expect(this.popover).toBeVisible();
  }

  async close(): Promise<void> {
    await this.closeButton.click();
    await expect(this.popover).not.toBeVisible();
  }
}

export type PaginationInfo = {
  start: number;
  end: number;
  total: number;
  currentPage: number;
  totalPages: number;
  rowsPerPage: number;
};

type RangeFilterType = "price" | "dust" | "gold";
type FilterChipType = RangeFilterType | "name";

/**
 * Page object flows shared by the desktop and mobile layouts: nav, league and
 * theme selectors, settings popovers, pagination bar, storage helpers. Table
 * specifics live in {@link PoEDisenchantDesktopPage}, card specifics in
 * `PoEDisenchantMobilePage`.
 *
 * `getByRole()` resolves through the accessibility tree, so hidden duplicates
 * of a control never match; `getByTestId`/`getByText` do see them and need
 * visibility scoping (see the filter chips).
 */
export abstract class PoEDisenchantPageBase {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  private get advancedSettingsPanel(): SettingsPanel {
    return new SettingsPanel(
      this.advancedSettingsTrigger,
      this.advancedSettingsPopover,
      this.advancedSettingsCloseButton,
    );
  }

  private get efficiencySettingsPanel(): SettingsPanel {
    return new SettingsPanel(
      this.efficiencySettingsTrigger,
      this.efficiencySettingsPopover,
      this.efficiencySettingsCloseButton,
    );
  }

  private get tabbedFilterPanel(): SettingsPanel {
    return new SettingsPanel(
      this.tabbedFilterButton,
      this.tabbedFilterPopover,
      this.tabbedFilterCloseButton,
    );
  }

  // ---------------------------
  // Layout-specific primitives
  // ---------------------------

  abstract waitForDataLoad(timeout?: number): Promise<void>;

  get tabbedFilterButton(): Locator {
    return this.page.getByRole("button", { name: "Filters", exact: true });
  }

  get advancedSettingsTrigger(): Locator {
    return this.page.getByRole("button", { name: /trade/i }).first();
  }

  get efficiencySettingsTrigger(): Locator {
    return this.page
      .getByRole("button", { name: /configure the efficiency metric/i })
      .first();
  }

  get clearMarksButton(): Locator {
    return this.page.getByRole("button").filter({ hasText: /clear marks/i });
  }

  get nameFilterInput(): Locator {
    return this.page
      .getByRole("textbox", { name: "Filter by name or variant" })
      .first();
  }

  get nameFilterClearButton(): Locator {
    return this.page.getByRole("button", { name: "Clear name filter" }).first();
  }

  get dataTable(): Locator {
    return this.page.locator("table");
  }

  abstract getPaginationInfo(): Promise<PaginationInfo>;

  abstract selectItem(name: string): Promise<void>;
  abstract verifyItemSelected(name: string, selected: boolean): Promise<void>;
  abstract verifyItemDisplayed(
    name: string,
    shouldExist?: boolean,
  ): Promise<void>;
  abstract verifyNoItemsDisplayed(): Promise<void>;

  abstract getItemContainer(name: string): Locator;

  abstract getTradeLinkLocator(itemName: string): Locator;

  // ---------------------------
  // Navigation & Loading
  // ---------------------------

  async goto(path: string = "/") {
    await this.page.goto(path, { waitUntil: "domcontentloaded" });
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

  // ---------------------------
  // Selection & Marking
  // ---------------------------

  async selectItems(names: string[]) {
    for (const name of names) await this.selectItem(name);
  }

  async verifyItemsDisplayed(
    names: string[],
    shouldExist = true,
  ): Promise<void> {
    for (const itemName of names) {
      await this.verifyItemDisplayed(itemName, shouldExist);
    }
  }

  async verifyItemSelectedState(name: string, selected = true): Promise<void> {
    const item = this.getItemContainer(name);
    if (selected) await expect(item).toHaveAttribute("data-state", "selected");
    else await expect(item).not.toHaveAttribute("data-state", "selected");
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

  async getTradeLink(itemName: string): Promise<string> {
    const link = this.getTradeLinkLocator(itemName);
    const href = await link.getAttribute("href");
    if (!href) throw new Error(`Trade link not found for item: ${itemName}`);
    return href;
  }

  async openTradeLinkInNewTab(itemName: string, context: BrowserContext) {
    const a = this.getTradeLinkLocator(itemName);

    await a.scrollIntoViewIfNeeded();
    await a.waitFor({ state: "visible", timeout: 2000 });

    const newPagePromise = context.waitForEvent("page");
    await a.click();

    const newPage = await newPagePromise;
    await newPage.waitForLoadState("domcontentloaded");
    return newPage;
  }

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

  async verifyTradeLinkSettings(expectedSettings: {
    minItemLevel?: number;
    includeCorrupted?: boolean;
    listingTimeFilter?: ListingTimeFilter;
    onlineStatus?: OnlineStatus;
  }): Promise<void> {
    const [itemName] = await this.getItemNames(1);
    const tradeLink = await this.getTradeLink(itemName);
    const payload = await this.parseTradeLinkPayload(tradeLink);

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

  /** Returns item names to operate on, regardless of layout. */
  protected abstract getItemNames(limit?: number): Promise<string[]>;

  // ---------------------------
  // Compact Number Helpers
  // ---------------------------

  parseCompactValue(compactValue: string): number {
    // Formatters emit grouping separators ("152,180"); drop them first
    const cleanValue = compactValue.replace(/,/g, "").trim().toUpperCase();

    const match = cleanValue.match(/([0-9]+(?:\.[0-9]+)?)\s*([KMB]?)\b/);
    if (!match) {
      throw new Error(`Invalid compact value format: ${compactValue}`);
    }

    const numericPart = parseFloat(match[1]);
    const suffix = match[2];

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

  /** True when the compact string matches the full value within rounding loss. */
  compareCompactAndFullValues(
    compactValue: string,
    fullValue: number,
  ): boolean {
    const parsedCompact = this.parseCompactValue(compactValue);
    const cleanValue = compactValue.trim().toUpperCase();
    const match = cleanValue.match(/([0-9]+(?:\.[0-9]+)?)\s*([KMB]?)\b/);
    const suffix = match?.[2] || "";

    // Half of the smallest unit at 1 decimal place, per suffix magnitude
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
    const escapedName = escapeRegExp(getLeagueName(league));
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

  private async getSystemTheme(): Promise<Theme> {
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

  // Rendered twice (desktop tooltip + mobile popover); keep the visible one
  get lastUpdatedElement() {
    return this.page
      .getByText(/last updated:/i)
      .filter({ visible: true })
      .first();
  }

  async verifyDateTimeAttribute(time: Locator) {
    const dateTime = await time.getAttribute("datetime");
    expect(dateTime).not.toBeNull();
    const date = new Date(dateTime!);
    expect(date.getTime()).not.toBeNaN();
  }

  async setAlwaysShowNewLeaguesFlag(): Promise<void> {
    await this.page.evaluate(() => {
      localStorage.setItem("poe-udt:always-show-new-leagues:v1", "true");
    });
  }

  get newLeaguesBadge() {
    return this.page.getByTestId("new-leagues-info-badge");
  }

  // ---------------------------
  // Name Filter Functionality
  // ---------------------------

  get nameFilterChip() {
    return this.page
      .getByTestId("name-filter-chip")
      .filter({ visible: true })
      .first();
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

  async verifyNoNameFilterActive(): Promise<void> {
    await expect(this.nameFilterChip).not.toBeVisible();
    const filterValue = await this.getNameFilterValue();
    expect(filterValue).toBe("");
  }

  // ---------------------------
  // Filtering Helpers
  // ---------------------------

  async waitForFilterDebounce(timeout = 300): Promise<void> {
    await this.page.waitForTimeout(timeout);
  }

  get priceFilterChip() {
    return this.page
      .getByTestId("price-filter-chip")
      .filter({ visible: true })
      .first();
  }

  get dustFilterChip() {
    return this.page
      .getByTestId("dust-filter-chip")
      .filter({ visible: true })
      .first();
  }

  get goldFilterChip() {
    return this.page
      .getByTestId("gold-filter-chip")
      .filter({ visible: true })
      .first();
  }

  private chipFor(type: FilterChipType): Locator {
    const chips = {
      name: this.nameFilterChip,
      price: this.priceFilterChip,
      dust: this.dustFilterChip,
      gold: this.goldFilterChip,
    };
    return chips[type];
  }

  // Chip, tab trigger and human label for one of the range filters
  private rangeParts(type: RangeFilterType) {
    const parts = {
      price: {
        tabTrigger: this.priceTabTrigger,
        label: "Price",
      },
      dust: {
        tabTrigger: this.dustValueTabTrigger,
        label: "Dust Value",
      },
      gold: {
        tabTrigger: this.goldFeeTabTrigger,
        label: "Gold Fee",
      },
    };
    return { ...parts[type], chip: this.chipFor(type) };
  }

  async verifyFilterChipVisible(
    type: FilterChipType,
    visible: boolean = true,
  ): Promise<void> {
    const chip = this.chipFor(type);
    if (visible) await expect(chip).toBeVisible();
    else await expect(chip).not.toBeVisible();
  }

  async clearFilterChip(type: FilterChipType): Promise<void> {
    // Find the X button within the chip and click it
    const clearButton = this.chipFor(type).getByLabel("Clear");
    await expect(clearButton).toBeVisible();
    await clearButton.click();
  }

  // ---------------------------
  // Tabbed Filter Functionality
  // ---------------------------

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
  async switchToTab(tabName: RangeFilterType): Promise<void> {
    const tab = this.rangeParts(tabName).tabTrigger;
    await tab.click();
    await expect(tab).toHaveAttribute("data-state", "active");
  }

  // Assumes popover is open
  async verifyTabActive(tabName: RangeFilterType): Promise<void> {
    await expect(this.rangeParts(tabName).tabTrigger).toHaveAttribute(
      "data-state",
      "active",
    );
  }

  private parseRangeChipText(rawChipText: string): {
    min?: number;
    max?: number;
  } {
    const chipText = rawChipText.trim();
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

  async getFilterRange(
    type: RangeFilterType,
  ): Promise<{ min?: number; max?: number }> {
    return this.parseRangeChipText(
      await this.rangeParts(type).chip.innerText(),
    );
  }

  // Sets a range bound by percent of the slider track.
  // Assumes the tabbed filter popover is already open.
  async setFilterValuePercent(
    filterType: RangeFilterType,
    bound: "lower" | "upper",
    percent: number,
  ): Promise<void> {
    if (percent < 0 || percent > 100) {
      throw new Error("Percent must be between 0 and 100");
    }
    await this.switchToTab(filterType);

    const boundLabel = bound === "lower" ? "Lower" : "Upper";
    const track = this.sliderTrackByName(
      `${boundLabel} bound ${this.rangeParts(filterType).label.toLowerCase()} filter`,
    );

    const boundingBox = await track.boundingBox();
    if (!boundingBox) {
      throw new Error(
        `Slider track for "${boundLabel} bound ${filterType}" has no layout box`,
      );
    }

    // Calculate press point based on percent
    const clickX = Math.round((percent * boundingBox.width) / 100);
    const clickY = boundingBox.height / 2;

    await track.focus();
    await track.hover({ force: true, position: { x: 0, y: clickY } });
    await this.page.mouse.down();
    await track.hover({ force: true, position: { x: clickX, y: clickY } });
    await this.page.mouse.up();
  }
  async setAllFilters(): Promise<void> {
    await this.setFilterValuePercent("price", "lower", 10);
    await this.setFilterValuePercent("price", "upper", 90);
    await this.verifyFilterChipVisible("price", true);
    await this.setFilterValuePercent("dust", "lower", 10);
    await this.setFilterValuePercent("dust", "upper", 90);
    await this.verifyFilterChipVisible("dust", true);
    await this.setFilterValuePercent("gold", "lower", 10);
    await this.setFilterValuePercent("gold", "upper", 90);
    await this.verifyFilterChipVisible("gold", true);
  }

  async getLowerBoundResetButton(name: RangeFilterType): Promise<Locator> {
    return this.page.getByRole("button", {
      name: `Clear lower bound ${this.rangeParts(name).label.toLowerCase()} filter`,
    });
  }

  async getUpperBoundResetButton(name: RangeFilterType): Promise<Locator> {
    return this.page.getByRole("button", {
      name: `Clear upper bound ${this.rangeParts(name).label.toLowerCase()} filter`,
    });
  }

  // ---------------------------
  // Advanced Settings Panel
  // ---------------------------

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

    // The slider root is not focusable, so send keys to the thumb
    const thumb = slider.getByRole("slider");
    await thumb.focus();
    await thumb.press(startAtMin ? "Home" : "End");
    // One keypress per unit of value: this assumes the slider's step is 1.
    // Sliders with larger steps need adjusted key handling.
    for (let steps = startAtMin ? fromMin : fromMax; steps > 0; steps--) {
      await thumb.press(startAtMin ? "ArrowRight" : "ArrowLeft");
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

  private async getListingTimeFilterValue(): Promise<string> {
    const valueText = await this.listingTimeFilterTrigger
      .locator('[data-slot="select-value"]')
      .innerText();
    return valueText.trim();
  }

  async selectListingTimeFilter(value: ListingTimeFilter): Promise<void> {
    const label = LISTING_TIME_LABELS[value];
    await this.listingTimeFilterTrigger.click();

    const option = this.page.getByRole("option", { name: label, exact: true });
    await option.waitFor({ state: "visible" });
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

  private async getOnlineStatusFilterValue(): Promise<string> {
    const valueText = await this.onlineStatusFilterTrigger
      .locator('[data-slot="select-value"]')
      .innerText();
    return valueText.trim();
  }

  async selectOnlineStatusFilter(value: OnlineStatus): Promise<void> {
    const label = ONLINE_STATUS_LABELS[value];
    await this.onlineStatusFilterTrigger.click();

    const option = this.page.getByRole("option", {
      name: label,
      exact: true,
    });
    await option.waitFor({ state: "visible" });
    await option.scrollIntoViewIfNeeded();
    await option.click();
  }

  async verifyOnlineStatusFilter(value: OnlineStatus): Promise<void> {
    const label = ONLINE_STATUS_LABELS[value];
    const currentValue = await this.getOnlineStatusFilterValue();
    expect(currentValue).toContain(label);
  }

  // Reset Button State
  private async isResetButtonDisabled(): Promise<boolean> {
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
    const escapedLabel = escapeRegExp(EFFICIENCY_MODES[mode].label);
    return this.efficiencySettingsPopover.getByRole("radio", {
      name: new RegExp(`^${escapedLabel}`),
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

  protected async parsePaginationText(): Promise<
    Pick<
      PaginationInfo,
      "start" | "end" | "total" | "currentPage" | "totalPages"
    >
  > {
    const paginationText = await this.paginationSummary.innerText();
    const pageText = await this.pageIndicator.innerText();

    const showingMatch = paginationText.match(
      /Showing (\d+)[–](\d+) of (\d+) items/,
    );
    if (!showingMatch) {
      throw new Error(`Unrecognized pagination summary: "${paginationText}"`);
    }
    const pageMatch = pageText.match(/Page (\d+) of (\d+)/);
    if (!pageMatch) {
      throw new Error(`Unrecognized page indicator: "${pageText}"`);
    }

    return {
      start: parseInt(showingMatch[1]),
      end: parseInt(showingMatch[2]),
      total: parseInt(showingMatch[3]),
      currentPage: parseInt(pageMatch[1]),
      totalPages: parseInt(pageMatch[2]),
    };
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

  // ---------------------------
  // localStorage
  // ---------------------------

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
