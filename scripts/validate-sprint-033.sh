#!/usr/bin/env bash
set -euo pipefail

required_files=(
  "docs/sprints/SPRINT_033.md"
  "docs/validation/SPRINT_033_VALIDATION.md"
  "docs/product/INTERACTIVE_STUDY_SYSTEM.md"
  "apps/web/components/guided-study-player.tsx"
  "apps/web/lib/guided-study.mjs"
  "apps/web/lib/guided-study.d.mts"
  "apps/web/lib/guided-study.test.mjs"
)

for file in "${required_files[@]}"; do
  test -f "$file" || {
    echo "ERRO: arquivo da Sprint 033 ausente: $file"
    exit 1
  }
done

grep -q "Sprint 033 - Player de estudo guiado" docs/sprints/SPRINT_033.md
grep -q "PR nº 45" docs/sprints/SPRINT_033.md
grep -q "6 a 8 aulas autorais" docs/sprints/SPRINT_033.md
grep -q "Alpha integral, beta, piloto pedagógico" README.md
grep -q "GuidedStudyPlayer" apps/web/components/app-shell.tsx
grep -q "Piloto funcional - conteúdo publicado" apps/web/components/guided-study-player.tsx
grep -q "Bíblia permanece a autoridade final" apps/web/components/guided-study-player.tsx
grep -q "seminário teológico completo" apps/web/components/guided-study-player.tsx
grep -q "findResumeLessonIndex" apps/web/lib/guided-study.test.mjs
grep -q "A IA não cria doutrina" docs/product/INTERACTIVE_STUDY_SYSTEM.md
grep -q "149 testes" docs/validation/SPRINT_033_VALIDATION.md
grep -q "sem lançamento público" docs/validation/SPRINT_033_VALIDATION.md
grep -q "6 a 8 aulas" docs/sprints/SPRINT_033.md

if grep -q "Fundamentos da Fé Cristã.*publicado" docs/sprints/SPRINT_033.md; then
  echo "ERRO: o currículo documental em rascunho foi declarado publicado."
  exit 1
fi

echo "Sprint 033 - player guiado e limites honestos validados."
