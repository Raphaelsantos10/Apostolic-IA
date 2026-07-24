#!/usr/bin/env bash
set -euo pipefail

required_files=(
  "README.md"
  "ROADMAP.md"
  "CONTRIBUTING.md"
  "SECURITY.md"
  "CHANGELOG.md"
  "RELEASE_NOTES.md"
  "INSTALL.md"
  "UPDATE.md"
  "ROLLBACK.md"
  "docs/SPRINT_DELIVERY_POLICY.md"
  "docs/VALIDATION_POLICY.md"
  "docs/INSTALLATION_UPDATE_ROLLBACK.md"
  "docs/BACKUP_RECOVERY.md"
  "docs/sprints/SPRINT_000.md"
  "docs/sprints/SPRINT_001.md"
  "docs/sprints/SPRINT_002.md"
  "docs/doctrine/CONSTITUICAO_DOUTRINARIA.md"
  "docs/research/REFERENCIAS_CURRICULARES_PUBLICAS.md"
  "docs/requirements/MVP_SCOPE.md"
  "docs/validation/SPRINT_001_VALIDATION.md"
  "docs/backups/SPRINT_001_BACKUP_MANIFEST.md"
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

if ! grep -q "Sprint 002" README.md; then
  echo "ERRO: README não registra a Sprint 002"
  exit 1
fi

if grep -RInE --exclude-dir=.git \
  '(Rhema|Verbo da Vida|Carisma Matriz|apostilasdeteologia)' \
  README.md CHANGELOG.md RELEASE_NOTES.md docs; then
  echo "ERRO: marca externa encontrada na documentação pública"
  exit 1
fi

echo "Sprint 002 - estrutura inicial validada com sucesso."
