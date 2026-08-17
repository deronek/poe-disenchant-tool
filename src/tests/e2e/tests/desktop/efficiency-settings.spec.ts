import {
  DEFAULT_EFFICIENCY_SETTINGS,
  EFFICIENCY_MODES,
  EFFICIENCY_SETTINGS_STORAGE_KEY,
  EfficiencyModeSchema,
  GOLD_VALUATION_DEFAULT,
  GOLD_VALUATION_MAX,
  GOLD_VALUATION_MIN,
} from "@/lib/efficiency";
import { expect, test } from "../../fixtures";
import { PoEDisenchantPage } from "../../poe-page";

test.describe("Panel Open/Close", () => {
  test("should display efficiency settings trigger button", async ({
    poePage,
  }) => {
    await expect(poePage.efficiencySettingsTrigger).toBeVisible();
    await expect(poePage.efficiencySettingsTrigger).toBeEnabled();
  });

  test("should open efficiency settings panel on click", async ({
    poePage,
  }) => {
    await poePage.openEfficiencySettings();
    await expect(poePage.efficiencySettingsPopover).toBeVisible();
  });

  test("should close efficiency settings panel with close button", async ({
    poePage,
  }) => {
    await poePage.openEfficiencySettings();
    await poePage.closeEfficiencySettings();
    await expect(poePage.efficiencySettingsPopover).not.toBeVisible();
  });

  test("should close efficiency settings panel with escape key", async ({
    poePage,
  }) => {
    await poePage.openEfficiencySettings();
    await poePage.page.keyboard.press("Escape");
    await expect(poePage.efficiencySettingsPopover).not.toBeVisible();
  });

  test("should close efficiency settings panel with outside click", async ({
    poePage,
  }) => {
    await poePage.openEfficiencySettings();
    await poePage.pageTitle.click();
    await expect(poePage.efficiencySettingsPopover).not.toBeVisible();
  });
});

test.describe("Efficiency Metric Radio Group", () => {
  test("should display efficiency metric radio group", async ({ poePage }) => {
    await poePage.openEfficiencySettings();
    await expect(poePage.efficiencyModeRadioGroup).toBeVisible();
  });

  test("should display all efficiency mode options", async ({ poePage }) => {
    await poePage.openEfficiencySettings();

    for (const mode of EfficiencyModeSchema.options) {
      const radio = poePage.getEfficiencyModeRadio(mode);
      await expect(radio).toBeVisible();
    }
  });

  test("should have total-cost mode selected by default", async ({
    poePage,
  }) => {
    await poePage.openEfficiencySettings();
    await poePage.verifyEfficiencyMode(DEFAULT_EFFICIENCY_SETTINGS.mode);
  });

  test("should switch to per-slot mode and update the column header", async ({
    poePage,
  }) => {
    await poePage.openEfficiencySettings();
    await poePage.selectEfficiencyMode("per-slot");
    await poePage.verifyEfficiencyMode("per-slot");
    await poePage.closeEfficiencySettings();

    await poePage.verifyEfficiencyColumnHeader(
      EFFICIENCY_MODES["per-slot"].columnLabel,
    );
  });

  test("should switch to per-gold mode and update the column header", async ({
    poePage,
  }) => {
    await poePage.openEfficiencySettings();
    await poePage.selectEfficiencyMode("per-gold");
    await poePage.verifyEfficiencyMode("per-gold");
    await poePage.closeEfficiencySettings();

    await poePage.verifyEfficiencyColumnHeader(
      EFFICIENCY_MODES["per-gold"].columnLabel,
    );
  });

  test("should switch back to total-cost mode and update the column header", async ({
    poePage,
  }) => {
    await poePage.openEfficiencySettings();
    await poePage.selectEfficiencyMode("total-cost");
    await poePage.verifyEfficiencyMode("total-cost");
    await poePage.closeEfficiencySettings();

    await poePage.verifyEfficiencyColumnHeader(
      EFFICIENCY_MODES["total-cost"].columnLabel,
    );
  });
});

