export function requestBodyAllowed(
  contentLength: string | null,
  maximumBytes: number
): boolean;

export type BodyReadResult =
  | Readonly<{ ok: true; value: string }>
  | Readonly<{ ok: false; tooLarge: boolean }>;

export type JsonReadResult =
  | Readonly<{ ok: true; value: unknown }>
  | Readonly<{ ok: false; tooLarge: boolean }>;

export function readTextBody(
  request: Request,
  maximumBytes: number
): Promise<BodyReadResult>;

export function readJsonBody(
  request: Request,
  maximumBytes: number
): Promise<JsonReadResult>;

export function resolveAppOrigin(options: Readonly<{
  configured: string | undefined;
  requestUrl: string;
  production: boolean;
}>): string | null;
