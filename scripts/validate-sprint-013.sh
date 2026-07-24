#!/usr/bin/env bash
set -euo pipefail

required_files=(
  "apps/web/proxy.ts"
  "apps/web/lib/supabase/env.ts"
  "apps/web/lib/supabase/client.ts"
  "apps/web/lib/supabase/server.ts"
  "apps/web/lib/supabase/proxy.ts"
  "apps/web/app/auth/actions.ts"
  "apps/web/app/auth/callback/route.ts"
  "apps/web/app/auth/confirm/route.ts"
  "apps/web/app/(auth)/entrar/page.tsx"
  "apps/web/app/(auth)/criar-conta/page.tsx"
  "apps/web/app/(auth)/recuperar-senha/page.tsx"
  "apps/web/app/(auth)/atualizar-senha/page.tsx"
  "apps/web/app/(auth)/conta/page.tsx"
  "supabase/migrations/20260725100000_account_deletion.sql"
  "supabase/tests/database/account-auth.test.sql"
  "docs/development/AUTHENTICATION.md"
  "docs/sprints/SPRINT_013.md"
)

for file in "${required_files[@]}"; do
  [[ -f "$file" ]] || {
    echo "ERRO: arquivo da Sprint 013 ausente: $file"
    exit 1
  }
done

grep -Fq 'auth.uid()' supabase/migrations/20260725100000_account_deletion.sql
grep -Fq "confirmation is distinct from 'EXCLUIR'" \
  supabase/migrations/20260725100000_account_deletion.sql
grep -Fq 'getUser()' apps/web/lib/supabase/proxy.ts
grep -Fq 'startsWith("/conta")' apps/web/lib/supabase/proxy.ts

if grep -RInE \
  '(service_role[=:][[:space:]]*[^<[:space:]]|SUPABASE_SECRET_KEY[=:][[:space:]]*[^<[:space:]])' \
  apps/web supabase docs/development/AUTHENTICATION.md; then
  echo "ERRO: possível segredo privilegiado encontrado"
  exit 1
fi

echo "Sprint 013 - fluxos de autenticação validados estaticamente."
