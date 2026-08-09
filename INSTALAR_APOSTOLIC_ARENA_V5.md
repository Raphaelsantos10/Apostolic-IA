# Instalar o Dashboard Realista V5

Este ZIP é um patch de sobreposição para a branch `feature/apostolic-arena-v2`. Ele não apaga cartas, Bíblias, comunidade, migrações ou alterações locais fora dos caminhos incluídos.

No Git Bash, dentro do projeto:

```bash
cd "$HOME/Documents/Nova pasta/Apostolic-IA-biblia"
git branch --show-current
git status --short

PATCH="$HOME/Downloads/apostolic-arena-dashboard-personagens-reais-v5.zip"
test -f "$PATCH" || { echo "Patch V5 não encontrado em Downloads"; exit 1; }

unzip -o "$PATCH" -d .
rm -rf apps/web/.next

corepack pnpm install
corepack pnpm --filter @apostolic-ia/web typecheck
corepack pnpm --filter @apostolic-ia/web test
corepack pnpm --filter @apostolic-ia/web build
```

Depois execute o projeto e abra **Jogos → Apostolic Arena**. No dashboard, clique nos botões de poder abaixo de Moisés, Davi, Sansão e Débora.

Não execute `git stash pop`, `git reset --hard` ou `git clean` durante esta instalação.
