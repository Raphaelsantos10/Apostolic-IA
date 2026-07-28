export type GuidedStudyProgressRow = {
  lesson_id?: string;
  status?: string;
  percent?: number;
};

export type GuidedStudyLesson = {
  id: string;
  title: string;
  summary: string;
  body_text: string | null;
  kind: string;
  position: number;
};

export type GuidedStudyModule = {
  id: string;
  title: string;
  summary: string;
  position: number;
  lessons: GuidedStudyLesson[];
};

export type FlattenedGuidedLesson = GuidedStudyLesson & {
  moduleId: string;
  moduleTitle: string;
  moduleSummary: string;
};

export const GUIDED_STUDY_STEPS: ReadonlyArray<{
  id: "overview" | "learn" | "practice" | "review";
  label: string;
}>;

export function flattenGuidedLessons(
  modules: GuidedStudyModule[]
): FlattenedGuidedLesson[];
export function findResumeLessonIndex(
  lessons: GuidedStudyLesson[],
  progressRows: GuidedStudyProgressRow[]
): number;
export function guidedLessonPosition(
  index: number,
  total: number
): { current: number; total: number; percent: number };
export function adjacentGuidedLessonIndex(
  index: number,
  total: number,
  direction: "previous" | "next"
): number;
