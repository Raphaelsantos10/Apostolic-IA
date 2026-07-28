#!/usr/bin/env bash
set -euo pipefail

required_files=(
  "apps/web/app/dashboard-preview/dashboard-functional.tsx"
  "apps/web/app/dashboard-preview/dashboard-preview.module.css"
  "docs/product/GAMIFICATION_EXPANSION_BACKLOG.md"
  "docs/sprints/SPRINT_029.md"
  "docs/validation/SPRINT_029_VALIDATION.md"
)

for file in "${required_files[@]}"; do
  test -f "$file" || {
    echo "ERRO: arquivo da Sprint 029 ausente: $file"
    exit 1
  }
done

grep -q 'sync_healthy_gamification' \
  apps/web/app/dashboard-preview/dashboard-functional.tsx
grep -q 'apostolic-learning-mode' \
  apps/web/app/dashboard-preview/dashboard-functional.tsx
grep -q 'Gamificação mede aprendizagem, nunca espiritualidade' \
  apps/web/app/dashboard-preview/dashboard-functional.tsx
grep -q '029 | \[x\] Concluída' ROADMAP.md

echo "Sprint 029 - dashboard e gamificação saudável validados estaticamente."