test.describe("Gold Valuation Slider", () => {
  test("should display gold valuation slider in total-cost mode", async ({
    poePage,
  }) => {
    await poePage.openEfficiencySettings();
    await expect(poePage.goldValuationSlider).toBeVisible();
  });

  test("should not display gold valuation slider in per-slot mode", async ({
    poePage,
  }) => {
    await poePage.openEfficiencySettings();
    await poePage.selectEfficiencyMode("per-slot");
    await expect(poePage.goldValuationSlider).not.toBeVisible();
  });

  test("should not display gold valuation slider in per-gold mode", async ({
    poePage,
  }) => {
    await poePage.openEfficiencySettings();
    await poePage.selectEfficiencyMode("per-gold");
    await expect(poePage.goldValuationSlider).not.toBeVisible();
  });

  test("should display default gold valuation value", async ({ poePage }) => {
    await poePage.openEfficiencySettings();
    await poePage.verifyGoldValuation(
      DEFAULT_EFFICIENCY_SETTINGS.goldValueChaosPer10k,
    );
  });

  test("should display gold valuation range labels", async ({ poePage }) => {
    await poePage.openEfficiencySettings();
    await expect(poePage.goldValuationThumb).toHaveAttribute(
      "aria-valuemin",
      String(GOLD_VALUATION_MIN),
    );
    await expect(poePage.goldValuationThumb).toHaveAttribute(
      "aria-valuemax",
      String(GOLD_VALUATION_MAX),
    );
  });

  test("should update gold valuation when slider is moved", async ({
    poePage,
  }) => {
    await poePage.openEfficiencySettings();
    await poePage.setGoldValuation(10);
    await poePage.verifyGoldValuation(10);
  });

  test("should update gold valuation to minimum value", async ({ poePage }) => {
    await poePage.openEfficiencySettings();
    await poePage.setGoldValuation(GOLD_VALUATION_MIN);
    await poePage.verifyGoldValuation(GOLD_VALUATION_MIN);
  });

  test("should update gold valuation to maximum value", async ({ poePage }) => {
    await poePage.openEfficiencySettings();
    await poePage.setGoldValuation(GOLD_VALUATION_MAX);
    await poePage.verifyGoldValuation(GOLD_VALUATION_MAX);
  });

  test("should disable gold valuation reset button at default", async ({
    poePage,
  }) => {
    await poePage.openEfficiencySettings();
    await expect(poePage.goldValuationResetButton).toBeDisabled();
  });

  test("should enable gold valuation reset button when value is changed", async ({
    poePage,
  }) => {
    await poePage.openEfficiencySettings();
    await poePage.setGoldValuation(10);
    await expect(poePage.goldValuationResetButton).toBeEnabled();
  });

  test("should reset gold valuation to default when reset button is clicked", async ({
    poePage,
  }) => {
    await poePage.openEfficiencySettings();
    await poePage.setGoldValuation(10);
    await poePage.verifyGoldValuation(10);

    await poePage.goldValuationResetButton.click();
    await poePage.verifyGoldValuation(GOLD_VALUATION_DEFAULT);
    await expect(poePage.goldValuationResetButton).toBeDisabled();
  });
});

test.describe("Keyboard Navigation", () => {
  test("should open efficiency settings panel with keyboard", async ({
    poePage,
  }) => {
    const trigger = poePage.efficiencySettingsTrigger;
    await trigger.focus();
    await trigger.press("Enter");

    await expect(poePage.efficiencySettingsPopover).toBeVisible();
  });

  test("should switch efficiency mode with arrow keys", async ({ poePage }) => {
    await poePage.openEfficiencySettings();

    // Focus the checked radio (total-cost is the last option)
    const totalCostRadio = poePage.getEfficiencyModeRadio("total-cost");
    await totalCostRadio.focus();

    // ArrowUp moves to the previous option (per-gold). The key needs to stay
    // down while roving focus moves (it is deferred via setTimeout), so use
    // keyboard.down/up with a delay instead of press.
    await poePage.page.keyboard.down("ArrowUp");
    await poePage.page.waitForTimeout(100);
    await poePage.page.keyboard.up("ArrowUp");
    await poePage.verifyEfficiencyMode("per-gold");

    // ArrowUp again moves to the first option (per-slot)
    await poePage.page.keyboard.down("ArrowUp");
    await poePage.page.waitForTimeout(100);
    await poePage.page.keyboard.up("ArrowUp");
    await poePage.verifyEfficiencyMode("per-slot");
  });

  test("should adjust gold valuation with arrow keys", async ({ poePage }) => {
    await poePage.openEfficiencySettings();

    // Start from the default value (5) and increase by one
    const thumb = poePage.goldValuationThumb;
    await thumb.focus();
    await poePage.page.keyboard.press("ArrowRight");
    await poePage.verifyGoldValuation(
      DEFAULT_EFFICIENCY_SETTINGS.goldValueChaosPer10k + 1,
    );
  });
});

