import { expect, testMobile as test } from "../../fixtures";

test.describe("Name Filter Functionality", () => {
  test("should filter cards by name", async ({ poePage }) => {
    const [first] = await poePage.getCardNames(1);
    expect(first).toBeTruthy();

    await poePage.setNameFilter(first!);
    await poePage.waitForFilterDebounce();

    await poePage.verifyItemDisplayed(first!);
  });

  test("should clear the name filter via the input clear button", async ({
    poePage,
  }) => {
    const [first] = await poePage.getCardNames(1);

    await poePage.setNameFilter(first!);
    await poePage.waitForFilterDebounce();

    await poePage.clearNameFilter();
    await poePage.waitForFilterDebounce();

    await poePage.verifyNoNameFilterActive();
    const { rowsPerPage } = await poePage.getPaginationInfo();
    expect(await poePage.mobileCardHeadings.count()).toBe(rowsPerPage);
  });

  test("should clear the name filter via the filter chip", async ({
    poePage,
  }) => {
    const [first] = await poePage.getCardNames(1);

    await poePage.setNameFilter(first!);
    await poePage.waitForFilterDebounce();
    await poePage.verifyFilterChipVisible("name");

    await poePage.clearFilterChip("name");
    await poePage.waitForFilterDebounce();
    await poePage.verifyNoNameFilterActive();
  });

  test("should show the mobile empty state when nothing matches", async ({
    poePage,
  }) => {
    await poePage.setNameFilter("zzzz-no-such-item-zzzz");
    await poePage.waitForFilterDebounce();

    await poePage.verifyNoItemsDisplayed();

    // Desktop empty state stays hidden
    await expect(poePage.dataTable).toBeHidden();

    await poePage.setNameFilter("");
    await poePage.waitForFilterDebounce();
    expect(await poePage.mobileCardHeadings.count()).toBeGreaterThan(0);
  });

  test("should reset to the first page when filtering", async ({ poePage }) => {
    await poePage.goToNextPage();
    const [nameOnPage2] = await poePage.getCardNames(1);

    await poePage.setNameFilter(nameOnPage2!);
    await poePage.waitForFilterDebounce();

    await poePage.expectCurrentPage(1);
  });
});

