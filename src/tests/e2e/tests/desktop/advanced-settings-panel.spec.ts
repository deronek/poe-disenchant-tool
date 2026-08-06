import {
  ADVANCED_SETTINGS_STORAGE_KEY,
  DEFAULT_ADVANCED_SETTINGS,
  LEGACY_ADVANCED_SETTINGS_STORAGE_KEY_V1,
  LEGACY_MIN_ITEM_LEVEL_DEFAULT_V1,
} from "@/lib/advanced-settings";
import {
  LISTING_TIME_LABELS,
  ListingTimeFilterSchema,
  MIN_ITEM_LEVEL_RANGE,
  ONLINE_STATUS_LABELS,
  OnlineStatusSchema,
} from "@/lib/filters";
import { expect, test } from "../../fixtures";
import { PoEDisenchantPage } from "../../poe-page";

test.describe("Panel Open/Close", () => {
  test("should display advanced settings trigger button", async ({
    poePage,
  }) => {
    await expect(poePage.advancedSettingsTrigger).toBeVisible();
    await expect(poePage.advancedSettingsTrigger).toBeEnabled();
  });

  test("should open advanced settings panel on click", async ({ poePage }) => {
    await poePage.openAdvancedSettings();
    await expect(poePage.advancedSettingsPopover).toBeVisible();
  });

  test("should close advanced settings panel with close button", async ({
    poePage,
  }) => {
    await poePage.openAdvancedSettings();
    await poePage.closeAdvancedSettings();
    await expect(poePage.advancedSettingsPopover).not.toBeVisible();
  });

  test("should close advanced settings panel with escape key", async ({
    poePage,
  }) => {
    await poePage.openAdvancedSettings();
    await poePage.page.keyboard.press("Escape");
    await expect(poePage.advancedSettingsPopover).not.toBeVisible();
  });

  test("should close advanced settings panel with outside click", async ({
    poePage,
  }) => {
    await poePage.openAdvancedSettings();
    await poePage.pageTitle.click();
    await expect(poePage.advancedSettingsPopover).not.toBeVisible();
  });
});

test.describe("Minimum Item Level Slider", () => {
  test("should display minimum item level slider", async ({ poePage }) => {
    await poePage.openAdvancedSettings();
    await expect(poePage.minItemLevelSlider).toBeVisible();
  });

  test("should display default minimum item level value", async ({
    poePage,
  }) => {
    await poePage.openAdvancedSettings();
    await poePage.verifyMinItemLevel(DEFAULT_ADVANCED_SETTINGS.minItemLevel);
  });

  test("should display slider range labels with min and max values", async ({
    poePage,
  }) => {
    await poePage.openAdvancedSettings();
    await expect(poePage.minItemLevelRangeMin).toHaveText(
      MIN_ITEM_LEVEL_RANGE.min.toString(),
    );
    await expect(poePage.minItemLevelRangeMax).toHaveText(
      MIN_ITEM_LEVEL_RANGE.max.toString(),
    );
  });

  test("should update minimum item level when slider is moved", async ({
    poePage,
  }) => {
    await poePage.openAdvancedSettings();
    await poePage.setMinItemLevel(70);
    await poePage.verifyMinItemLevel(70);
    await poePage.verifyTradeLinkSettings({ minItemLevel: 70 });
  });

  test("should update minimum item level to minimum value", async ({
    poePage,
  }) => {
    await poePage.openAdvancedSettings();
    await poePage.setMinItemLevel(MIN_ITEM_LEVEL_RANGE.min);
    await poePage.verifyMinItemLevel(MIN_ITEM_LEVEL_RANGE.min);
    await poePage.verifyTradeLinkSettings({
      minItemLevel: MIN_ITEM_LEVEL_RANGE.min,
    });
  });

  test("should update minimum item level to maximum value", async ({
    poePage,
  }) => {
    await poePage.openAdvancedSettings();
    await poePage.setMinItemLevel(MIN_ITEM_LEVEL_RANGE.max);
    await poePage.verifyMinItemLevel(MIN_ITEM_LEVEL_RANGE.max);
    await poePage.verifyTradeLinkSettings({
      minItemLevel: MIN_ITEM_LEVEL_RANGE.max,
    });
  });
});

