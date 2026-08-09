# Instalar o Menu Principal Cinematografico V6

Este ZIP e incremental e pressupoe que a V5 esteja confirmada no commit `e934fac` da branch `feature/apostolic-arena-v2`.

No Git Bash, dentro do projeto:

```bash
cd "$HOME/Documents/Nova pasta/Apostolic-IA-biblia"
git branch --show-current
git status --short

PATCH="$HOME/Downloads/apostolic-arena-menu-cinematico-v6.zip"
test -f "$PATCH" || { echo "Patch V6 nao encontrado em Downloads"; exit 1; }

unzip -o "$PATCH" -d .
rm -rf apps/web/.next

corepack pnpm --filter @apostolic-ia/web typecheck
corepack pnpm --filter @apostolic-ia/web test
corepack pnpm --filter @apostolic-ia/web build
```

Depois abra Jogos -> Apostolic Arena. Troque o Campeao no seletor lateral, teste o botao BATALHAR e as demais abas.

Nao execute `git reset --hard`, `git clean` ou `git stash pop` durante a instalacao.
