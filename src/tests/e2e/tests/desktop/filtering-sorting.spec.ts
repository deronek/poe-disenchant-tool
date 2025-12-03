import type { TestItem } from "../../types";
import { expect, test } from "../../fixtures";

let initialItems: TestItem[];

test.beforeEach(async ({ poePage }) => {
  // Get items for tests
  initialItems = await poePage.getTestItems(10);
  expect(initialItems.length).toBe(10);
});

test.describe("Name Filter Functionality", () => {
  test.describe("Positive Testing", () => {
    test("should filter by exact item name", async ({ poePage }) => {
      const targetItem = initialItems[0];
      expect(targetItem.name).toBeTruthy();

      await poePage.setNameFilter(targetItem.name);
      await poePage.waitForFilterDebounce();

      // Verify target item is still visible
      await poePage.verifyItemDisplayed(targetItem.name);

      // Verify other items are filtered out (if any exist with different names)
      const otherItems = initialItems.filter(
        (item) => item.name !== targetItem.name,
      );
      if (otherItems.length > 0) {
        await poePage.verifyItemDisplayed(otherItems[0].name, false);
      }
    });

    test("should filter by partial item name", async ({ poePage }) => {
      const targetItem = initialItems[0];
      const partialName = targetItem.name.substring(
        0,
        Math.min(3, targetItem.name.length),
      );
      expect(partialName.length).toBeGreaterThanOrEqual(2);

      await poePage.setNameFilter(partialName);
      await poePage.waitForFilterDebounce();

      await poePage.verifyItemDisplayed(targetItem.name);
    });

    test("should filter case-insensitively", async ({ poePage }) => {
      const targetItem = initialItems[0];
      const uppercaseName = targetItem.name.toUpperCase();

      await poePage.setNameFilter(uppercaseName);
      await poePage.waitForFilterDebounce();

      await poePage.verifyItemDisplayed(targetItem.name);
    });

    test("should filter items with special characters", async ({ poePage }) => {
      // Find an item with special characters or create a test
      const specialCharItems = initialItems.filter(
        (item) => /[^\w\s]/.test(item.name) || /\s/.test(item.name),
      );

      test.skip(
        specialCharItems.length === 0,
        "No items with special characters found",
      );

      const targetItem = specialCharItems[0];
      await poePage.setNameFilter(targetItem.name);
      await poePage.waitForFilterDebounce();

      await poePage.verifyItemDisplayed(targetItem.name, true);
    });

    test("should show filter chip when active", async ({ poePage }) => {
      // No filter chip by default
      await poePage.verifyFilterChipVisible("name", false);

      const targetItem = initialItems[0];
      await poePage.setNameFilter(targetItem.name);
      await poePage.waitForFilterDebounce();

      await poePage.verifyFilterChipVisible("name");
    });

    test("should clear filter using clear button", async ({ poePage }) => {
      const targetItem = initialItems[0];
      await poePage.setNameFilter(targetItem.name);
      await poePage.waitForFilterDebounce();

      await poePage.clearNameFilter();
      await poePage.waitForFilterDebounce();

      await poePage.verifyNoNameFilterActive();
    });

    test("should handle multiple filter changes sequentially", async ({
      poePage,
    }) => {
      const items = initialItems.slice(0, 3);

      // Filter by first item
      await poePage.setNameFilter(items[0].name);
      await poePage.waitForFilterDebounce();
      await poePage.verifyItemDisplayed(items[0].name);

      // Change filter to second item
      await poePage.setNameFilter(items[1].name);
      await poePage.waitForFilterDebounce();
      await poePage.verifyItemDisplayed(items[1].name);

      // Clear filter
      await poePage.clearNameFilter();
      await poePage.waitForFilterDebounce();
      await poePage.verifyNoNameFilterActive();

      // Verify all items are visible again
      await poePage.verifyItemsDisplayed(
        items.map((i) => i.name),
        true,
      );
    });

    test("should maintain filter state during sort operations", async ({
      poePage,
    }) => {
      const targetItem = initialItems[0];
      const filterValue = targetItem.name.substring(0, 3);

      // Apply filter
      await poePage.setNameFilter(filterValue);
      await poePage.waitForFilterDebounce();

      // Apply sort
      await poePage.sortByColumn("Price", "asc");
      await poePage.waitForFilterDebounce();

      // Verify filter still active
      await expect(poePage.nameFilterInput).toHaveValue(filterValue);
      await poePage.verifyFilterChipVisible("name");
    });

    test("should maintain focus during filter operations", async ({
      poePage,
    }) => {
      await poePage.nameFilterInput.focus();
      await expect(poePage.nameFilterInput).toBeFocused();

      const targetItem = initialItems[0];
      await poePage.setNameFilter(targetItem.name);
      await poePage.waitForFilterDebounce();

      // Focus should be maintained in the input
      await expect(poePage.nameFilterInput).toBeFocused();
    });

    test("should apply filter within 500ms", async ({ poePage }) => {
      const startTime = performance.now();
      const targetItem = initialItems[0];

      await poePage.setNameFilter(targetItem.name);
      await poePage.verifyFilterChipVisible("name");

      const endTime = performance.now();
      const filterTime = endTime - startTime;

      expect(filterTime).toBeLessThan(500);
    });
  });

  test.describe("Negative Testing", () => {
    test("should handle empty filter input gracefully", async ({ poePage }) => {
      await poePage.setNameFilter("");
      await poePage.waitForFilterDebounce();

      // Should show all items
      await poePage.verifyNoNameFilterActive();

      // Verify at least some initial items are still visible
      await poePage.verifyItemsDisplayed(initialItems.map((i) => i.name));
    });

    test("should handle whitespace-only filter", async ({ poePage }) => {
      await poePage.setNameFilter("   ");
      await poePage.waitForFilterDebounce();

      // Should be treated as empty filter
      await expect(poePage.nameFilterChip).not.toBeVisible();
      await poePage.verifyItemsDisplayed(initialItems.map((i) => i.name));
    });

    test("should handle non-matching filter gracefully", async ({
      poePage,
    }) => {
      const nonExistentFilter = "ThisItemDefinitelyDoesNotExist12345";

      await poePage.setNameFilter(nonExistentFilter);
      await poePage.waitForFilterDebounce();

      // Should show no results
      await poePage.verifyNoItemsDisplayed();
    });

    test("should handle very long filter string", async ({ poePage }) => {
      const longFilter = "a".repeat(1000);

      await poePage.setNameFilter(longFilter);
      await poePage.waitForFilterDebounce();

      // Verify that only 50 characters are actually in the input
      const actualFilterValue = await poePage.getNameFilterValue();
      expect(actualFilterValue.length).toBe(50);
      expect(actualFilterValue).toBe("a".repeat(50));

      await poePage.verifyNoConsoleErrors();
      await poePage.verifyNoItemsDisplayed();
    });

    test("should handle special characters in filter", async ({ poePage }) => {
      const specialCharFilter = "!@#$%^&*(){}[]|\\:;\"'<>?,./";

      await poePage.setNameFilter(specialCharFilter);
      await poePage.waitForFilterDebounce();

      await poePage.verifyNoConsoleErrors();
      await poePage.verifyNoItemsDisplayed();
    });

    test("should handle rapid input changes", async ({ poePage }) => {
      const item = initialItems[0];
      const length = Math.min(5, item.name.length);
      const nameFragment = item.name.substring(0, length);

      // Rapidly type characters one by one
      for (let i = 1; i <= nameFragment.length; i++) {
        const partial = nameFragment.substring(0, i);
        await poePage.setNameFilter(partial);
        await poePage.page.waitForTimeout(50);

        // Filter chip not yet visible
        await poePage.verifyFilterChipVisible("name", false);
      }

      // Wait for debounce and check final state
      await poePage.waitForFilterDebounce();
      await poePage.verifyNoConsoleErrors();
      await poePage.verifyFilterChipVisible("name");
      await poePage.verifyItemDisplayed(item.name);
    });

    test("should handle filter with leading/trailing spaces", async ({
      poePage,
    }) => {
      const targetItem = initialItems[0];
      const spacedFilter = `  ${targetItem.name}  `;

      await poePage.setNameFilter(spacedFilter);
      await poePage.waitForFilterDebounce();

      // Should still match (trimmed internally)
      await poePage.verifyItemDisplayed(targetItem.name);
    });
  });
});