test.describe("Include Corrupted Items Checkbox", () => {
  test("should display include corrupted items checkbox", async ({
    poePage,
  }) => {
    await poePage.openAdvancedSettings();
    await expect(poePage.includeCorruptedCheckbox).toBeVisible();
  });

  test("should have include corrupted items checked by default", async ({
    poePage,
  }) => {
    await poePage.openAdvancedSettings();
    await poePage.verifyIncludeCorrupted(
      DEFAULT_ADVANCED_SETTINGS.includeCorrupted,
    );
  });

  test("should toggle include corrupted items checkbox", async ({
    poePage,
  }) => {
    await poePage.openAdvancedSettings();

    // Uncheck
    await poePage.setIncludeCorrupted(false);
    await poePage.verifyIncludeCorrupted(false);
    await poePage.verifyTradeLinkSettings({ includeCorrupted: false });

    // Check again
    await poePage.setIncludeCorrupted(true);
    await poePage.verifyIncludeCorrupted(true);
    await poePage.verifyTradeLinkSettings({ includeCorrupted: true });
  });
});

test.describe("Listing Time Filter", () => {
  test("should display listing time filter dropdown", async ({ poePage }) => {
    await poePage.openAdvancedSettings();
    await expect(poePage.listingTimeFilterTrigger).toBeVisible();
  });

  test("should display default listing time filter value", async ({
    poePage,
  }) => {
    await poePage.openAdvancedSettings();
    await poePage.verifyListingTimeFilter("3days");
  });

  test("should display all listing time filter options", async ({
    poePage,
  }) => {
    await poePage.openAdvancedSettings();
    await poePage.listingTimeFilterTrigger.click();

    const options = poePage.page.getByRole("option");
    const optionTexts = await options.allInnerTexts();

    for (const label of Object.values(LISTING_TIME_LABELS)) {
      expect(optionTexts).toContain(label);
    }
  });

  ListingTimeFilterSchema.options.forEach((value) => {
    test(`should select listing time filter option: ${LISTING_TIME_LABELS[value]}`, async ({
      poePage,
    }) => {
      await poePage.openAdvancedSettings();
      await poePage.selectListingTimeFilter(value);
      await poePage.verifyListingTimeFilter(value);
      await poePage.verifyTradeLinkSettings({
        listingTimeFilter: value,
      });
    });
  });
});

test.describe("Online Status Filter", () => {
  test("should display online status filter dropdown", async ({ poePage }) => {
    await poePage.openAdvancedSettings();
    await expect(poePage.onlineStatusFilterTrigger).toBeVisible();
  });

  test("should display default online status filter value", async ({
    poePage,
  }) => {
    await poePage.openAdvancedSettings();
    await poePage.verifyOnlineStatusFilter("available");
  });

  test("should display all online status filter options", async ({
    poePage,
  }) => {
    await poePage.openAdvancedSettings();
    await poePage.onlineStatusFilterTrigger.click();

    const options = poePage.page.getByRole("option");
    const optionTexts = await options.allInnerTexts();

    for (const label of Object.values(ONLINE_STATUS_LABELS)) {
      expect(optionTexts).toContain(label);
    }
  });

  OnlineStatusSchema.options.forEach((value) => {
    test(`should select online status filter option: ${ONLINE_STATUS_LABELS[value]}`, async ({
      poePage,
    }) => {
      await poePage.openAdvancedSettings();
      await poePage.selectOnlineStatusFilter(value);
      await poePage.verifyOnlineStatusFilter(value);
      await poePage.verifyTradeLinkSettings({
        onlineStatus: value,
      });
    });
  });
});

