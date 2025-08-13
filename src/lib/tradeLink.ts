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
  const payload: TradePayload = {
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
      },
    },
    sort: {
      price: "asc",
    },
  };

  // Add item level filter if minItemLevel is specified and greater than 1
  if (settings?.minItemLevel && settings.minItemLevel > 1) {
    if (!payload.query.filters) {
      payload.query.filters = {};
    }
    if (!payload.query.filters.type_filters) {
      payload.query.filters.type_filters = {
        filters: {},
      };
    }
    payload.query.filters.type_filters.filters.ilvl = {
      min: settings.minItemLevel,
      max: 84,
    };
  }

  // Add corrupted filter if specified
  if (settings?.includeCorrupted !== undefined) {
    if (!payload.query.filters) {
      payload.query.filters = {};
    }
    if (!payload.query.filters.type_filters) {
      payload.query.filters.type_filters = {
        filters: {},
      };
    }
    payload.query.filters.type_filters.filters.corrupted = {
      option: settings.includeCorrupted ? "true" : "false",
    };
  }

  const baseLink = `https://www.pathofexile.com/trade/search/Mercenaries?q=`;
  return baseLink + encodeURIComponent(JSON.stringify(payload));
};
