// src/lib/leagues.ts
export const LEAGUES = {
  standard: { name: "Standard", apiName: "Standard" },
  hardcore: { name: "Hardcore", apiName: "Hardcore" },
  mercenaries: { name: "Mercenaries", apiName: "Mercenaries" },
  "hardcore-mercenaries": {
    name: "Hardcore Mercenaries",
    apiName: "Hardcore Mercenaries",
  },
} as const;

export type League = keyof typeof LEAGUES;
export const LEAGUE_SLUGS = Object.keys(LEAGUES) as League[];
export const DEFAULT_LEAGUE: League = "mercenaries";

export function isValidLeague(slug: string): slug is League {
  return slug in LEAGUES;
}

export function getLeagueApiName(slug: League) {
  return LEAGUES[slug].apiName;
}
