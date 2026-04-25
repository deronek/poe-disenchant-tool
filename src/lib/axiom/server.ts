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

const MAX_CAUSE_DEPTH = 3;

const normalizeErrorCause = (
  cause: unknown,
  depth: number,
): LogValue | undefined => {
  if (cause == null) {
    return undefined;
  }

  if (cause instanceof Error) {
    if (depth >= MAX_CAUSE_DEPTH) {
      return {
        name: cause.name,
        message: cause.message,
        stack: cause.stack,
      };
    }

    return normalizeErrorInternal(cause, depth + 1);
  }

  return String(cause);
};

export const normalizeError = (error: unknown): LogRecord | undefined => {
  return normalizeErrorInternal(error, 0);
};

const normalizeErrorInternal = (
  error: unknown,
  depth: number,
): LogRecord | undefined => {
  if (error == null) return undefined;
  if (error instanceof Error) {
    const record: LogRecord = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };

    if ("code" in error) {
      const code = error.code;
      if (
        typeof code === "string" ||
        typeof code === "number" ||
        typeof code === "boolean"
      ) {
        record.code = code;
      }
    }

    const normalizedCause = normalizeErrorCause(error.cause, depth);
    if (normalizedCause !== undefined) {
      record.cause = normalizedCause;
    }

    if (error instanceof AggregateError) {
      record.errors = Array.from(error.errors, (entry) =>
        entry instanceof Error
          ? depth >= MAX_CAUSE_DEPTH
            ? {
                name: entry.name,
                message: entry.message,
                stack: entry.stack,
              }
            : normalizeErrorInternal(entry, depth + 1)
          : String(entry),
      );
    }

    return record;
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
