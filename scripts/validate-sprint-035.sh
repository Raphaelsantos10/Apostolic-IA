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
  "docs/design/APOSTOLIC_PRODUCT_VISUAL_ARCHITECTURE.md"
)

for file in "${required_files[@]}"; do
  test -f "$file"
done

grep -Fq "NEXT_PUBLIC_STUDY_EXPERIENCE_V2" .env.example
grep -Fq "prefers-reduced-motion" apps/web/app/dashboard-preview/study-experience.module.css
grep -Fq "Bíblia: autoridade final" apps/web/components/study-experience.tsx
grep -Fq "nunca crescimento espiritual" apps/web/components/study-experience.tsx
grep -Fq "ModuleReviewPlayer" apps/web/components/study-experience.tsx
grep -Fq "Oito aulas e quizzes do Módulo 1" apps/web/components/study-experience.tsx
grep -Fq "modo de revisão local" apps/web/components/study-experience.tsx
grep -Fq '"loading"' apps/web/components/module-review-player.tsx
grep -Fq '"offline"' apps/web/components/module-review-player.tsx
grep -Fq '"unavailable"' apps/web/components/module-review-player.tsx
grep -Fq '"error"' apps/web/components/module-review-player.tsx
grep -Fq "Tentar novamente" apps/web/components/module-review-player.tsx
grep -Fq "@rive-app/react-webgl2" apps/web/package.json
grep -Fq 'LUMI_ARTBOARD = "Lumi"' apps/web/components/rive-study-flame.tsx
grep -Fq 'LUMI_STATE_MACHINE = "lumi-ui"' apps/web/components/rive-study-flame.tsx
grep -Fq "NEXT_PUBLIC_RIVE_LUMI_URL" apps/web/components/study-motion.tsx
test -f apps/web/public/characters/lumi/poster.webp
grep -Fq 'activeSection === "study" && visualExperience' apps/web/app/dashboard-preview/dashboard-functional.tsx
grep -Fq '{ icon: "▤", label: "Estudos", section: "study" }' apps/web/app/dashboard-preview/dashboard-functional.tsx
grep -Fq '/dashboard-preview?section=' apps/web/app/dashboard-preview/dashboard-functional.tsx
grep -Fq "discoveryCards" apps/web/app/dashboard-preview/dashboard-functional.tsx
grep -Fq "scrollReveal" apps/web/app/dashboard-preview/dashboard-functional.tsx
grep -Fq "scroll-snap-type" apps/web/app/dashboard-preview/dashboard-preview.module.css
grep -Fq "animation-timeline: view()" apps/web/app/dashboard-preview/dashboard-preview.module.css
grep -Fq "prefers-reduced-motion: reduce" apps/web/app/dashboard-preview/dashboard-preview.module.css
grep -Fq "O dashboard é sempre a página inicial autenticada" docs/design/APOSTOLIC_PRODUCT_VISUAL_ARCHITECTURE.md
grep -Fq "A chama mede somente constância de estudo" docs/design/APOSTOLIC_PRODUCT_VISUAL_ARCHITECTURE.md
grep -Fq "@lottiefiles/dotlottie-react" apps/web/package.json

echo "Sprint 035 - experiência visual e movimento responsável validados."
