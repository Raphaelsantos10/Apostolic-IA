#!/usr/bin/env bash
set -euo pipefail

required_files=(
  "apps/web/components/voice-accessibility.tsx"
  "apps/web/lib/voice-utils.mjs"
  "apps/web/lib/voice-utils.test.mjs"
  "docs/development/VOICE_ACCESSIBILITY.md"
  "docs/sprints/SPRINT_025.md"
  "docs/validation/SPRINT_025_VALIDATION.md"
)

for file in "${required_files[@]}"; do
  if [[ ! -f "$file" ]]; then
    echo "ERRO: arquivo da Sprint 025 ausente: $file"
    exit 1
  fi
done

grep -q "VoiceInput" apps/web/components/bible-teacher.tsx
grep -q "SpeechPlayer" apps/web/components/bible-teacher.tsx
grep -q "Confirmar resposta transcrita" apps/web/components/bible-game.tsx
grep -q "consent: false" apps/web/components/voice-accessibility.tsx

echo "Sprint 025 - estrutura de voz validada estaticamente."
