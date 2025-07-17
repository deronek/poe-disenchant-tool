export const createTradeLink = (name: string) => {
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
      },
    },
    sort: {
      price: "asc",
    },
  };
  const baseLink = `https://www.pathofexile.com/trade/search/Mercenaries?q=`;
  return baseLink + encodeURIComponent(JSON.stringify(payload));
};
