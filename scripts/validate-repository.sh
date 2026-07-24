#!/usr/bin/env bash
set -euo pipefail

required_files=(
  "README.md"
  "ROADMAP.md"
  "CONTRIBUTING.md"
  "SECURITY.md"
  "CHANGELOG.md"
  "docs/SPRINT_DELIVERY_POLICY.md"
  "docs/VALIDATION_POLICY.md"
  "docs/INSTALLATION_UPDATE_ROLLBACK.md"
  "docs/BACKUP_RECOVERY.md"
  "docs/sprints/SPRINT_000.md"
)

for file in "${required_files[@]}"; do
  if [[ ! -f "$file" ]]; then
    echo "ERRO: arquivo obrigatório ausente: $file"
    exit 1
  fi
done

for forbidden in .env .env.local node_modules dist build; do
  if [[ -e "$forbidden" ]]; then
    echo "ERRO: item proibido na raiz: $forbidden"
    exit 1
  fi
done

if grep -RInE --exclude-dir=.git --exclude="validate-repository.sh" \
  '(BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY|sk-[A-Za-z0-9_-]{20,}|service_role[=:][[:space:]]*[^<[:space:]])' .; then
  echo "ERRO: possível segredo encontrado"
  exit 1
fi

if grep -RInE --exclude-dir=.git '^(<<<<<<<|=======|>>>>>>>)' .; then
  echo "ERRO: marcador de conflito Git encontrado"
  exit 1
fi

echo "Sprint 000 validada com sucesso."
