# Instalar Apostolic Arena V8

Aplicar depois da V7 e da correcao V7.1.

```bash
cd "$HOME/Documents/Nova pasta/Apostolic-IA-biblia"
unzip -o "$HOME/Downloads/apostolic-arena-batalha-3d-v8.zip" -d .
rm -rf apps/web/.next
corepack pnpm --filter @apostolic-ia/web typecheck
corepack pnpm --filter @apostolic-ia/web test
corepack pnpm --filter @apostolic-ia/web build
corepack pnpm --filter @apostolic-ia/web dev
```

Abra o Apostolic Arena e clique em BATALHAR. Nao faca commit antes da inspecao visual.
