import type { BrowserContext } from "@playwright/test";
import { expect, test } from "@playwright/test";

import { TITLE } from "@/lib/constants";
import { PoEDisenchantDesktopPage } from "../e2e/page-pom/page-desktop";

const productionURL = new URL(process.env.PRODUCTION_BASE_URL!);
const expectedCommitSha = process.env.PRODUCTION_EXPECTED_COMMIT_SHA;
const bypassHeaders = {
  "x-vercel-protection-bypass": process.env.VERCEL_AUTOMATION_BYPASS_SECRET!,
  "x-vercel-set-bypass-cookie": "true",
};

async function setBypassCookie(context: BrowserContext) {
  let url = productionURL;

  // Manual redirects prevent Playwright from forwarding these headers to another origin.
  for (let redirectCount = 0; redirectCount < 20; redirectCount++) {
    const response = await context.request.get(url.toString(), {
      headers: bypassHeaders,
      maxRedirects: 0,
    });
    const location = response.headers().location;
    if (!location) {
      expect(response.ok(), `Production returned ${response.status()}`).toBe(
        true,
      );
      return;
    }

    const redirectURL = new URL(location, url);
    expect(redirectURL.origin).toBe(productionURL.origin);
    url = redirectURL;
  }

  throw new Error("Production authentication exceeded 20 redirects");
}

test.beforeEach(async ({ context }) => {
  if (!expectedCommitSha) await setBypassCookie(context);
});

test("production renders plausible item data", async ({ page, context }) => {
  const poePage = new PoEDisenchantDesktopPage(page);

  if (expectedCommitSha) {
    await expect
      .poll(
        async () => {
          try {
            await setBypassCookie(context);
          } catch {
            return "Authentication failed";
          }

          try {
            const response = await page.goto("/", {
              waitUntil: "domcontentloaded",
            });
            if (!response?.ok()) {
              return `Production returned ${response?.status() ?? "no response"}`;
            }
            return (
              (await page.locator("html").getAttribute("data-commit-sha")) ??
              "Missing data-commit-sha"
            );
          } catch {
            return "Page load failed";
          }
        },
        { intervals: [30_000], timeout: 5 * 60 * 1000 },
      )
      .toBe(expectedCommitSha);
  } else {
    const response = await page.goto("/", { waitUntil: "domcontentloaded" });
    expect(response).not.toBeNull();
    expect(response!.ok()).toBe(true);
  }

  await poePage.waitForDataLoad();
  await poePage.waitForHydration();
  await expect(poePage.pageTitle).toHaveText(TITLE);
  await expect(poePage.leagueTable).toBeVisible();

  const items = await poePage.getTestItems(10);
  expect(items).toHaveLength(10);

  for (const item of items) {
    expect(item.name).not.toBe("");
    expect(item.baseType).not.toBe("");

    const numericValues = {
      price: item.price,
      dustValue: item.dustValue,
      dustPerChaos: item.dustPerChaos,
      efficiency: item.efficiency,
      goldCost: item.goldCost,
    };
    for (const [label, value] of Object.entries(numericValues)) {
      expect(Number.isFinite(value), `${item.name} ${label}`).toBe(true);
      expect(value, `${item.name} ${label}`).toBeGreaterThan(0);
    }
  }

  await poePage.verifyDateTimeAttribute(poePage.lastUpdatedElement);
});
