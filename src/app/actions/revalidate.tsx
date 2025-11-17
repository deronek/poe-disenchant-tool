import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { getItems } from "@/lib/itemData";
import { isValidLeague } from "@/lib/leagues";

function normalizeOrigin(origin: string) {
  return origin.replace(/\/$/, "");
}

function buildAllowlistOrigins(): Set<string> {
  const out = new Set<string>();

  if (process.env.VERCEL_URL) {
    out.add(normalizeOrigin(`https://${process.env.VERCEL_URL}`));
  }
  if (process.env.VERCEL_BRANCH_URL) {
    out.add(normalizeOrigin(`https://${process.env.VERCEL_BRANCH_URL}`));
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    out.add(
      normalizeOrigin(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`),
    );
  }
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    out.add(normalizeOrigin(`https://${process.env.NEXT_PUBLIC_VERCEL_URL}`));
  }

  const raw = process.env.ALLOWED_ORIGINS || "";
  raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach((s) => {
      if (!/^https?:\/\//i.test(s)) {
        out.add(normalizeOrigin(`https://${s}`));
      } else {
        out.add(normalizeOrigin(s));
      }
    });

  // local dev
  out.add("http://localhost:3000");
  out.add("http://127.0.0.1:3000");

  return out;
}

function isIpLiteral(hostname: string) {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname);
}

function throwHttpError(message: string, status = 400): never {
  console.log("throwHttpError", message, status);
  throw new Response(message, { status });
}

function validateOriginAllowed(
  originFromClient: string,
  allowlist: Set<string>,
) {
  let originUrl: URL;
  try {
    originUrl = new URL(originFromClient);
  } catch {
    throwHttpError("Invalid origin format", 400);
  }

  const normalized = normalizeOrigin(originUrl.origin);
  if (!allowlist.has(normalized)) {
    throwHttpError("Origin not allowed", 403);
  }

  // Disallow IP literals except explicit localhost (127.0.0.1 is allowed)
  const hostname = originUrl.hostname;
  if (isIpLiteral(hostname) && hostname !== "127.0.0.1") {
    throwHttpError("IP address origins are not allowed", 403);
  }

  const isLocalDev =
    normalized === "http://localhost:3000" ||
    normalized === "http://127.0.0.1:3000";

  // Enforce https for non-localhost origins
  if (!isLocalDev && originUrl.protocol !== "https:") {
    throwHttpError("Only https origins are allowed in production", 403);
  }

  return normalized;
}

async function warmOrigin(fullWarmUrl: string) {
  console.debug("Warming origin", fullWarmUrl);
  const requestCookies = (await cookies()).toString();

  const res = await fetch(fullWarmUrl, {
    method: "GET",
    redirect: "manual", // don't follow redirects
    headers: {
      cookie: requestCookies,
    },
  });

  // Treat redirects or non-OK as upstream/bad-gateway
  if (res.status >= 300 && res.status < 400) {
    throwHttpError(
      `Warm request redirected (status ${res.status}) — aborting`,
      502,
    );
  }
  if (!res.ok) {
    throwHttpError(`Warm request failed with status ${res.status}`, 502);
  }

  const xVercel =
    res.headers.get("x-vercel-cache") ??
    res.headers.get("x-nextjs-cache") ??
    null;
  return { status: res.status, xVercel };
}

export async function revalidateDataAction(
  originFromClient: string,
  league: string,
) {
  "use server";

  if (!originFromClient) {
    throwHttpError("Missing origin", 400);
  }

  if (!league) {
    throwHttpError("Missing league parameter", 400);
  }

  if (!isValidLeague(league)) {
    throwHttpError(`Invalid league parameter: ${league}`, 400);
  }

  const now = Date.now();
  const { lastUpdated } = await getItems(league);

  const age = now - lastUpdated;

  // 30 minutes
  if (age < 30 * 60 * 1000) {
    console.debug("Data was not revalidated");
    // Client will call router.refresh() to get the latest data
    return { didRevalidate: false, lastUpdated: lastUpdated };
  }

  try {
    const allowlist = buildAllowlistOrigins();
    console.debug("allowlist", allowlist);
    const normalizedOrigin = validateOriginAllowed(originFromClient, allowlist);

    // Revalidate specific league page
    revalidatePath(`/${league}`, "page");
    const fullWarmUrl = `${normalizedOrigin}/${league}`;
    await warmOrigin(fullWarmUrl);

    return {
      // Next.js should automatically deliver newest RSC data to client, but sometimes doesn't
      didRevalidate: true,
      // Below timestamp is not exactly the data timestamp, but we can't retrieve it at this point
      // because cache can still be stale
      lastUpdated: now,
    };
  } catch (err) {
    // If we've thrown a Response via throwHttpError, it already propagated as the proper HTTP code.
    // Any other unexpected errors become 500.
    if (err instanceof Response) throw err;
    console.error("Unexpected revalidation error:", err);
    throw new Response("Internal server error during revalidation", {
      status: 500,
    });
  }
}