test.describe("Reset Button", () => {
  test("should display reset button", async ({ poePage }) => {
    await poePage.openAdvancedSettings();
    await expect(poePage.advancedSettingsResetButton).toBeVisible();
  });

  test("should disable reset button when settings are at defaults", async ({
    poePage,
  }) => {
    await poePage.openAdvancedSettings();
    await poePage.verifyResetButtonDisabled(true);
  });

  test("should enable reset button when settings are changed", async ({
    poePage,
  }) => {
    await poePage.openAdvancedSettings();

    // Change a setting
    await poePage.setMinItemLevel(70);
    await poePage.verifyResetButtonDisabled(false);
  });

  test("should reset all settings to defaults when reset button is clicked", async ({
    poePage,
  }) => {
    await poePage.openAdvancedSettings();

    // Change multiple settings
    await poePage.setMinItemLevel(70);
    await poePage.setIncludeCorrupted(false);
    await poePage.selectListingTimeFilter("1hour");
    await poePage.selectOnlineStatusFilter("securable");

    // Click reset
    await poePage.advancedSettingsResetButton.click();

    // Verify all settings are back to defaults
    await poePage.verifyAllDefaultSettings();

    // Verify trade link has default settings
    await poePage.verifyTradeLinkSettings({
      minItemLevel: DEFAULT_ADVANCED_SETTINGS.minItemLevel,
      includeCorrupted: DEFAULT_ADVANCED_SETTINGS.includeCorrupted,
      listingTimeFilter: DEFAULT_ADVANCED_SETTINGS.listingTimeFilter,
      onlineStatus: DEFAULT_ADVANCED_SETTINGS.onlineStatus,
    });
  });

  test("should reset only one changed setting back to default", async ({
    poePage,
  }) => {
    await poePage.openAdvancedSettings();

    // Change only one setting
    await poePage.setMinItemLevel(70);

    // Verify reset button is enabled
    await poePage.verifyResetButtonDisabled(false);

    // Click reset
    await poePage.advancedSettingsResetButton.click();

    // Verify only the changed setting is back to default
    await poePage.verifyAllDefaultSettings();

    // Verify trade link has default settings
    await poePage.verifyTradeLinkSettings({
      minItemLevel: DEFAULT_ADVANCED_SETTINGS.minItemLevel,
      includeCorrupted: DEFAULT_ADVANCED_SETTINGS.includeCorrupted,
      listingTimeFilter: DEFAULT_ADVANCED_SETTINGS.listingTimeFilter,
      onlineStatus: DEFAULT_ADVANCED_SETTINGS.onlineStatus,
    });
  });

  test("should reset two changed settings while one remains at default", async ({
    poePage,
  }) => {
    await poePage.openAdvancedSettings();

    // Change two settings (minItemLevel and includeCorrupted)
    // Leave listingTimeFilter and onlineStatus at defaults
    await poePage.setMinItemLevel(75);
    await poePage.setIncludeCorrupted(false);

    // Verify reset button is enabled
    await poePage.verifyResetButtonDisabled(false);

    // Click reset
    await poePage.advancedSettingsResetButton.click();

    // Verify all settings are back to defaults
    await poePage.verifyAllDefaultSettings();

    // Verify trade link has default settings
    await poePage.verifyTradeLinkSettings({
      minItemLevel: DEFAULT_ADVANCED_SETTINGS.minItemLevel,
      includeCorrupted: DEFAULT_ADVANCED_SETTINGS.includeCorrupted,
      listingTimeFilter: DEFAULT_ADVANCED_SETTINGS.listingTimeFilter,
      onlineStatus: DEFAULT_ADVANCED_SETTINGS.onlineStatus,
    });
  });
});

