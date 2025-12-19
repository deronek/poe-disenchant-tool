export const LEAGUES = {
  standard: { name: "Standard", apiName: "Standard" },
  hardcore: { name: "Hardcore", apiName: "Hardcore" },
  keepers: { name: "Keepers", apiName: "Keepers" },
  "hardcore-keepers": {
    name: "Hardcore Keepers",
    apiName: "Hardcore Keepers",
  },
} as const;

export const ARCHIVED_LEAGUES = {
  mercenaries: {
    name: "Mercenaries",
    apiName: "Mercenaries",
  },
  "hardcore-mercenaries": {
    name: "Hardcore Mercenaries",
    apiName: "Hardcore Mercenaries",
  },
} as const;

export type League = keyof typeof LEAGUES;
export const LEAGUE_SLUGS = Object.keys(LEAGUES) as League[];
export const DEFAULT_LEAGUE: League = "keepers";

export type ArchivedLeague = keyof typeof ARCHIVED_LEAGUES;
export const ARCHIVED_LEAGUE_SLUGS = Object.keys(
  ARCHIVED_LEAGUES,
) as ArchivedLeague[];

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