test.describe("Tabbed Filter Functionality", () => {
  test("should open and close tabbed filter popover", async ({ poePage }) => {
    await poePage.openTabbedFilter();
    await expect(poePage.tabbedFilterPopover).toBeVisible();

    await poePage.closeTabbedFilter();
    await expect(poePage.tabbedFilterPopover).not.toBeVisible();
  });

  test("should close tabbed filter popover with escape key", async ({
    poePage,
  }) => {
    await poePage.openTabbedFilter();
    await expect(poePage.tabbedFilterPopover).toBeVisible();

    await poePage.page.keyboard.press("Escape");
    await expect(poePage.tabbedFilterPopover).not.toBeVisible();
  });

  test("should close tabbed filter popover with outside click", async ({
    poePage,
  }) => {
    await poePage.openTabbedFilter();
    await expect(poePage.tabbedFilterPopover).toBeVisible();

    await poePage.page.locator("body").click();
    await expect(poePage.tabbedFilterPopover).not.toBeVisible();
  });

  test("should switch between price and dust value tabs", async ({
    poePage,
  }) => {
    await poePage.openTabbedFilter();

    // Verify price tab is active by default
    await poePage.verifyTabActive("price");
    await expect(poePage.priceTabTrigger).toHaveAttribute(
      "data-state",
      "active",
    );
    await expect(poePage.dustValueTabTrigger).toHaveAttribute(
      "data-state",
      "inactive",
    );

    // Switch to dust value tab
    await poePage.dustValueTabTrigger.click();
    await expect(poePage.dustValueTabTrigger).toHaveAttribute(
      "data-state",
      "active",
    );
    await expect(poePage.priceTabTrigger).toHaveAttribute(
      "data-state",
      "inactive",
    );

    // Switch back to price tab
    await poePage.priceTabTrigger.click();
    await expect(poePage.priceTabTrigger).toHaveAttribute(
      "data-state",
      "active",
    );
    await expect(poePage.dustValueTabTrigger).toHaveAttribute(
      "data-state",
      "inactive",
    );

    await poePage.closeTabbedFilter();
  });

  test("should maintain tab state when reopening popover", async ({
    poePage,
  }) => {
    await poePage.openTabbedFilter();
    await poePage.switchToTab("dustValue");
    await poePage.closeTabbedFilter();

    // Reopen and verify dust value tab is still active
    await poePage.openTabbedFilter();
    await poePage.verifyTabActive("dustValue");
    await poePage.closeTabbedFilter();
  });

  test("should reset all filters with reset all button", async ({
    poePage,
  }) => {
    await poePage.openTabbedFilter();
    // Set price filter
    await poePage.setPriceFilterValuePercent("lower", 50);
    await poePage.verifyFilterChipVisible("price", true);

    // Set dust filter
    await poePage.setDustFilterValuePercent("lower", 30);
    await poePage.verifyFilterChipVisible("dust", true);

    // Reset all
    await poePage.tabbedFilterResetAllButton.click();
    await poePage.verifyFilterChipVisible("price", false);
    await poePage.verifyFilterChipVisible("dust", false);
  });
});

