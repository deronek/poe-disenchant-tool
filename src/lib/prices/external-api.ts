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

export const logExternalApiError = (
  error: ExternalApiError,
  prefix = "External API error",
) => {
  const details = [
    `source=${error.source}`,
    `league=${error.league}`,
    `resource=${error.resource}`,
    `kind=${error.kind}`,
    error.status != null ? `status=${error.status}` : null,
  ]
    .filter(Boolean)
    .join(" ");

  console.error(`${prefix}: ${details} - ${error.message}`);

  if (error.cause != null) {
    console.error(error.cause);
  }
};
