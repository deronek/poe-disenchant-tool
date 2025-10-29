import { test, expect } from "../../fixtures";

test("should display correct column headers", async ({ poePage }) => {
  const headers = await poePage.getColumnHeaderNames();

  // Expected headers based on columns.tsx
  const expectedHeaders = [
    "Name",
    "Price",
    "Dust Value",
    "Dust / Chaos",
    "Dust / Chaos / Slot",
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
  ];

  test("should display compact and full values correctly for all items and numerical columns", async ({
    poePage,
  }) => {
    const items = await poePage.getTestItems(10);
    expect(items.length).toBe(10);

    for (const item of items) {
      for (const column of numericalColumns) {
        const data = await poePage.getCompactAndFullValueForCell(
          item.name,
          column,
        );

        // Verify compact value exists and is properly formatted
        expect(data.compact).toBeTruthy();
        expect(data.compact).toMatch(/[0-9]+(\.[0-9]+)?[KMBkmb]?/);

        // Verify full value is a valid number greater than 0
        expect(data.full).toBeGreaterThan(0);
        expect(data.full).not.toBeNaN();

        // Parse compact value and compare to full value with tolerance
        expect(
          poePage.compareCompactAndFullValues(data.compact, data.full),
        ).toBeTruthy();
      }
    }
  });

  test("should show tooltips on compact numbers", async ({ poePage }) => {
    const [item] = await poePage.getTestItems();

    for (const column of numericalColumns) {
      const data = await poePage.getCompactAndFullValueForCell(
        item.name,
        column,
      );

      // Hover over compact number to trigger tooltip
      const colIndex = await poePage.getColumnIndex(column);
      const cell = poePage.page
        .locator("tr")
        .filter({ hasText: item.name })
        .locator("td")
        .nth(colIndex);

      const compactNumber = cell.locator("[data-full-value]");
      await compactNumber.hover();
      await poePage.page.waitForTimeout(500);

      // Check for tooltip
      const tooltip = poePage.page.locator("[role='tooltip']").first();
      await expect(tooltip).toBeVisible();

      // Tooltip should compare full number
      const tooltipText = await tooltip.innerText();
      expect(tooltipText).toMatch(/[0-9,]+(\.[0-9]+)?/);

      // Strip thousands separators
      const tooltipValue = Number.parseFloat(tooltipText.replace(/,/g, ""));
      expect(tooltipValue).toBe(data.full);
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

    // Test "Go to next page" button
    const nextButton = poePage.nextPageButton;
    await nextButton.click();
    await poePage.page.waitForTimeout(300); // Wait for pagination update

    const nextState = await poePage.getPaginationInfo();
    expect(nextState.start).toBe(initialState.start + nextState.rowsPerPage);
    expect(nextState.end).toBe(initialState.end + nextState.rowsPerPage);
    expect(nextState.total).toBe(initialState.total);
    expect(nextState.currentPage).toBe(initialState.currentPage + 1);
    expect(nextState.totalPages).toBe(initialState.totalPages);
    expect(nextState.rowsPerPage).toBe(initialState.rowsPerPage);

    // Test "Go to previous page" button
    const prevButton = poePage.prevPageButton;
    await prevButton.click();
    await poePage.page.waitForTimeout(300);

    const prevState = await poePage.getPaginationInfo();
    expect(prevState.start).toBe(initialState.start);
    expect(prevState.end).toBe(initialState.end);
    expect(prevState.total).toBe(initialState.total);
    expect(prevState.currentPage).toBe(initialState.currentPage);
    expect(prevState.totalPages).toBe(initialState.totalPages);
    expect(prevState.rowsPerPage).toBe(initialState.rowsPerPage);

    // Test "Go to last page" button
    const lastButton = poePage.lastPageButton;
    await lastButton.click();
    await poePage.page.waitForTimeout(300);

    const lastState = await poePage.getPaginationInfo();
    expect(lastState.start).toBeGreaterThan(initialState.start);
    expect(lastState.end).toBeGreaterThan(initialState.end);
    expect(lastState.total).toBe(initialState.total);
    expect(lastState.currentPage).toBeGreaterThan(initialState.currentPage);
    expect(lastState.totalPages).toBe(initialState.totalPages);
    expect(lastState.rowsPerPage).toBe(initialState.rowsPerPage);

    expect(lastState.end).toBe(lastState.total);
    expect(lastState.currentPage).toBe(lastState.totalPages);

    // Test "Go to first page" button
    const firstButton = poePage.firstPageButton;
    await firstButton.click();
    await poePage.page.waitForTimeout(300);

    const firstState = await poePage.getPaginationInfo();
    expect(firstState.start).toBe(1);
    expect(firstState.end).toBe(10);
    expect(firstState.total).toBe(initialState.total);
    expect(firstState.currentPage).toBe(1);
    expect(firstState.totalPages).toBe(initialState.totalPages);
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
});