test.describe("Settings Persistence", () => {
  test("should persist minimum item level across page refresh", async ({
    poePage,
  }) => {
    await poePage.openAdvancedSettings();
    await poePage.setMinItemLevel(72);
    await poePage.closeAdvancedSettings();

    // Refresh page
    await poePage.refreshPage();

    // Verify setting persisted
    await poePage.openAdvancedSettings();
    await poePage.verifyMinItemLevel(72);
    await poePage.verifyTradeLinkSettings({ minItemLevel: 72 });
  });

  test("should persist include corrupted setting across page refresh", async ({
    poePage,
  }) => {
    await poePage.openAdvancedSettings();
    await poePage.setIncludeCorrupted(false);
    await poePage.closeAdvancedSettings();

    // Refresh page
    await poePage.refreshPage();

    // Verify setting persisted
    await poePage.openAdvancedSettings();
    await poePage.verifyIncludeCorrupted(false);
    await poePage.verifyTradeLinkSettings({ includeCorrupted: false });
  });

  test("should persist listing time filter across page refresh", async ({
    poePage,
  }) => {
    await poePage.openAdvancedSettings();
    await poePage.selectListingTimeFilter("12hours");
    await poePage.closeAdvancedSettings();

    // Refresh page
    await poePage.refreshPage();

    // Verify setting persisted
    await poePage.openAdvancedSettings();
    await poePage.verifyListingTimeFilter("12hours");
    await poePage.verifyTradeLinkSettings({
      listingTimeFilter: "12hours",
    });
  });

  test("should persist online status filter across page refresh", async ({
    poePage,
  }) => {
    await poePage.openAdvancedSettings();
    await poePage.selectOnlineStatusFilter("online");
    await poePage.closeAdvancedSettings();

    // Refresh page
    await poePage.refreshPage();

    // Verify setting persisted
    await poePage.openAdvancedSettings();
    await poePage.verifyOnlineStatusFilter("online");
    await poePage.verifyTradeLinkSettings({
      onlineStatus: "online",
    });
  });

  test("should persist all settings across page refresh", async ({
    poePage,
  }) => {
    await poePage.openAdvancedSettings();

    // Set all settings
    await poePage.setMinItemLevel(75);
    await poePage.setIncludeCorrupted(false);
    await poePage.selectListingTimeFilter("1day");
    await poePage.selectOnlineStatusFilter("securable");
    await poePage.closeAdvancedSettings();

    // Refresh page
    await poePage.refreshPage();

    // Verify all settings persisted
    await poePage.openAdvancedSettings();
    await poePage.verifyMinItemLevel(75);
    await poePage.verifyIncludeCorrupted(false);
    await poePage.verifyListingTimeFilter("1day");
    await poePage.verifyOnlineStatusFilter("securable");
    await poePage.verifyTradeLinkSettings({
      minItemLevel: 75,
      includeCorrupted: false,
      listingTimeFilter: "1day",
      onlineStatus: "securable",
    });
  });

  test("should persist all settings across league changes", async ({
    poePage,
  }) => {
    await poePage.openAdvancedSettings();

    // Set all settings
    await poePage.setMinItemLevel(75);
    await poePage.setIncludeCorrupted(false);
    await poePage.selectListingTimeFilter("1day");
    await poePage.selectOnlineStatusFilter("securable");
    await poePage.closeAdvancedSettings();

    // Change league
    await poePage.selectLeague("standard");
    await poePage.verifyLeagueSelected("standard");

    // Verify all settings persisted
    await poePage.openAdvancedSettings();
    await poePage.verifyMinItemLevel(75);
    await poePage.verifyIncludeCorrupted(false);
    await poePage.verifyListingTimeFilter("1day");
    await poePage.verifyOnlineStatusFilter("securable");
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
    }, ADVANCED_SETTINGS_STORAGE_KEY);
    await newPoePage.setup();

    // Should load with default settings
    await newPoePage.openAdvancedSettings();
    await newPoePage.verifyMinItemLevel(DEFAULT_ADVANCED_SETTINGS.minItemLevel);
    await newPoePage.verifyIncludeCorrupted(
      DEFAULT_ADVANCED_SETTINGS.includeCorrupted,
    );
  });

  test("should handle partial localStorage data gracefully", async ({
    context,
  }) => {
    // Open page manually
    const newPage = await context.newPage();
    const newPoePage = new PoEDisenchantPage(newPage);

    // Set partial localStorage data (missing some fields)
    await newPage.addInitScript((key) => {
      localStorage.setItem(key, JSON.stringify({ minItemLevel: 70 }));
    }, ADVANCED_SETTINGS_STORAGE_KEY);
    await newPoePage.setup();

    // Should load with defaults for missing fields
    await newPoePage.openAdvancedSettings();
    // The partial data should be merged with defaults, so minItemLevel should be 70
    await newPoePage.verifyMinItemLevel(70);
    await newPoePage.verifyIncludeCorrupted(
      DEFAULT_ADVANCED_SETTINGS.includeCorrupted,
    );
  });

  test("should migrate legacy v1 settings on load", async ({ context }) => {
    // Open page manually
    const newPage = await context.newPage();
    const newPoePage = new PoEDisenchantPage(newPage);

    // Set legacy settings (minItemLevel at the old default) alongside custom values
    await newPage.addInitScript(
      ({ key, data }) => {
        localStorage.setItem(key, JSON.stringify(data));
      },
      {
        key: LEGACY_ADVANCED_SETTINGS_STORAGE_KEY_V1,
        data: {
          minItemLevel: LEGACY_MIN_ITEM_LEVEL_DEFAULT_V1,
          includeCorrupted: false,
          listingTimeFilter: "1day",
          onlineStatus: "available",
        },
      },
    );
    await newPoePage.setup();

    // The legacy default should be migrated to the new default (highest item level),
    // other settings should be transferred 1:1, and the legacy key should be removed
    await newPoePage.openAdvancedSettings();
    await newPoePage.verifyMinItemLevel(DEFAULT_ADVANCED_SETTINGS.minItemLevel);
    await newPoePage.verifyIncludeCorrupted(false);
    await newPoePage.verifyListingTimeFilter("1day");
    await newPoePage.expectStorageKey(
      LEGACY_ADVANCED_SETTINGS_STORAGE_KEY_V1,
      null,
    );
    await newPoePage.expectStorageKeyContains(ADVANCED_SETTINGS_STORAGE_KEY, {
      minItemLevel: DEFAULT_ADVANCED_SETTINGS.minItemLevel,
      includeCorrupted: false,
      listingTimeFilter: "1day",
      onlineStatus: "available",
    });
  });

  test("should migrate legacy v1 settings 1:1 when minItemLevel is custom", async ({
    context,
  }) => {
    // Open page manually
    const newPage = await context.newPage();
    const newPoePage = new PoEDisenchantPage(newPage);

    // Set legacy settings with a custom minItemLevel
    await newPage.addInitScript(
      ({ key, data }) => {
        localStorage.setItem(key, JSON.stringify(data));
      },
      {
        key: LEGACY_ADVANCED_SETTINGS_STORAGE_KEY_V1,
        data: {
          minItemLevel: 70,
          includeCorrupted: false,
          listingTimeFilter: "1day",
        },
      },
    );
    await newPoePage.setup();

    // The custom value should be transferred 1:1, and the legacy key should be removed
    await newPoePage.openAdvancedSettings();
    await newPoePage.verifyMinItemLevel(70);
    await newPoePage.verifyIncludeCorrupted(false);
    await newPoePage.verifyListingTimeFilter("1day");
    await newPoePage.expectStorageKey(
      LEGACY_ADVANCED_SETTINGS_STORAGE_KEY_V1,
      null,
    );
    await newPoePage.expectStorageKeyContains(ADVANCED_SETTINGS_STORAGE_KEY, {
      minItemLevel: 70,
      includeCorrupted: false,
      listingTimeFilter: "1day",
    });
  });

  test("should persist settings after force closing and reopening page", async ({
    poePage,
    context,
  }) => {
    await poePage.openAdvancedSettings();

    // Change settings
    await poePage.setMinItemLevel(72);
    await poePage.setIncludeCorrupted(false);

    // Close page
    await poePage.page.close();

    // Open new page
    const newPage = await context.newPage();
    const newPoePage = new PoEDisenchantPage(newPage);
    await newPoePage.setup();

    // Verify settings persisted
    await newPoePage.openAdvancedSettings();
    await newPoePage.verifyMinItemLevel(72);
    await newPoePage.verifyIncludeCorrupted(false);
  });
});

