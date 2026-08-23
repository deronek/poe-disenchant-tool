import type { Locator } from "@playwright/test";
import { expect } from "@playwright/test";

import type { PaginationInfo } from "./page-base";
import { escapeRegExp, PoEDisenchantPageBase } from "./page-base";

export type CardMetricLabel =
  | "Price"
  | "Dust Value"
  | "Gold Fee"
  | "Dust per Chaos"
  | "Efficiency";

const METRIC_VALUE_TESTIDS: Record<CardMetricLabel, string> = {
  Price: "card-metric-price",
  "Dust Value": "card-metric-dust-value",
  "Gold Fee": "card-metric-gold-fee",
  "Dust per Chaos": "card-metric-dust-per-chaos",
  Efficiency: "card-metric-efficiency",
};

/**
 * Page object for the mobile layout (< lg breakpoint): the card list.
 * Layout-agnostic flows live in {@link PoEDisenchantPageBase}.
 */
export class PoEDisenchantMobilePage extends PoEDisenchantPageBase {
  // ---------------------------
  // Layout-specific primitives
  // ---------------------------

  override async waitForDataLoad(timeout = 15000) {
    await this.mobileCards.first().waitFor({ state: "visible", timeout });
  }

  override async selectItem(name: string) {
    const checkbox = this.mobileCard(name).getByRole("checkbox");
    await checkbox.scrollIntoViewIfNeeded();
    await checkbox.click();
  }

  override async verifyItemSelected(name: string, selected: boolean) {
    const checkbox = this.mobileCard(name).getByRole("checkbox");
    if (selected) await expect(checkbox).toBeChecked();
    else await expect(checkbox).not.toBeChecked();
  }

  override getItemContainer(name: string): Locator {
    return this.mobileCard(name);
  }

  override getTradeLinkLocator(itemName: string) {
    return this.mobileCard(itemName).getByRole("link", {
      name: `Open trade search for ${itemName} in new tab`,
    });
  }

  // ---------------------------
  // Mobile Card Layout
  // ---------------------------

  get mobileCards() {
    return this.leagueTable.getByRole("heading", { level: 3 });
  }

  get noResultsText() {
    // Both layouts render a "No results." node; keep the visible one
    return this.leagueTable
      .getByText("No results.", { exact: true })
      .filter({ visible: true });
  }

  // NOTE: the inner `has` locator must be created from `page`; locators
  // rooted at another locator are not rebased by filter() and never match
  mobileCard(itemName: string): Locator {
    const escapedName = escapeRegExp(itemName.trim().replace(/\s+/g, " "));
    const heading = this.page.getByRole("heading", {
      level: 3,
      name: new RegExp(`^\\s*${escapedName}\\s*$`),
    });
    return this.leagueTable
      .locator("[data-testid='mobile-card']")
      .filter({ has: heading })
      .first();
  }

  cardMetric(itemName: string, metricLabel: CardMetricLabel): Locator {
    return this.mobileCard(itemName).getByTestId(
      METRIC_VALUE_TESTIDS[metricLabel],
    );
  }

  async getCardMetricValue(
    itemName: string,
    metricLabel: CardMetricLabel,
  ): Promise<string> {
    const value = this.cardMetric(itemName, metricLabel);
    await value.waitFor({ state: "visible" });
    return (await value.innerText()).trim();
  }

  async getCardNames(limit = Number.POSITIVE_INFINITY): Promise<string[]> {
    const cards = this.mobileCards;
    const count = Math.min(await cards.count(), limit);
    const names: string[] = [];
    for (let i = 0; i < count; i++) {
      names.push((await cards.nth(i).innerText()).trim());
    }
    return names;
  }

  protected override async getItemNames(limit = 10): Promise<string[]> {
    return this.getCardNames(limit);
  }

  // Quality type, e.g. "(q20)" rendered next to the dust value
  async getCardQualityType(itemName: string): Promise<string> {
    const text = await this.mobileCard(itemName).innerText();
    const match = text.match(/\((q20|q0)\)/);
    return match ? match[1] : "";
  }

  override async verifyItemDisplayed(itemName: string, shouldExist = true) {
    const card = this.mobileCard(itemName);
    if (shouldExist) await expect(card).toBeVisible();
    else await expect(card).not.toBeVisible();
  }

  override async verifyNoItemsDisplayed() {
    await expect(this.noResultsText).toBeVisible();
  }

  // ---------------------------
  // Mobile Sorting Dropdown
  // ---------------------------

  get sortTrigger() {
    return this.page.getByRole("button", { name: /^Sort options/ });
  }

  get sortMenu() {
    return this.page.getByRole("menu", { name: "Sort options" });
  }

  sortMenuItem(optionLabel: string) {
    const escaped = escapeRegExp(optionLabel);
    return this.sortMenu.getByRole("menuitem", {
      name: new RegExp(
        `^(?:Sort by ${escaped}, descending|${escaped}, currently (?:ascending|descending)\\. Select to sort (?:ascending|descending))$`,
        "i",
      ),
    });
  }

  async openSortMenu() {
    await this.sortTrigger.click();
    await expect(this.sortMenu).toBeVisible();
  }

  async sortByOption(optionLabel: string) {
    await this.openSortMenu();
    await this.sortMenuItem(optionLabel).click();
    await expect(this.sortMenu).not.toBeVisible();
  }

  async verifySortTriggerState(columnLabel: string, direction: string) {
    await expect(this.sortTrigger).toHaveAttribute(
      "aria-label",
      new RegExp(
        `Current:\\s*${escapeRegExp(columnLabel)},\\s*${direction}`,
        "i",
      ),
    );
  }

  // ---------------------------
  // Info Popovers (tap instead of hover)
  // ---------------------------

  get lastUpdatedPopoverContent() {
    return this.page
      .locator("[data-slot='popover-content']")
      .filter({ hasText: /absolute time/i });
  }

  async getLastUpdatedPopover() {
    await this.lastUpdatedElement.click();
    const popover = this.lastUpdatedPopoverContent;
    await expect(popover).toBeVisible();
    return popover;
  }

  async closeLastUpdatedPopover() {
    await this.lastUpdatedElement.click();
    await expect(this.lastUpdatedPopoverContent).not.toBeVisible();
  }

  async openCardInfoPopover(itemName: string, infoButtonName: string) {
    const button = this.mobileCard(itemName).getByRole("button", {
      name: infoButtonName,
    });
    await button.scrollIntoViewIfNeeded();
    await button.click();
    const popover = this.page
      .locator("[data-slot='popover-content']")
      .filter({ visible: true });
    await expect(popover).toBeVisible();
    return popover;
  }

  // ---------------------------
  // Pagination (mobile-adapted)
  // ---------------------------

  // The rows-per-page select is hidden below lg; derive the page size from
  // the summary instead of reading the hidden control.
  override async getPaginationInfo(): Promise<PaginationInfo> {
    const parsed = await this.parsePaginationText();

    return {
      ...parsed,
      rowsPerPage: Math.max(0, parsed.end - parsed.start + 1),
    };
  }
}
