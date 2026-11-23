# Emergency deployments during a poe.ninja outage

Production deploys automatically from `main`. A normal deployment must fail when poe.ninja returns no usable prices. The failed build does not replace the current production deployment.

An emergency code change can use a one-off build override. The resulting deployment shows an explicit price-data outage message instead of an empty table.

## Deployment behavior

| Deployment                       | Override                        | No usable prices                                        |
| -------------------------------- | ------------------------------- | ------------------------------------------------------- |
| Automatic deployment from `main` | Not set                         | Build fails; production stays on the current deployment |
| Manual emergency deployment      | `ALLOW_UNAVAILABLE_PRERENDER=1` | Build succeeds with an outage page                      |
| Runtime ISR revalidation         | Not used                        | Error propagates; Next.js keeps the last good page      |

The override is checked only during `next build`. It must not change price parsing or turn an empty response into a successful `ItemDataResult`.

A partial response still renders the usable items. The override is for builds with no usable price data.

## Deploy the emergency change

Push the change through the normal `main` workflow first. If its automatic deployment fails because poe.ninja is down, deploy the same commit manually.

Run the CLI from a clean checkout at that commit. `vercel deploy` uploads the working directory, including uncommitted files.

```bash
git switch main
git pull
git status --short
```

Do not continue if the last command prints unexpected changes.

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
- the item table is absent;
- no current "last updated" time is shown;
- the leagues affected by the outage have the same explicit state.

Promote the inspected deployment:

```bash
pnpm dlx vercel@latest promote <deployment-url>
```

For a break-glass deployment that should go live immediately, omit `--skip-domain` and the promotion step.

## Recovery

The manual deployment does not disable automatic Git deployments. Later pushes to `main` still run without the override and fail if poe.ninja is still down.

After poe.ninja recovers, a successful ISR revalidation replaces the outage page with prices. There is no project setting to remove.

## Rules to keep

- Never save `ALLOW_UNAVAILABLE_PRERENDER` in Vercel Project Settings or a committed environment file. That would enable the fallback on automatic `main` builds.
- Use `--build-env`, not `--env`. Runtime failures must still propagate so ISR retains stale content.
- Do not return an empty item array from the price fetcher as an emergency fallback.
- Do not catch price failures at runtime to render the outage page. A successful fallback render can replace a good cached page.
- Do not show a new `lastUpdated` or JSON-LD `dateModified` timestamp when no prices were fetched.

Vercel CLI references: [build environment variables](https://vercel.com/docs/cli/deploy#build-env), [staged production deployments](https://vercel.com/docs/cli/deploying-from-cli#deploying-a-staged-production-build), and [promotion](https://vercel.com/docs/cli/promote).
