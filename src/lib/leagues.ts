export const LEAGUES = {
  standard: { name: "Standard", apiName: "Standard" },
  hardcore: { name: "Hardcore", apiName: "Hardcore" },
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
export const DEFAULT_LEAGUE: League = "standard";

export type ArchivedLeague = keyof typeof ARCHIVED_LEAGUES;
export const ARCHIVED_LEAGUE_SLUGS = Object.keys(
  ARCHIVED_LEAGUES,
) as ArchivedLeague[];

export const DATE_PUBLISHED_LEAGUES: Record<League, Date> = {
  standard: new Date("2025-06-01"),
  hardcore: new Date("2025-06-01"),
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

export function hasNewLeagues(): boolean {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  return Object.values(DATE_PUBLISHED_LEAGUES).some(
    (publishedDate) => publishedDate > oneWeekAgo,
  );
}
