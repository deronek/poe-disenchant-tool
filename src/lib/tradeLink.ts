export interface TradeLinkSettings {
  minItemLevel?: number;
  includeCorrupted?: boolean;
}

interface TypeFilters {
  ilvl?: {
    min: number;
    max: number;
  };
  corrupted?: {
    option: string;
  };
}

interface TradeFilters {
  trade_filters?: {
    filters: {
      indexed: {
        option: string;
      };
    };
  };
  type_filters?: {
    filters: TypeFilters;
  };
}

interface TradeQuery {
  status: {
    option: string;
  };
  name: string;
  stats: Array<{
    type: string;
    filters: unknown[];
  }>;
  filters?: TradeFilters;
}

interface TradePayload {
  query: TradeQuery;
  sort: {
    price: string;
  };
}

export const createTradeLink = (name: string, settings?: TradeLinkSettings) => {
  const payload = {
    query: {
      status: {
        option: "online",
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
            indexed: {
              option: "3days",
            },
          },
        },
        misc_filters: {
          filters: {
            ...(settings?.minItemLevel !== undefined && {
              ilvl: {
                min: settings.minItemLevel,
              },
            }),
            ...(settings?.includeCorrupted === false && {
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

  const baseLink = `https://www.pathofexile.com/trade/search/Mercenaries?q=`;
  return baseLink + encodeURIComponent(JSON.stringify(payload));
};
