# Instalar Apostolic Arena V10

Aplicar depois da V9.

```bash
cd "$HOME/Documents/Nova pasta/Apostolic-IA-biblia"
unzip -o "$HOME/Downloads/apostolic-arena-batalha-jogavel-v10.zip" -d .
rm -rf apps/web/.next
corepack pnpm --filter @apostolic-ia/web typecheck
corepack pnpm --filter @apostolic-ia/web test
corepack pnpm --filter @apostolic-ia/web build
corepack pnpm --filter @apostolic-ia/web dev
```

Abra BATALHAR, invoque unidades nas duas rotas e observe movimento, ataque e dano. Nao faça commit antes da inspeção.
