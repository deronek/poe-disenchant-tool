import { expect, test } from "../../fixtures";

test("should display correct column headers", async ({ poePage }) => {
  const headers = await poePage.getColumnHeaderNames();

  // Expected headers based on columns.tsx
  const expectedHeaders = [
    "Name",
    "Price",
    "Dust Value",
    "Dust / Chaos",
    "Dust / Chaos / Slot",
    "Gold Fee",
    "Trade Link",
    "Mark",
  ];

  expect(headers).toHaveLength(expectedHeaders.length);
  expectedHeaders.forEach((header) => {
    expect(headers).toContain(header);
  });
});

test.describe("Data Rendering and Formatting", () => {
  // Define all numerical columns to test
  const numericalColumns = [
    "Price",
    "Dust Value",
    "Dust / Chaos",
    "Dust / Chaos / Slot",
    "Gold Fee",
  ];
  test.describe("Table Value Display", () => {
    numericalColumns.forEach((column) => {
      test(`should display table value correctly for ${column} column`, async ({
        poePage,
      }) => {
        const items = await poePage.getTestItems(10);
        expect(items.length).toBe(10);

        for (const item of items) {
          const data = await poePage.getFullValueAndDisplayedTextForCell(
            item.name,
            column,
          );

          // Verify displayed table value exists and is properly formatted
          expect(data.displayed).toBeTruthy();
          expect(data.displayed).toMatch(/[0-9]+(\.[0-9]+)?[KMBkmb]?/); // possibly with compact suffix

          // Verify full value is a valid number greater than 0
          expect(data.full).toBeGreaterThan(0);
          expect(data.full).not.toBeNaN();

          // Parse compact value and compare to full value with tolerance
          expect(
            poePage.compareCompactAndFullValues(data.displayed, data.full),
          ).toBeTruthy();
        }
      });
    });
  });
  test.describe("Compact Number Display", () => {
    numericalColumns
      .filter((col) => col !== "Price") // Price handled in separate test due to custom divine/chaos logic
      .forEach((column) => {
        test(`should show tooltips on compact numbers for ${column} column`, async ({
          poePage,
        }) => {
          // Sort by descending to find highest values (most likely to be compact)
          await poePage.sortByColumn(column, "desc");
          let compactTested = false;
          const items = await poePage.getTestItems(10);

          for (const item of items) {
            const data = await poePage.getFullValueAndDisplayedTextForCell(
              item.name,
              column,
            );

            // Skip non-compact numbers
            if (!data.displayed.match(/[KMBkmb]/)) {
              continue;
            }

            compactTested = true;
            const colIndex = await poePage.getColumnIndex(column);
            const cell = poePage.page
              .locator("tr")
              .filter({ hasText: item.name })
              .locator("td")
              .nth(colIndex);

            const compactNumber = cell.locator("[data-full-value]");
            await compactNumber.hover();

            const tooltip = poePage.page.locator("[role='tooltip']").first();
            await expect(tooltip).toBeVisible();

            const tooltipText = await tooltip.innerText();
            expect(tooltipText).toMatch(/[0-9,]+(\.[0-9]+)?/);

            const tooltipValue = Number.parseFloat(
              tooltipText.replace(/,/g, ""),
            );
            expect(tooltipValue).toBe(data.full);

            // Remove hover and wait for tooltip to disappear
            await poePage.pageTitle.click();
            await expect(tooltip).not.toBeVisible({ timeout: 500 });
          }

          // We needed to test at least one tooltip in that column
          expect(compactTested).toBeTruthy();
        });
        test(`should not show tooltips on non-compact numbers for ${column} column`, async ({
          poePage,
        }) => {
          // Sort by ascending to find lowest values (most likely to be non-compact)
          await poePage.sortByColumn(column, "asc");
          let nonCompactTested = false;
          const items = await poePage.getTestItems(10);

          for (const item of items) {
            const data = await poePage.getFullValueAndDisplayedTextForCell(
              item.name,
              column,
            );

            // Skip compact numbers
            if (data.displayed.match(/[KMBkmb]/)) {
              continue;
            }

            nonCompactTested = true;
            const colIndex = await poePage.getColumnIndex(column);
            const cell = poePage.page
              .locator("tr")
              .filter({ hasText: item.name })
              .locator("td")
              .nth(colIndex);

            const compactNumber = cell.locator("[data-full-value]");
            await compactNumber.hover();

            const tooltip = poePage.page.locator("[role='tooltip']").first();
            await expect(tooltip).not.toBeVisible({ timeout: 1000 });

            // Remove hover and wait for the potential tooltip to disappear
            await poePage.pageTitle.click();
            await expect(tooltip).not.toBeVisible({ timeout: 500 });
          }

          // If we didn't test any compact numbers, mark test as skipped
          // e.g. Dust Value column doesn't have such small values
          test.skip(
            !nonCompactTested,
            `No non-compact numbers found for ${column} column`,
          );
        });
      });
  });

  test("should display correct divine/chaos price tooltips", async ({
    poePage,
  }) => {
    // Sort price column descending to get high values (more likely to be in divine format)
    await poePage.sortByColumn("Price", "desc");

    const items = await poePage.getTestItems(10);
    let compactTested = false;

    for (const item of items) {
      const colIndex = await poePage.getColumnIndex("Price");
      const cell = poePage.page
        .locator("tr")
        .filter({ hasText: item.name })
        .locator("td")
        .nth(colIndex);

      const compactNumber = cell.locator("[data-full-value]");
      await compactNumber.hover();

      const tooltip = poePage.page
        .locator("[data-slot='tooltip-content']")
        .first();
      await expect(tooltip).toBeVisible();

      // Check if the price is compact (has K/M/B suffix)
      const priceData = await poePage.getFullValueAndDisplayedTextForCell(
        item.name,
        "Price",
      );
      const isCompactPrice = /[KMBkmb]/.test(priceData.displayed);

      if (isCompactPrice) {
        compactTested = true;
        // Check if tooltip contains both divine and chaos info
        const tooltipText = await tooltip.innerText();
        expect(tooltipText).toMatch(/[0-9,]+(\.[0-9]+)?/);

        // Check if divine pricing is active (cell contains DivineOrbIcon)
        const hasDivineIcon =
          (await cell.locator("img[alt='Divine Orb']").count()) > 0;

        if (hasDivineIcon) {
          // If divine pricing is active, tooltip may show both prices (if divine is compact)
          // or just chaos price (if divine is not compact)

          // Check for both currency icons in tooltip
          const hasDivineIconInTooltip =
            (await tooltip.locator("img[alt='Divine Orb']").count()) > 0;
          const hasChaosIconInTooltip =
            (await tooltip.locator("img[alt='Chaos Orb']").count()) > 0;

          if (hasDivineIconInTooltip) {
            // Divine pricing active and divine value is compact - tooltip shows both divine and chaos values
            expect(hasChaosIconInTooltip).toBeTruthy();
            const numericMatches = tooltipText.match(/[0-9,]+(\.[0-9]+)?/g);
            expect(numericMatches).toBeDefined();
            expect(numericMatches!.length).toBeGreaterThanOrEqual(2);
            // Compare actual values
            const matches = numericMatches!;
            const divineStr = matches[0].replace(/,/g, "");
            const chaosStr = matches[1].replace(/,/g, "");
            const divineValue = Number.parseFloat(divineStr);
            // Compare chaos value from tooltip with full chaos from cell
            expect(
              poePage.compareCompactAndFullValues(chaosStr, priceData.full),
            ).toBeTruthy();
            // Compare divine value from tooltip with compact divine from cell
            expect(
              poePage.compareCompactAndFullValues(
                priceData.displayed,
                divineValue,
              ),
            ).toBeTruthy();
          } else {
            // Divine pricing active but divine value not compact - tooltip shows only chaos value
            expect(hasChaosIconInTooltip).toBeTruthy();
            const numericMatches = tooltipText.match(/[0-9,]+(\.[0-9]+)?/g);
            expect(numericMatches).toBeDefined();
            expect(numericMatches!.length).toBeGreaterThanOrEqual(1);
            // Compare actual values
            const matches = numericMatches!;
            const chaosStr = matches[0].replace(/,/g, "");
            expect(
              poePage.compareCompactAndFullValues(chaosStr, priceData.full),
            ).toBeTruthy();
          }
        } else {
          // No divine pricing - tooltip should show chaos value
          const numericMatches = tooltipText.match(/[0-9,]+(\.[0-9]+)?/g);
          expect(numericMatches).toBeDefined();
          expect(numericMatches!.length).toBeGreaterThanOrEqual(1);
        }
      }
      // Remove hover and wait for the tooltip to disappear
      await poePage.pageTitle.click();
      await expect(tooltip).not.toBeVisible({ timeout: 500 });
    }
    // We needed to test at least one compact price
    expect(compactTested).toBeTruthy();
  });

  test("should display qualityType for all items", async ({ poePage }) => {
    const items = await poePage.getTestItems(10);
    expect(items.length).toBeGreaterThan(0);

    for (const item of items) {
      // Verify that qualityType is present and is a valid value (q20/q0)
      expect(item.qualityType).toMatch(/^(q20|q0)$/);
    }
  });
});

