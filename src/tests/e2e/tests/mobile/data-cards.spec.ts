// Not tested here by design: divine/chaos price display (cards render a
// chaos-only compact value; the divine split is covered on desktop in
// tests/desktop/data-table.spec.ts)
import type { CardMetricLabel } from "../../page-pom/page-mobile";
import { expect, testMobile as test } from "../../fixtures";

const METRIC_LABELS = [
  "Price",
  "Dust Value",
  "Gold Fee",
  "Dust per Chaos",
] as const satisfies readonly CardMetricLabel[];

test.describe("Card Content Rendering", () => {
  test("should display all metric labels on every card", async ({
    poePage,
  }) => {
    const names = await poePage.getCardNames(5);
    expect(names.length).toBeGreaterThan(0);

    for (const name of names) {
      const card = poePage.mobileCard(name);
      for (const label of METRIC_LABELS) {
        await expect(card.getByText(label, { exact: true })).toBeVisible();
      }
      // Dynamic efficiency label, e.g. "Efficiency · Total Cost"
      await expect(card.getByText(/^Efficiency · \S/)).toBeVisible();
    }
  });

  test("should display item icon, name and selection checkbox", async ({
    poePage,
  }) => {
    const names = await poePage.getCardNames(5);

    for (const name of names) {
      const card = poePage.mobileCard(name);
      await expect(card.locator("img").first()).toBeVisible();
      await expect(
        card.getByRole("checkbox", { name: `Mark ${name} as completed` }),
      ).toBeVisible();
    }
  });

  test("should display quality type for all cards", async ({ poePage }) => {
    const names = await poePage.getCardNames(10);

    for (const name of names) {
      const qualityType = await poePage.getCardQualityType(name);
      expect(qualityType).toMatch(/^(q20|q0)$/);
    }
  });

  test("should render parseable numeric values for all metrics", async ({
    poePage,
  }) => {
    const names = await poePage.getCardNames(5);

    for (const name of names) {
      for (const label of METRIC_LABELS) {
        const raw = await poePage.getCardMetricValue(name, label);
        const value = poePage.parseCompactValue(raw);
        expect(value, `${label} of "${name}"`).toBeGreaterThan(0);
      }

      const efficiencyRaw = await poePage.getCardMetricValue(
        name,
        "Efficiency",
      );
      expect(
        poePage.parseCompactValue(efficiencyRaw),
        `Efficiency of "${name}"`,
      ).toBeGreaterThan(0);
    }
  });

  test("should render the mode-appropriate efficiency unit marker", async ({
    poePage,
  }) => {
    const [first] = await poePage.getCardNames(1);
    const metric = poePage.cardMetric(first!, "Efficiency");

    await expect(metric.getByLabel("Total Cost")).toBeVisible();
    await expect(metric).not.toContainText(/slot/);

    await poePage.setEfficiencyMode("per-slot");
    await expect(metric.getByText(/\d+ slots?/)).toBeVisible();

    await poePage.setEfficiencyMode("per-gold");
    await expect(metric.locator("img[alt='Gold']")).toBeVisible();
  });
});

test.describe("Card Info Popovers", () => {
  const infoPopovers = [
    "Learn more about item marking",
    "Learn more about dust value calculation",
    "Learn more about gold fee",
  ];

  for (const button of infoPopovers) {
    test(`should open and close the "${button}" popover on tap`, async ({
      poePage,
    }) => {
      const [name] = await poePage.getCardNames(1);

      const popover = await poePage.openCardInfoPopover(name, button);
      await expect(popover.locator("h4").first()).toHaveText(/.+/);

      const trigger = poePage
        .mobileCard(name)
        .getByRole("button", { name: button });
      await trigger.click();
      await expect(popover).not.toBeVisible();
    });
  }

  test("should open the total cost breakdown popover on tap", async ({
    poePage,
  }) => {
    const [name] = await poePage.getCardNames(1);

    const popover = await poePage.openCardInfoPopover(
      name,
      `Show total cost breakdown for ${name}`,
    );
    await expect(popover).toContainText(/total cost/i);
  });

  test("should dismiss a card info popover on outside tap", async ({
    poePage,
  }) => {
    const [name] = await poePage.getCardNames(1);

    await poePage.openCardInfoPopover(name, "Learn more about item marking");
    await poePage.pageTitle.click();
    await expect(
      poePage.page.locator("[data-slot='popover-content']").filter({
        visible: true,
      }),
    ).not.toBeVisible();
  });

  for (const [badgeKind, badgeLabel] of [
    ["low stock", (name: string) => `Low stock details for ${name}`],
    ["catalyst", () => "Catalyst recommendation details"],
  ] as const) {
    test(`should open the ${badgeKind} popover for items showing the badge`, async ({
      poePage,
    }) => {
      await poePage.sortByOption("Dust Value");
      const names = await poePage.getCardNames(20);
      let tested = false;

      for (const name of names) {
        const badge = poePage
          .mobileCard(name)
          .getByRole("button", { name: badgeLabel(name) });
        if ((await badge.count()) === 0) continue;

        await badge.click();
        const popover = poePage.page
          .locator("[data-slot='popover-content']")
          .filter({ visible: true });
        await expect(popover).toBeVisible();
        await badge.click();
        await expect(popover).not.toBeVisible();
        tested = true;
        break;
      }

      expect(
        tested,
        `No ${badgeKind} items among the top 20 cards by dust value`,
      ).toBe(true);
    });
  }
});
