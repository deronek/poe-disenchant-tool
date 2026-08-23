import { EFFICIENCY_MODES } from "@/lib/efficiency";
import { expect, testMobile as test } from "../../fixtures";

test.describe("Mobile Sorting Dropdown", () => {
  test("should default to Dust / Chaos descending", async ({ poePage }) => {
    await poePage.verifySortTriggerState("Dust / Chaos", "descending");

    // Cards must actually be ordered by dust per chaos, descending
    const names = await poePage.getCardNames();
    const values: number[] = [];
    for (const name of names) {
      const raw = await poePage.getCardMetricValue(name, "Dust per Chaos");
      values.push(poePage.parseCompactValue(raw));
    }

    const sorted = [...values].sort((a, b) => b - a);
    expect(values).toEqual(sorted);
  });

  test("should list all sort options in the dropdown", async ({ poePage }) => {
    await poePage.openSortMenu();

    const expectedOptions = [
      "Dust / Chaos",
      /Efficiency · \S/, // mode-dependent label
      "Name",
      "Price",
      "Dust Value",
      "Gold Fee",
    ];

    for (const option of expectedOptions) {
      const item =
        typeof option === "string"
          ? poePage.sortMenuItem(option)
          : poePage.sortMenu
              .getByRole("menuitem")
              .filter({ hasText: option })
              .first();
      await expect(item).toBeVisible();
    }
  });

  // Every sort option must actually reorder the cards, not just exist
  for (const [option, metric] of [
    ["Dust Value", "Dust Value"],
    ["Gold Fee", "Gold Fee"],
    [
      `Efficiency · ${EFFICIENCY_MODES["total-cost"].columnLabel}`,
      "Efficiency",
    ],
  ] as const) {
    test(`should sort by ${option} in descending card order`, async ({
      poePage,
    }) => {
      await poePage.sortByOption(option);
      await poePage.verifySortTriggerState(option, "descending");

      await expect(async () => {
        const names = await poePage.getCardNames(5);
        const values: number[] = [];
        for (const name of names) {
          const raw = await poePage.getCardMetricValue(name, metric);
          values.push(poePage.parseCompactValue(raw));
        }

        const sorted = [...values].sort((a, b) => b - a);
        expect(values).toEqual(sorted);
      }).toPass({ timeout: 5000 });
    });
  }

  test("should sort by name descending then toggle to ascending", async ({
    poePage,
  }) => {
    await poePage.sortByOption("Name");
    await poePage.verifySortTriggerState("Name", "descending");

    let names = await poePage.getCardNames();
    expect(names.length).toBeGreaterThanOrEqual(2);
    const descending = [...names]
      .map((n) => n.toLowerCase())
      .sort((a, b) => b.localeCompare(a));
    expect(names.map((n) => n.toLowerCase())).toEqual(descending);

    await poePage.sortByOption("Name");
    await poePage.verifySortTriggerState("Name", "ascending");

    names = await poePage.getCardNames();
    const ascending = [...names]
      .map((n) => n.toLowerCase())
      .sort((a, b) => a.localeCompare(b));
    expect(names.map((n) => n.toLowerCase())).toEqual(ascending);
  });

  test("should sort by price descending with numeric ordering", async ({
    poePage,
  }) => {
    await poePage.sortByOption("Price");
    await poePage.verifySortTriggerState("Price", "descending");

    await expect(async () => {
      const names = await poePage.getCardNames(5);
      const prices: number[] = [];
      for (const name of names) {
        const raw = await poePage.getCardMetricValue(name, "Price");
        prices.push(poePage.parseCompactValue(raw));
      }

      const sorted = [...prices].sort((a, b) => b - a);
      expect(prices).toEqual(sorted);
    }).toPass({ timeout: 5000 });
  });

  test("should close the dropdown on Escape", async ({ poePage }) => {
    await poePage.openSortMenu();
    await poePage.page.keyboard.press("Escape");
    await expect(poePage.sortMenu).not.toBeVisible();
    await poePage.verifySortTriggerState("Dust / Chaos", "descending");
  });

  test("should support keyboard navigation in the sort dropdown", async ({
    poePage,
  }) => {
    const trigger = poePage.sortTrigger;
    await trigger.focus();
    await trigger.press("Enter");

    const menu = poePage.sortMenu;
    await expect(menu).toBeVisible();

    // First option (Dust / Chaos) is highlighted; it is already the active
    // sort (descending), so selecting it toggles to ascending.
    const firstItem = menu.getByRole("menuitem").first();
    await expect(firstItem).toHaveAttribute("data-highlighted", "");
    await poePage.page.keyboard.press("Enter");

    await expect(menu).not.toBeVisible();
    await poePage.verifySortTriggerState("Dust / Chaos", "ascending");
  });
});
