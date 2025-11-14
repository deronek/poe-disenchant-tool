import { DESCRIPTION, TITLE } from "@/lib/constants";
import {
  DEFAULT_LEAGUE,
  getLeagueFromName,
  getLeagueName,
  League,
  LEAGUE_SLUGS,
} from "@/lib/leagues";
import { expect, test } from "../../fixtures";

test.describe("Page Metadata", () => {
  test("should display correct default page title", async ({ poePage }) => {
    await poePage.verifyPageTitle(
      getLeagueName(DEFAULT_LEAGUE) + " | " + TITLE,
    );
  });

  test("should have correct page description meta tag", async ({ poePage }) => {
    await poePage.verifyPageDescription(DESCRIPTION);
  });

  test("should display page header and description", async ({ poePage }) => {
    const pageTitle = poePage.page.getByTestId("page-title");
    const pageDescription = poePage.page.getByTestId("page-description");

    await expect(pageTitle).toBeVisible();
    await expect(pageTitle).toHaveText(TITLE);
    await expect(pageDescription).toBeVisible();
    await expect(pageDescription).toHaveText(DESCRIPTION);
  });
});

test.describe("League Selector Functionality", () => {
  test("should display league selector with correct options", async ({
    poePage,
  }) => {
    await poePage.leagueSelectorTrigger.click();

    const options = poePage.page.getByRole("option");
    const count = await options.count();
    expect(count).toBeGreaterThan(0);

    for (const league of LEAGUE_SLUGS) {
      const option = await poePage.getLeagueOption(league);
      await expect(option).toBeVisible();
    }
  });

  test("should allow selecting different leagues", async ({ poePage }) => {
    for (const league of LEAGUE_SLUGS) {
      await poePage.selectLeague(league);
      await poePage.verifyLeagueSelected(league);

      // Verify title
      await poePage.verifyPageTitle(getLeagueName(league) + " | " + TITLE);
    }
  });

  test("should show loading state during league selection", async ({
    poePage,
  }) => {
    // Get first which key isn't DEFAULT_LEAGUE
    const leagueToSelect = LEAGUE_SLUGS.find((key) => key !== DEFAULT_LEAGUE)!;
    expect(leagueToSelect).toBeDefined();
    await poePage.selectLeague(leagueToSelect);

    const spinner = poePage.leagueSelectorSpinner;
    await expect(spinner).toBeVisible();
    await expect(spinner).toBeHidden();
    await poePage.verifyLeagueSelected(leagueToSelect);
  });

  test("should persist default league selection across page reloads", async ({
    poePage,
    page,
  }) => {
    const initialLeague = DEFAULT_LEAGUE;
    await poePage.verifyLeagueSelected(initialLeague);
    await page.reload();
    await poePage.waitForDataLoad();
    await poePage.verifyLeagueSelected(initialLeague);
  });

  test("should persist non-default league selection across page reloads", async ({
    poePage,
    page,
  }) => {
    const selectedLeague = "standard";
    await poePage.selectLeague(selectedLeague);
    await poePage.verifyLeagueSelected(selectedLeague);
    await page.reload();
    await poePage.waitForDataLoad();
    await poePage.verifyLeagueSelected(selectedLeague);
  });

  test("should support keyboard open/close in league selector", async ({
    poePage,
  }) => {
    const selector = poePage.leagueSelectorTrigger;
    await selector.focus();
    await selector.press("Enter");

    const dropdown = poePage.leagueSelector;
    await expect(dropdown).toBeVisible();

    // Test closing with Escape
    await dropdown.press("Escape");
    await expect(dropdown).not.toBeVisible();
  });

  test("should support selecting league using keyboard", async ({
    poePage,
  }) => {
    const selector = poePage.leagueSelectorTrigger;
    await selector.focus();
    await selector.press("Enter");

    const dropdown = poePage.leagueSelector;
    await expect(dropdown).toBeVisible();

    const defaultLeagueOption = await poePage.getLeagueOption(DEFAULT_LEAGUE);
    await expect(defaultLeagueOption).toHaveAttribute("data-state", "checked");
    await expect(defaultLeagueOption).toHaveAttribute("data-highlighted", "");

    // Move up one league
    await poePage.page.keyboard.press("ArrowUp");
    await poePage.page.waitForTimeout(100); // wait for input
    const highlightedLeagueLocator = poePage.page.locator(
      "[role='option'][data-highlighted]",
    );
    const highlightedLeagueName = await highlightedLeagueLocator.innerText();
    const highlightedLeague = getLeagueFromName(highlightedLeagueName);
    expect(highlightedLeague).toBeDefined();

    // Select that league
    await poePage.page.keyboard.press("Enter");
    await poePage.verifyLeagueSelected(highlightedLeague as League);
  });
});

