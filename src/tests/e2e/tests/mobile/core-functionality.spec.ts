// Shared chrome (page metadata, league/theme dropdown internals, keyboard
// handling) repeats tests/desktop/core-functionality.spec.ts; this file keeps
// only what behaves differently at card-layout sizes.
import { DEFAULT_LEAGUE, getLeagueName, LEAGUE_SLUGS } from "@/lib/leagues";
import { expect, testMobile as test } from "../../fixtures";
import { escapeRegExp } from "../../page-pom/page-base";

test.describe("League Selector Functionality", () => {
  test("should re-render cards when the league changes", async ({
    poePage,
  }) => {
    const leagueToSelect = LEAGUE_SLUGS.find((key) => key !== DEFAULT_LEAGUE)!;
    expect(leagueToSelect).toBeDefined();

    await poePage.selectLeague(leagueToSelect);
    // Dev data is league-independent; the title proves the new league rendered
    await expect(poePage.page).toHaveTitle(
      new RegExp(`^${escapeRegExp(getLeagueName(leagueToSelect))}\\b`),
    );
    await poePage.waitForDataLoad();
    await poePage.verifyLeagueSelected(leagueToSelect);
  });
});

test.describe("Last Updated Functionality", () => {
  test("should show absolute time in a tap popover instead of a hover tooltip", async ({
    poePage,
  }) => {
    const popover = await poePage.getLastUpdatedPopover();

    await expect(popover).toHaveText(/absolute time/i);
    const absoluteTime = popover.locator("time").first();
    const displayedText = await absoluteTime.innerText();
    expect(displayedText.trim().length).toBeGreaterThan(0);
    expect(displayedText).toMatch(/\d/);
    expect(displayedText).not.toMatch(/Invalid Date|NaN/);
    await poePage.verifyDateTimeAttribute(absoluteTime);

    await poePage.closeLastUpdatedPopover();
  });
});
