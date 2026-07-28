import assert from "node:assert/strict";
import test from "node:test";
import {
  buildHealthPayload,
  evaluatePerformanceBudget,
  PERFORMANCE_BUDGETS,
  resolveHealthRequestId
} from "./resilience.mjs";

test("health check expõe somente estado, serviço e data", () => {
  const payload = buildHealthPayload(
    () => "2026-07-28T00:00:00.000Z"
  );

  assert.deepEqual(payload, {
    status: "ok",
    service: "apostolic-ia-web",
    timestamp: "2026-07-28T00:00:00.000Z"
  });
  assert.doesNotMatch(JSON.stringify(payload), /token|email|database|secret/i);
});

test("health check preserva ou gera request id seguro", () => {
  assert.equal(
    resolveHealthRequestId("health-request-1234"),
    "health-request-1234"
  );
  assert.equal(
    resolveHealthRequestId(null, () => "generated-health-1234"),
    "generated-health-1234"
  );
});

test("orçamento aprova métricas dentro dos limites", () => {
  const result = evaluatePerformanceBudget({
    serverResponseMs: 500,
    largestContentfulPaintMs: 2000,
    interactionToNextPaintMs: 150,
    cumulativeLayoutShift: 0.05,
    initialJavaScriptKb: 250
  });

  assert.equal(result.passed, true);
});

test("orçamento reprova métrica ausente ou acima do limite", () => {
  const result = evaluatePerformanceBudget({
    ...PERFORMANCE_BUDGETS,
    largestContentfulPaintMs: 3000
  });

  assert.equal(result.passed, false);
  assert.equal(
    result.results.find(
      ({ metric }) => metric === "largestContentfulPaintMs"
    )?.passed,
    false
  );
});
