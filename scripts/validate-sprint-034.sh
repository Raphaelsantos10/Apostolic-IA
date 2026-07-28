#!/usr/bin/env bash
set -euo pipefail

required_files=(
  "docs/product/TEOLOGIA_CURRICULO.md"
  "docs/curriculum/TEOLOGIA_CARGA_HORARIA.md"
  "docs/courses/fundamentos-da-fe/module-01/plan.yaml"
  "docs/courses/fundamentos-da-fe/module-01/lesson-01.md"
  "docs/courses/fundamentos-da-fe/module-01/quiz-01.json"
  "docs/courses/fundamentos-da-fe/module-01/sources.md"
  "docs/courses/fundamentos-da-fe/module-01/lesson-02.md"
  "docs/courses/fundamentos-da-fe/module-01/quiz-02.json"
  "docs/courses/fundamentos-da-fe/module-01/sources-02.md"
  "docs/courses/fundamentos-da-fe/module-01/lesson-03.md"
  "docs/courses/fundamentos-da-fe/module-01/quiz-03.json"
  "docs/courses/fundamentos-da-fe/module-01/sources-03.md"
  "docs/sprints/SPRINT_034.md"
  "docs/validation/SPRINT_034_VALIDATION.md"
)

for file in "${required_files[@]}"; do
  [[ -f "$file" ]] || {
    echo "ERRO: arquivo obrigatório da Sprint 034 ausente: $file"
    exit 1
  }
done

grep -q "432 horas" docs/product/TEOLOGIA_CURRICULO.md
grep -q "24 matérias" docs/product/TEOLOGIA_CURRICULO.md
grep -q "estimated_hours: 18" \
  docs/courses/fundamentos-da-fe/module-01/plan.yaml
grep -q "lesson_count: 8" \
  docs/courses/fundamentos-da-fe/module-01/plan.yaml
grep -q "publication_allowed: false" \
  docs/courses/fundamentos-da-fe/module-01/plan.yaml
grep -Fq "title: Revelação de Deus e a Palavra escrita" \
  docs/courses/fundamentos-da-fe/module-01/lesson-01.md
grep -Fq "version: 2" \
  docs/courses/fundamentos-da-fe/module-01/lesson-01.md
grep -Fq "status: draft" \
  docs/courses/fundamentos-da-fe/module-01/lesson-01.md
grep -Fq "estimated_minutes: 120" \
  docs/courses/fundamentos-da-fe/module-01/lesson-01.md
grep -Fq "publication_allowed: false" \
  docs/courses/fundamentos-da-fe/module-01/lesson-01.md
grep -Fq "doctrinal: pending" \
  docs/courses/fundamentos-da-fe/module-01/lesson-01.md
grep -Fq "pedagogical: pending" \
  docs/courses/fundamentos-da-fe/module-01/lesson-01.md
grep -Fq "editorial: pending" \
  docs/courses/fundamentos-da-fe/module-01/lesson-01.md
grep -Fq "accessibility: pending" \
  docs/courses/fundamentos-da-fe/module-01/lesson-01.md
grep -Fq "não reproduz material proprietário" \
  docs/courses/fundamentos-da-fe/module-01/sources.md
grep -Fq "title: Inspiração divina e autoria humana" \
  docs/courses/fundamentos-da-fe/module-01/lesson-02.md
grep -Fq "version: 1" \
  docs/courses/fundamentos-da-fe/module-01/lesson-02.md
grep -Fq "status: draft" \
  docs/courses/fundamentos-da-fe/module-01/lesson-02.md
grep -Fq "estimated_minutes: 135" \
  docs/courses/fundamentos-da-fe/module-01/lesson-02.md
grep -Fq "publication_allowed: false" \
  docs/courses/fundamentos-da-fe/module-01/lesson-02.md
grep -Fq "doctrinal: pending" \
  docs/courses/fundamentos-da-fe/module-01/lesson-02.md
grep -Fq "pedagogical: pending" \
  docs/courses/fundamentos-da-fe/module-01/lesson-02.md
grep -Fq "editorial: pending" \
  docs/courses/fundamentos-da-fe/module-01/lesson-02.md
grep -Fq "accessibility: pending" \
  docs/courses/fundamentos-da-fe/module-01/lesson-02.md
grep -Fq "não reproduz material proprietário" \
  docs/courses/fundamentos-da-fe/module-01/sources-02.md
grep -Fq "title: Cânon, transmissão e confiança no texto" \
  docs/courses/fundamentos-da-fe/module-01/lesson-03.md
grep -Fq "version: 1" \
  docs/courses/fundamentos-da-fe/module-01/lesson-03.md
grep -Fq "status: draft" \
  docs/courses/fundamentos-da-fe/module-01/lesson-03.md
grep -Fq "estimated_minutes: 135" \
  docs/courses/fundamentos-da-fe/module-01/lesson-03.md
grep -Fq "publication_allowed: false" \
  docs/courses/fundamentos-da-fe/module-01/lesson-03.md
grep -Fq "doctrinal: pending" \
  docs/courses/fundamentos-da-fe/module-01/lesson-03.md
grep -Fq "pedagogical: pending" \
  docs/courses/fundamentos-da-fe/module-01/lesson-03.md
grep -Fq "editorial: pending" \
  docs/courses/fundamentos-da-fe/module-01/lesson-03.md
grep -Fq "accessibility: pending" \
  docs/courses/fundamentos-da-fe/module-01/lesson-03.md
grep -Fq "não reproduz material proprietário" \
  docs/courses/fundamentos-da-fe/module-01/sources-03.md
grep -Fq "não enumera oficialmente o cânon do projeto" \
  docs/courses/fundamentos-da-fe/module-01/sources-03.md

node --input-type=module <<'NODE'
import { readFileSync } from "node:fs";

const quizzes = [
  {
    lesson: 1,
    path: "docs/courses/fundamentos-da-fe/module-01/quiz-01.json",
    minimumVersion: 2
  },
  {
    lesson: 2,
    path: "docs/courses/fundamentos-da-fe/module-01/quiz-02.json",
    minimumVersion: 1
  },
  {
    lesson: 3,
    path: "docs/courses/fundamentos-da-fe/module-01/quiz-03.json",
    minimumVersion: 1
  }
];

for (const item of quizzes) {
  const quiz = JSON.parse(readFileSync(item.path, "utf8"));

  if (quiz.status !== "draft" || quiz.version < item.minimumVersion) {
    throw new Error(`Quiz da Aula ${item.lesson} possui versão ou estado inválido.`);
  }

  if (!Array.isArray(quiz.questions) || quiz.questions.length !== 8) {
    throw new Error(`Quiz da Aula ${item.lesson} deve conter oito questões.`);
  }

  for (const [index, question] of quiz.questions.entries()) {
    if (!Array.isArray(question.options) || question.options.length !== 4) {
      throw new Error(
        `Aula ${item.lesson}, questão ${index + 1}: quatro alternativas exigidas.`
      );
    }

    if (
      !Number.isInteger(question.correctIndex) ||
      question.correctIndex < 0 ||
      question.correctIndex >= question.options.length ||
      typeof question.explanation !== "string" ||
      question.explanation.trim() === ""
    ) {
      throw new Error(
        `Aula ${item.lesson}, questão ${index + 1}: resposta inválida.`
      );
    }
  }
}
NODE

grep -q "Em andamento" docs/sprints/SPRINT_034.md
grep -q "não representa aprovação final" \
  docs/validation/SPRINT_034_VALIDATION.md

echo "Sprint 034 - matriz, carga horária e rascunhos das Aulas 1 a 3 validados."