test.describe("Price Filter Functionality", () => {
  test("should set lower bound price filter value", async ({ poePage }) => {
    await poePage.verifyFilterChipVisible("price", false);

    await poePage.openTabbedFilter();
    await poePage.setPriceFilterValuePercent("lower", 50);
    await poePage.verifyFilterChipVisible("price", true);
  });

  test("should set upper bound price filter value", async ({ poePage }) => {
    await poePage.verifyFilterChipVisible("price", false);

    await poePage.openTabbedFilter();
    await poePage.setPriceFilterValuePercent("upper", 50);
    await poePage.verifyFilterChipVisible("price", true);
  });

  test("should set both bounds price filter value", async ({ poePage }) => {
    await poePage.verifyFilterChipVisible("price", false);
    await poePage.openTabbedFilter();

    // 1) Set only lower bound (upper bound should be disabled / no max)
    await poePage.setPriceFilterValuePercent("lower", 50);
    await poePage.verifyFilterChipVisible("price", true);

    const lowerOnly = await poePage.getPriceFilterRange();
    expect(lowerOnly.min).toBeGreaterThan(0);
    expect(lowerOnly.max).toBeUndefined();

    // 2) Now set upper bound as well, creating a bounded range
    await poePage.setPriceFilterValuePercent("upper", 50);
    await poePage.verifyFilterChipVisible("price", true);

    const rangeBoth = await poePage.getPriceFilterRange();
    expect(rangeBoth.min).toBe(lowerOnly.min);
    expect(rangeBoth.max).toBeDefined();
    expect(rangeBoth.max).toBeLessThan(500);
  });

  test("should maintain price filter during name filter changes", async ({
    poePage,
  }) => {
    await poePage.openTabbedFilter();

    // Set price filter first
    await poePage.setPriceFilterValuePercent("lower", 50);
    await poePage.verifyFilterChipVisible("price", true);

    // Apply name filter
    const targetItem = initialItems[0];
    await poePage.setNameFilter(targetItem.name);
    await poePage.waitForFilterDebounce();

    // Verify price filter is still active
    await poePage.verifyFilterChipVisible("price", true);
  });

  test("should maintain price filter during dust value filter changes", async ({
    poePage,
  }) => {
    await poePage.openTabbedFilter();

    // Set price filter first
    await poePage.setPriceFilterValuePercent("lower", 50);
    await poePage.verifyFilterChipVisible("price", true);

    // Apply dust value filter
    await poePage.setDustFilterValuePercent("lower", 30);
    await poePage.verifyFilterChipVisible("dust", true);

    // Verify price filter is still active
    await poePage.verifyFilterChipVisible("price", true);
  });

  test("should persist price filter state after page refresh", async ({
    poePage,
  }) => {
    // Set a price filter
    await poePage.openTabbedFilter();
    await poePage.setPriceFilterValuePercent("lower", 50);
    await poePage.verifyFilterChipVisible("price", true);

    // Get the filter range before refresh
    const filterRangeBefore = await poePage.getPriceFilterRange();
    expect(filterRangeBefore.min).toBeDefined();
    expect(filterRangeBefore.min).toBeGreaterThan(0);

    // Refresh the page
    await poePage.refreshPage();

    // Verify the price filter is still active after refresh
    await poePage.verifyFilterChipVisible("price", true);

    // Verify the filter range is the same as before refresh
    const filterRangeAfter = await poePage.getPriceFilterRange();
    expect(filterRangeAfter.min).toBe(filterRangeBefore.min);
    expect(filterRangeAfter.max).toBe(filterRangeBefore.max);
  });
});

