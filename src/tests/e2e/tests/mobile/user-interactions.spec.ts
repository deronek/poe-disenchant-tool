import { DEFAULT_ADVANCED_SETTINGS } from "@/lib/advanced-settings";
import { DEFAULT_LEAGUE, getLeagueApiName } from "@/lib/leagues";
import { expect, testMobile as test } from "../../fixtures";

test.describe("Row Selection & Marking", () => {
  test("should select and deselect cards with visual feedback", async ({
    poePage,
  }) => {
    const names = await poePage.getCardNames(2);
    const [first, second] = names;

    await poePage.selectItems([first!, second!]);
    await poePage.verifyItemSelected(first!, true);
    await poePage.verifyItemSelected(second!, true);
    await poePage.verifyItemSelectedState(first!, true);
    await poePage.verifyItemSelectedState(second!, true);

    await poePage.selectItem(first!); // toggle off
    await poePage.verifyItemSelected(first!, false);
    await poePage.verifyItemSelectedState(first!, false);

    await poePage.clearAllSelections();
    await poePage.verifyItemSelected(second!, false);
  });

  test("should toggle selection with the keyboard", async ({ poePage }) => {
    const [first] = await poePage.getCardNames(1);
    const checkbox = poePage.mobileCard(first!).getByRole("checkbox");

    await checkbox.focus();
    await checkbox.press("Space");
    await expect(checkbox).toBeChecked();

    await checkbox.press("Space");
    await expect(checkbox).not.toBeChecked();
  });

  test("should display the number of selected cards on Clear Marks", async ({
    poePage,
  }) => {
    const names = await poePage.getCardNames(3);

    await poePage.verifyClearMarksCount(0);
    await expect(poePage.clearMarksButton).toBeDisabled();

    await poePage.selectItem(names[0]!);
    await poePage.verifyClearMarksCount(1);

    await poePage.selectItem(names[1]!);
    await poePage.selectItem(names[2]!);
    await poePage.verifyClearMarksCount(3);

    await poePage.clearAllSelections();
    await poePage.verifyClearMarksCount(0);
    await expect(poePage.clearMarksButton).toBeDisabled();
  });

  test("should persist selections across reloads", async ({ poePage }) => {
    const [first] = await poePage.getCardNames(1);

    await poePage.selectItem(first!);
    await poePage.refreshPage();
    await poePage.verifyItemSelected(first!, true);

    await poePage.clearAllSelections();
  });
});

test.describe("Trade Link Functionality", () => {
  test("should generate valid PoE trade links from cards", async ({
    poePage,
  }) => {
    const [first] = await poePage.getCardNames(1);
    const link = await poePage.getTradeLink(first!);

    expect(link).toContain("https://www.pathofexile.com/trade/search/");
    expect(link).toContain(getLeagueApiName(DEFAULT_LEAGUE));
  });

  test("should open trade link in a new tab when tapped", async ({
    poePage,
    context,
  }) => {
    const [first] = await poePage.getCardNames(1);

    const tradePage = await poePage.openTradeLinkInNewTab(first!, context);

    expect(tradePage.url()).toContain("pathofexile.com/trade");
    await tradePage.close();
  });

  test("should include default trade options in the payload", async ({
    poePage,
  }) => {
    const [first] = await poePage.getCardNames(1);
    const payload = await poePage.parseTradeLinkPayload(
      await poePage.getTradeLink(first!),
    );

    expect(payload.query.name).toBe(first);
    expect(payload.sort.price).toBe("asc");
    expect(payload.query.status.option).toBe("available");
    expect(payload.query.filters.trade_filters.filters.indexed?.option).toBe(
      "3days",
    );
    expect(payload.query.filters.misc_filters.filters.ilvl.min).toBe(
      DEFAULT_ADVANCED_SETTINGS.minItemLevel,
    );
  });
});
