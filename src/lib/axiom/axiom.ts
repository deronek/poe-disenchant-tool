import "server-only";

import { Axiom } from "@axiomhq/js";

import { isDevelopment } from "@/lib/utils-server";

const axiomToken = process.env.AXIOM_TOKEN?.trim();

if (!axiomToken && !isDevelopment) {
  console.error("Missing Axiom token");
}

// The SDK warns during construction when token is empty. Skip client
// initialization entirely in that case so local dev does not spam logs.
export const axiom = axiomToken ? new Axiom({ token: axiomToken }) : null;
