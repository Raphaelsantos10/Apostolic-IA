export type LearningProgressRow = {
  lesson_id?: string;
  status?: string;
  percent?: number;
};

export function clampProgress(value: unknown): number;
export function summarizeLearningProgress(
  totalLessons: number,
  progressRows: LearningProgressRow[]
): {
  completedLessons: number;
  overallProgress: number;
};
export function calculateCourseProgress(
  lessonIds: string[],
  progressRows: LearningProgressRow[]
): number;
