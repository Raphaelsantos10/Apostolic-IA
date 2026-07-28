import assert from "node:assert/strict";
import test from "node:test";
import {
  buildSafeErrorEvent,
  logServerError,
  resolveRequestId
} from "./server-observability.mjs";

test("preserva identificador de correlação seguro", () => {
  assert.equal(resolveRequestId("request-12345678"), "request-12345678");
});

test("substitui identificador ausente ou inseguro", () => {
  const generated = "generated-12345678";
  assert.equal(resolveRequestId(null, () => generated), generated);
  assert.equal(resolveRequestId("valor com espaço", () => generated), generated);
});

test("evento de erro não inclui mensagem, pilha ou conteúdo privado", () => {
  const event = buildSafeErrorEvent({
    event: "billing.webhook.failed",
    requestId: "request-12345678",
    error: new Error("token=segredo pergunta=conteúdo privado"),
    now: () => "2026-07-28T00:00:00.000Z"
  });

  assert.deepEqual(Object.keys(event), [
    "timestamp",
    "event",
    "requestId",
    "errorType"
  ]);
  assert.equal(event.errorType, "Error");
  assert.doesNotMatch(JSON.stringify(event), /segredo|conteúdo privado|stack/i);
});

test("logger escreve somente o evento sanitizado", () => {
  const messages = [];
  logServerError(
    {
      event: "server.error",
      requestId: "request-12345678",
      error: new TypeError("e-mail privado"),
      now: () => "2026-07-28T00:00:00.000Z"
    },
    (message) => messages.push(message)
  );

  assert.equal(messages.length, 1);
  assert.match(messages[0], /"errorType":"TypeError"/);
  assert.doesNotMatch(messages[0], /e-mail privado/);
});
