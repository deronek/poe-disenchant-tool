import { expect, testVrt as test } from "../e2e/fixtures";

test.describe("Filters - Desktop", () => {
  test("price filter open", async ({ poePage }) => {
    await poePage.openTabbedFilter();
    await poePage.switchToTab("price");
    await expect(poePage.tabbedFilterPopover).toHaveScreenshot(
      "price-filter-open.png",
    );

    await poePage.setFilterValuePercent("price", "lower", 50);
    await poePage.setFilterValuePercent("price", "upper", 50);
    await expect(poePage.tabbedFilterPopover).toHaveScreenshot(
      "price-filter-active.png",
    );
  });

  test("dust filter open", async ({ poePage }) => {
    await poePage.openTabbedFilter();
    await poePage.switchToTab("dust");
    await expect(poePage.tabbedFilterPopover).toHaveScreenshot(
      "dust-filter-open.png",
    );

    await poePage.setFilterValuePercent("dust", "lower", 50);
    await poePage.setFilterValuePercent("dust", "upper", 50);
    await expect(poePage.tabbedFilterPopover).toHaveScreenshot(
      "dust-filter-active.png",
    );
  });

  test("gold filter open", async ({ poePage }) => {
    await poePage.openTabbedFilter();
    await poePage.switchToTab("gold");
    await expect(poePage.tabbedFilterPopover).toHaveScreenshot(
      "gold-filter-open.png",
    );

    await poePage.setFilterValuePercent("gold", "lower", 50);
    await poePage.setFilterValuePercent("gold", "upper", 50);
    await expect(poePage.tabbedFilterPopover).toHaveScreenshot(
      "gold-filter-active.png",
    );
  });

  test("name filter active", async ({ poePage }) => {
    await poePage.setNameFilter("Mageblood");
    await poePage.waitForFilterDebounce();
    await expect(poePage.leagueTable).toHaveScreenshot(
      "name-filter-active.png",
      {
        maxDiffPixelRatio: 0.01,
      },
    );
  });

  test("all filters active", async ({ poePage }) => {
    // Set name filter
    await poePage.setNameFilter("Yoke of Suffering");
    await poePage.waitForFilterDebounce();

    // Set other filters
    await poePage.openTabbedFilter();
    await poePage.setAllFilters();
    await poePage.closeTabbedFilter();

    await expect(poePage.leagueTable).toHaveScreenshot(
      "all-filters-active.png",
    );
  });
});
