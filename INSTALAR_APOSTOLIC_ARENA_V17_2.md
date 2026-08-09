# Instalar Apostolic Arena V17.2

Este pacote e incremental e deve ser aplicado depois da V17.1.

```bash
cd "$HOME/Documents/Nova pasta/Apostolic-IA-biblia"
unzip -o "$HOME/Downloads/apostolic-arena-colecao-premium-v17-2.zip" -d .
rm -rf apps/web/.next
corepack pnpm --filter @apostolic-ia/web typecheck
corepack pnpm --filter @apostolic-ia/web build
corepack pnpm --filter @apostolic-ia/web dev
```

Abra `http://localhost:3000`, entre no Apostolic Arena e selecione **Cartas**.

## Roteiro de teste

1. Clique em um dos oito espaços e depois em `+ DECK` numa carta conquistada.
2. Clique em outro espaço e escolha uma carta que ja esteja no deck: as duas devem trocar de posicao.
3. Arraste um card do deck para outro espaco e confirme a nova ordem.
4. Use os filtros Conquistadas/Bloqueadas, raridade, funcao e ordenacao.
5. Abra uma carta e confira poder, Vida, Dano, Alcance, Velocidade e custo de evolucao.
6. Salve o baralho; somente oito cartas conquistadas e o Campeao selecionado permitem testar a batalha.

Nao execute `git add .`. Primeiro confirme visualmente e envie o resultado do typecheck/build.
