import { test, expect } from "@playwright/test";
import { PoEDisenchantPage } from "../../poe-page";
import { TITLE, DESCRIPTION } from "@/lib/constants";
import {
  DEFAULT_LEAGUE,
  getLeagueFromName,
  getLeagueName,
  League,
  LEAGUE_SLUGS,
} from "@/lib/leagues";

let poePage: PoEDisenchantPage;

test.beforeEach(async ({ page }) => {
  poePage = new PoEDisenchantPage(page);
  await poePage.setup();
});

test.describe("Page Metadata", () => {
  test("should display correct default page title", async () => {
    await poePage.verifyPageTitle(
      getLeagueName(DEFAULT_LEAGUE) + " | " + TITLE,
    );
  });

  test("should have correct page description meta tag", async () => {
    await poePage.verifyPageDescription(DESCRIPTION);
  });

  test("should display page header and description", async () => {
    const pageHeader = poePage.page.locator("h1").first();
    const pageDescription = poePage.page.locator("h3").first();

    await expect(pageHeader).toBeVisible();
    await expect(pageHeader).toHaveText(TITLE);
    await expect(pageDescription).toBeVisible();
    await expect(pageDescription).toHaveText(DESCRIPTION);
  });
});

test.describe("League Selector Functionality", () => {
  test("should display league selector with correct options", async () => {
    await poePage.leagueSelectorTrigger.click();

    const options = poePage.page.getByRole("option");
    const count = await options.count();
    expect(count).toBeGreaterThan(0);

    for (const league of LEAGUE_SLUGS) {
      const option = await poePage.getLeagueOption(league);
      await expect(option).toBeVisible();
    }
  });

  test("should allow selecting different leagues", async () => {
    for (const league of LEAGUE_SLUGS) {
      await poePage.selectLeague(league);
      await poePage.verifyLeagueSelected(league);

      // Verify title
      await poePage.verifyPageTitle(getLeagueName(league) + " | " + TITLE);
    }
  });

  test("should show loading state during league selection", async () => {
    // Get first which key isn't DEFAULT_LEAGUE
    const leagueToSelect = LEAGUE_SLUGS.find((key) => key !== DEFAULT_LEAGUE)!;
    expect(leagueToSelect).toBeDefined();
    await poePage.selectLeague(leagueToSelect);

    const spinner = poePage.leagueSelectorSpinner;
    await expect(spinner).toBeVisible();
    await expect(spinner).toBeHidden();
    await poePage.verifyLeagueSelected(leagueToSelect);
  });

  test("should persist league selection across page reloads", async ({
    page,
  }) => {
    const initialLeague = DEFAULT_LEAGUE;
    await poePage.verifyLeagueSelected(initialLeague);
    await page.reload();
    await poePage.waitForDataLoad();
    await poePage.verifyLeagueSelected(initialLeague);
  });

  test("should support keyboard open/close in league selector", async () => {
    const selector = poePage.leagueSelectorTrigger;
    await selector.focus();
    await selector.press("Enter");

    const dropdown = poePage.leagueSelector;
    await expect(dropdown).toBeVisible();

    // Test closing with Escape
    await dropdown.press("Escape");
    await expect(dropdown).not.toBeVisible();
  });

  test("should support selecting league using keyboard", async () => {
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
  test("should display theme selector button", async () => {
    await expect(poePage.themeSelectorTrigger).toBeVisible();
    await expect(poePage.themeSelectorTrigger).toBeEnabled();
  });

  test("should allow switching between light, dark and system themes", async () => {
    await poePage.selectTheme("light");
    await poePage.verifyThemeApplied("light");

    await poePage.selectTheme("dark");
    await poePage.verifyThemeApplied("dark");

    await poePage.selectTheme("system");
    await poePage.verifyThemeApplied("system");
  });

  test("should persist theme selection across page reloads", async ({
    page,
  }) => {
    const initialTheme = await poePage.getCurrentTheme();
    await page.reload();
    await poePage.waitForDataLoad();
    const currentTheme = await poePage.getCurrentTheme();
    expect(currentTheme).toBe(initialTheme);
  });

  test("should maintain visual consistency across theme changes", async () => {
    await poePage.selectTheme("light");
    await expect(poePage.page.locator("h1")).toBeVisible();
    await expect(poePage.page.locator("table")).toBeVisible();

    await poePage.selectTheme("dark");
    await expect(poePage.page.locator("h1")).toBeVisible();
    await expect(poePage.page.locator("table")).toBeVisible();
  });

  test("should support keyboard open/close in theme selector", async () => {
    const button = poePage.themeSelectorTrigger;
    await button.focus();
    await button.press("Enter");

    const dropdown = poePage.themeSelector;
    await expect(dropdown).toBeVisible();

    // Test closing with Escape
    await poePage.page.keyboard.press("Escape");
    await expect(dropdown).not.toBeVisible();
  });

  test("should support selecting first theme using keyboard", async () => {
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

  test("should support selecting second theme using keyboard", async () => {
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
  test("should display last updated text with relative time", async () => {
    const lastUpdated = poePage.lastUpdatedElement;
    expect(lastUpdated).toHaveText(/last updated:/i);
    expect(lastUpdated).toHaveText(/just now|ago/i);
    await poePage.verifyDateTimeAttribute(lastUpdated);
  });

  test("should show absolute time in tooltip", async () => {
    const tooltip = await poePage.getLastUpdatedTooltip();
    expect(tooltip).toHaveText(/absolute time/i);

    const absoluteTime = tooltip.locator("time").first();
    await expect(absoluteTime).toHaveText(
      /[\w ,]+ \d{1,2}[:]\d{2}[:]\d{2} [A-Z]{2,4}(?:[+-]?\d{1,2})?/i,
    );
    await poePage.verifyDateTimeAttribute(absoluteTime);
  });

  test("should handle refresh button click", async () => {
    await poePage.setAlwaysShowRefreshFlag();
    await poePage.page.reload();
    await poePage.waitForDataLoad();

    // Click refresh button
    await poePage.clickRefreshButton();

    // Wait for refresh process to complete
    // We should have fresh data
    const lastUpdated = poePage.lastUpdatedElement;
    await expect(lastUpdated).toHaveText(/just now/i);
  });
});
test.describe("Data Table Functionality", () => {
  test("should display correct column headers", async () => {
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

    test("should display compact and full values correctly for all items and numerical columns", async () => {
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

    test("should show tooltips on compact numbers", async () => {
      const [item] = await poePage.getTestItems();

      for (const column of numericalColumns) {
        const data = await poePage.getCompactAndFullValueForCell(
          item.name,
          column,
        );
        console.log(data);

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
    });
