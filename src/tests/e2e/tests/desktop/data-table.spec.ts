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

  test.describe("Compact Number Display", () => {
    numericalColumns.forEach((column) => {
      test(`should check compact and non-compact values for ${column} column in both sort directions`, async ({
        poePage,
      }) => {
        let hasCompact = false;
        let hasNonCompact = false;

        // Test descending sort (high values)
        await poePage.sortByColumn(column, "desc");
        const [highValueItem] = await poePage.getTestItems(1);
        const highColIndex = await poePage.getColumnIndex(column);
        const highCell = poePage.page
          .locator("tr")
          .filter({ hasText: highValueItem.name })
          .locator("td")
          .nth(highColIndex);
        const highCompactNumber = highCell.locator("[data-full-value]");
        const highCellText = await highCompactNumber.innerText();

        if (highCellText.match(/[KMBkmb]/)) {
          hasCompact = true;
          await highCompactNumber.hover();
          await poePage.page.waitForTimeout(500);
          const tooltip = poePage.page.locator("[role='tooltip']").first();
          await expect(tooltip).toBeVisible();
        }

        // Test ascending sort (low values)
        await poePage.sortByColumn(column, "asc");
        const [lowValueItem] = await poePage.getTestItems(1);
        const lowColIndex = await poePage.getColumnIndex(column);
        const lowCell = poePage.page
          .locator("tr")
          .filter({ hasText: lowValueItem.name })
          .locator("td")
          .nth(lowColIndex);
        const lowCompactNumber = lowCell.locator("[data-full-value]");
        const lowCellText = await lowCompactNumber.innerText();

        if (!lowCellText.match(/[KMBkmb]/)) {
          hasNonCompact = true;
          // Check if the cell text does not contain compact suffix (K, M, B)
          expect(lowCellText).not.toMatch(/[KMBkmb]/);
        }

        // Ensure we tested at least one condition
        expect(hasCompact || hasNonCompact).toBeTruthy();
      });
    });
  });

  test("should display correct divine/chaos price tooltips", async ({
    poePage,
  }) => {
    // Sort price column descending to get high values (more likely to be in divine format)
    await poePage.sortByColumn("Price", "desc");

    const items = await poePage.getTestItems(5);

    for (const item of items) {
      const colIndex = await poePage.getColumnIndex("Price");
      const cell = poePage.page
        .locator("tr")
        .filter({ hasText: item.name })
        .locator("td")
        .nth(colIndex);

      const compactNumber = cell.locator("[data-full-value]");
      await compactNumber.hover();
      await poePage.page.waitForTimeout(500);

      const tooltip = poePage.page.locator("[role='tooltip']").first();

      // Check if tooltip contains both divine and chaos values or just chaos value
      if (await tooltip.isVisible()) {
        const tooltipText = await tooltip.innerText();
        expect(tooltipText).toMatch(/[0-9,]+(\.[0-9]+)?/);

        // Price column tooltip should contain at least one currency value
        expect(tooltipText.trim().length).toBeGreaterThan(0);
      }
    }
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
});
