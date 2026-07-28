export function requestBodyAllowed(contentLength, maximumBytes) {
  if (contentLength === null) return true;
  if (!/^\d+$/.test(contentLength)) return false;
  const value = Number(contentLength);
  return Number.isSafeInteger(value) && value >= 0 && value <= maximumBytes;
}

export async function readTextBody(request, maximumBytes) {
  if (!requestBodyAllowed(request.headers.get("content-length"), maximumBytes)) {
    return { ok: false, tooLarge: true };
  }
  if (!request.body) return { ok: true, value: "" };

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let value = "";
  while (true) {
    const { done, value: chunk } = await reader.read();
    if (done) break;
    size += chunk.byteLength;
    if (size > maximumBytes) {
      await reader.cancel();
      return { ok: false, tooLarge: true };
    }
    value += decoder.decode(chunk, { stream: true });
  }
  value += decoder.decode();
  return { ok: true, value };
}

export async function readJsonBody(request, maximumBytes) {
  const result = await readTextBody(request, maximumBytes);
  if (!result.ok) return result;
  try {
    return { ok: true, value: JSON.parse(result.value) };
  } catch {
    return { ok: false, tooLarge: false };
  }
}

export function resolveAppOrigin({
  configured,
  requestUrl,
  production
}) {
  const candidate = configured || (production ? "" : requestUrl);
  if (!candidate) return null;
  try {
    const url = new URL(candidate);
    if (production && url.protocol !== "https:") return null;
    if (url.username || url.password) return null;
    return url.origin;
  } catch {
    return null;
  }
}
