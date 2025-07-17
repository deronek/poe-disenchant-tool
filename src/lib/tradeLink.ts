//const baseLink = `https://www.pathofexile.com/trade/search/Mercenaries?q=%7B%22query%22%3A%7B%22filters%22%3A%7B%22type_filters%22%3A%7B%22filters%22%3A%7B%7D%7D%7D%2C%22name%22%3A%22${nameEncoded}%22%7D%7D`;
const a =
  "https://www.pathofexile.com/trade/search/Mercenaries?%7B%22query%22%3A%7B%22status%22%3A%7B%22option%22%3A%22online%22%7D%2C%22name%22%3A%22Breath%20of%20the%20Council%22%2C%22stats%22%3A%5B%7B%22type%22%3A%22and%22%2C%22filters%22%3A%5B%5D%7D%5D%2C%22filters%22%3A%7B%22trade_filters%22%3A%7B%22filters%22%3A%7B%22indexed%22%3A%7B%22option%22%3A%223days%22%7D%7D%7D%7D%7D%2C%22sort%22%3A%7B%22price%22%3A%22asc%22%7D%7D";
import { URLSearchParams } from "url";

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
