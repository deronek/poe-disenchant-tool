# poe-disenchant-tool

![Vercel Deploy](https://deploy-badge.vercel.app/vercel/poe-disenchant-tool)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

Path of Exile tool for calculating unique item disenchanting efficiency across multiple leagues. Compares item market prices with Thaumaturgic Dust values and calculates gold fees for async trades.

## Usage

1. **Sort by Dust per Chaos** (default) to find the most efficient trades.
2. **Apply filters** to skip low dust value or high gold fee items.
3. **Use the trade link** on each item and purchase any available at a good price.
4. **Mark items as traded** afterwards.
5. **Stop** when Dust per Chaos drops below your target efficiency.
   - Community often uses **5,000+ Dust per Chaos** as a cut-off point.
6. Over time, the market will naturally refresh with new listings - **clear all marks** and repeat the process.
7. **Refresh the page** to see the latest data.

## Features

- Real-time price data from poe.ninja API (refreshed every 1 hour)
- Multi-league support
- Dust value calculations based on item type, level, and quality
- Smart catalyst recommendations for jewellery
- Filtering options:
  - Name
  - Price
  - Dust value
  - Gold fee
- Sorting options:
  - Dust per Chaos
  - Configurable efficiency metric: Dust per Chaos per slot, Dust per Gold, or Dust per Total Cost
  - Price
  - Dust value
  - Gold fee
- Persistent item marking with local storage
- Direct trade search integration with adjustable filter settings
- Low stock warnings for items with limited availability
- Responsive design with mobile card layout
- Dark/light theme support

### Dust Value

- **Weapons/Armors**: Use ilvl 84, q20 values
  - _Exception_: Quivers (cannot have quality) use ilvl 84, q0 values
- **Accessories**: Smart calculation based on catalyst cost vs benefit
  - If catalysted dust per chaos > non-catalyzed: use ilvl 84, q20 values
  - Otherwise: use ilvl 84, q0 values
  - Catalyst suggestions shown in the UI

### Key Metrics

- **Dust per Chaos**: `dustValue / chaosPrice`: Higher = more efficient
- **Dust per Chaos per Slot**: `dustPerChaos / itemSlots`: For comparing items with different slot counts
- **Gold Cost**: calculated fee for async trades
- **Dust per Gold**: `dustValue / goldFee`; higher is more Gold-efficient
- **Dust per Total Cost**: dust divided by price including user-defined Chaos value of Gold

### Advanced Trade Settings

- Minimum Item Level
- Include Corrupted
- Online Status:
  - Instant Buyout & In-Person
  - Instant Buyout Only
  - In-Person Only
  - Any (Possibly Offline)
- Listing Time
  - Any time, Up to an hour, Up to 3 hours
  - Up to 12 hours, Up to a day, Up to 3 days, Up to a week

## Tech Stack

- Next.js 16, React 19, TypeScript
- Tailwind CSS 4, shadcn/ui
- TanStack Table for data management
- Zod for data validation
- Vitest for unit testing
- Playwright for E2E testing

## Development

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000

## Data Sources

- **Prices**: poe.ninja API for real-time market data
- **Dust Values**: Community-sourced mappings, based on [PoEDB.tw](https://poedb.tw)
- **Items**: Merges price and dust data to calculate efficiency metrics

## Credits

- @rasmuskl for [poe.ninja](https://poe.ninja) API providing real-time market data
- @alserom for creating [this list](https://gist.github.com/alserom/22bdd4106806cbd4f85a5cb8c4345c08#file-poe-dust-csv), used as the basis for dust value calculations
- [PoEDB.tw](https://poedb.tw) for comprehensive unique item data

## License

MIT
