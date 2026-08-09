# Instalar Apostolic Arena V9

Aplicar depois da V8.1.

```bash
cd "$HOME/Documents/Nova pasta/Apostolic-IA-biblia"
unzip -o "$HOME/Downloads/apostolic-arena-invocacao-v9.zip" -d .
rm -rf apps/web/.next
corepack pnpm --filter @apostolic-ia/web typecheck
corepack pnpm --filter @apostolic-ia/web test
corepack pnpm --filter @apostolic-ia/web build
corepack pnpm --filter @apostolic-ia/web dev
```

Abra BATALHAR, arraste cartas para a metade azul e confirme a rotacao da mao. Nao faça commit antes da inspeção.