test.describe("Dust Value Filter Functionality", () => {
  test("should set lower bound dust value filter value", async ({
    poePage,
  }) => {
    await poePage.verifyFilterChipVisible("dust", false);
    await poePage.openTabbedFilter();

    await poePage.setDustFilterValuePercent("lower", 25);
    await poePage.verifyFilterChipVisible("dust", true);
  });

  test("should set upper bound dust value filter value", async ({
    poePage,
  }) => {
    await poePage.verifyFilterChipVisible("dust", false);
    await poePage.openTabbedFilter();

    await poePage.setDustFilterValuePercent("upper", 75);
    await poePage.verifyFilterChipVisible("dust", true);
  });

  test("should set both bounds dust value filter value", async ({
    poePage,
  }) => {
    await poePage.verifyFilterChipVisible("dust", false);
    await poePage.openTabbedFilter();

    // 1) Set only lower bound
    await poePage.setDustFilterValuePercent("lower", 25);
    await poePage.verifyFilterChipVisible("dust", true);

    const lowerOnly = await poePage.getDustFilterRange();
    expect(lowerOnly.min).toBeGreaterThan(2000); // Min dust value
    expect(lowerOnly.max).toBeUndefined();

    // 2) Now set upper bound as well, creating a bounded range
    await poePage.setDustFilterValuePercent("upper", 75);
    await poePage.verifyFilterChipVisible("dust", true);

    const rangeBoth = await poePage.getDustFilterRange();
    expect(rangeBoth.min).toBe(lowerOnly.min);
    expect(rangeBoth.max).toBeDefined();
    expect(rangeBoth.max).toBeLessThan(5000000); // Max dust value
  });

  test("should reset dust value filter to default with reset button", async ({
    poePage,
  }) => {
    await poePage.openTabbedFilter();

    await poePage.setDustFilterValuePercent("lower", 25);
    await poePage.verifyFilterChipVisible("dust", true);

    await poePage.resetDustFilter();
    await poePage.verifyFilterChipVisible("dust", false);
  });

  test("should maintain dust value filter during name filter changes", async ({
    poePage,
  }) => {
    await poePage.openTabbedFilter();

    // Set dust value filter first
    await poePage.setDustFilterValuePercent("lower", 25);
    await poePage.verifyFilterChipVisible("dust", true);

    // Apply name filter
    const targetItem = initialItems[0];
    await poePage.setNameFilter(targetItem.name);
    await poePage.waitForFilterDebounce();

    // Verify dust value filter is still active
    await poePage.verifyFilterChipVisible("dust", true);
  });

  test("should maintain dust value filter during price filter changes", async ({
    poePage,
  }) => {
    await poePage.openTabbedFilter();

    // Set dust value filter first
    await poePage.setDustFilterValuePercent("lower", 25);
    await poePage.verifyFilterChipVisible("dust", true);

    // Apply price filter
    await poePage.setPriceFilterValuePercent("lower", 50);
    await poePage.verifyFilterChipVisible("price", true);

    // Verify dust value filter is still active
    await poePage.verifyFilterChipVisible("dust", true);
  });

  test("should persist dust value filter state after page refresh", async ({
    poePage,
  }) => {
    // Set a dust value filter
    await poePage.openTabbedFilter();
    await poePage.setDustFilterValuePercent("lower", 25);
    await poePage.verifyFilterChipVisible("dust", true);

    // Get the filter range before refresh
    const filterRangeBefore = await poePage.getDustFilterRange();
    expect(filterRangeBefore.min).toBeDefined();
    expect(filterRangeBefore.min).toBeGreaterThan(2000);

    // Refresh the page
    await poePage.refreshPage();

    // Verify the dust value filter is still active after refresh
    await poePage.verifyFilterChipVisible("dust", true);

    // Verify the filter range is the same as before refresh
    const filterRangeAfter = await poePage.getDustFilterRange();
    expect(filterRangeAfter.min).toBe(filterRangeBefore.min);
    expect(filterRangeAfter.max).toBe(filterRangeBefore.max);
  });
});

