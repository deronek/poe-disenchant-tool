import { describe, expect, it } from "vitest";

import { getLeagueApiName, LEAGUE_SLUGS } from "@/lib/leagues";

describe("active leagues", () => {
  it("lists Covens leagues below Hardcore with their API names", () => {
    expect(LEAGUE_SLUGS.slice(0, 4)).toEqual([
      "standard",
      "hardcore",
      "covens",
      "hardcore-covens",
    ]);
    expect(getLeagueApiName("covens")).toBe("Covens");
    expect(getLeagueApiName("hardcore-covens")).toBe("Hardcore Covens");
  });
});
