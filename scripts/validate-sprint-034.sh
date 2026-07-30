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
  "docs/courses/fundamentos-da-fe/module-01/lesson-04.md"
  "docs/courses/fundamentos-da-fe/module-01/quiz-04.json"
  "docs/courses/fundamentos-da-fe/module-01/sources-04.md"
  "docs/courses/fundamentos-da-fe/module-01/lesson-05.md"
  "docs/courses/fundamentos-da-fe/module-01/quiz-05.json"
  "docs/courses/fundamentos-da-fe/module-01/sources-05.md"
  "docs/courses/fundamentos-da-fe/module-01/lesson-06.md"
  "docs/courses/fundamentos-da-fe/module-01/quiz-06.json"
  "docs/courses/fundamentos-da-fe/module-01/sources-06.md"
  "docs/courses/fundamentos-da-fe/module-01/lesson-07.md"
  "docs/courses/fundamentos-da-fe/module-01/quiz-07.json"
  "docs/courses/fundamentos-da-fe/module-01/sources-07.md"
  "docs/courses/fundamentos-da-fe/module-01/lesson-08.md"
  "docs/courses/fundamentos-da-fe/module-01/quiz-08.json"
  "docs/courses/fundamentos-da-fe/module-01/sources-08.md"
  "docs/courses/fundamentos-da-fe/module-01/assessment-rubric.md"
  "docs/reviews/MODULE_01_HUMAN_REVIEW.md"
  "docs/reviews/module-01/README.md"
  "docs/reviews/module-01/2026-07-29-doctrinal.json"
  "docs/reviews/module-01/2026-07-29-pedagogical.json"
  "docs/reviews/module-01/2026-07-29-pedagogical-abd8b90.json"
  "docs/reviews/module-01/2026-07-29-editorial.json"
  "docs/reviews/module-01/2026-07-29-accessibility.json"
  "docs/reviews/module-01/2026-07-30-doctrinal-2f9e307.json"
  "docs/sprints/SPRINT_034.md"
  "docs/validation/SPRINT_034_VALIDATION.md"
  "docs/validation/MODULE_01_PEDAGOGICAL_PILOT.md"
  "docs/editorial/MODULE_01_PROVENANCE.md"
  "docs/legal/MODULE_01_SOURCE_AND_RIGHTS_REGISTER.md"
  "docs/accessibility/MODULE_01_ACCESSIBILITY_ACCEPTANCE.md"
  "docs/reviews/module-01/FINAL_GATE_PLAN_C95E252.md"
  "docs/reviews/module-01/final-review-template-v2.json"
  "docs/research/MODULE_01_AULA_03_SOURCE_DOSSIER.md"
  "docs/doctrine/CANON_PROTESTANTE_66_LIVROS.md"
  "docs/editorial/MODULE_01_AUTOMATED_AUDIT.md"
  "scripts/audit-module-01-editorial.mjs"
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
grep -Fq "version: 2" \
  docs/courses/fundamentos-da-fe/module-01/lesson-03.md
grep -Fq "status: draft" \
  docs/courses/fundamentos-da-fe/module-01/lesson-03.md
grep -Fq "estimated_minutes: 135" \
  docs/courses/fundamentos-da-fe/module-01/lesson-03.md
grep -Fq "publication_allowed: false" \
  docs/courses/fundamentos-da-fe/module-01/lesson-03.md
node scripts/audit-module-01-editorial.mjs >/dev/null
grep -Fq "humanSimilarityReviewRequired" \
  scripts/audit-module-01-editorial.mjs
grep -Fq "não comprova originalidade jurídica" \
  docs/editorial/MODULE_01_AUTOMATED_AUDIT.md
grep -Fq 'role="status"' \
  apps/web/components/learning-tools.tsx
grep -Fq "Sem limite de tempo" \
  apps/web/components/learning-tools.tsx
grep -Fq "testes reais" \
  docs/accessibility/MODULE_01_ACCESSIBILITY_ACCEPTANCE.md
