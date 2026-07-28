#!/usr/bin/env bash
set -euo pipefail

required_files=(
  ".github/dependabot.yml"
  ".github/workflows/codeql.yml"
  "apps/web/lib/security-headers.mjs"
  "apps/web/lib/security-headers.test.mjs"
  "apps/web/lib/server-observability.mjs"
  "apps/web/lib/server-observability.test.mjs"
  "docs/security/INCIDENT_RESPONSE.md"
  "docs/security/PRODUCTION_SECURITY_BASELINE.md"
  "docs/security/SECRETS_INVENTORY.md"
  "docs/security/OBSERVABILITY.md"
  "docs/sprints/SPRINT_030.md"
  "docs/validation/SPRINT_030_VALIDATION.md"
  "supabase/tests/database/global-security-audit.test.sql"
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
grep -q "errorType" apps/web/lib/server-observability.mjs
grep -q "SUPABASE_SERVICE_ROLE_KEY" docs/security/SECRETS_INVENTORY.md
grep -q "relforcerowsecurity" supabase/tests/database/global-security-audit.test.sql
grep -q "has_function_privilege" supabase/tests/database/global-security-audit.test.sql

echo "Sprint 030 - base de segurança validada estaticamente."