test.describe("Pagination Functionality", () => {
  test("should display pagination controls", async ({ poePage }) => {
    // Check for pagination container
    await expect(poePage.paginationContainer).toBeVisible();

    // Check for pagination summary and page indicator
    await expect(poePage.paginationSummary).toBeVisible();
    await expect(poePage.pageIndicator).toBeVisible();

    // Check for page navigation buttons
    await expect(poePage.prevPageButton).toBeVisible();
    await expect(poePage.nextPageButton).toBeVisible();

    // Check for page size selector
    await expect(poePage.rowsPerPageSelectTrigger).toBeVisible();
  });

  test("should load the first page by default", async ({ poePage }) => {
    // Prev and first button disabled
    await expect(poePage.firstPageButton).toBeDisabled();
    await expect(poePage.prevPageButton).toBeDisabled();
    await expect(poePage.nextPageButton).toBeEnabled();
    await expect(poePage.lastPageButton).toBeEnabled();

    // Verify default pagination state
    const paginationInfo = await poePage.getPaginationInfo();
    expect(paginationInfo.start).toBe(1);
    expect(paginationInfo.end).toBe(10);
    expect(paginationInfo.currentPage).toBe(1);
    expect(paginationInfo.rowsPerPage).toBe(10);

    expect(paginationInfo.total).toBeGreaterThanOrEqual(1);
    expect(paginationInfo.totalPages).toBeGreaterThanOrEqual(1);
  });

  test("should show correct page size options", async ({ poePage }) => {
    const pageSizeOptions = await poePage.getPageSizeOptions();

    expect(pageSizeOptions).toContain(10);
    expect(pageSizeOptions).toContain(20);
    expect(pageSizeOptions).toContain(30);
    expect(pageSizeOptions).toContain(40);
    expect(pageSizeOptions).toContain(50);
  });

  test("should navigate using all pagination buttons correctly", async ({
    poePage,
  }) => {
    // Get initial state
    const initialState = await poePage.getPaginationInfo();
    const initialItems = await poePage.getTestItems(10);

    // Test "Go to next page" button
    const nextButton = poePage.nextPageButton;
    await nextButton.click();
    await poePage.page.waitForTimeout(300); // Wait for pagination update

    const nextState = await poePage.getPaginationInfo();
    const nextItems = await poePage.getTestItems(10);
    expect(nextState.start).toBe(initialState.start + nextState.rowsPerPage);
    expect(nextState.end).toBe(initialState.end + nextState.rowsPerPage);
    expect(nextState.total).toBe(initialState.total);
    expect(nextState.currentPage).toBe(initialState.currentPage + 1);
    expect(nextState.totalPages).toBe(initialState.totalPages);
    expect(nextState.rowsPerPage).toBe(initialState.rowsPerPage);
    expect(nextItems).not.toEqual(initialItems);

    // Test "Go to previous page" button
    const prevButton = poePage.prevPageButton;
    await prevButton.click();
    await poePage.page.waitForTimeout(300);

    const prevState = await poePage.getPaginationInfo();
    const prevItems = await poePage.getTestItems(10);
    expect(prevState.start).toBe(initialState.start);
    expect(prevState.end).toBe(initialState.end);
    expect(prevState.total).toBe(initialState.total);
    expect(prevState.currentPage).toBe(initialState.currentPage);
    expect(prevState.totalPages).toBe(initialState.totalPages);
    expect(prevState.rowsPerPage).toBe(initialState.rowsPerPage);
    expect(prevItems).toEqual(initialItems);

    // Test "Go to last page" button
    const lastButton = poePage.lastPageButton;
    await lastButton.click();
    await poePage.page.waitForTimeout(300);

    const lastState = await poePage.getPaginationInfo();
    const lastItems = await poePage.getTestItems(10);
    expect(lastState.start).toBeGreaterThan(initialState.start);
    expect(lastState.end).toBeGreaterThan(initialState.end);
    expect(lastState.total).toBe(initialState.total);
    expect(lastState.currentPage).toBeGreaterThan(initialState.currentPage);
    expect(lastState.totalPages).toBe(initialState.totalPages);
    expect(lastState.rowsPerPage).toBe(initialState.rowsPerPage);
    expect(lastItems).not.toEqual(initialItems);

    expect(lastState.end).toBe(lastState.total);
    expect(lastState.currentPage).toBe(lastState.totalPages);

    // Test "Go to first page" button
    const firstButton = poePage.firstPageButton;
    await firstButton.click();
    await poePage.page.waitForTimeout(300);

    const firstState = await poePage.getPaginationInfo();
    const firstItems = await poePage.getTestItems(10);
    expect(firstState.start).toBe(1);
    expect(firstState.end).toBe(10);
    expect(firstState.total).toBe(initialState.total);
    expect(firstState.currentPage).toBe(1);
    expect(firstState.totalPages).toBe(initialState.totalPages);
    expect(firstItems).toEqual(initialItems);
  });

  test("should update displayed items when rows-per-page changes", async ({
    poePage,
  }) => {
    // Change page size to a different value
    const pageSizeSelect = poePage.rowsPerPageSelectTrigger;
    await pageSizeSelect.click();
    await poePage.page.waitForTimeout(200);

    // Select a different page size (e.g. 20)
    const newPageSizeOption =
      poePage.rowsPerPageSelectContent.locator('[data-value="20"]');
    await newPageSizeOption.click();
    await poePage.page.waitForTimeout(300); // Wait for pagination update

    // Verify pagination info updated
    const updatedInfo = await poePage.getPaginationInfo();
    expect(updatedInfo.start).toBe(1);
    expect(updatedInfo.end).toBe(20);

    // Verify table rows updated accordingly
    const updatedRowCount = await poePage.page.locator("tbody tr").count();
    expect(updatedRowCount).toBe(20);
  });

  test("should persist page size across page refreshes", async ({
    poePage,
  }) => {
    // Change page size to a different value (e.g., 20)
    const pageSizeSelect = poePage.rowsPerPageSelectTrigger;
    await pageSizeSelect.click();
    await poePage.page.waitForTimeout(200);

    // Select page size 20
    const newPageSizeOption =
      poePage.rowsPerPageSelectContent.locator('[data-value="20"]');
    await newPageSizeOption.click();
    await poePage.page.waitForTimeout(300);

    // Verify the page size changed
    const pageSize = await poePage.getCurrentPageSize();
    expect(pageSize).toBe(20);

    // Refresh the page
    await poePage.refreshPage();
    await poePage.page.waitForTimeout(300);

    // Verify page size is persisted after refresh
    const newPageSize = await poePage.getCurrentPageSize();
    expect(newPageSize).toBe(20);

    // Verify the correct number of rows are displayed
    const rowCount = await poePage.page.locator("tbody tr").count();
    expect(rowCount).toBe(20);
  });

  test("should persist page size across league changes", async ({
    poePage,
  }) => {
    // Change page size to a different value (e.g., 30)
    const pageSizeSelect = poePage.rowsPerPageSelectTrigger;
    await pageSizeSelect.click();
    await poePage.page.waitForTimeout(200);

    // Select page size 30
    const newPageSizeOption =
      poePage.rowsPerPageSelectContent.locator('[data-value="30"]');
    await newPageSizeOption.click();
    await poePage.page.waitForTimeout(300);

    // Verify the page size changed
    const pageSize = await poePage.getCurrentPageSize();
    expect(pageSize).toBe(30);

    // Verify the correct number of rows are displayed
    const rowCount = await poePage.page.locator("tbody tr").count();
    expect(rowCount).toBe(30);

    // Navigate to a different league
    const newLeague = "standard";
    await poePage.selectLeague(newLeague);
    await poePage.verifyLeagueSelected(newLeague);

    // Verify page size is persisted across leagues
    const newPageSize = await poePage.getCurrentPageSize();
    expect(newPageSize).toBe(30);

    // Verify the correct number of rows are displayed
    const newRowCount = await poePage.page.locator("tbody tr").count();
    expect(newRowCount).toBe(30);
  });

  test("should keep the current page when trade settings change", async ({
    poePage,
  }) => {
    // Navigate to a non-first page
    await poePage.nextPageButton.click();
    await expect
      .poll(async () => (await poePage.getPaginationInfo()).currentPage)
      .toBeGreaterThan(1);
    const stateBefore = await poePage.getPaginationInfo();

    // Change a trade setting
    await poePage.openAdvancedSettings();
    await poePage.setMinItemLevel(72);
    // Deterministic: confirm the new value propagated before closing the panel
    await expect(poePage.minItemLevelValue).toHaveText("72");
    await poePage.closeAdvancedSettings();

    // The same page should still be selected
    await expect
      .poll(async () => (await poePage.getPaginationInfo()).currentPage)
      .toBe(stateBefore.currentPage);

    const stateAfter = await poePage.getPaginationInfo();
    expect(stateAfter.rowsPerPage).toBe(stateBefore.rowsPerPage);
  });

  test("should reset to first page when a filter is applied", async ({
    poePage,
  }) => {
    // Navigate to a non-first page
    await poePage.nextPageButton.click();
    await expect
      .poll(async () => (await poePage.getPaginationInfo()).currentPage)
      .toBeGreaterThan(1);

    // Apply a name filter that reduces the row count
    const items = await poePage.getTestItems(1);
    await poePage.setNameFilter(items[0].name);

    // Deterministic: wait for the reset
    await expect
      .poll(async () => (await poePage.getPaginationInfo()).currentPage)
      .toBe(1);
  });
});