test.describe("Settings Persistence", () => {
  test("should persist efficiency mode across page refresh", async ({
    poePage,
  }) => {
    await poePage.openEfficiencySettings();
    await poePage.selectEfficiencyMode("per-slot");
    await poePage.closeEfficiencySettings();

    // Wait for the debounced localStorage write
    await poePage.page.waitForTimeout(500);

    // Refresh page
    await poePage.refreshPage();

    // Verify setting persisted
    await poePage.openEfficiencySettings();
    await poePage.verifyEfficiencyMode("per-slot");
    await poePage.verifyEfficiencyColumnHeader(
      EFFICIENCY_MODES["per-slot"].columnLabel,
    );
  });

  test("should persist gold valuation across page refresh", async ({
    poePage,
  }) => {
    await poePage.openEfficiencySettings();
    await poePage.setGoldValuation(10);
    await poePage.closeEfficiencySettings();

    // Wait for the debounced localStorage write
    await poePage.page.waitForTimeout(500);

    // Refresh page
    await poePage.refreshPage();

    // Verify setting persisted
    await poePage.openEfficiencySettings();
    await poePage.verifyGoldValuation(10);
    await poePage.expectStorageKeyContains(EFFICIENCY_SETTINGS_STORAGE_KEY, {
      goldValueChaosPer10k: 10,
    });
  });

  test("should handle invalid localStorage data gracefully", async ({
    context,
  }) => {
    // Open page manually
    const newPage = await context.newPage();
    const newPoePage = new PoEDisenchantPage(newPage);

    // Set invalid localStorage data
    await newPage.addInitScript((key) => {
      localStorage.setItem(key, "invalid-json");
    }, EFFICIENCY_SETTINGS_STORAGE_KEY);
    await newPoePage.setup();

    // Should load with default settings
    await newPoePage.openEfficiencySettings();
    await newPoePage.verifyEfficiencyMode(DEFAULT_EFFICIENCY_SETTINGS.mode);
    await newPoePage.verifyGoldValuation(
      DEFAULT_EFFICIENCY_SETTINGS.goldValueChaosPer10k,
    );
  });

  test("should handle partial localStorage data gracefully", async ({
    context,
  }) => {
    // Open page manually
    const newPage = await context.newPage();
    const newPoePage = new PoEDisenchantPage(newPage);

    // Set partial localStorage data (missing mode)
    await newPage.addInitScript((key) => {
      localStorage.setItem(key, JSON.stringify({ goldValueChaosPer10k: 12 }));
    }, EFFICIENCY_SETTINGS_STORAGE_KEY);
    await newPoePage.setup();

    // The partial data should be merged with defaults
    await newPoePage.openEfficiencySettings();
    await newPoePage.verifyEfficiencyMode(DEFAULT_EFFICIENCY_SETTINGS.mode);
    await newPoePage.verifyGoldValuation(12);
  });

  test("should persist settings after force closing and reopening page", async ({
    poePage,
    context,
  }) => {
    await poePage.openEfficiencySettings();

    // Change settings (gold valuation first - slider is only visible in total-cost mode)
    await poePage.setGoldValuation(20);
    await poePage.selectEfficiencyMode("per-gold");

    // Close page
    await poePage.page.close();

    // Open new page
    const newPage = await context.newPage();
    const newPoePage = new PoEDisenchantPage(newPage);
    await newPoePage.setup();

    // Verify settings persisted
    await newPoePage.openEfficiencySettings();
    await newPoePage.verifyEfficiencyMode("per-gold");

    // The gold valuation section is only visible in total-cost mode, so switch
    // back to total-cost to confirm the value persisted
    await newPoePage.selectEfficiencyMode("total-cost");
    await newPoePage.verifyGoldValuation(20);
  });
});
