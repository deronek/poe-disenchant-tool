import { DEFAULT_ADVANCED_SETTINGS } from "@/lib/advanced-settings";
import { DEFAULT_LEAGUE, getLeagueApiName } from "@/lib/leagues";
import { expect, test } from "../../fixtures";

test.describe("Row Selection & Marking", () => {
  test("should allow selecting, deselecting, and visual feedback", async ({
    poePage,
  }) => {
    const items = await poePage.getTestItems();
    expect(items.length).toBeGreaterThanOrEqual(2);
    const [first, second] = items;

    await poePage.selectItems([first.name, second.name]);
    await poePage.verifyItemSelected(first.name, true);
    await poePage.verifyItemSelected(second.name, true);

    await poePage.selectItem(first.name); // toggle off
    await poePage.verifyItemSelected(first.name, false);

    await poePage.expectRowSelectedStyle(second.name, true);
  });

  test("should support checkbox selection with keyboard", async ({
    poePage,
  }) => {
    const firstCheckbox = poePage.page.getByRole("checkbox").first();
    await firstCheckbox.focus();
    await firstCheckbox.press("Space");
    await expect(firstCheckbox).toBeChecked();
  });

  test("should clear all marks and disable button", async ({ poePage }) => {
    const items = await poePage.getTestItems();
    expect(items.length).toBeGreaterThanOrEqual(2);
    const [first, second] = items;

    await poePage.selectItems([first.name, second.name]);
    await expect(poePage.clearMarksButton).toBeEnabled();

    await poePage.clearAllSelections();

    await poePage.verifyItemSelected(first.name, false);
    await poePage.verifyItemSelected(second.name, false);
    await expect(poePage.clearMarksButton).toBeDisabled();
  });

  test("should persist selections across reloads", async ({
    poePage,
    page,
  }) => {
    const [item] = await poePage.getTestItems();
    await poePage.selectItem(item.name);

    await page.reload();
    await poePage.waitForDataLoad();
    await poePage.verifyItemSelected(item.name, true);
  });

  test("should clear persisted selections when cleared manually", async ({
    poePage,
    page,
  }) => {
    const [item] = await poePage.getTestItems();
    await poePage.selectItem(item.name);
    await poePage.clearAllSelections();

    await page.reload();
    await poePage.waitForDataLoad();
    await poePage.verifyItemSelected(item.name, false);
  });

  test("should display the number of selected rows on the Clear Marks button", async ({
    poePage,
  }) => {
    const items = await poePage.getTestItems(3);
    expect(items.length).toBeGreaterThanOrEqual(3);
    const [first, second, third] = items;

    await poePage.verifyClearMarksCount(0);
    await expect(poePage.clearMarksButton).toBeDisabled();

    await poePage.selectItems([first.name]);
    await poePage.verifyClearMarksCount(1);

    await poePage.selectItems([second.name, third.name]);
    await poePage.verifyClearMarksCount(3);

    await poePage.selectItem(second.name); // toggle off
    await poePage.verifyClearMarksCount(2);

    await poePage.clearAllSelections();
    await poePage.verifyClearMarksCount(0);
    await expect(poePage.clearMarksButton).toBeDisabled();
  });

  test("should clear marks via keyboard", async ({ poePage }) => {
    const [item] = await poePage.getTestItems();
    await poePage.selectItem(item.name);

    await poePage.clearMarksButton.focus();
    await poePage.clearMarksButton.press("Enter");

    await poePage.verifyItemSelected(item.name, false);
  });
});

test.describe("Trade Link Functionality", () => {
  test("should generate valid PoE trade links", async ({ poePage }) => {
    const [item] = await poePage.getTestItems(1);
    const link = await poePage.getTradeLink(item.name);

    expect(link).toContain("https://www.pathofexile.com/trade/search/");
    expect(link).toContain(getLeagueApiName(DEFAULT_LEAGUE));
  });

  test("should open trade link in new tab", async ({ poePage, context }) => {
    const [item] = await poePage.getTestItems(1);
    expect(item).toBeTruthy();

    const href = await poePage.getTradeLink(item.name);
    expect(href).toContain("pathofexile.com/trade");
    const tradePage = await poePage.openTradeLinkInNewTab(item.name, context);

    expect(tradePage.url()).toContain("pathofexile.com/trade");
    await tradePage.close();
  });

  test("should include default options in trade link", async ({ poePage }) => {
    const [item] = await poePage.getTestItems();
    const tradeLink = await poePage.getTradeLink(item.name);
    const payload = JSON.parse(decodeURIComponent(tradeLink.split("q=")[1]));

    expect(payload.query.name).toBe(item.name);
    expect(payload.query.status.option).toBe("available");
    expect(payload.query.filters.trade_filters.filters.indexed.option).toBe(
      "3days",
    );
    expect(payload.query.filters.misc_filters.filters.ilvl.min).toBe(
      DEFAULT_ADVANCED_SETTINGS.minItemLevel,
    );
    expect(payload.sort.price).toBe("asc");
  });
});
