import assert from "node:assert/strict";
import test from "node:test";
import {
  buildContentSecurityPolicy,
  securityHeaders
} from "./security-headers.mjs";

test("a política de produção bloqueia enquadramento e objetos", () => {
  const policy = buildContentSecurityPolicy({ production: true });
  assert.match(policy, /frame-ancestors 'none'/);
  assert.match(policy, /object-src 'none'/);
  assert.doesNotMatch(policy, /unsafe-eval/);
});

test("o desenvolvimento permite o runtime local sem enfraquecer produção", () => {
  const policy = buildContentSecurityPolicy({ production: false });
  assert.match(policy, /unsafe-eval/);
  assert.match(policy, /ws:\/\/127\.0\.0\.1:54321/);
});

test("HSTS existe somente em produção", () => {
  const production = securityHeaders({ production: true });
  const development = securityHeaders({ production: false });
  assert.ok(production.some((header) => header.key === "Strict-Transport-Security"));
  assert.ok(!development.some((header) => header.key === "Strict-Transport-Security"));
});

test("microfone é restrito à própria aplicação", () => {
  const permissions = securityHeaders({ production: true }).find(
    (header) => header.key === "Permissions-Policy"
  );
  assert.match(permissions?.value ?? "", /microphone=\(self\)/);
  assert.match(permissions?.value ?? "", /camera=\(\)/);
});
