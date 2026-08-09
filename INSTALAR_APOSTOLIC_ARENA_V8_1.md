# Instalar Apostolic Arena V8.1

Aplicar depois da V8.

```bash
cd "$HOME/Documents/Nova pasta/Apostolic-IA-biblia"
unzip -o "$HOME/Downloads/apostolic-arena-fidelidade-visual-v8-1.zip" -d .
rm -rf apps/web/.next
corepack pnpm --filter @apostolic-ia/web typecheck
corepack pnpm --filter @apostolic-ia/web test
corepack pnpm --filter @apostolic-ia/web build
corepack pnpm --filter @apostolic-ia/web dev
```

Abra BATALHAR e grave a arena em tela cheia. Nao faça commit antes da aprovacao visual.
