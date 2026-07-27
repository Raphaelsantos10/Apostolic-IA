#!/usr/bin/env bash
set -euo pipefail
required=(
  supabase/migrations/20260727260000_sustainability.sql
  supabase/tests/database/sustainability.test.sql
  apps/web/components/pricing-panel.tsx
  apps/web/app/api/billing/checkout/route.ts
  apps/web/app/api/billing/webhook/route.ts
  docs/product/PRICING_SUSTAINABILITY.md
  docs/development/BILLING.md
  docs/sprints/SPRINT_026.md
  docs/validation/SPRINT_026_VALIDATION.md
)
for file in "${required[@]}"; do test -f "$file" || { echo "Ausente: $file"; exit 1; }; done
grep -q "STRIPE_SECRET_KEY" .env.example
grep -q "force row level security" supabase/migrations/20260727260000_sustainability.sql
echo "Sprint 026 - estrutura validada estaticamente."
