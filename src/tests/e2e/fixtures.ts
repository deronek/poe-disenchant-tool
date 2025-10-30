import { test as base } from "@playwright/test";

import { PoEDisenchantPage } from "./poe-page";

export const test = base.extend<{ poePage: PoEDisenchantPage }>({
  poePage: async ({ page }, use) => {
    const poePage = new PoEDisenchantPage(page);
    await poePage.setup();
    // eslint-disable-next-line react-hooks/rules-of-hooks -- 💀
    await use(poePage);
  },
});

export { expect } from "@playwright/test";
