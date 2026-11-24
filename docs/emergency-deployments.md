# Emergency deployments during a price-data outage

Production deploys automatically from `main`. A normal deployment must fail when the price API returns no usable prices. The failed build does not replace the current production deployment.

An emergency code change can use a one-off build override. The resulting deployment reports the outage above the table. Filters and settings remain available, and the table shows "No results."

## Deployment behavior

| Deployment                       | Override                        | No usable prices                                        |
| -------------------------------- | ------------------------------- | ------------------------------------------------------- |
| Automatic deployment from `main` | Not set                         | Build fails; production stays on the current deployment |
| Manual emergency deployment      | `ALLOW_UNAVAILABLE_PRERENDER=1` | Build succeeds with an outage state                     |
| Runtime ISR revalidation         | Not used                        | Error propagates; Next.js keeps the last good page      |

The override is checked only during `next build`. It must not change price parsing or turn an empty response into a successful `ItemDataResult`.

A partial response still renders the usable items. The override is for builds with no usable price data.

## Deploy the emergency change

Push the change through the normal `main` workflow first. If its automatic deployment fails because price data is unavailable, record the failed deployment's commit SHA from GitHub or Vercel.

Create a fresh clone and check out that commit. Do not reuse an existing checkout. `vercel deploy` uploads the working directory, and a fresh clone avoids including local or ignored files.

```bash
git clone https://github.com/deronek/poe-disenchant-tool.git poe-disenchant-tool-emergency
cd poe-disenchant-tool-emergency
git switch --detach <failed-deployment-commit-sha>
git rev-parse HEAD
```

Do not continue unless the last command prints the failed deployment's commit SHA.

Authenticate with `vercel login` or set `VERCEL_TOKEN`. Then create a production deployment without assigning the production domain:

```bash
pnpm dlx vercel@latest deploy \
  --prod \
  --skip-domain \
  --project poe-disenchant-tool \
  --build-env ALLOW_UNAVAILABLE_PRERENDER=1
```

Add `--scope <team>` when the project belongs to a Vercel team.

`--build-env` applies the override to this build only. It does not add a runtime variable or change the project settings.

Open the deployment URL printed by the CLI. Check that:

- the page says price data is unavailable;
- the price-data warning replaces the currency and catalyst warnings;
- the table still has its filters and settings;
- the table shows "No results.";
- no current "last updated" time is shown;
- the leagues affected by the outage have the same explicit state.

Before promoting, check that `main` still points to the failed deployment's commit and production has not changed since you staged the emergency deployment. Coordinate with other deployers. Stop if either check fails; promoting would replace newer production code with an older build.

Promote the inspected deployment:

```bash
pnpm dlx vercel@latest promote <deployment-url>
```

For a break-glass deployment that should go live immediately, omit `--skip-domain` and the promotion step.

## Recovery

The manual deployment does not disable automatic Git deployments. Later pushes to `main` still run without the override and fail while price data is unavailable.

When the price API recovers, a successful ISR revalidation replaces the outage state with prices. There is no project setting to remove.

## Rules to keep

- Never save `ALLOW_UNAVAILABLE_PRERENDER` in Vercel Project Settings or a committed environment file. That would enable the fallback on automatic `main` builds.
- Use `--build-env`, not `--env`. Runtime failures must still propagate so ISR retains stale content.
- Do not return an empty item array from the price fetcher as an emergency fallback.
- Do not catch price failures at runtime to render the outage state. A successful fallback render can replace a good cached page.
- Do not show a new `lastUpdated` or JSON-LD `dateModified` timestamp when no prices were fetched.

Vercel CLI references: [build environment variables](https://vercel.com/docs/cli/deploy#build-env), [staged production deployments](https://vercel.com/docs/cli/deploying-from-cli#deploying-a-staged-production-build), and [promotion](https://vercel.com/docs/cli/promote).
