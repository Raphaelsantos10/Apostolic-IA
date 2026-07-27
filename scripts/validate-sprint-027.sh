#!/usr/bin/env bash
set -euo pipefail

required_files=(
  "docs/product/TEOLOGIA_CURRICULO.md"
  "docs/editorial/TEOLOGIA_APROVACAO.md"
  "docs/editorial/CONTENT_ORIGINALITY_POLICY.md"
  "docs/editorial/AI_CONTENT_POLICY.md"
  "docs/curriculum/COURSE_TEMPLATE.md"
  "docs/curriculum/LESSON_TEMPLATE.md"
  "docs/courses/fundamentos-da-fe/course.yaml"
  "docs/courses/fundamentos-da-fe/module-01/lesson-01.md"
  "docs/courses/fundamentos-da-fe/module-01/quiz-01.json"
  "docs/courses/fundamentos-da-fe/module-01/sources.md"
  "docs/sprints/SPRINT_027.md"
  "supabase/migrations/20260727270000_theological_approval.sql"
  "supabase/tests/database/theological-approval.test.sql"
)

for file in "${required_files[@]}"; do
  test -f "$file" || {
    echo "ERRO: arquivo da Sprint 027 ausente: $file"
    exit 1
  }
done

grep -q "curso livre" docs/product/TEOLOGIA_CURRICULO.md
grep -q "Doutrinário" docs/editorial/TEOLOGIA_APROVACAO.md
grep -q "pesquisa em múltiplas fontes" \
  docs/editorial/CONTENT_ORIGINALITY_POLICY.md
grep -q "pode ser publicada antes dos pareceres" \
  docs/courses/fundamentos-da-fe/module-01/lesson-01.md
node -e "JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'))" \
  docs/courses/fundamentos-da-fe/module-01/quiz-01.json
grep -q "PUBLICATION_REQUIRES_HUMAN_APPROVAL" \
  supabase/migrations/20260727270000_theological_approval.sql

echo "Sprint 027 - currículo e aprovação humana validados."
