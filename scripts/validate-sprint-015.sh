#!/usr/bin/env bash
set -euo pipefail
files=("apps/web/app/onboarding/actions.ts" "apps/web/app/(auth)/onboarding/page.tsx" "apps/web/app/(auth)/onboarding/resultado/page.tsx" "supabase/migrations/20260725140000_onboarding.sql" "supabase/tests/database/onboarding.test.sql" "docs/sprints/SPRINT_015.md")
for f in "${files[@]}"; do [[ -f "$f" ]] || { echo "ERRO: ausente $f"; exit 1; }; done
grep -Fq 'enable row level security' supabase/migrations/20260725140000_onboarding.sql
grep -Fq 'auth.uid()' supabase/migrations/20260725140000_onboarding.sql
echo "Sprint 015 - onboarding validado estaticamente."