test.describe("Keyboard Navigation", () => {
  test("should open advanced settings panel with keyboard", async ({
    poePage,
  }) => {
    const trigger = poePage.advancedSettingsTrigger;
    await trigger.focus();
    await trigger.press("Enter");

    await expect(poePage.advancedSettingsPopover).toBeVisible();
  });

  test("should close advanced settings panel with escape key", async ({
    poePage,
  }) => {
    await poePage.openAdvancedSettings();
    await poePage.page.keyboard.press("Escape");
    await expect(poePage.advancedSettingsPopover).not.toBeVisible();
  });

  test("should adjust minimum item level with arrow keys", async ({
    poePage,
  }) => {
    await poePage.openAdvancedSettings();

    // Set a value below the max so the slider can be increased
    await poePage.setMinItemLevel(80);

    // Focus slider
    const slider = poePage.minItemLevelSlider;
    await slider.focus();

    // Press right arrow to increase
    await poePage.page.keyboard.press("ArrowRight");
    await expect(poePage.minItemLevelValue).toHaveText("81");
  });

  test("should toggle include corrupted checkbox with space key", async ({
    poePage,
  }) => {
    await poePage.openAdvancedSettings();

    // Focus checkbox
    const checkbox = poePage.includeCorruptedCheckbox;
    await checkbox.focus();

    // Get initial state
    const initialState = await poePage.isIncludeCorruptedChecked();

    // Press space to toggle
    await poePage.page.keyboard.press("Space");
    await expect(checkbox).toBeChecked({ checked: !initialState });
  });

  test("should open listing time filter dropdown with enter key", async ({
    poePage,
  }) => {
    await poePage.openAdvancedSettings();

    // Focus trigger
    const trigger = poePage.listingTimeFilterTrigger;
    await trigger.focus();

    // Press enter to open
    await poePage.page.keyboard.press("Enter");

    const content = poePage.listingTimeFilterContent;
    await expect(content).toBeVisible();
  });

  test("should select listing time filter option with keyboard", async ({
    poePage,
  }) => {
    await poePage.openAdvancedSettings();

    // Focus and open dropdown
    const trigger = poePage.listingTimeFilterTrigger;
    await trigger.focus();
    await poePage.page.keyboard.press("Enter");
    await poePage.page.waitForTimeout(300); // Need to wait for animation finish

    // Navigate to second option from default
    // Press ArrowDown once to move from current selection to next option
    await poePage.page.keyboard.press("ArrowDown");
    await poePage.page.keyboard.press("Enter");

    // Verify selection
    await poePage.verifyListingTimeFilter("1week");
  });

  test("should open online status filter dropdown with enter key", async ({
    poePage,
  }) => {
    await poePage.openAdvancedSettings();

    // Focus trigger
    const trigger = poePage.onlineStatusFilterTrigger;
    await trigger.focus();

    // Press enter to open
    await poePage.page.keyboard.press("Enter");

    const content = poePage.onlineStatusFilterContent;
    await expect(content).toBeVisible();
  });

  test("should select online status filter option with keyboard", async ({
    poePage,
  }) => {
    await poePage.openAdvancedSettings();

    // Focus and open dropdown
    const trigger = poePage.onlineStatusFilterTrigger;
    await trigger.focus();
    await poePage.page.keyboard.press("Enter");
    await expect(poePage.onlineStatusFilterContent).toBeVisible();
    await poePage.page.waitForTimeout(100); // Need to wait for animation finish

    // Navigate to second option (Instant Buyout)
    await poePage.page.keyboard.press("ArrowDown");
    await poePage.page.keyboard.press("Enter");

    // Verify selection
    await poePage.verifyOnlineStatusFilter("securable");
  });
});
