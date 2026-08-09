# Instalar a Reconstrucao Visual V7

Este ZIP substitui a V6 reprovada e pressupoe que a V5 esteja confirmada no commit `e934fac`.

```bash
cd "$HOME/Documents/Nova pasta/Apostolic-IA-biblia"
git branch --show-current
git status --short

PATCH="$HOME/Downloads/apostolic-arena-reconstrucao-visual-decks-v7.zip"
test -f "$PATCH" || { echo "Patch V7 nao encontrado"; exit 1; }

unzip -o "$PATCH" -d .
rm -rf apps/web/.next

corepack pnpm --filter @apostolic-ia/web typecheck
corepack pnpm --filter @apostolic-ia/web test
corepack pnpm --filter @apostolic-ia/web build
corepack pnpm --filter @apostolic-ia/web dev
```

Abra a URL indicada pelo terminal, entre em Jogos -> Apostolic Arena e teste os quatro Campeoes. Cada selecao deve trocar simultaneamente personagem e deck.

Nao faça commit antes da inspeção visual.
