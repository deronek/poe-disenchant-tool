import {
  EFFICIENCY_MODES,
  EfficiencyModeSchema,
  GOLD_VALUATION_DEFAULT,
} from "@/lib/efficiency";
import { expect, test } from "../../fixtures";

test.describe("Efficiency Column Headers", () => {
  test("should display the efficiency column header for the default mode", async ({
    poePage,
  }) => {
    // Default mode is total-cost
    await poePage.verifyEfficiencyColumnHeader(
      EFFICIENCY_MODES["total-cost"].columnLabel,
    );
    const ariaLabel = await poePage.getEfficiencyHeaderAriaLabel();
    expect(ariaLabel).toBe(
      `Efficiency metric: ${EFFICIENCY_MODES["total-cost"].label}`,
    );
  });

  for (const mode of EfficiencyModeSchema.options) {
    test(`should update the efficiency column header for ${EFFICIENCY_MODES[mode].label} mode`, async ({
      poePage,
    }) => {
      await poePage.setEfficiencyMode(mode);

      await poePage.verifyEfficiencyColumnHeader(
        EFFICIENCY_MODES[mode].columnLabel,
      );
      const ariaLabel = await poePage.getEfficiencyHeaderAriaLabel();
      expect(ariaLabel).toBe(
        `Efficiency metric: ${EFFICIENCY_MODES[mode].label}`,
      );
    });
  }
});

test.describe("Efficiency Column Values", () => {
  test("should display valid efficiency values in default mode", async ({
    poePage,
  }) => {
    const items = await poePage.getTestItems(10);

    for (const item of items) {
      expect(item.efficiency).toBeGreaterThan(0);
      expect(item.efficiency).not.toBeNaN();
    }
  });

  test("should change efficiency values when mode changes", async ({
    poePage,
  }) => {
    const totalCostItems = await poePage.getTestItems(10);

    // Switch to per-slot mode
    await poePage.setEfficiencyMode("per-slot");
    const perSlotItems = await poePage.getTestItems(10);

    // The calculation differs, so at least one value must change
    expect(perSlotItems.map((i) => i.efficiency)).not.toEqual(
      totalCostItems.map((i) => i.efficiency),
    );

    // Switch to per-gold mode
    await poePage.setEfficiencyMode("per-gold");
    const perGoldItems = await poePage.getTestItems(10);

    expect(perGoldItems.map((i) => i.efficiency)).not.toEqual(
      perSlotItems.map((i) => i.efficiency),
    );
  });

  test("should display mode-specific units in the efficiency column", async ({
    poePage,
  }) => {
    const { name } = (await poePage.getTestItems(1))[0];

    // per-slot: dust / chaos icons with slot count
    await poePage.setEfficiencyMode("per-slot");
    let cell = await poePage.getCell(name, "Efficiency");
    await expect(cell.locator("img[alt='Thaumaturgic Dust']")).toBeVisible();
    await expect(cell.locator("img[alt='Chaos Orb']")).toBeVisible();
    await expect(
      cell.locator("span", { hasText: /^\d+ slots?$/ }),
    ).toBeVisible();

    // per-gold: dust / gold icons, no slot count
    await poePage.setEfficiencyMode("per-gold");
    cell = await poePage.getCell(name, "Efficiency");
    await expect(cell.locator("img[alt='Thaumaturgic Dust']")).toBeVisible();
    await expect(cell.locator("img[alt='Gold']")).toBeVisible();
    await expect(cell.locator("span", { hasText: /slots?/ })).toHaveCount(0);

    // total-cost: dust / total cost icons
    await poePage.setEfficiencyMode("total-cost");
    cell = await poePage.getCell(name, "Efficiency");
    await expect(cell.locator("img[alt='Thaumaturgic Dust']")).toBeVisible();
    await expect(cell.locator("svg[aria-label='Total Cost']")).toBeVisible();
    await expect(cell.locator("span", { hasText: /slots?/ })).toHaveCount(0);
  });
});

