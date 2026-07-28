#!/usr/bin/env bash
set -euo pipefail

required_files=(
  "docs/product/TEOLOGIA_CURRICULO.md"
  "docs/curriculum/TEOLOGIA_CARGA_HORARIA.md"
  "docs/courses/fundamentos-da-fe/module-01/plan.yaml"
  "docs/courses/fundamentos-da-fe/module-01/lesson-01.md"
  "docs/courses/fundamentos-da-fe/module-01/quiz-01.json"
  "docs/courses/fundamentos-da-fe/module-01/sources.md"
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

node --input-type=module <<'NODE'
import { readFileSync } from "node:fs";

const path = "docs/courses/fundamentos-da-fe/module-01/quiz-01.json";
const quiz = JSON.parse(readFileSync(path, "utf8"));

if (quiz.status !== "draft" || quiz.version < 2) {
  throw new Error("Quiz da Aula 1 deve permanecer como rascunho na versão 2.");
}

if (!Array.isArray(quiz.questions) || quiz.questions.length !== 8) {
  throw new Error("Quiz da Aula 1 deve conter exatamente oito questões.");
}

for (const [index, question] of quiz.questions.entries()) {
  if (!Array.isArray(question.options) || question.options.length !== 4) {
    throw new Error(`Questão ${index + 1} deve conter quatro alternativas.`);
  }

  if (
    !Number.isInteger(question.correctIndex) ||
    question.correctIndex < 0 ||
    question.correctIndex >= question.options.length ||
    typeof question.explanation !== "string" ||
    question.explanation.trim() === ""
  ) {
    throw new Error(`Questão ${index + 1} possui resposta inválida.`);
  }
}
NODE

grep -q "Em andamento" docs/sprints/SPRINT_034.md
grep -q "não representa aprovação final" \
  docs/validation/SPRINT_034_VALIDATION.md

echo "Sprint 034 - matriz, carga horária e rascunho da Aula 1 validados."
