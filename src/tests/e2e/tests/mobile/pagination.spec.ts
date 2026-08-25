import { DEFAULT_PAGE_SIZE } from "@/components/data-table/pagination-persistence";
import { MIN_ITEM_LEVEL_RANGE } from "@/lib/filters";
import { expect, testMobile as test } from "../../fixtures";

test.describe("Pagination Functionality", () => {
  test("should load the first page by default with correct controls", async ({
    poePage,
  }) => {
    await expect(poePage.firstPageButton).toBeDisabled();
    await expect(poePage.prevPageButton).toBeDisabled();
    await expect(poePage.nextPageButton).toBeEnabled();

    const info = await poePage.getPaginationInfo();
    expect(info.start).toBe(1);
    expect(info.currentPage).toBe(1);
    expect(info.rowsPerPage).toBe(DEFAULT_PAGE_SIZE);
    expect(info.total).toBeGreaterThanOrEqual(1);
    expect(info.totalPages).toBeGreaterThanOrEqual(1);
  });

  test("should navigate to the next page and back", async ({ poePage }) => {
    const initialNames = await poePage.getCardNames();
    const initialInfo = await poePage.getPaginationInfo();

    const nextInfo = await poePage.goToNextPage();
    expect(nextInfo.start).toBe(initialInfo.start + initialInfo.rowsPerPage);
    expect(nextInfo.currentPage).toBe(2);

    const nextNames = await poePage.getCardNames();
    expect(nextNames).not.toEqual(initialNames);

    // Back to page 1 restores the exact same cards
    await poePage.prevPageButton.click();
    await poePage.expectCurrentPage(1);
    expect(await poePage.getCardNames()).toEqual(initialNames);
    await expect(poePage.prevPageButton).toBeDisabled();
    await expect(poePage.nextPageButton).toBeEnabled();
  });

  test("should update the summary while paging", async ({ poePage }) => {
    const before = await poePage.getPaginationInfo();

    const after = await poePage.goToNextPage();
    // Page two may be a partial last page
    expect(after.end).toBe(
      Math.min(before.end + before.rowsPerPage, before.total),
    );
    expect(after.total).toBe(before.total);
  });

  test("should keep the current page when trade settings change", async ({
    poePage,
  }) => {
    const stateBefore = await poePage.goToNextPage();

    await poePage.openAdvancedSettings();
    const currentMinItemLevel = await poePage.getMinItemLevel();
    // Step off the current value so the setting actually changes, even if
    // the default ever sits at the bottom of the range
    const { min } = MIN_ITEM_LEVEL_RANGE;
    const target = currentMinItemLevel === min ? currentMinItemLevel + 1 : min;
    await poePage.setMinItemLevel(target);
    await poePage.closeAdvancedSettings();

    const stateAfter = await poePage.expectCurrentPage(stateBefore.currentPage);
    expect(stateAfter.rowsPerPage).toBe(stateBefore.rowsPerPage);
  });

  test("should page with the keyboard while lg-only controls stay hidden", async ({
    poePage,
  }) => {
    await expect(poePage.firstPageButton).toBeHidden();
    await expect(poePage.lastPageButton).toBeHidden();
    await expect(poePage.rowsPerPageSelectTrigger).toBeHidden();

    await poePage.nextPageButton.focus();
    await poePage.nextPageButton.press("Enter");
    await poePage.expectCurrentPage(2);

    await poePage.prevPageButton.focus();
    await poePage.prevPageButton.press("Enter");
    await poePage.expectCurrentPage(1);

    await expect(poePage.firstPageButton).toBeHidden();
    await expect(poePage.lastPageButton).toBeHidden();
    await expect(poePage.rowsPerPageSelectTrigger).toBeHidden();
  });

  test("should render exactly rows-per-page cards on a full page", async ({
    poePage,
  }) => {
    const info = await poePage.getPaginationInfo();
    expect(
      info.totalPages,
      "Dataset no longer fills two pages",
    ).toBeGreaterThanOrEqual(2);

    expect(await poePage.mobileCardHeadings.count()).toBe(info.rowsPerPage);

    await poePage.goToNextPage();
    const remainingOnPage2 = info.total - info.rowsPerPage;
    expect(await poePage.mobileCardHeadings.count()).toBe(
      Math.min(info.rowsPerPage, remainingOnPage2),
    );
  });
});
