#!/usr/bin/env bash
set -euo pipefail

required_files=(
  "docs/product/TEOLOGIA_CURRICULO.md"
  "docs/curriculum/TEOLOGIA_CARGA_HORARIA.md"
  "docs/courses/fundamentos-da-fe/module-01/plan.yaml"
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
grep -q "Em andamento" docs/sprints/SPRINT_034.md
grep -q "não representa aprovação final" \
  docs/validation/SPRINT_034_VALIDATION.md

echo "Sprint 034 - matriz, carga horária e plano do módulo validados."
