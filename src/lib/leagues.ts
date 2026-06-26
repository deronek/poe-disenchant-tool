export const LEAGUES = {
  standard: { name: "Standard", apiName: "Standard" },
  hardcore: { name: "Hardcore", apiName: "Hardcore" },
  ancestors: { name: "Ancestors", apiName: "Ancestors" },
  "hardcore-ancestors": {
    name: "Hardcore Ancestors",
    apiName: "Hardcore Ancestors",
  },
  mirage: { name: "Mirage", apiName: "Mirage" },
  "hardcore-mirage": { name: "Hardcore Mirage", apiName: "Hardcore Mirage" },
} as const;

export const ARCHIVED_LEAGUES = {
  keepers: { name: "Keepers", apiName: "Keepers" },
  "hardcore-keepers": {
    name: "Hardcore Keepers",
    apiName: "Hardcore Keepers",
  },
  mercenaries: {
    name: "Mercenaries",
    apiName: "Mercenaries",
  },
  "hardcore-mercenaries": {
    name: "Hardcore Mercenaries",
    apiName: "Hardcore Mercenaries",
  },
  "phrecia2.0": { name: "Phrecia 2.0", apiName: "Phrecia 2.0" },
  "phrecia2.0hc": {
    name: "Hardcore Phrecia 2.0",
    apiName: "Hardcore Phrecia 2.0",
  },
} as const;

export type League = keyof typeof LEAGUES;
export const LEAGUE_SLUGS = Object.keys(LEAGUES) as League[];
export const DEFAULT_LEAGUE: League = "ancestors";

export type ArchivedLeague = keyof typeof ARCHIVED_LEAGUES;
export const ARCHIVED_LEAGUE_SLUGS = Object.keys(
  ARCHIVED_LEAGUES,
) as ArchivedLeague[];

export const DATE_PUBLISHED_LEAGUES: Record<League, Date> = {
  standard: new Date("2025-06-01"),
  hardcore: new Date("2025-06-01"),
  ancestors: new Date("2026-06-26"),
  "hardcore-ancestors": new Date("2026-06-26"),
  mirage: new Date("2026-03-06"),
  "hardcore-mirage": new Date("2026-03-06"),
};

export function isValidLeague(slug: string): slug is League {
  return Object.hasOwn(LEAGUES, slug);
}

export function isArchivedLeague(slug: string): slug is ArchivedLeague {
  return Object.hasOwn(ARCHIVED_LEAGUES, slug);
}

export function getLeagueName(slug: League) {
  return LEAGUES[slug].name;
}

export function getLeagueApiName(slug: League) {
  return LEAGUES[slug].apiName;
}

export function getLeagueFromName(name: string): League | undefined {
  return LEAGUE_SLUGS.find((slug) => LEAGUES[slug].name === name);
}

export function getLeagueDatePublished(slug: League) {
  return DATE_PUBLISHED_LEAGUES[slug];
}

export function isNewLeague(slug: League): boolean {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  return DATE_PUBLISHED_LEAGUES[slug] > oneWeekAgo;
}

export function hasNewLeagues(): boolean {
  return LEAGUE_SLUGS.some(isNewLeague);
}
