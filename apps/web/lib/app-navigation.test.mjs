import assert from "node:assert/strict";
import test from "node:test";
import {
  APP_VIEWS,
  DASHBOARD_SECTIONS,
  appViewHref,
  dashboardSectionHref,
  isProtectedAppPath,
  resolveDashboardSection,
  resolveSafeNextPath,
  resolveAppView
} from "./app-navigation.mjs";

test("aceita somente destinos realmente implementados", () => {
  for (const view of APP_VIEWS) {
    assert.equal(resolveAppView(view), view);
  }
  assert.equal(resolveAppView("estudos-futuros"), "home");
  assert.equal(resolveAppView(undefined), "home");
});

test("gera destino interno seguro para a aplicação existente", () => {
  assert.equal(appViewHref("courses"), "/?view=courses");
  assert.equal(appViewHref("https://example.com"), "/?view=home");
});

test("mantém as áreas funcionais dentro do dashboard novo", () => {
  for (const section of DASHBOARD_SECTIONS) {
    assert.equal(resolveDashboardSection(section), section);
  }
  assert.equal(dashboardSectionHref("dashboard"), "/dashboard");
  assert.equal(
    dashboardSectionHref("courses"),
    "/dashboard?section=courses"
  );
  assert.equal(
    dashboardSectionHref("destino-inexistente"),
    "/dashboard"
  );
});

test("protege a jornada privada sem bloquear a prévia aprovada", () => {
  assert.equal(isProtectedAppPath("/dashboard"), true);
  assert.equal(isProtectedAppPath("/dashboard/configuracoes"), true);
  assert.equal(isProtectedAppPath("/dashboard-preview"), false);
  assert.equal(isProtectedAppPath("/perfil"), true);
  assert.equal(isProtectedAppPath("/entrar"), false);
});

test("callback aceita somente redirecionamento interno", () => {
  assert.equal(resolveSafeNextPath("/dashboard"), "/dashboard");
  assert.equal(
    resolveSafeNextPath("/atualizar-senha?origem=email"),
    "/atualizar-senha?origem=email"
  );
  assert.equal(resolveSafeNextPath("//example.com"), "/onboarding");
  assert.equal(resolveSafeNextPath("https://example.com"), "/onboarding");
  assert.equal(resolveSafeNextPath("/\\example.com"), "/onboarding");
});
