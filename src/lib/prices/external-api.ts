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
};

export class ExternalApiError extends Error {
  readonly source: ExternalApiSource;
  readonly league: League | string;
  readonly resource: string;
  readonly kind: ExternalApiErrorKind;
  readonly status?: number;
  override readonly cause?: unknown;

  constructor({
    source,
    league,
    resource,
    kind,
    message,
    status,
    cause,
  }: ExternalApiErrorParams) {
    super(message, { cause });
    this.name = "ExternalApiError";
    this.source = source;
    this.league = league;
    this.resource = resource;
    this.kind = kind;
    this.status = status;
    this.cause = cause;
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
  cause?: string;
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
    cause: error.cause == null ? undefined : String(error.cause),
  };
};
