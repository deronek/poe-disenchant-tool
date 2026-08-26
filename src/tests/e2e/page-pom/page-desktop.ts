import type { Locator } from "@playwright/test";
import { expect } from "@playwright/test";

import type { TestItem } from "../types";
import type { PaginationInfo } from "./page-base";
import { escapeRegExp, PoEDisenchantPageBase } from "./page-base";

/**
 * Page object for the desktop layout (>= lg breakpoint): the sortable data
 * table. Shared flows live in {@link PoEDisenchantPageBase}.
 */
export class PoEDisenchantDesktopPage extends PoEDisenchantPageBase {
  // ---------------------------
  // Layout-specific primitives
  // ---------------------------

  override async waitForDataLoad(timeout = 15000) {
    await this.page
      .locator("table tbody tr")
      .first()
      .waitFor({ state: "visible", timeout });
  }

  override async selectItem(name: string) {
    const checkbox = this.getItemRow(name).getByRole("checkbox");
    await checkbox.scrollIntoViewIfNeeded();
    await checkbox.click();
  }

  override async verifyItemSelected(name: string, selected: boolean) {
    const checkbox = this.getItemRow(name).getByRole("checkbox");
    if (selected) await expect(checkbox).toBeChecked();
    else await expect(checkbox).not.toBeChecked();
  }

  override async verifyItemDisplayed(name: string, shouldExist = true) {
    const row = this.rowsByName(name);
    if (shouldExist) await expect(row).toBeVisible();
    else await expect(row).toHaveCount(0);
  }

  override async verifyNoItemsDisplayed(): Promise<void> {
    const visibleRows = await this.dataTableRows.count();
    expect(visibleRows).toBe(1);
    await expect(this.dataTableRows).toHaveText(/No results/);
  }

  override getTradeLinkLocator(itemName: string) {
    const row = this.getItemRow(itemName);
    const a = row.locator("a[href*='pathofexile.com/trade/search/']").first();
    return a;
  }

  // ---------------------------
  // Test Data Helpers
  // ---------------------------

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

  protected override async getItemNames(limit = 10): Promise<string[]> {
    const items = await this.getTestItems(limit);
    return items.map((item) => item.name);
  }

  private rowsByName(itemName: string) {
    const escapedName = escapeRegExp(itemName.trim().replace(/\s+/g, " "));
    return this.dataTableRows.filter({
      has: this.page.locator("td").filter({
        has: this.page.locator("p:first-child", {
          hasText: new RegExp(`^\\s*${escapedName}\\s*$`),
        }),
      }),
    });
  }

  getItemRow(itemName: string) {
    return this.rowsByName(itemName).first();
  }

  async getCell(itemName: string, columnName: string) {
    const colIndex = await this.getColumnIndex(columnName);
    return this.getItemRow(itemName).locator("td").nth(colIndex);
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
  // Data Table Functionality Helpers
  // ---------------------------

  async getColumnHeaderNames(): Promise<string[]> {
    const headers = await this.page.locator("thead th").allInnerTexts();
    return headers.map((h) => h.trim()).filter((h) => h !== "");
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

  override getItemContainer(name: string): Locator {
    return this.getItemRow(name);
  }

  // ---------------------------
  // Last Updated Functionality
  // ---------------------------

  async getLastUpdatedTooltip() {
    await this.lastUpdatedElement.hover();
    await this.page.waitForTimeout(500); // Wait for tooltip to appear
    const tooltip = this.page.locator("[data-slot='tooltip-content']").first();
    return tooltip;
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

    await header.click();

    if (direction) {
      // Sorting removal is off, so sorts toggle asc/desc; at most one
      // extra click reaches the target
      await expect(header).toHaveAttribute(
        "aria-sort",
        /^(ascending|descending)$/,
      );
      if ((await this.getColumnSortState(columnName)) !== direction) {
        await header.click();
      }
      await expect(header).toHaveAttribute(
        "aria-sort",
        direction === "asc" ? "ascending" : "descending",
      );
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

    await this.verifyColumnValuesOrdered(columnName, direction, type);
  }

  async verifyColumnValuesOrdered(
    columnName: string,
    direction: "asc" | "desc" = "asc",
    type: "number" | "string" = "number",
  ): Promise<void> {
    const tableData = await this.getTestItems();
    expect(tableData.length).toBeGreaterThanOrEqual(2);

    const rawValues = tableData.map((item) =>
      this.getItemFieldFromHeaderName(item, columnName),
    );
    const values =
      type === "number"
        ? rawValues.map((v) => Number(v))
        : rawValues.map((v) => String(v).toLowerCase().trim());

    const sortedValues = [...values].sort((a, b) => {
      if (a === b) return 0;
      if (direction === "asc") return a > b ? 1 : -1;
      return a < b ? 1 : -1;
    });

    expect(values).toEqual(sortedValues);
  }

  // ---------------------------
  // Efficiency Column Header
  // ---------------------------

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

  // ---------------------------
  // Total Cost Breakdown Tooltip (total-cost mode only)
  // ---------------------------

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
    await expect(tooltip).not.toBeVisible();
  }

  // ---------------------------
  // Pagination
  // ---------------------------

  override async getPaginationInfo(): Promise<PaginationInfo> {
    const parsed = await this.parsePaginationText();
    const rowsPerPage = await this.getCurrentPageSize();

    return { ...parsed, rowsPerPage };
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
