# Correcao Apostolic Arena V15.1.1

Esta correcao deve ser aplicada depois da V15.1.

```bash
cd "$HOME/Documents/Nova pasta/Apostolic-IA-biblia"
unzip -o "$HOME/Downloads/apostolic-arena-correcao-v15-1-1.zip" -d .
rm -rf apps/web/.next
corepack pnpm --filter @apostolic-ia/web typecheck
corepack pnpm --filter @apostolic-ia/web build
corepack pnpm --filter @apostolic-ia/web dev
```

## Corrigido

- remove comparacao TypeScript impossivel entre os estados `attack/hit/defeat` e `idle`;
- mantem repeticao apenas para a animacao `walk`;
- remove referencia antecipada ao pacote `@babylonjs/loaders/glTF`;
- evita aviso do Turbopack enquanto todos os modelos GLB permanecem desativados;
- preserva fallback 2D e toda a V14.

Nao instale `@babylonjs/loaders` agora. A dependencia sera adicionada junto com o primeiro GLB real e na mesma versao de `@babylonjs/core`.

