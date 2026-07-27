#!/usr/bin/env bash
set -euo pipefail

required_files=(
  "apps/mobile/lib/platform.ts"
  "docs/development/PLATFORM_OFFLINE_SYNC.md"
  "docs/sprints/SPRINT_028.md"
  "docs/validation/SPRINT_028_VALIDATION.md"
  "supabase/migrations/20260727280000_platform_offline_sync.sql"
  "supabase/tests/database/platform-offline-sync.test.sql"
)

for file in "${required_files[@]}"; do
  test -f "$file" || {
    echo "ERRO: arquivo da Sprint 028 ausente: $file"
    exit 1
  }
done

grep -q "pt-BR" apps/mobile/lib/platform.ts
grep -q "authorization" apps/web/public/sw.js
grep -q "mutations_own_insert" \
  supabase/migrations/20260727280000_platform_offline_sync.sql

echo "Sprint 028 - plataformas e offline validados estaticamente."