test.describe("Total Cost Breakdown", () => {
  test("should display the total cost breakdown button only in total-cost mode", async ({
    poePage,
  }) => {
    const items = await poePage.getTestItems(1);

    // Default mode is total-cost - button is present
    const row = poePage.getItemRow(items[0].name);
    await expect(
      row.getByRole("button", {
        name: `Show total cost breakdown for ${items[0].name}`,
      }),
    ).toBeVisible();

    // per-slot mode - no breakdown button
    await poePage.setEfficiencyMode("per-slot");
    await expect(
      poePage.page.locator("button[aria-label^='Show total cost breakdown']"),
    ).toHaveCount(0);

    // per-gold mode - no breakdown button
    await poePage.setEfficiencyMode("per-gold");
    await expect(
      poePage.page.locator("button[aria-label^='Show total cost breakdown']"),
    ).toHaveCount(0);
  });

  test("should show the total cost breakdown tooltip with labels", async ({
    poePage,
  }) => {
    const items = await poePage.getTestItems(1);

    const tooltip = await poePage.openTotalCostBreakdown(items[0].name);
    await expect(tooltip).toContainText("Total Cost Breakdown");
    await expect(tooltip).toContainText("Price");
    await expect(tooltip).toContainText("Gold Fee");
    await expect(tooltip).toContainText("Gold Equivalent");
    await expect(tooltip).toContainText("Total Cost");
    await expect(tooltip).toContainText("per 10,000 Gold");
  });

  test("should show a consistent total cost breakdown", async ({ poePage }) => {
    const items = await poePage.getTestItems(10);
    const checkedItems: { name: string; dustValue: number }[] = [];

    for (const item of items) {
      const tooltip = await poePage.openTotalCostBreakdown(item.name);
      const { price, goldFee, goldEquivalent, totalCost } =
        await poePage.parseTotalCostBreakdown(tooltip);

      // Gold equivalent = gold fee * valuation / 10000 (displayed with 1 decimal)
      const expectedGoldEquivalent =
        (goldFee * GOLD_VALUATION_DEFAULT) / 10_000;
      expect(
        Math.abs(goldEquivalent - expectedGoldEquivalent),
      ).toBeLessThanOrEqual(0.15);

      // Total cost = price + gold equivalent (both displayed with 1 decimal)
      expect(
        Math.abs(totalCost - (price + goldEquivalent)),
      ).toBeLessThanOrEqual(0.15);

      // Efficiency = round(dust / total cost), within rounding bounds of the
      // displayed (1-decimal) total cost
      if (totalCost - 0.15 > 0) {
        const expectedMin = Math.round(item.dustValue / (totalCost + 0.15));
        const expectedMax = Math.round(item.dustValue / (totalCost - 0.15));
        expect(item.efficiency).toBeGreaterThanOrEqual(expectedMin);
        expect(item.efficiency).toBeLessThanOrEqual(expectedMax);
        checkedItems.push({ name: item.name, dustValue: item.dustValue });
      }

      // Remove hover
      await poePage.closeTotalCostBreakdown(tooltip);
    }

    // At least one item should have been checked against the formula
    expect(checkedItems.length).toBeGreaterThan(0);
  });

  test("should update the total cost breakdown when gold valuation changes", async ({
    poePage,
  }) => {
    const items = await poePage.getTestItems(1);
    const itemName = items[0].name;

    // Default valuation (5c per 10k gold)
    const defaultTooltip = await poePage.openTotalCostBreakdown(itemName);
    const defaultBreakdown =
      await poePage.parseTotalCostBreakdown(defaultTooltip);
    const defaultEfficiency = items[0].efficiency;
    await poePage.closeTotalCostBreakdown(defaultTooltip);

    // Increase valuation to 10c per 10k gold
    await poePage.openEfficiencySettings();
    await poePage.setGoldValuation(10);
    await poePage.closeEfficiencySettings();

    const updatedTooltip = await poePage.openTotalCostBreakdown(itemName);
    const updatedBreakdown =
      await poePage.parseTotalCostBreakdown(updatedTooltip);
    const updatedItems = await poePage.getTestItems(1);
    const updatedEfficiency = updatedItems[0].efficiency;

    // Gold equivalent doubles, total cost increases
    expect(
      Math.abs(
        updatedBreakdown.goldEquivalent - defaultBreakdown.goldEquivalent * 2,
      ),
    ).toBeLessThanOrEqual(0.2);
    expect(updatedBreakdown.totalCost).toBeGreaterThan(
      defaultBreakdown.totalCost,
    );

    // Efficiency cannot improve when the cost increases
    expect(updatedEfficiency).toBeLessThanOrEqual(defaultEfficiency);
  });

  test("should show the catalyst recommendation when the item uses catalysts", async ({
    poePage,
  }) => {
    // Sort by dust value descending to surface high-value jewellery items,
    // which are the ones most likely to warrant catalyst investment
    await poePage.sortByColumn("Dust Value", "desc");

    const items = await poePage.getTestItems(10);
    let catalystItemFound = false;

    for (const item of items) {
      const tooltip = await poePage.openTotalCostBreakdown(item.name);
      const hasCatalystSection =
        (await tooltip.getByText("Catalyst Recommendation").count()) > 0;

      if (hasCatalystSection) {
        catalystItemFound = true;
        await expect(tooltip).toContainText("20 Catalysts");
        break;
      }

      await poePage.closeTotalCostBreakdown(tooltip);
    }

    expect(
      catalystItemFound,
      "Expected a catalyst recommendation among the top dust value items",
    ).toBe(true);
  });
});
