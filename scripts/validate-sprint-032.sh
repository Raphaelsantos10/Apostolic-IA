#!/usr/bin/env bash
set -euo pipefail

required_files=(
  "README.md"
  "ROADMAP.md"
  "docs/SPRINT_DELIVERY_POLICY.md"
  "docs/doctrine/CONSTITUICAO_DOUTRINARIA.md"
  "docs/sprints/SPRINT_031.md"
  "docs/validation/SPRINT_031_VALIDATION.md"
  "docs/sprints/SPRINT_032.md"
  "docs/validation/SPRINT_032_VALIDATION.md"
  "docs/design/MOTION_SYSTEM.md"
  "apps/web/app/dashboard-preview/page.tsx"
  "apps/web/app/dashboard-preview/dashboard-functional.tsx"
  "apps/web/lib/visual-motion.mjs"
  "apps/web/lib/visual-motion.test.mjs"
  "apps/mobile/package.json"
  "packages/design-tokens/src/tokens.json"
)

for file in "${required_files[@]}"; do
  test -f "$file" || {
    echo "ERRO: arquivo da Sprint 032 ausente: $file"
    exit 1
  }
done

grep -q "Sprint 032" README.md
grep -q "sprint/032-alpha-beta-piloto" README.md
grep -q "Alpha, beta, piloto" docs/sprints/SPRINT_032.md
grep -q "Release Candidate" docs/sprints/SPRINT_032.md
grep -q "não redesenhar o dashboard aprovado" docs/sprints/SPRINT_032.md
grep -q "a IA não cria doutrina" docs/sprints/SPRINT_032.md
grep -q "não declarar todos os cursos como prontos" docs/sprints/SPRINT_032.md
grep -q "Sprint 033" docs/validation/SPRINT_032_VALIDATION.md
grep -q "prefers-reduced-motion" docs/design/MOTION_SYSTEM.md
grep -q "NEXT_PUBLIC_APOSTOLIC_ENHANCED_MOTION" docs/design/MOTION_SYSTEM.md
grep -q '"standard": 200' packages/design-tokens/src/tokens.json
grep -q 'data-motion' apps/web/app/layout.tsx
grep -q 'prefers-reduced-motion' apps/web/app/styles.css

echo "Sprint 032 - continuidade, escopo e gates de piloto validados."
