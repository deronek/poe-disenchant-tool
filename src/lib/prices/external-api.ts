import { ZodError } from "zod";

import type { League } from "../leagues";

export type ExternalApiSource = "prices" | "currency";

export type ExternalApiErrorKind = "http" | "network" | "schema" | "empty-data";

type ExternalApiErrorParams = {
  source: ExternalApiSource;
  league: League | string;
  resource: string;
  kind: ExternalApiErrorKind;
  message: string;
  status?: number;
  cause?: unknown;
  context?: Record<string, unknown>;
};

export class ExternalApiError extends Error {
  readonly source: ExternalApiSource;
  readonly league: League | string;
  readonly resource: string;
  readonly kind: ExternalApiErrorKind;
  readonly status?: number;
  readonly context?: Record<string, unknown>;
  override readonly cause?: unknown;

  constructor({
    source,
    league,
    resource,
    kind,
    message,
    status,
    cause,
    context,
  }: ExternalApiErrorParams) {
    super(message, { cause });
    this.name = "ExternalApiError";
    this.source = source;
    this.league = league;
    this.resource = resource;
    this.kind = kind;
    this.status = status;
    this.cause = cause;
    this.context = context;
  }
}

export type ApiSuccess<T> = {
  ok: true;
  data: T;
};

export type ApiFailure = {
  ok: false;
  error: ExternalApiError;
};

export type ApiResult<T> = ApiSuccess<T> | ApiFailure;

export type ExternalApiErrorContext = {
  source: ExternalApiSource;
  league: League | string;
  resource: string;
  kind: ExternalApiErrorKind;
  status_code?: number;
  message: string;
  cause?: string | Record<string, unknown>;
};

const MAX_CAUSE_DEPTH = 3;

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return Object.prototype.toString.call(value) === "[object Object]";
};

const serializeCause = (
  cause: unknown,
  depth = 0,
  seen = new WeakSet<object>(),
): string | Record<string, unknown> | undefined => {
  if (cause == null) {
    return undefined;
  }

  if (depth >= MAX_CAUSE_DEPTH) {
    return { message: "max cause depth reached" };
  }

  if (typeof cause === "object") {
    if (seen.has(cause)) {
      return { message: "circular cause reference" };
    }
    seen.add(cause);
  }

  if (cause instanceof ZodError) {
    return {
      name: cause.name,
      message: cause.message,
      stack: cause.stack,
      issues: cause.issues,
      cause: serializeCause(cause.cause, depth + 1, seen),
    };
  }

  if (cause instanceof Error) {
    const serialized: Record<string, unknown> = {
      name: cause.name,
      message: cause.message,
      stack: cause.stack,
    };

    if ("code" in cause) {
      serialized.code = cause.code;
    }

    const nestedCause = serializeCause(cause.cause, depth + 1, seen);
    if (nestedCause !== undefined) {
      serialized.cause = nestedCause;
    }

    if (cause instanceof AggregateError) {
      serialized.errors = Array.from(
        cause.errors,
        (entry) => serializeCause(entry, depth + 1, seen) ?? String(entry),
      );
    }

    return serialized;
  }

  if (typeof cause === "object") {
    try {
      const parsed = JSON.parse(JSON.stringify(cause)) as unknown;
      if (!isPlainObject(parsed)) {
        return { value: parsed };
      }
      return parsed;
    } catch {
      return { message: String(cause) };
    }
  }

  return String(cause);
};

export const toExternalApiErrorContext = (
  error: ExternalApiError,
): ExternalApiErrorContext => {
  return {
    source: error.source,
    league: error.league,
    resource: error.resource,
    kind: error.kind,
    status_code: error.status,
    message: error.message,
    cause: serializeCause(error.cause),
  };
};
