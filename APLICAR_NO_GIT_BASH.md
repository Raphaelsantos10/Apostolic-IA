# Aplicar o pacote no Git Bash

Extraia este pacote e copie o conteúdo para a raiz do repositório Apostolic-IA.
Depois execute:

```bash
cd "/c/Users/Utilizador/Documents/Nova pasta/Apostolic-IA"

git branch --show-current
git status
git diff --check
bash scripts/validate-repository.sh

git add README.md docs/sprints/SPRINT_001.md \
  docs/doctrine/CONSTITUICAO_DOUTRINARIA.md
git commit -m "docs: Sprint 001 - iniciar constituicao doutrinaria"
git push origin sprint/001-constituicao-doutrinaria
```

O validador ainda exibirá a mensagem da Sprint 000 até ser atualizado na etapa
final da Sprint 001. Isso não significa que a Sprint 001 esteja concluída.
