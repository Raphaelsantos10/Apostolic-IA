#!/usr/bin/env bash
set -euo pipefail
files=(
  "apps/web/app/perfil/actions.ts"
  "apps/web/app/(auth)/perfil/page.tsx"
  "apps/web/app/(auth)/perfil/preference-form.tsx"
  "supabase/tests/database/profile-preferences.test.sql"
  "docs/development/PROFILE_PREFERENCES.md"
  "docs/sprints/SPRINT_014.md"
)
for file in "${files[@]}"; do
  [[ -f "$file" ]] || { echo "ERRO: ausente: $file"; exit 1; }
done
grep -Fq 'auth.getUser()' apps/web/app/perfil/actions.ts
grep -Fq '.from("preferences")' apps/web/app/perfil/actions.ts
echo "Sprint 014 - perfil e preferências validados estaticamente."
