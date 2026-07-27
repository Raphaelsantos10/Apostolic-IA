#!/usr/bin/env bash
set -euo pipefail

required_files=(
  "docs/product/TEOLOGIA_CURRICULO.md"
  "docs/editorial/TEOLOGIA_APROVACAO.md"
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
grep -q "PUBLICATION_REQUIRES_HUMAN_APPROVAL" \
  supabase/migrations/20260727270000_theological_approval.sql

echo "Sprint 027 - currículo e aprovação humana validados."
