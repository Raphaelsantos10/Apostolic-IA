export function clampProgress(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.min(100, Math.max(0, Math.round(numeric)));
}

export function summarizeLearningProgress(totalLessons, progressRows) {
  const safeTotal = Math.max(0, Number.isInteger(totalLessons) ? totalLessons : 0);
  const rows = Array.isArray(progressRows) ? progressRows : [];
  const completedLessons = rows.filter(
    (row) => row?.status === "completed" && clampProgress(row.percent) === 100
  ).length;
  const totalPercent = rows.reduce(
    (sum, row) => sum + clampProgress(row?.percent),
    0
  );

  return {
    completedLessons: Math.min(completedLessons, safeTotal),
    overallProgress: safeTotal
      ? Math.min(100, Math.round(totalPercent / safeTotal))
      : 0
  };
}

export function calculateCourseProgress(lessonIds, progressRows) {
  const ids = new Set(Array.isArray(lessonIds) ? lessonIds : []);
  if (ids.size === 0) return 0;
  const relevantRows = (Array.isArray(progressRows) ? progressRows : []).filter(
    (row) => ids.has(row?.lesson_id)
  );
  return summarizeLearningProgress(ids.size, relevantRows).overallProgress;
}
