import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyStripeSignature(
  payload,
  header,
  secret,
  nowSeconds = Date.now() / 1000
) {
  const pairs = header
    .split(",")
    .map((item) => item.trim().split("="))
    .filter(([key, value]) => key && value);
  const timestampValue = pairs.find(([key]) => key === "t")?.[1];
  const timestamp = Number(timestampValue);
  const signatures = pairs
    .filter(([key]) => key === "v1")
    .map(([, value]) => value)
    .filter((value) => /^[a-f0-9]{64}$/i.test(value));

  if (!Number.isFinite(timestamp) || signatures.length === 0) return false;
  if (Math.abs(nowSeconds - timestamp) > 300) return false;

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest();
  return signatures.some((signature) => {
    const received = Buffer.from(signature, "hex");
    return received.length === expected.length &&
      timingSafeEqual(expected, received);
  });
}
