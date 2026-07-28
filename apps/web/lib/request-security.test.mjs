import assert from "node:assert/strict";
import test from "node:test";
import {
  readJsonBody,
  readTextBody,
  requestBodyAllowed,
  resolveAppOrigin
} from "./request-security.mjs";

test("rejeita corpo declarado acima do limite", () => {
  assert.equal(requestBodyAllowed("16385", 16384), false);
  assert.equal(requestBodyAllowed("16384", 16384), true);
  assert.equal(requestBodyAllowed("inválido", 16384), false);
});

test("limita também corpos sem tamanho previamente confiável", async () => {
  const textResult = await readTextBody(
    new Request("https://example.test", {
      method: "POST",
      body: "123456"
    }),
    5
  );
  assert.deepEqual(textResult, { ok: false, tooLarge: true });

  const jsonResult = await readJsonBody(
    new Request("https://example.test", {
      method: "POST",
      body: '{"ok":true}'
    }),
    64
  );
  assert.deepEqual(jsonResult, { ok: true, value: { ok: true } });
});

test("produção exige origem HTTPS configurada", () => {
  assert.equal(
    resolveAppOrigin({
      configured: undefined,
      requestUrl: "https://host-controlado.example",
      production: true
    }),
    null
  );
  assert.equal(
    resolveAppOrigin({
      configured: "http://example.test",
      requestUrl: "https://ignorado.example",
      production: true
    }),
    null
  );
  assert.equal(
    resolveAppOrigin({
      configured: "https://apostolic.example/caminho",
      requestUrl: "https://ignorado.example",
      production: true
    }),
    "https://apostolic.example"
  );
});

test("desenvolvimento pode usar a origem local da requisição", () => {
  assert.equal(
    resolveAppOrigin({
      configured: undefined,
      requestUrl: "http://localhost:3000/api/billing/checkout",
      production: false
    }),
    "http://localhost:3000"
  );
});
