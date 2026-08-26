// Not tested here by design: localStorage robustness (invalid/partial/
// legacy JSON) and the new-leagues badge - shared code with desktop, covered
// in tests/desktop/{advanced-settings-panel,efficiency-settings,core-functionality}.spec.ts
import { DEFAULT_ADVANCED_SETTINGS } from "@/lib/advanced-settings";
import { EFFICIENCY_MODES, GOLD_VALUATION_DEFAULT } from "@/lib/efficiency";
import { MIN_ITEM_LEVEL_RANGE } from "@/lib/filters";
import { expect, testMobile as test } from "../../fixtures";

test.describe("Advanced Settings Panel", () => {
  test("should open and show all default settings", async ({ poePage }) => {
    await poePage.openAdvancedSettings();
    await poePage.verifyAllDefaultSettings();
    await poePage.closeAdvancedSettings();
  });

  test("should change and persist the minimum item level", async ({
    poePage,
  }) => {
    // The default is the top of the slider range, so move downwards
    const target = DEFAULT_ADVANCED_SETTINGS.minItemLevel - 5;
    expect(target).toBeGreaterThanOrEqual(MIN_ITEM_LEVEL_RANGE.min);

    await poePage.openAdvancedSettings();
    await poePage.setMinItemLevel(target);
    await poePage.verifyMinItemLevel(target);
    await poePage.closeAdvancedSettings();

    await poePage.refreshPage();
    await poePage.openAdvancedSettings();
    await poePage.verifyMinItemLevel(target);

    await poePage.resetAdvancedSettings();
    await poePage.verifyAllDefaultSettings();
    await poePage.closeAdvancedSettings();
  });

  test("should toggle the include-corrupted checkbox", async ({ poePage }) => {
    await poePage.openAdvancedSettings();

    const initial = await poePage.isIncludeCorruptedChecked();
    await poePage.setIncludeCorrupted(!initial);
    await poePage.verifyIncludeCorrupted(!initial);
    await poePage.setIncludeCorrupted(initial);
    await poePage.verifyIncludeCorrupted(initial);

    await poePage.closeAdvancedSettings();
  });

  test("should respect the slider range limits", async ({ poePage }) => {
    await poePage.openAdvancedSettings();

    // The default equals the top of the range; setting the minimum must
    // enable Reset, which restores the default.
    await poePage.setMinItemLevel(MIN_ITEM_LEVEL_RANGE.min);
    await poePage.verifyMinItemLevel(MIN_ITEM_LEVEL_RANGE.min);
    await poePage.resetAdvancedSettings();

    await expect(poePage.minItemLevelValue).toHaveText(
      String(DEFAULT_ADVANCED_SETTINGS.minItemLevel),
    );
    await poePage.closeAdvancedSettings();
  });

  test("should select listing time and online status filters", async ({
    poePage,
  }) => {
    await poePage.openAdvancedSettings();

    await poePage.selectListingTimeFilter("1day");
    await poePage.verifyListingTimeFilter("1day");

    await poePage.selectOnlineStatusFilter("any");
    await poePage.verifyOnlineStatusFilter("any");

    // Trade links must reflect the changed settings
    await poePage.closeAdvancedSettings();
    await poePage.verifyTradeLinkSettings({
      listingTimeFilter: "1day",
      onlineStatus: "any",
    });

    await poePage.openAdvancedSettings();
    await poePage.resetAdvancedSettings();
    await poePage.closeAdvancedSettings();
  });

  test("should keep the panel inside the viewport", async ({ poePage }) => {
    await poePage.openAdvancedSettings();

    const box = await poePage.advancedSettingsPopover.boundingBox();
    expect(box).not.toBeNull();

    const viewport = poePage.page.viewportSize()!;
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height);
    await poePage.closeAdvancedSettings();
  });
});

