import { resolveRequestId } from "./server-observability.mjs";

export const PERFORMANCE_BUDGETS = Object.freeze({
  serverResponseMs: 800,
  largestContentfulPaintMs: 2500,
  interactionToNextPaintMs: 200,
  cumulativeLayoutShift: 0.1,
  initialJavaScriptKb: 300
});

export function resolveHealthRequestId(value, generate) {
  return resolveRequestId(value, generate);
}

export function buildHealthPayload(
  now = () => new Date().toISOString()
) {
  return Object.freeze({
    status: "ok",
    service: "apostolic-ia-web",
    timestamp: now()
  });
}

export function evaluatePerformanceBudget(
  metrics,
  budgets = PERFORMANCE_BUDGETS
) {
  const results = Object.entries(budgets).map(([metric, maximum]) => {
    const measured = Number(metrics?.[metric]);
    return Object.freeze({
      metric,
      measured,
      maximum,
      passed: Number.isFinite(measured) && measured <= maximum
    });
  });

  return Object.freeze({
    passed: results.every((result) => result.passed),
    results: Object.freeze(results)
  });
}
