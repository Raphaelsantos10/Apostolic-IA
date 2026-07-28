export type SafeErrorEvent = Readonly<{
  timestamp: string;
  event: string;
  requestId: string;
  errorType: string;
}>;

export function resolveRequestId(
  value: string | null | undefined,
  generate?: () => string
): string;

export function buildSafeErrorEvent(input: Readonly<{
  event: string;
  requestId: string | null | undefined;
  error: unknown;
  now?: () => string;
}>): SafeErrorEvent;

export function logServerError(
  input: Readonly<{
    event: string;
    requestId: string | null | undefined;
    error: unknown;
    now?: () => string;
  }>,
  write?: (message: string) => void
): SafeErrorEvent;
