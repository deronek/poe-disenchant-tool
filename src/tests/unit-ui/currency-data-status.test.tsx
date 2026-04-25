import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { CurrencyDataStatus } from "@/components/currency-data-status";

const okStatus = { usedDefaultCatalystPrice: false, error: null };
const catalystDegradedStatus = { usedDefaultCatalystPrice: true, error: null };

describe("CurrencyDataStatus", () => {
  afterEach(cleanup);

  it("renders nothing when both currency and catalyst are healthy", () => {
    const { container } = render(
      <CurrencyDataStatus status={okStatus} divinePriceThreshold={160} />,
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders the currency pill when divinePriceThreshold is null", () => {
    render(
      <CurrencyDataStatus status={okStatus} divinePriceThreshold={null} />,
    );

    expect(
      screen.getAllByText("Currency rates unavailable").length,
    ).toBeGreaterThan(0);
  });

  it("does not render the currency pill when divinePriceThreshold is set", () => {
    render(<CurrencyDataStatus status={okStatus} divinePriceThreshold={160} />);

    expect(screen.queryAllByText("Currency rates unavailable")).toHaveLength(0);
  });

  it("renders the catalyst pill when usedDefaultCatalystPrice is true", () => {
    render(
      <CurrencyDataStatus
        status={catalystDegradedStatus}
        divinePriceThreshold={160}
      />,
    );

    expect(
      screen.getAllByText("Catalyst price unavailable").length,
    ).toBeGreaterThan(0);
  });

  it("does not render the catalyst pill when usedDefaultCatalystPrice is false", () => {
    render(<CurrencyDataStatus status={okStatus} divinePriceThreshold={160} />);

    expect(screen.queryAllByText("Catalyst price unavailable")).toHaveLength(0);
  });

  it("renders both pills when both are degraded", () => {
    render(
      <CurrencyDataStatus
        status={catalystDegradedStatus}
        divinePriceThreshold={null}
      />,
    );

    expect(
      screen.getAllByText("Currency rates unavailable").length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Catalyst price unavailable").length,
    ).toBeGreaterThan(0);
  });

  it("does not render the catalyst pill when only currency is degraded", () => {
    render(
      <CurrencyDataStatus status={okStatus} divinePriceThreshold={null} />,
    );

    expect(screen.queryAllByText("Catalyst price unavailable")).toHaveLength(0);
  });

  it("does not render the currency pill when only catalyst is degraded", () => {
    render(
      <CurrencyDataStatus
        status={catalystDegradedStatus}
        divinePriceThreshold={160}
      />,
    );

    expect(screen.queryAllByText("Currency rates unavailable")).toHaveLength(0);
  });
});
