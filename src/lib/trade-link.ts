import type { ListingTimeFilter } from "./filters/listing-time-filter";
import type { OnlineStatus } from "./filters/online-status";
import { League, LEAGUES } from "./leagues";

export interface TradeLinkSettings {
  minItemLevel: number;
  includeCorrupted: boolean;
  listingTimeFilter: ListingTimeFilter;
  onlineStatus: OnlineStatus;
}

/**
 * Type representing the parsed trade link payload structure
 */
export type TradeLinkPayload = {
  query: {
    status: {
      option: string;
    };
    name: string;
    stats: Array<{
      type: string;
      filters: Array<unknown>;
    }>;
    filters: {
      trade_filters: {
        filters: {
          indexed?: {
            option: string;
          };
        };
      };
      misc_filters: {
        filters: {
          ilvl: {
            min: number;
          };
          corrupted?: {
            option: boolean;
          };
        };
      };
    };
  };
  sort: {
    price: string;
  };
};

export const createTradeLink = (
  name: string,
  league: League,
  settings: TradeLinkSettings,
) => {
  const { onlineStatus, listingTimeFilter, minItemLevel, includeCorrupted } =
    settings;

  const payload = {
    query: {
      status: {
        option: onlineStatus,
      },
      name: name,
      stats: [
        {
          type: "and",
          filters: [],
        },
      ],
      filters: {
        trade_filters: {
          filters: {
            ...(listingTimeFilter !== "any" && {
              indexed: {
                option: listingTimeFilter,
              },
            }),
          },
        },
        misc_filters: {
          filters: {
            ilvl: {
              min: minItemLevel,
            },
            ...(includeCorrupted === false && {
              corrupted: {
                option: false,
              },
            }),
          },
        },
      },
    },
    sort: {
      price: "asc",
    },
  };

  const leagueName = LEAGUES[league].apiName;
  const baseLink = `https://www.pathofexile.com/trade/search/${leagueName}?q=`;
  return baseLink + encodeURIComponent(JSON.stringify(payload));
};
