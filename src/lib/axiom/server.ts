import "server-only";

import { AxiomJSTransport, Logger, LogLevel } from "@axiomhq/logging";
import { nextJsFormatters } from "@axiomhq/nextjs";

import { axiom } from "@/lib/axiom/axiom";
import { isDevelopment } from "@/lib/utils-server";

type LogValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | LogRecord
  | LogValue[];

export type LogRecord = {
  [key: string]: LogValue;
};

type WideEvent = LogRecord & {
  outcome?: string;
  message?: string;
  event_name?: string;
};

const dataset = process.env.AXIOM_DATASET;

export const logger = new Logger(
  dataset
    ? {
        transports: [new AxiomJSTransport({ axiom, dataset })],
        formatters: nextJsFormatters,
      }
    : {
        transports: [
          {
            log() {
              return;
            },
            flush: async () => undefined,
          },
        ],
        formatters: nextJsFormatters,
      },
);

const baseMetadata = (): LogRecord => ({
  app: process.env.PDT_APP_NAME,
  version: process.env.PDT_APP_VERSION,
  commit_hash: process.env.VERCEL_GIT_COMMIT_SHA,
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  next_phase: process.env.NEXT_PHASE,
  deployment_url: process.env.VERCEL_URL,
  region: process.env.VERCEL_REGION,
});

export const normalizeError = (error: unknown): LogRecord | undefined => {
  if (error == null) return undefined;
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      cause:
        error.cause instanceof Error
          ? {
              name: error.cause.name,
              message: error.cause.message,
            }
          : error.cause == null
            ? undefined
            : String(error.cause),
    };
  }

  return {
    message: String(error),
  };
};

export const emitWideEvent = async (event: WideEvent) => {
  if (isDevelopment) {
    return;
  }

  const payload: WideEvent = {
    ...baseMetadata(),
    timestamp: new Date().toISOString(),
    ...event,
  };

  const level = payload.outcome === "error" ? LogLevel.error : LogLevel.info;
  logger.log(
    level,
    String(payload.message ?? payload.event_name ?? "event"),
    payload,
  );
  await logger.flush();
};
