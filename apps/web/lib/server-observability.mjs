const REQUEST_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/;
const LABEL_PATTERN = /^[A-Za-z][A-Za-z0-9._-]{0,63}$/;

function generateRequestId() {
  return globalThis.crypto.randomUUID();
}

function safeLabel(value, fallback) {
  return typeof value === "string" && LABEL_PATTERN.test(value)
    ? value
    : fallback;
}

export function resolveRequestId(value, generate = generateRequestId) {
  const candidate = typeof value === "string" ? value.trim() : "";
  if (REQUEST_ID_PATTERN.test(candidate)) return candidate;

  const generated = generate();
  if (!REQUEST_ID_PATTERN.test(generated)) {
    throw new TypeError("request id generator returned an invalid value");
  }
  return generated;
}

export function buildSafeErrorEvent({
  event,
  requestId,
  error,
  now = () => new Date().toISOString()
}) {
  return Object.freeze({
    timestamp: now(),
    event: safeLabel(event, "server.error"),
    requestId: resolveRequestId(requestId),
    errorType: safeLabel(
      error instanceof Error ? error.name : "UnknownError",
      "UnknownError"
    )
  });
}

export function logServerError(input, write = console.error) {
  const safeEvent = buildSafeErrorEvent(input);
  write(JSON.stringify(safeEvent));
  return safeEvent;
}
