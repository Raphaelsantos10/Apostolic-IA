# Instalar Apostolic Arena V20.2.1

Correcao incremental para o erro TS2345 da V20.2.

```bash
cd "$HOME/Documents/Nova pasta/Apostolic-IA-biblia"
unzip -o "$HOME/Downloads/apostolic-arena-correcao-calibracao-v20-2-1.zip" -d .
rm -rf apps/web/.next
corepack pnpm --filter @apostolic-ia/web typecheck
corepack pnpm --filter @apostolic-ia/web build
corepack pnpm --filter @apostolic-ia/web dev
```

Nao faça commit antes de confirmar typecheck e build.
