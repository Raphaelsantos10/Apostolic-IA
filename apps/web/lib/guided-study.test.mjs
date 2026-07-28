import assert from "node:assert/strict";
import test from "node:test";
import {
  adjacentGuidedLessonIndex,
  findResumeLessonIndex,
  flattenGuidedLessons,
  guidedLessonPosition
} from "./guided-study.mjs";

const modules = [
  {
    id: "m2",
    title: "Módulo 2",
    summary: "Segundo",
    position: 2,
    lessons: [
      { id: "l3", title: "Aula 3", summary: "", position: 1 }
    ]
  },
  {
    id: "m1",
    title: "Módulo 1",
    summary: "Primeiro",
    position: 1,
    lessons: [
      { id: "l2", title: "Aula 2", summary: "", position: 2 },
      { id: "l1", title: "Aula 1", summary: "", position: 1 }
    ]
  }
];

test("ordena módulos e aulas para a jornada guiada", () => {
  const lessons = flattenGuidedLessons(modules);
  assert.deepEqual(
    lessons.map((lesson) => lesson.id),
    ["l1", "l2", "l3"]
  );
  assert.equal(lessons[0].moduleTitle, "Módulo 1");
});

test("retoma na primeira aula ainda não concluída", () => {
  const lessons = flattenGuidedLessons(modules);
  assert.equal(
    findResumeLessonIndex(lessons, [
      { lesson_id: "l1", status: "completed", percent: 100 },
      { lesson_id: "l2", status: "in_progress", percent: 50 }
    ]),
    1
  );
  assert.equal(
    findResumeLessonIndex(lessons, lessons.map((lesson) => ({
      lesson_id: lesson.id,
      status: "completed",
      percent: 100
    }))),
    2
  );
});

test("limita posição e navegação aos limites do percurso", () => {
  assert.deepEqual(guidedLessonPosition(1, 3), {
    current: 2,
    total: 3,
    percent: 67
  });
  assert.equal(adjacentGuidedLessonIndex(0, 3, "previous"), 0);
  assert.equal(adjacentGuidedLessonIndex(2, 3, "next"), 2);
});
