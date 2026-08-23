import { expect, testMobile as test } from "../../fixtures";

test.describe("Responsive Layout Switching", () => {
  test("should render the card layout and hide the desktop table", async ({
    poePage,
  }) => {
    expect(await poePage.mobileCards.count()).toBeGreaterThan(0);

    await expect(poePage.dataTable).toBeHidden();
    await expect(poePage.rowsPerPageSelectTrigger).toBeHidden();
    await expect(poePage.firstPageButton).toBeHidden();
    await expect(poePage.lastPageButton).toBeHidden();
  });

  test("should show all mobile toolbar controls", async ({ poePage }) => {
    await expect(poePage.tabbedFilterButton).toBeVisible();
    await expect(poePage.sortTrigger).toBeVisible();
    await expect(poePage.efficiencySettingsTrigger).toBeVisible();
    await expect(poePage.advancedSettingsTrigger).toBeVisible();
    await expect(poePage.nameFilterInput).toBeVisible();
    await expect(poePage.clearMarksButton).toBeVisible();
  });

  test("should have a responsive viewport meta tag", async ({ poePage }) => {
    const meta = poePage.page.locator('meta[name="viewport"]');
    await expect(meta).toHaveAttribute("content", /width=device-width/);
  });

  test("should not overflow the viewport horizontally", async ({ poePage }) => {
    const metrics = await poePage.page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      innerWidth: window.innerWidth,
    }));

    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth);
    expect(metrics.clientWidth).toBe(metrics.innerWidth);
  });

  test("should stack cards in a single column on phone width", async ({
    poePage,
  }) => {
    const names = await poePage.getCardNames(2);
    expect(names.length).toBe(2);

    const firstBox = await poePage.mobileCard(names[0]).boundingBox();
    const secondBox = await poePage.mobileCard(names[1]).boundingBox();
    expect(firstBox).not.toBeNull();
    expect(secondBox).not.toBeNull();

    // Same left edge => single column, stacked vertically
    expect(Math.abs(firstBox!.x - secondBox!.x)).toBeLessThan(8);
    expect(secondBox!.y).toBeGreaterThan(firstBox!.y);
  });

  test("should keep shared pagination controls visible", async ({
    poePage,
  }) => {
    await expect(poePage.paginationContainer).toBeVisible();
    await expect(poePage.paginationSummary).toBeVisible();
    await expect(poePage.pageIndicator).toBeVisible();
    await expect(poePage.prevPageButton).toBeVisible();
    await expect(poePage.nextPageButton).toBeVisible();
  });
});
