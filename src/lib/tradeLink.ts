export interface TradeLinkSettings {
  minItemLevel?: number;
  includeCorrupted?: boolean;
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