grep -Fq "doctrinal: pending" \
  docs/courses/fundamentos-da-fe/module-01/lesson-03.md
grep -Fq "pedagogical: pending" \
  docs/courses/fundamentos-da-fe/module-01/lesson-03.md
grep -Fq "editorial: pending" \
  docs/courses/fundamentos-da-fe/module-01/lesson-03.md
grep -Fq "accessibility: pending" \
  docs/courses/fundamentos-da-fe/module-01/lesson-03.md
grep -Fq "continuidade dos dons espirituais" \
  docs/doctrine/CONSTITUICAO_DOUTRINARIA.md
grep -Fq "Cânon fechado e dons espirituais atuais" \
  docs/courses/fundamentos-da-fe/module-01/lesson-03.md
grep -Fq "Dons atuais não ampliam o cânon nem substituem as Escrituras" \
  docs/courses/fundamentos-da-fe/module-01/lesson-03.md
grep -Fq "1 Tessalonicenses 5:19-22" \
  docs/courses/fundamentos-da-fe/module-01/sources-03.md
grep -Fq "não reproduz material proprietário" \
  docs/courses/fundamentos-da-fe/module-01/sources-03.md
grep -Fq "enumera o cânon oficial" \
  docs/courses/fundamentos-da-fe/module-01/sources-03.md
grep -Fq "39 livros no Antigo Testamento" \
  docs/doctrine/CONSTITUICAO_DOUTRINARIA.md
grep -Fq "27 livros no Novo Testamento" \
  docs/doctrine/CONSTITUICAO_DOUTRINARIA.md
grep -Fq "Gênesis, Êxodo, Levítico, Números e Deuteronômio" \
  docs/doctrine/CANON_PROTESTANTE_66_LIVROS.md
grep -Fq "Mateus, Marcos, Lucas e João" \
  docs/doctrine/CANON_PROTESTANTE_66_LIVROS.md
grep -Fq "não substitui a revisão histórico-textual especializada da Aula 3" \
  docs/doctrine/CANON_PROTESTANTE_66_LIVROS.md
grep -Fq "publication_allowed: false" \
  docs/courses/fundamentos-da-fe/module-01/lesson-03.md
grep -Fq "title: Autoridade, suficiência, clareza e necessidade" \
  docs/courses/fundamentos-da-fe/module-01/lesson-04.md
grep -Fq "version: 1" \
  docs/courses/fundamentos-da-fe/module-01/lesson-04.md
grep -Fq "status: draft" \
  docs/courses/fundamentos-da-fe/module-01/lesson-04.md
grep -Fq "estimated_minutes: 135" \
  docs/courses/fundamentos-da-fe/module-01/lesson-04.md
grep -Fq "publication_allowed: false" \
  docs/courses/fundamentos-da-fe/module-01/lesson-04.md
grep -Fq "doctrinal: pending" \
  docs/courses/fundamentos-da-fe/module-01/lesson-04.md
grep -Fq "pedagogical: pending" \
  docs/courses/fundamentos-da-fe/module-01/lesson-04.md
grep -Fq "editorial: pending" \
  docs/courses/fundamentos-da-fe/module-01/lesson-04.md
grep -Fq "accessibility: pending" \
  docs/courses/fundamentos-da-fe/module-01/lesson-04.md
grep -Fq "não reproduz material proprietário" \
  docs/courses/fundamentos-da-fe/module-01/sources-04.md
grep -Fq "title: Contexto histórico, literário e bíblico" \
  docs/courses/fundamentos-da-fe/module-01/lesson-05.md
grep -Fq "version: 1" \
  docs/courses/fundamentos-da-fe/module-01/lesson-05.md
grep -Fq "status: draft" \
  docs/courses/fundamentos-da-fe/module-01/lesson-05.md
grep -Fq "estimated_minutes: 135" \
  docs/courses/fundamentos-da-fe/module-01/lesson-05.md
