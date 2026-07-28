#!/usr/bin/env bash
set -euo pipefail

required_files=(
  "apps/web/app/api/health/route.ts"
  "apps/web/lib/resilience.mjs"
  "apps/web/lib/resilience.test.mjs"
  "docs/resilience/BACKUP_RESTORE_RUNBOOK.md"
  "docs/resilience/HEALTH_CHECKS.md"
  "docs/resilience/PERFORMANCE_BUDGETS.md"
  "docs/accessibility/WCAG_22_AA_AUDIT.md"
  "docs/sprints/SPRINT_031.md"
  "docs/validation/SPRINT_031_VALIDATION.md"
  "scripts/backup-manifest.mjs"
  "scripts/backup-manifest.test.mjs"
  "scripts/web-quality-audit.mjs"
  "scripts/web-quality-audit.test.mjs"
)

for file in "${required_files[@]}"; do
  test -f "$file" || {
    echo "ERRO: arquivo da Sprint 031 ausente: $file"
    exit 1
  }
done

grep -q "x-request-id" apps/web/app/api/health/route.ts
grep -q "no-store" apps/web/app/api/health/route.ts
grep -q "sha256" scripts/backup-manifest.mjs
grep -q "RPO de até 24 horas" docs/BACKUP_RECOVERY.md
grep -q "RTO de até 8 horas" docs/BACKUP_RECOVERY.md
grep -q "não alterar a identidade visual" docs/sprints/SPRINT_031.md
grep -q "auditHtml" scripts/web-quality-audit.mjs
grep -q "não comprova conformidade" docs/accessibility/WCAG_22_AA_AUDIT.md

echo "Sprint 031 - resiliência e auditoria de qualidade validadas."
