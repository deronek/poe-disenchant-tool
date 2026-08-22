# poe-disenchant-tool

![Vercel Deploy](https://deploy-badge.vercel.app/vercel/poe-disenchant-tool)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

Path of Exile tool for calculating unique item disenchanting efficiency across multiple leagues. It compares market prices against Thaumaturgic Dust values to find which uniques are worth buying and disenchanting.

## Usage

1. Sort by Dust per Chaos to find the most efficient trades.
   - If you buy through async trades and pay the Gold Fee each time, use the Efficiency column in Dust / Total Cost mode instead so the fee is included.
2. Apply filters to skip items with low Dust Value or a high Gold Fee.
3. Open the trade link on an item and buy any listing at a good price.
4. Mark purchased items to track progress across sessions.
5. Stop once your sort metric drops below your target. A common cut-off for Dust per Chaos is 5,000.
6. Prices refresh hourly. When fresh listings appear, clear your marks and repeat.

## Features

- Market prices from the poe.ninja API, refreshed hourly
- Multi-league support
- Dust Value based on item level, quality and influences
- Gold Fee estimates for async trades
- Catalyst recommendations for jewellery based on catalyst market prices
- Configurable Efficiency metric (see [Efficiency](#efficiency))
- Trade search links that honor adjustable settings (see [Advanced trade settings](#advanced-trade-settings))
- Marks, filters, and user settings persist between sessions

### Dust Value

Dust values come from community-sourced mappings based on ilvl 84 data.

- Weapons and armor use q20 values.
  - Items that cannot have quality use q0 values instead.
- Jewellery uses whichever of two values yields more Dust per Chaos:
  - Catalyzed, meaning q20 values after buying 20 of the cheapest catalyst on the market.
  - Uncatalyzed, meaning q0 values as-is.
- Items worth catalyzing are highlighted in the table.

### Key metrics

- **Dust per Chaos.** `dustValue / chaosPrice`. Higher is more efficient.
- **Gold Fee.** The estimated gold cost charged by the trade site for async trades.
- **Dust per Gold.** `dustValue / goldFee`. Higher means more dust per gold spent.
- **Dust per Total Cost.** Dust divided by the item's total cost, which is its price plus your Gold valuation of the Gold Fee (see [Efficiency](#efficiency)).

### Efficiency

The Efficiency column ranks items using one of three selectable modes:

- **Dust / Total Cost.** The default mode. Adds the Gold Fee to the item price at your Gold valuation.
- **Dust / Chaos / Slot.** Divides Dust per Chaos by the item's inventory slot count, so small items compete with large ones.
- **Dust / Gold.** Ignores price and compares Dust Value against the Gold Fee.

In Total Cost mode each row shows a breakdown of the effective cost, including the catalyst purchase for jewellery worth catalyzing.

### Advanced trade settings

Trade search links honor these settings:

- Minimum Item Level, from 65 to 84. Defaults to 84 because dust values assume level 84 items, anything lower yields less dust than the listed value
- Include Corrupted Items, enabled by default
- Online Status, matching the options available on the trade site
- Listing Time, from Up to an hour ago to Up to a week ago

## Tech stack

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

Dev mode serves local price data from `data/prices/dev-data`, not live poe.ninja data. Catalyst and divine rates are hardcoded. Run `pnpm populate-devdata` to refresh that data from poe.ninja.

Other commands:

```bash
pnpm lint  # prettier check, eslint, typecheck
pnpm build # production build, fetches live prices from poe.ninja
```

Two files hold the dust data in `data/dust/`:

- `poe-dust-original.js`: the source dataset, with a raw dust value and inventory footprint per unique
- `poe-dust.js`: what the app reads, generated from the source by `pnpm dust:process`

The prebuild hook validates the generated file before every `pnpm build`. To validate or regenerate manually:

```bash
pnpm dust:validate # validate the current dataset
pnpm dust:process  # regenerate from source data, then validate
```

## Testing

All suites run on pull requests in CI. To run them locally:

### Unit tests

These cover implementations that needed verification rather than the whole codebase. `pnpm test:unit` runs logic tests in Node, and `pnpm test:unit:ui` renders components in jsdom.

### E2E tests

A large Playwright suite that drives the app in a real browser, currently desktop Chromium only. It runs slower than the other suites.

```bash
pnpm test:install # one-time setup: download browser binaries
pnpm test:desktop # headless run of the full suite
pnpm test:ui      # interactive mode
```

### Visual regression tests

CI only. Compare rendered pages against committed screenshots in light and dark themes to catch unintended visible changes. Intended visual changes get new snapshots through the Update VRT Snapshots workflow.

## Credits

- @rasmuskl for [poe.ninja](https://poe.ninja) and its API providing the price data
- @alserom for creating [this list](https://gist.github.com/alserom/22bdd4106806cbd4f85a5cb8c4345c08#file-poe-dust-csv), used as the basis for dust value calculations
- [PoEDB.tw](https://poedb.tw) for unique item and dust value data

## License

MIT