grep -Fq "publication_allowed: false" \
  docs/courses/fundamentos-da-fe/module-01/lesson-05.md
grep -Fq "doctrinal: pending" \
  docs/courses/fundamentos-da-fe/module-01/lesson-05.md
grep -Fq "pedagogical: pending" \
  docs/courses/fundamentos-da-fe/module-01/lesson-05.md
grep -Fq "editorial: pending" \
  docs/courses/fundamentos-da-fe/module-01/lesson-05.md
grep -Fq "accessibility: pending" \
  docs/courses/fundamentos-da-fe/module-01/lesson-05.md
grep -Fq "não reproduz material proprietário" \
  docs/courses/fundamentos-da-fe/module-01/sources-05.md
grep -Fq "title: Leitura cristocêntrica e interpretação responsável" \
  docs/courses/fundamentos-da-fe/module-01/lesson-06.md
grep -Fq "version: 1" \
  docs/courses/fundamentos-da-fe/module-01/lesson-06.md
grep -Fq "status: draft" \
  docs/courses/fundamentos-da-fe/module-01/lesson-06.md
grep -Fq "estimated_minutes: 150" \
  docs/courses/fundamentos-da-fe/module-01/lesson-06.md
grep -Fq "publication_allowed: false" \
  docs/courses/fundamentos-da-fe/module-01/lesson-06.md
grep -Fq "doctrinal: pending" \
  docs/courses/fundamentos-da-fe/module-01/lesson-06.md
grep -Fq "pedagogical: pending" \
  docs/courses/fundamentos-da-fe/module-01/lesson-06.md
grep -Fq "editorial: pending" \
  docs/courses/fundamentos-da-fe/module-01/lesson-06.md
grep -Fq "accessibility: pending" \
  docs/courses/fundamentos-da-fe/module-01/lesson-06.md
grep -Fq "não reproduz material proprietário" \
  docs/courses/fundamentos-da-fe/module-01/sources-06.md
grep -Fq "title: Aplicação fiel sem distorcer o texto" \
  docs/courses/fundamentos-da-fe/module-01/lesson-07.md
grep -Fq "version: 1" \
  docs/courses/fundamentos-da-fe/module-01/lesson-07.md
grep -Fq "status: draft" \
  docs/courses/fundamentos-da-fe/module-01/lesson-07.md
grep -Fq "estimated_minutes: 135" \
  docs/courses/fundamentos-da-fe/module-01/lesson-07.md
grep -Fq "publication_allowed: false" \
  docs/courses/fundamentos-da-fe/module-01/lesson-07.md
grep -Fq "doctrinal: pending" \
  docs/courses/fundamentos-da-fe/module-01/lesson-07.md
grep -Fq "pedagogical: pending" \
  docs/courses/fundamentos-da-fe/module-01/lesson-07.md
grep -Fq "editorial: pending" \
  docs/courses/fundamentos-da-fe/module-01/lesson-07.md
grep -Fq "accessibility: pending" \
  docs/courses/fundamentos-da-fe/module-01/lesson-07.md
grep -Fq "não reproduz material proprietário" \
  docs/courses/fundamentos-da-fe/module-01/sources-07.md
grep -Fq "title: Integração, revisão e avaliação final" \
  docs/courses/fundamentos-da-fe/module-01/lesson-08.md
grep -Fq "version: 2" \
  docs/courses/fundamentos-da-fe/module-01/lesson-08.md
grep -Fq "status: draft" \
  docs/courses/fundamentos-da-fe/module-01/lesson-08.md
grep -Fq "estimated_minutes: 135" \
  docs/courses/fundamentos-da-fe/module-01/lesson-08.md
grep -Fq "publication_allowed: false" \
  docs/courses/fundamentos-da-fe/module-01/lesson-08.md
grep -Fq "doctrinal: pending" \
  docs/courses/fundamentos-da-fe/module-01/lesson-08.md