test.describe("Range Filter Functionality", () => {
  test("should apply a price range filter and display its chip", async ({
    poePage,
  }) => {
    await poePage.openTabbedFilter();
    await poePage.switchToTab("price");

    await poePage.setFilterValuePercent("price", "lower", 10);
    await poePage.setFilterValuePercent("price", "upper", 90);

    await poePage.verifyFilterChipVisible("price");
    const range = await poePage.getFilterRange("price");
    expect(range.min).toBeDefined();
    expect(range.max).toBeDefined();
    expect(range.min!).toBeLessThan(range.max!);

    await poePage.closeTabbedFilter();

    const names = await poePage.getCardNames(5);
    // Compact display rounds ("12.3K"); allow 5% slack
    const minSlack = Math.max(1, range.min! * 0.05);
    const maxSlack = Math.max(1, range.max! * 0.05);
    for (const name of names) {
      const raw = await poePage.getCardMetricValue(name, "Price");
      const price = poePage.parseCompactValue(raw);
      expect(price).toBeGreaterThanOrEqual(range.min! - minSlack);
      expect(price).toBeLessThanOrEqual(range.max! + maxSlack);
    }
  });

  test("should switch between filter tabs", async ({ poePage }) => {
    await poePage.openTabbedFilter();

    await poePage.switchToTab("dust");
    await poePage.verifyTabActive("dust");

    await poePage.switchToTab("gold");
    await poePage.verifyTabActive("gold");

    await poePage.switchToTab("price");
    await poePage.verifyTabActive("price");

    await poePage.closeTabbedFilter();
  });

  test("should clear all filters with the Clear All button", async ({
    poePage,
  }) => {
    await poePage.openTabbedFilter();
    await poePage.setFilterValuePercent("price", "lower", 10);
    await poePage.setFilterValuePercent("dust", "upper", 90);
    await poePage.verifyFilterChipVisible("price");
    await poePage.verifyFilterChipVisible("dust");

    await poePage.tabbedFilterResetAllButton.click();

    await poePage.verifyFilterChipVisible("price", false);
    await poePage.verifyFilterChipVisible("dust", false);
    await poePage.closeTabbedFilter();

    const { rowsPerPage } = await poePage.getPaginationInfo();
    expect(await poePage.mobileCardHeadings.count()).toBe(rowsPerPage);
  });

  test("should persist applied range filters across page reloads", async ({
    poePage,
  }) => {
    await poePage.openTabbedFilter();
    await poePage.switchToTab("gold");
    await poePage.setFilterValuePercent("gold", "lower", 20);
    await poePage.closeTabbedFilter();
    await poePage.verifyFilterChipVisible("gold");

    await poePage.refreshPage();
    await poePage.verifyFilterChipVisible("gold");
  });

  test("should close the tabbed filter via Escape and outside tap, preserving tab state", async ({
    poePage,
  }) => {
    await poePage.openTabbedFilter();
    await poePage.switchToTab("dust");
    await poePage.verifyTabActive("dust");

    await poePage.page.keyboard.press("Escape");
    await expect(poePage.tabbedFilterPopover).not.toBeVisible();

    // Tab state survives reopen
    await poePage.openTabbedFilter();
    await poePage.verifyTabActive("dust");

    await poePage.pageTitle.click();
    await expect(poePage.tabbedFilterPopover).not.toBeVisible();
  });

  test("should clear a price range filter via its chip", async ({
    poePage,
  }) => {
    await poePage.openTabbedFilter();
    await poePage.setFilterValuePercent("price", "lower", 10);
    await poePage.closeTabbedFilter();
    await poePage.verifyFilterChipVisible("price");

    await poePage.clearFilterChip("price");
    await poePage.waitForFilterDebounce();

    await poePage.verifyFilterChipVisible("price", false);
  });

  test("should keep filters isolated when price and dust filters are combined", async ({
    poePage,
  }) => {
    await poePage.openTabbedFilter();
    await poePage.setFilterValuePercent("price", "lower", 10);
    await poePage.setFilterValuePercent("dust", "lower", 30);
    await poePage.closeTabbedFilter();

    const priceRange = await poePage.getFilterRange("price");
    const dustRange = await poePage.getFilterRange("dust");
    expect(priceRange.min).toBeDefined();
    expect(dustRange.min).toBeDefined();

    const priceSlack = Math.max(1, priceRange.min! * 0.05);
    const dustSlack = Math.max(1, dustRange.min! * 0.05);
    await expect(async () => {
      const names = await poePage.getCardNames(5);
      expect(names.length).toBeGreaterThan(0);
      for (const name of names) {
        const price = poePage.parseCompactValue(
          await poePage.getCardMetricValue(name, "Price"),
        );
        const dust = poePage.parseCompactValue(
          await poePage.getCardMetricValue(name, "Dust Value"),
        );
        expect(price, `price of "${name}"`).toBeGreaterThanOrEqual(
          priceRange.min! - priceSlack,
        );
        expect(dust, `dust of "${name}"`).toBeGreaterThanOrEqual(
          dustRange.min! - dustSlack,
        );
      }
    }).toPass({ timeout: 5000 });
  });

  test("should reset a single range bound while preserving the other", async ({
    poePage,
  }) => {
    await poePage.openTabbedFilter();
    await poePage.setFilterValuePercent("price", "lower", 10);
    await poePage.setFilterValuePercent("price", "upper", 90);
    await poePage.verifyFilterChipVisible("price");
    const before = await poePage.getFilterRange("price");
    expect(before.max).toBeDefined();

    const resetLower = await poePage.getLowerBoundResetButton("price");
    await expect(resetLower).toBeVisible();
    await resetLower.click();

    const after = await poePage.getFilterRange("price");
    expect(after.min).toBeUndefined();
    expect(after.max).toBe(before.max);
    await poePage.closeTabbedFilter();
  });
});
