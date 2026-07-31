#!/usr/bin/env bash
set -euo pipefail

required_files=(
  "apps/web/components/study-experience.tsx"
  "apps/web/components/study-motion.tsx"
  "apps/web/components/rive-study-flame.tsx"
  "apps/web/app/dashboard-preview/study-experience.module.css"
  "apps/web/public/animations/achievement-spark.json"
  "docs/sprints/SPRINT_035.md"
  "docs/validation/SPRINT_035_VALIDATION.md"
)

for file in "${required_files[@]}"; do
  test -f "$file"
done

grep -Fq "NEXT_PUBLIC_STUDY_EXPERIENCE_V2" .env.example
grep -Fq "prefers-reduced-motion" apps/web/app/dashboard-preview/study-experience.module.css
grep -Fq "Bíblia: autoridade final" apps/web/components/study-experience.tsx
grep -Fq "nunca crescimento espiritual" apps/web/components/study-experience.tsx
grep -Fq "@rive-app/react-webgl2" apps/web/package.json
grep -Fq 'LUMI_ARTBOARD = "Lumi"' apps/web/components/rive-study-flame.tsx
grep -Fq 'LUMI_STATE_MACHINE = "lumi-ui"' apps/web/components/rive-study-flame.tsx
grep -Fq "NEXT_PUBLIC_RIVE_LUMI_URL" apps/web/components/study-motion.tsx
test -f apps/web/public/characters/lumi/poster.webp
grep -Fq "@lottiefiles/dotlottie-react" apps/web/package.json

echo "Sprint 035 - experiência visual e movimento responsável validados."