grep -Fq "pedagogical: pending" \
  docs/courses/fundamentos-da-fe/module-01/lesson-08.md
grep -Fq "editorial: pending" \
  docs/courses/fundamentos-da-fe/module-01/lesson-08.md
grep -Fq "accessibility: pending" \
  docs/courses/fundamentos-da-fe/module-01/lesson-08.md
grep -Fq "não reproduz material proprietário" \
  docs/courses/fundamentos-da-fe/module-01/sources-08.md
grep -Fq 'project_weight_percent: 60' \
  docs/courses/fundamentos-da-fe/module-01/plan.yaml
grep -Fq 'final_assessment_weight_percent: 40' \
  docs/courses/fundamentos-da-fe/module-01/plan.yaml
grep -Fq 'passing_score_percent: 80' \
  docs/courses/fundamentos-da-fe/module-01/plan.yaml
grep -Fq 'minimum_component_score_percent: 70' \
  docs/courses/fundamentos-da-fe/module-01/plan.yaml
grep -Fq 'mode: references_only' \
  docs/courses/fundamentos-da-fe/module-01/plan.yaml
grep -Fq 'full_text_embedded: false' \
  docs/courses/fundamentos-da-fe/module-01/plan.yaml
grep -Fq 'protected_translation_selected: false' \
  docs/courses/fundamentos-da-fe/module-01/plan.yaml
grep -Fq 'assessment_timer_required: false' \
  docs/courses/fundamentos-da-fe/module-01/plan.yaml
grep -Fq 'additional_time_penalty: false' \
  docs/courses/fundamentos-da-fe/module-01/plan.yaml
grep -Fq 'OpenAI ChatGPT/Codex' \
  docs/editorial/MODULE_01_PROVENANCE.md
grep -Fq 'Nenhuma comparação humana documentada' \
  docs/editorial/MODULE_01_PROVENANCE.md
grep -Fq 'somente referências bíblicas' \
  docs/legal/MODULE_01_SOURCE_AND_RIGHTS_REGISTER.md
grep -Fq 'BIB-TEXT-001' \
  docs/legal/MODULE_01_SOURCE_AND_RIGHTS_REGISTER.md
grep -Fq 'implementation_and_testing_pending' \
  docs/accessibility/MODULE_01_ACCESSIBILITY_ACCEPTANCE.md
grep -Fq 'conformidade WCAG 2.2 AA' \
  docs/accessibility/MODULE_01_ACCESSIBILITY_ACCEPTANCE.md
grep -Fq 'O autor não pode aprovar o próprio conteúdo' \
  docs/reviews/module-01/FINAL_GATE_PLAN_C95E252.md
grep -Fq 'O PR nº 46 permanece em rascunho' \
  docs/reviews/module-01/FINAL_GATE_PLAN_C95E252.md
grep -Fq 'candidate_sources_registered_specialist_review_pending' \
  docs/research/MODULE_01_AULA_03_SOURCE_DOSSIER.md
grep -Fq 'Obra candidata não é fonte efetivamente utilizada' \
  docs/research/MODULE_01_AULA_03_SOURCE_DOSSIER.md
grep -Fq 'specialist_review: pending' \
  docs/research/MODULE_01_AULA_03_SOURCE_DOSSIER.md
grep -Fq 'MODULE_01_AULA_03_SOURCE_DOSSIER.md' \
  docs/courses/fundamentos-da-fe/module-01/sources-03.md
grep -Fq 'nota final = (projeto × 0,60) + (avaliação final × 0,40)' \
  docs/courses/fundamentos-da-fe/module-01/lesson-08.md
grep -Fq 'Excelente | 20' \
  docs/courses/fundamentos-da-fe/module-01/assessment-rubric.md
grep -Fq 'Nível insuficiente em integração bíblica e cristocêntrica' \
  docs/courses/fundamentos-da-fe/module-01/assessment-rubric.md
