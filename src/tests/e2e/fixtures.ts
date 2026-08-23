import type { Page } from "@playwright/test";
import { test as base } from "@playwright/test";

import { PoEDisenchantDesktopPage } from "./page-pom/page-desktop";
import { PoEDisenchantMobilePage } from "./page-pom/page-mobile";

function makePoeFixture<T extends { setup(): Promise<void> }>(
  create: (page: Page) => T,
) {
  return base.extend<{ poePage: T }>({
    poePage: async ({ page }, use) => {
      const poePage = create(page);
      await poePage.setup();
      // eslint-disable-next-line react-hooks/rules-of-hooks -- fixture teardown callback is named `use`
      await use(poePage);
    },
  });
}

export const test = makePoeFixture(
  (page) => new PoEDisenchantDesktopPage(page),
);

export const testMobile = makePoeFixture(
  (page) => new PoEDisenchantMobilePage(page),
);

export const testVrt = base.extend<{ poePage: PoEDisenchantDesktopPage }>({
  poePage: async ({ page }, use) => {
    const poePage = new PoEDisenchantDesktopPage(page);
    await poePage.setup();
    // Wait for icons load
    await poePage.page.waitForLoadState("networkidle");
    // eslint-disable-next-line react-hooks/rules-of-hooks -- fixture teardown callback is named `use`
    await use(poePage);
  },
});

export { expect } from "@playwright/test";
