#!/usr/bin/env bash
set -euo pipefail

migration="supabase/migrations/20260724170000_identity_and_rls.sql"
test_file="supabase/tests/database/rls.test.sql"

required_files=(
  "supabase/config.toml"
  "$migration"
  "supabase/seed.sql"
  "$test_file"
  "docs/development/BACKEND.md"
  "docs/security/RLS_MATRIX.md"
  "docs/sprints/SPRINT_012.md"
)

for file in "${required_files[@]}"; do
  [[ -f "$file" ]] || {
    echo "ERRO: arquivo da Sprint 012 ausente: $file"
    exit 1
  }
done

checks=(
  "alter table public.profiles enable row level security"
  "alter table public.profiles force row level security"
  "alter table public.preferences enable row level security"
  "alter table public.preferences force row level security"
  "auth.uid()"
  "revoke all on public.profiles from anon, authenticated"
  "grant update (display_name, locale, timezone)"
  "security definer"
  "set search_path = ''"
)

for check in "${checks[@]}"; do
  grep -Fq "$check" "$migration" || {
    echo "ERRO: proteção obrigatória ausente na migração: $check"
    exit 1
  }
done

grep -Fq "set local request.jwt.claim.sub" "$test_file" || {
  echo "ERRO: teste RLS não simula identidade autenticada"
  exit 1
}

secret_targets=(supabase docs/development/BACKEND.md)
[[ -f .env.example ]] && secret_targets+=(.env.example)

if grep -RInE \
  '(service_role[=:][[:space:]]*[^<[:space:]]|SUPABASE_SECRET_KEY[=:][[:space:]]*[^<[:space:]])' \
  "${secret_targets[@]}"; then
  echo "ERRO: possível chave privilegiada encontrada"
  exit 1
fi

echo "Sprint 012 - estrutura, autenticação e RLS validadas estaticamente."