grep -Fq 'protocol_ready_pilot_pending' \
  docs/validation/MODULE_01_PEDAGOGICAL_PILOT.md
grep -Fq 'mediana do tempo ativo total estiver entre 15 e 21 horas' \
  docs/validation/MODULE_01_PEDAGOGICAL_PILOT.md
grep -Fq 'changes_required' \
  docs/reviews/MODULE_01_HUMAN_REVIEW.md
grep -Fq 'conteúdo-base: commit `22b38c3`' \
  docs/reviews/MODULE_01_HUMAN_REVIEW.md
grep -Fq "O autor não pode aprovar o próprio conteúdo" \
  docs/reviews/MODULE_01_HUMAN_REVIEW.md
grep -Fq "parecer doutrinário, bíblico e pastoral: **aprovado com condicionantes**" \
  docs/reviews/MODULE_01_HUMAN_REVIEW.md
grep -Fq "parecer pedagógico: **alterações solicitadas**" \
  docs/reviews/MODULE_01_HUMAN_REVIEW.md
grep -Fq "parecer editorial, originalidade e licenças: **rejeitado**" \
  docs/reviews/MODULE_01_HUMAN_REVIEW.md
grep -Fq "gate de acessibilidade: **rejeitado**" \
  docs/reviews/MODULE_01_HUMAN_REVIEW.md
grep -Fq "independência e competência específica dos pareceres: **a verificar**" \
  docs/reviews/MODULE_01_HUMAN_REVIEW.md
grep -Fq "publicação: **bloqueada**" \
  docs/reviews/MODULE_01_HUMAN_REVIEW.md

node --input-type=module <<'NODE'
import { readFileSync } from "node:fs";

const expected = new Map([
  ["doctrinal", "approved"],
  ["pedagogical", "changes-requested"],
  ["editorial", "rejected"],
  ["accessibility", "rejected"]
]);

for (const [type, decision] of expected) {
  const path = `docs/reviews/module-01/2026-07-29-${type}.json`;
  const review = JSON.parse(readFileSync(path, "utf8"));

  if (review.schema !== "apostolic-ia.module-review.v1") {
    throw new Error(`Schema inválido em ${path}`);
  }
  if (review.module?.contentCommit !== "22b38c3") {
    throw new Error(`Commit revisado inválido em ${path}`);
  }
  if (review.review?.type !== type || review.review?.decision !== decision) {
    throw new Error(`Decisão inválida em ${path}`);
  }
  if (review.automaticPublicationAuthorized !== false) {
    throw new Error(`Publicação automática indevidamente autorizada em ${path}`);
  }
}

const correctedPedagogical = JSON.parse(
  readFileSync(
    "docs/reviews/module-01/2026-07-29-pedagogical-abd8b90.json",
    "utf8"
  )
);

if (
  correctedPedagogical.schema !== "apostolic-ia.module-review.v1" ||
  correctedPedagogical.module?.contentCommit !== "abd8b90" ||
  correctedPedagogical.review?.type !== "pedagogical" ||
  correctedPedagogical.review?.decision !== "approved" ||
  correctedPedagogical.automaticPublicationAuthorized !== false
) {
  throw new Error("Parecer pedagógico corrigido inválido.");
}

if (
  !correctedPedagogical.review?.blockers?.includes("piloto pedagógico") ||
  !correctedPedagogical.review?.observations?.includes(
    "Aprovado com condições"
  )
) {
  throw new Error("Condições do parecer pedagógico corrigido ausentes.");
}

const latestDoctrinal = JSON.parse(
  readFileSync(
    "docs/reviews/module-01/2026-07-30-doctrinal-2f9e307.json",
    "utf8"
  )
);

