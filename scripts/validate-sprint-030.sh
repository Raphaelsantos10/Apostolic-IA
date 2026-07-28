#!/usr/bin/env bash
set -euo pipefail

required_files=(
  ".github/dependabot.yml"
  ".github/workflows/codeql.yml"
  "apps/web/lib/security-headers.mjs"
  "apps/web/lib/security-headers.test.mjs"
  "docs/security/PRODUCTION_SECURITY_BASELINE.md"
  "docs/sprints/SPRINT_030.md"
  "docs/validation/SPRINT_030_VALIDATION.md"
)

for file in "${required_files[@]}"; do
  test -f "$file" || {
    echo "ERRO: arquivo da Sprint 030 ausente: $file"
    exit 1
  }
done

grep -q "frame-ancestors 'none'" apps/web/lib/security-headers.mjs
grep -q "microphone=(self)" apps/web/lib/security-headers.mjs
grep -q "security-events: write" .github/workflows/codeql.yml
grep -q "advisories/new" SECURITY.md

echo "Sprint 030 - base de segurança validada estaticamente."