test.describe("Column Sorting Functionality", () => {
  test("should sort by Dust / Chaos column in descending order by default", async ({
    poePage,
  }) => {
    await poePage.verifyColumnSorted("Dust / Chaos", "desc");
  });

  test("should sort columns in ascending and order", async ({ poePage }) => {
    test.slow();
    for (const column of poePage.numericalDataColumnHeaders) {
      await poePage.sortByColumn(column, "asc");
      await poePage.verifyColumnSorted(column, "asc");

      await poePage.sortByColumn(column, "desc");
      await poePage.verifyColumnSorted(column, "desc");
    }
    await poePage.sortByColumn("Name", "asc");
    await poePage.verifyColumnSorted("Name", "asc", "string");

    await poePage.sortByColumn("Name", "desc");
    await poePage.verifyColumnSorted("Name", "desc", "string");
  });

  test("should cycle through sort states", async ({ poePage }) => {
    // Click on Price column (should start desc)
    await poePage.sortByColumn("Price");
    await poePage.verifyColumnSorted("Price", "desc");

    // Click again (should cycle to asc)
    await poePage.sortByColumn("Price");
    await poePage.verifyColumnSorted("Price", "asc");

    // Click again (should cycle back to desc)
    await poePage.sortByColumn("Price");
    await poePage.verifyColumnSorted("Price", "desc");
  });
});
