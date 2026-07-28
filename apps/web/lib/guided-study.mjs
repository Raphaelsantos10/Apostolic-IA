export const GUIDED_STUDY_STEPS = Object.freeze([
  { id: "overview", label: "Visão geral" },
  { id: "learn", label: "Aprender" },
  { id: "practice", label: "Praticar" },
  { id: "review", label: "Revisar" }
]);

export function flattenGuidedLessons(modules) {
  if (!Array.isArray(modules)) return [];

  return [...modules]
    .sort((left, right) => Number(left?.position ?? 0) - Number(right?.position ?? 0))
    .flatMap((module) =>
      [...(Array.isArray(module?.lessons) ? module.lessons : [])]
        .sort(
          (left, right) =>
            Number(left?.position ?? 0) - Number(right?.position ?? 0)
        )
        .map((lesson) => ({
          ...lesson,
          moduleId: module.id,
          moduleTitle: module.title,
          moduleSummary: module.summary
        }))
    );
}

export function findResumeLessonIndex(lessons, progressRows) {
  if (!Array.isArray(lessons) || lessons.length === 0) return 0;
  const progress = new Map(
    (Array.isArray(progressRows) ? progressRows : []).map((row) => [
      row?.lesson_id,
      row
    ])
  );
  const unfinished = lessons.findIndex(
    (lesson) => progress.get(lesson?.id)?.status !== "completed"
  );
  return unfinished === -1 ? lessons.length - 1 : unfinished;
}

export function guidedLessonPosition(index, total) {
  const safeTotal = Math.max(0, Number.isInteger(total) ? total : 0);
  if (safeTotal === 0) return { current: 0, total: 0, percent: 0 };
  const safeIndex = Math.min(
    safeTotal - 1,
    Math.max(0, Number.isInteger(index) ? index : 0)
  );
  return {
    current: safeIndex + 1,
    total: safeTotal,
    percent: Math.round(((safeIndex + 1) / safeTotal) * 100)
  };
}

export function adjacentGuidedLessonIndex(index, total, direction) {
  const safeTotal = Math.max(0, Number.isInteger(total) ? total : 0);
  if (safeTotal === 0) return 0;
  const delta = direction === "previous" ? -1 : 1;
  return Math.min(safeTotal - 1, Math.max(0, index + delta));
}
