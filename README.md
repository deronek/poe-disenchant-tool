# poe-disenchant-tool

![Vercel Deploy](https://deploy-badge.vercel.app/vercel/poe-disenchant-tool)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

Path of Exile tool for calculating unique item disenchanting efficiency in Kingsmarch. Compares item market prices with Thaumaturgic Dust values.

## Usage

1. **Sort by Dust per Chaos** (default) to find the most efficient trades.
2. **Apply a price filter** to skip low-value items.
3. **Use the trade link** on each item and purchase any available at a good price.
4. **Mark items as traded** afterwards.
5. **Stop** when Dust per Chaos drops below your target efficiency.
   - Community often uses **5,000+ Dust per Chaos** as a cut-off point.
6. Over time, the market will naturally refresh with new listings - **clear all marks** and repeat the process.
7. **Refresh the page** to see the latest data.

## Features

- Real-time price data from poe.ninja API (refreshed every 15 minutes)
- Dust value calculations based on item type and level
- Filtering (name, price range)
- Sorting (dust per chaos, dust value, price, name)
- Persistent item marking with local storage
- Direct trade search integration
- Responsive design with mobile card layout
- Dark/light theme support

## Tech Stack

- Next.js 15, React 19, TypeScript
- Tailwind CSS 4, shadcn/ui
- TanStack Table for data management
- Zod for data validation

## Development

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000

## Data Sources

- **Prices**: poe.ninja API
- **Dust Values**: Community-sourced mappings, based on [PoEDB.tw](https://poedb.tw)
- **Items**: Merges price and dust data to calculate efficiency

## Calculations

- **Dust Value**:
  - Weapons/armors use ilvl 84, q20 values
  - Accessories use ilvl84, q0 values
- **Dust per Chaos**: `dustValue / chaosPrice` (higher = more efficient)
- **Variant Handling**: Deduplicates 5L/6Ls, relics and base variants and keeps the cheapest options

## Credits

- @rasmuskl for [poe.ninja](https://poe.ninja) API
- @alserom for creating [this list](https://gist.github.com/alserom/22bdd4106806cbd4f85a5cb8c4345c08#file-poe-dust-csv), used for basis of dust value of uniques
- [PoEDB.tw](https://poedb.tw) for unique item data

## License

MIT
