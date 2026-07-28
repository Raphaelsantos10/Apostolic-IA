import assert from "node:assert/strict";
import test from "node:test";
import { auditHtml, auditPage } from "./web-quality-audit.mjs";

const accessibleHtml = `<!doctype html>
<html lang="pt-PT">
  <head><title>Apostolic IA</title></head>
  <body>
    <main>
      <h1>Estudo bíblico</h1>
      <img src="/biblia.png" alt="Bíblia aberta">
      <button aria-label="Abrir menu"><svg></svg></button>
      <a href="/cursos">Cursos</a>
      <label for="email">E-mail</label>
      <input id="email" type="email">
    </main>
  </body>
</html>`;

test("aprova estrutura HTML acessível coberta", () => {
  assert.deepEqual(auditHtml(accessibleHtml), {
    passed: true,
    violations: []
  });
});

test("detecta idioma, main, título e nomes ausentes", () => {
  const result = auditHtml(
    "<html><head></head><body><img><button></button><input></body></html>"
  );
  const ids = result.violations.map(({ id }) => id);

  assert.equal(result.passed, false);
  assert.ok(ids.includes("document-doctype"));
  assert.ok(ids.includes("html-lang"));
  assert.ok(ids.includes("document-title"));
  assert.ok(ids.includes("main-landmark"));
  assert.ok(ids.includes("page-heading"));
  assert.ok(ids.includes("image-alt"));
  assert.ok(ids.includes("button-name"));
  assert.ok(ids.includes("input-name"));
});

test("detecta identificadores duplicados", () => {
  const result = auditHtml(
    accessibleHtml.replace(
      "</main>",
      '<p id="repetido">A</p><p id="repetido">B</p></main>'
    )
  );

  assert.ok(
    result.violations.some(({ id }) => id === "duplicate-id")
  );
});

test("mede página e aplica orçamento de resposta", async () => {
  const times = [0, 100, 100, 220, 220, 370];
  const result = await auditPage("http://localhost:3000/", {
    clock: () => times.shift(),
    fetcher: async () => ({
      status: 200,
      url: "http://localhost:3000/",
      text: async () => accessibleHtml
    })
  });

  assert.equal(result.responseMs, 120);
  assert.equal(result.passed, true);
  assert.ok(result.bytes > 0);
});
