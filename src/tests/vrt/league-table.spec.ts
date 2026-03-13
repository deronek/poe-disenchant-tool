import { expect, testVrt as test } from "../e2e/fixtures";

test.describe("League Table - Desktop", () => {
  test("full table render", async ({ poePage }) => {
    await expect(poePage.page).toHaveScreenshot("page.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.01, // 1% pixel diff tolerance
    });
  });

  test("sorted by price ascending", async ({ poePage }) => {
    await poePage.sortByColumn("Price", "asc");
    await expect(poePage.leagueTable).toHaveScreenshot(
      "table-sorted-price-asc.png",
    );
  });

  test("sorted by dust value descending", async ({ poePage }) => {
    await poePage.sortByColumn("Dust Value", "desc");
    await expect(poePage.leagueTable).toHaveScreenshot(
      "table-sorted-dust-desc.png",
    );
  });
});
