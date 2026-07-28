import { createHmac } from "node:crypto";
import assert from "node:assert/strict";
import test from "node:test";
import { verifyStripeSignature } from "./stripe-webhook.mjs";

const payload = '{"id":"evt_test","type":"test"}';
const secret = "whsec_test";
const timestamp = 1_700_000_000;
const signature = createHmac("sha256", secret)
  .update(`${timestamp}.${payload}`)
  .digest("hex");

test("aceita uma assinatura válida entre múltiplas versões", () => {
  const header = `t=${timestamp},v1=${"0".repeat(64)},v1=${signature}`;
  assert.equal(
    verifyStripeSignature(payload, header, secret, timestamp + 10),
    true
  );
});

test("rejeita assinatura antiga ou malformada", () => {
  assert.equal(
    verifyStripeSignature(payload, `t=${timestamp},v1=${signature}`, secret, timestamp + 301),
    false
  );
  assert.equal(
    verifyStripeSignature(payload, `t=${timestamp},v1=inválida`, secret, timestamp),
    false
  );
});

test("rejeita corpo alterado", () => {
  assert.equal(
    verifyStripeSignature(`${payload} `, `t=${timestamp},v1=${signature}`, secret, timestamp),
    false
  );
});