test.describe("Theme Selector Functionality", () => {
  test("should display theme selector button", async ({ poePage }) => {
    await expect(poePage.themeSelectorTrigger).toBeVisible();
    await expect(poePage.themeSelectorTrigger).toBeEnabled();
  });

  test("should allow switching between light, dark and system themes", async ({
    poePage,
  }) => {
    await poePage.selectTheme("light");
    await poePage.verifyThemeApplied("light");

    await poePage.selectTheme("dark");
    await poePage.verifyThemeApplied("dark");

    await poePage.selectTheme("system");
    await poePage.verifyThemeApplied("system");
  });

  test("should persist theme selection across page reloads", async ({
    poePage,
    page,
  }) => {
    const initialTheme = await poePage.getCurrentTheme();
    await page.reload();
    await poePage.waitForDataLoad();
    const currentTheme = await poePage.getCurrentTheme();
    expect(currentTheme).toBe(initialTheme);
  });

  test("should maintain visual consistency across theme changes", async ({
    poePage,
  }) => {
    await poePage.selectTheme("light");
    await expect(poePage.page.locator("h1")).toBeVisible();
    await expect(poePage.page.locator("table")).toBeVisible();

    await poePage.selectTheme("dark");
    await expect(poePage.page.locator("h1")).toBeVisible();
    await expect(poePage.page.locator("table")).toBeVisible();
  });

  test("should support keyboard open/close in theme selector", async ({
    poePage,
  }) => {
    const button = poePage.themeSelectorTrigger;
    await button.focus();
    await button.press("Enter");

    const dropdown = poePage.themeSelector;
    await expect(dropdown).toBeVisible();

    // Test closing with Escape
    await poePage.page.keyboard.press("Escape");
    await expect(dropdown).not.toBeVisible();
  });

  test("should support selecting first theme using keyboard", async ({
    poePage,
  }) => {
    const button = poePage.themeSelectorTrigger;
    await button.focus();
    await button.press("Enter");

    const dropdown = poePage.themeSelector;
    await expect(dropdown).toBeVisible();

    // Should automatically focus the first option - light
    const option = poePage.page.locator("[role='menuitem'][data-highlighted]");
    await expect(option).toHaveText("Light");
    await poePage.page.keyboard.press("Enter");
    await poePage.verifyThemeApplied("light");
  });

  test("should support selecting second theme using keyboard", async ({
    poePage,
  }) => {
    const button = poePage.themeSelectorTrigger;
    await button.focus();
    await button.press("Enter");

    const dropdown = poePage.page.locator("[role='menu']");
    await expect(dropdown).toBeVisible();

    // Manually focus the second option - dark
    await poePage.page.keyboard.press("ArrowDown");
    const option = poePage.page.locator("[role='menuitem'][data-highlighted]");
    await expect(option).toHaveText("Dark");

    await poePage.page.keyboard.press("Enter");
    await poePage.verifyThemeApplied("dark");
  });
});

test.describe("Last Updated Functionality", () => {
  test("should display last updated text with relative time", async ({
    poePage,
  }) => {
    const lastUpdated = poePage.lastUpdatedElement;
    expect(lastUpdated).toHaveText(/last updated:/i);
    expect(lastUpdated).toHaveText(/just now|ago/i);
    await poePage.verifyDateTimeAttribute(lastUpdated);
  });

  test("should show absolute time in tooltip", async ({ poePage }) => {
    const tooltip = await poePage.getLastUpdatedTooltip();
    expect(tooltip).toHaveText(/absolute time/i);

    const absoluteTime = tooltip.locator("time").first();
    const displayedText = await absoluteTime.innerText();

    // Should render something non-empty and time-like
    expect(displayedText.trim().length).toBeGreaterThan(0);
    expect(displayedText).toMatch(/\d/); // contains digits
    expect(displayedText).not.toMatch(/Invalid Date/);
    expect(displayedText).not.toMatch(/NaN/);

    await poePage.verifyDateTimeAttribute(absoluteTime);
  });
});
