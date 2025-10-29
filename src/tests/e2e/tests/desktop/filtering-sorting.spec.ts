import { expect, test } from "@playwright/test";
import { PoEDisenchantPage } from "../../poe-page";
import type { TestItem } from "../../types";

let poePage: PoEDisenchantPage;
let initialItems: TestItem[];

test.beforeEach(async ({ page }) => {
  poePage = new PoEDisenchantPage(page);
  await poePage.setup();

  // Get items for tests
  initialItems = await poePage.getTestItems(10);
  expect(initialItems.length).toBe(10);
});

test.describe("Name Filter Functionality", () => {
  test.describe("Positive Testing", () => {
    test("should filter by exact item name", async () => {
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

    test("should filter by partial item name", async () => {
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

    test("should filter case-insensitively", async () => {
      const targetItem = initialItems[0];
      const uppercaseName = targetItem.name.toUpperCase();

      await poePage.setNameFilter(uppercaseName);
      await poePage.waitForFilterDebounce();

      await poePage.verifyItemDisplayed(targetItem.name);
    });

    test("should filter items with special characters", async () => {
      // Find an item with special characters or create a test
      const specialCharItems = initialItems.filter(
        (item) => /[^\w\s]/.test(item.name) || /\s/.test(item.name),
      );

      if (specialCharItems.length === 0) {
        test.skip(true, "No items with special characters found");
        return;
      }

      const targetItem = specialCharItems[0];
      await poePage.setNameFilter(targetItem.name);
      await poePage.waitForFilterDebounce();

      await poePage.verifyItemDisplayed(targetItem.name, true);
    });

    test("should show filter chip when active", async () => {
      // No filter chip by default
      await poePage.verifyFilterChipVisible("name", false);

      const targetItem = initialItems[0];
      await poePage.setNameFilter(targetItem.name);
      await poePage.waitForFilterDebounce();

      await poePage.verifyFilterChipVisible("name");
    });

    test("should clear filter using clear button", async () => {
      const targetItem = initialItems[0];
      await poePage.setNameFilter(targetItem.name);
      await poePage.waitForFilterDebounce();

      await poePage.clearNameFilter();
      await poePage.waitForFilterDebounce();

      await poePage.verifyNoNameFilterActive();
    });

    test("should handle multiple filter changes sequentially", async () => {
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

    test("should maintain filter state during sort operations", async () => {
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

    test("should maintain focus during filter operations", async () => {
      await poePage.nameFilterInput.focus();
      await expect(poePage.nameFilterInput).toBeFocused();

      const targetItem = initialItems[0];
      await poePage.setNameFilter(targetItem.name);
      await poePage.waitForFilterDebounce();

      // Focus should be maintained in the input
      await expect(poePage.nameFilterInput).toBeFocused();
    });

    test("should apply filter within 500ms", async () => {
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
    test("should handle empty filter input gracefully", async () => {
      await poePage.setNameFilter("");
      await poePage.waitForFilterDebounce();

      // Should show all items
      await poePage.verifyNoNameFilterActive();

      // Verify at least some initial items are still visible
      await poePage.verifyItemsDisplayed(initialItems.map((i) => i.name));
    });

    test("should handle whitespace-only filter", async () => {
      await poePage.setNameFilter("   ");
      await poePage.waitForFilterDebounce();

      // Should be treated as empty filter
      await expect(poePage.nameFilterChip).not.toBeVisible();
      await poePage.verifyItemsDisplayed(initialItems.map((i) => i.name));
    });

    test("should handle non-matching filter gracefully", async () => {
      const nonExistentFilter = "ThisItemDefinitelyDoesNotExist12345";

      await poePage.setNameFilter(nonExistentFilter);
      await poePage.waitForFilterDebounce();

      // Should show no results
      await poePage.verifyNoItemsDisplayed();
    });

    test("should handle very long filter string", async () => {
      const longFilter = "a".repeat(1000);

      await poePage.setNameFilter(longFilter);
      await poePage.waitForFilterDebounce();

      await poePage.verifyNoConsoleErrors();
      await poePage.verifyNoItemsDisplayed();
    });

    test("should handle special characters in filter", async () => {
      const specialCharFilter = "!@#$%^&*(){}[]|\\:;\"'<>?,./";

      await poePage.setNameFilter(specialCharFilter);
      await poePage.waitForFilterDebounce();

      await poePage.verifyNoConsoleErrors();
      await poePage.verifyNoItemsDisplayed();
    });

    test("should handle rapid input changes", async () => {
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

    test("should handle filter with leading/trailing spaces", async () => {
      const targetItem = initialItems[0];
      const spacedFilter = `  ${targetItem.name}  `;

      await poePage.setNameFilter(spacedFilter);
      await poePage.waitForFilterDebounce();

      // Should still match (trimmed internally)
      await poePage.verifyItemDisplayed(targetItem.name);
    });
  });
});

test.describe("Price Filter Functionality", () => {
  test("should open and close price filter popover", async () => {
    await poePage.openPriceFilter();
    await expect(poePage.priceFilterPopover).toBeVisible();

    await poePage.closePriceFilter();
    await expect(poePage.priceFilterPopover).not.toBeVisible();
  });

  test("should close price filter popover with escape key", async () => {
    await poePage.openPriceFilter();
    await expect(poePage.priceFilterPopover).toBeVisible();

    await poePage.page.keyboard.press("Escape");
    await expect(poePage.priceFilterPopover).not.toBeVisible();
  });

  test("should close price filter popover with outside click", async () => {
    await poePage.openPriceFilter();
    await expect(poePage.priceFilterPopover).toBeVisible();

    await poePage.page.locator("body").click();
    await poePage.page.waitForTimeout(200);

    await expect(poePage.priceFilterPopover).not.toBeVisible();
  });

  test("should set lower bound price filter value", async () => {
    await poePage.verifyFilterChipVisible("price", false);
    await poePage.setPriceFilterValuePercent("lower", 50);
    await poePage.verifyFilterChipVisible("price", true);
  });

  test("should set upper bound price filter value", async () => {
    await poePage.verifyFilterChipVisible("price", false);
    await poePage.setPriceFilterValuePercent("upper", 50);
    await poePage.verifyFilterChipVisible("price", true);
  });

  test("should set both bounds price filter value", async () => {
    await poePage.verifyFilterChipVisible("price", false);
    await poePage.setPriceFilterValuePercent("lower", 50);
    await poePage.verifyFilterChipVisible("price", true);

    const range = await poePage.getPriceFilterRange();
    expect(range.max).toBe(500);

    await poePage.setPriceFilterValuePercent("upper", 50);
    await poePage.verifyFilterChipVisible("price", true);

    const rangeBoth = await poePage.getPriceFilterRange();
    expect(rangeBoth.min).toBe(range.min);
    expect(rangeBoth.max).not.toBe(range.max);
  });

  test("should reset price filter to default with reset button", async () => {
    await poePage.setPriceFilterValuePercent("lower", 50);
    await poePage.verifyFilterChipVisible("price", true);

    await poePage.resetPriceFilter();
    await poePage.verifyFilterChipVisible("price", false);
  });

  test("should maintain price filter during name filter changes", async () => {
    // Set price filter first
    await poePage.setPriceFilterValuePercent("lower", 50);
    await poePage.verifyFilterChipVisible("price", true);

    // Apply name filter
    const targetItem = initialItems[0];
    await poePage.setNameFilter(targetItem.name);
    await poePage.page.waitForTimeout(500);

    // Verify price filter is still active
    await poePage.verifyFilterChipVisible("price", true);
  });
});

test.describe("Column Sorting Functionality", () => {
  test("should sort by Dust / Chaos column in descending order by default", async () => {
    await poePage.verifyColumnSorted("Dust / Chaos", "desc");
  });

  test("should sort columns in ascending and order", async () => {
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

  test("should cycle through sort states", async () => {
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
