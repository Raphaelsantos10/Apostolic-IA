export type HealthPayload = Readonly<{
  status: "ok";
  service: "apostolic-ia-web";
  timestamp: string;
}>;

export type PerformanceBudgets = Readonly<{
  serverResponseMs: number;
  largestContentfulPaintMs: number;
  interactionToNextPaintMs: number;
  cumulativeLayoutShift: number;
  initialJavaScriptKb: number;
}>;

export const PERFORMANCE_BUDGETS: PerformanceBudgets;

export function resolveHealthRequestId(
  value: string | null | undefined,
  generate?: () => string
): string;

export function buildHealthPayload(now?: () => string): HealthPayload;

export function evaluatePerformanceBudget(
  metrics: Partial<Record<keyof PerformanceBudgets, number>>,
  budgets?: PerformanceBudgets
): Readonly<{
  passed: boolean;
  results: ReadonlyArray<Readonly<{
    metric: string;
    measured: number;
    maximum: number;
    passed: boolean;
  }>>;
}>;