if (
  latestDoctrinal.schema !== "apostolic-ia.module-review.v2" ||
  latestDoctrinal.template !== false ||
  latestDoctrinal.module?.contentCommit !== "2f9e307" ||
  latestDoctrinal.review?.type !== "doctrinal" ||
  latestDoctrinal.review?.decision !== "approved" ||
  latestDoctrinal.declarations?.humanReviewer !== true ||
  latestDoctrinal.declarations?.reviewedFrozenContent !== true ||
  latestDoctrinal.declarations?.bibleFinalAuthority !== true ||
  latestDoctrinal.declarations?.independenceDeclared !== false ||
  latestDoctrinal.automaticPublicationAuthorized !== false
) {
  throw new Error("Parecer doutrinário do commit 2f9e307 inválido.");
}

if (
  !latestDoctrinal.review?.checklist?.some(
    (item) =>
      item.id === "continuation_of_gifts" && item.result === "compliant"
  ) ||
  !latestDoctrinal.review?.blockers?.includes(
    "revisão histórica e textual especializada"
  ) ||
  !latestDoctrinal.review?.observations?.includes(
    "não autoriza publicação ou merge"
  )
) {
  throw new Error("Limites da aprovação doutrinária do commit 2f9e307 ausentes.");
}
NODE

node --input-type=module <<'NODE'
import { readFileSync } from "node:fs";

const quizzes = [
  {
    lesson: 1,
    path: "docs/courses/fundamentos-da-fe/module-01/quiz-01.json",
    minimumVersion: 2,
    expectedQuestions: 8
  },
  {
    lesson: 2,
    path: "docs/courses/fundamentos-da-fe/module-01/quiz-02.json",
    minimumVersion: 1,
    expectedQuestions: 8
  },
  {
    lesson: 3,
    path: "docs/courses/fundamentos-da-fe/module-01/quiz-03.json",
    minimumVersion: 1,
    expectedQuestions: 8
  },
  {
    lesson: 4,
    path: "docs/courses/fundamentos-da-fe/module-01/quiz-04.json",
    minimumVersion: 1,
    expectedQuestions: 8
  },
  {
    lesson: 5,
    path: "docs/courses/fundamentos-da-fe/module-01/quiz-05.json",
    minimumVersion: 1,
    expectedQuestions: 8
  },
  {
    lesson: 6,
    path: "docs/courses/fundamentos-da-fe/module-01/quiz-06.json",
    minimumVersion: 2,
    expectedQuestions: 8
  },
  {
    lesson: 7,
    path: "docs/courses/fundamentos-da-fe/module-01/quiz-07.json",
    minimumVersion: 1,
    expectedQuestions: 8
  },
  {
    lesson: 8,
    path: "docs/courses/fundamentos-da-fe/module-01/quiz-08.json",
    minimumVersion: 1,
    expectedQuestions: 16
  }
];

for (const item of quizzes) {
  const quiz = JSON.parse(readFileSync(item.path, "utf8"));

  if (quiz.status !== "draft" || quiz.version < item.minimumVersion) {
    throw new Error(`Quiz da Aula ${item.lesson} possui versão ou estado inválido.`);
  }

  if (
    !Array.isArray(quiz.questions) ||
    quiz.questions.length !== item.expectedQuestions
  ) {
    throw new Error(
      `Quiz da Aula ${item.lesson} deve conter ${item.expectedQuestions} questões.`
    );
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

node --input-type=module <<'NODE'
import { readFileSync } from "node:fs";

const template = JSON.parse(
  readFileSync(
    "docs/reviews/module-01/final-review-template-v2.json",
    "utf8"
  )
);

if (
  template.schema !== "apostolic-ia.module-review.v2" ||
  template.template !== true ||
  template.module?.contentCommit !== "abd8b90" ||
  template.module?.controlsCommit !== "c95e252" ||
  template.review?.decision !== "pending" ||
  template.declarations?.humanReviewer !== false ||
  template.automaticPublicationAuthorized !== false
) {
  throw new Error("Modelo dos pareceres finais da Sprint 034 inválido.");
}
NODE

echo "Sprint 034 - matriz, carga horária e rascunhos das Aulas 1 a 8 validados."
