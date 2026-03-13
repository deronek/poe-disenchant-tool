import { expect, testVrt as test } from "../e2e/fixtures";

test.describe("Pagination - Desktop", () => {
  test("pagination controls", async ({ poePage }) => {
    await expect(poePage.paginationContainer).toHaveScreenshot(
      "pagination-controls.png",
    );
  });

  test("page 2", async ({ poePage }) => {
    await poePage.nextPageButton.click();
    await poePage.page.waitForTimeout(300);
    await expect(poePage.dataTable).toHaveScreenshot("page-2.png");
  });

  test("rows per page selector open", async ({ poePage }) => {
    await poePage.rowsPerPageSelectTrigger.click();
    await expect(poePage.rowsPerPageSelectContent).toHaveScreenshot(
      "rows-per-page-selector.png",
    );
  });
});
