import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateCourseProgress,
  clampProgress,
  summarizeLearningProgress
} from "./course-progress.mjs";

test("limita percentuais ao intervalo válido", () => {
  assert.equal(clampProgress(-20), 0);
  assert.equal(clampProgress(52.6), 53);
  assert.equal(clampProgress(180), 100);
  assert.equal(clampProgress("inválido"), 0);
});

test("resume progresso sem declarar aulas ausentes como concluídas", () => {
  assert.deepEqual(
    summarizeLearningProgress(4, [
      { lesson_id: "a", status: "completed", percent: 100 },
      { lesson_id: "b", status: "in_progress", percent: 50 }
    ]),
    { completedLessons: 1, overallProgress: 38 }
  );
});

test("calcula somente o progresso das aulas do curso escolhido", () => {
  assert.equal(
    calculateCourseProgress(["a", "b"], [
      { lesson_id: "a", status: "completed", percent: 100 },
      { lesson_id: "b", status: "in_progress", percent: 50 },
      { lesson_id: "outro", status: "completed", percent: 100 }
    ]),
    75
  );
  assert.equal(calculateCourseProgress([], []), 0);
});
