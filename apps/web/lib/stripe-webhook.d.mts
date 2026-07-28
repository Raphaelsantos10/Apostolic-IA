export function verifyStripeSignature(
  payload: string,
  header: string,
  secret: string,
  nowSeconds?: number
): boolean;
