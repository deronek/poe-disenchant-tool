import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { CurrencyDataStatus } from "@/components/currency-data-status";

const CURRENCY_MESSAGE = "Currency rates unavailable";
const CATALYST_MESSAGE = "Catalyst price unavailable";

function renderStatus({
  usedDefaultCatalystPrice = false,
  divinePriceThreshold = 160,
}: {
  usedDefaultCatalystPrice?: boolean;
  divinePriceThreshold?: number | null;
}) {
  return render(
    <CurrencyDataStatus
      status={{ usedDefaultCatalystPrice }}
      divinePriceThreshold={divinePriceThreshold}
    />,
  );
}

function expectStatusVisibility({
  currencyVisible,
  catalystVisible,
}: {
  currencyVisible: boolean;
  catalystVisible: boolean;
}) {
  const currencyMessage = screen.queryAllByText(CURRENCY_MESSAGE);
  const catalystMessage = screen.queryAllByText(CATALYST_MESSAGE);

  if (currencyVisible) {
    expect(currencyMessage.length).toBeGreaterThan(0);
  } else {
    expect(currencyMessage).toHaveLength(0);
  }

  if (catalystVisible) {
    expect(catalystMessage.length).toBeGreaterThan(0);
  } else {
    expect(catalystMessage).toHaveLength(0);
  }
}

describe("CurrencyDataStatus", () => {
  afterEach(cleanup);

  it("renders nothing when both currency and catalyst are healthy", () => {
    const { container } = renderStatus({});

    expect(container.firstChild).toBeNull();
  });

  it.each([
    {
      name: "renders only the currency pill when currency data is degraded",
      props: { divinePriceThreshold: null },
      expected: { currencyVisible: true, catalystVisible: false },
    },
    {
      name: "renders only the catalyst pill when catalyst data is degraded",
      props: { usedDefaultCatalystPrice: true },
      expected: { currencyVisible: false, catalystVisible: true },
    },
    {
      name: "renders both pills when both data sources are degraded",
      props: { usedDefaultCatalystPrice: true, divinePriceThreshold: null },
      expected: { currencyVisible: true, catalystVisible: true },
    },
    {
      name: "renders no pills when neither data source is degraded",
      props: {},
      expected: { currencyVisible: false, catalystVisible: false },
    },
  ])("$name", ({ props, expected }) => {
    renderStatus(props);

    expectStatusVisibility(expected);
  });
});