test.describe("Efficiency Settings Panel", () => {
  test("should open with the total-cost mode selected by default", async ({
    poePage,
  }) => {
    await poePage.openEfficiencySettings();
    await poePage.verifyEfficiencyMode("total-cost");
    await poePage.closeEfficiencySettings();

    // Cards label the efficiency metric accordingly
    const [first] = await poePage.getCardNames(1);
    await expect(
      poePage
        .mobileCard(first!)
        .getByText(
          `Efficiency · ${EFFICIENCY_MODES["total-cost"].columnLabel}`,
          { exact: true },
        ),
    ).toBeVisible();
  });

  test("should switch modes and update card labels", async ({ poePage }) => {
    await poePage.setEfficiencyMode("per-slot");

    const [first] = await poePage.getCardNames(1);
    await expect(
      poePage
        .mobileCard(first!)
        .getByText(`Efficiency · ${EFFICIENCY_MODES["per-slot"].columnLabel}`, {
          exact: true,
        }),
    ).toBeVisible();

    await poePage.setEfficiencyMode("per-gold");
    await expect(
      poePage
        .mobileCard(first!)
        .getByText(`Efficiency · ${EFFICIENCY_MODES["per-gold"].columnLabel}`, {
          exact: true,
        }),
    ).toBeVisible();

    await poePage.setEfficiencyMode("total-cost");
  });

  test("should change card efficiency values when the mode changes", async ({
    poePage,
  }) => {
    const [first] = await poePage.getCardNames(1);

    const totalCostValue = await poePage.getCardMetricValue(
      first!,
      "Efficiency",
    );
    await poePage.setEfficiencyMode("per-slot");
    const perSlotValue = await poePage.getCardMetricValue(first!, "Efficiency");

    expect(
      perSlotValue,
      "efficiency value must react to the selected mode",
    ).not.toBe(totalCostValue);
  });

  test("should reflect gold valuation changes in the total cost breakdown", async ({
    poePage,
  }) => {
    // Only cards with total-cost details expose the breakdown trigger
    const names = await poePage.getCardNames(10);
    let target: string | undefined;
    for (const name of names) {
      const hasBreakdown = await poePage
        .mobileCard(name)
        .getByRole("button", {
          name: `Show total cost breakdown for ${name}`,
        })
        .count();
      if (hasBreakdown > 0) {
        target = name;
        break;
      }
    }
    expect(target, "No card exposes a total cost breakdown").toBeDefined();
    const itemName = target!;

    const readBreakdown = async () => {
      const triggerName = `Show total cost breakdown for ${itemName}`;
      const popover = await poePage.openCardInfoPopover(itemName, triggerName);
      const parsed = await poePage.parseTotalCostBreakdown(popover);
      await poePage
        .mobileCard(itemName)
        .getByRole("button", { name: triggerName })
        .click();
      return parsed;
    };

    const before = await readBreakdown();

    await poePage.openEfficiencySettings();
    await poePage.setGoldValuation(GOLD_VALUATION_DEFAULT + 10);
    await poePage.closeEfficiencySettings();

    const after = await readBreakdown();

    expect(after.goldEquivalent).toBeGreaterThan(before.goldEquivalent);
    expect(after.totalCost).toBeGreaterThan(before.totalCost);
  });

  test("should show gold valuation only in total-cost mode", async ({
    poePage,
  }) => {
    await poePage.openEfficiencySettings();

    await expect(poePage.goldValuationSlider).toBeVisible();

    await poePage.selectEfficiencyMode("per-gold");
    await expect(poePage.goldValuationSlider).toBeHidden();

    await poePage.selectEfficiencyMode("total-cost");
    await expect(poePage.goldValuationSlider).toBeVisible();

    await poePage.closeEfficiencySettings();
  });

  test("should persist the selected mode across reloads", async ({
    poePage,
  }) => {
    await poePage.setEfficiencyMode("per-slot");

    await poePage.refreshPage();
    await poePage.openEfficiencySettings();
    await poePage.verifyEfficiencyMode("per-slot");

    await poePage.selectEfficiencyMode("total-cost");
    await poePage.closeEfficiencySettings();
  });
});
