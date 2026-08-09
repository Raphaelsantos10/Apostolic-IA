# Instalar Apostolic Arena V14

Aplicar depois da V13.

```bash
cd "$HOME/Documents/Nova pasta/Apostolic-IA-biblia"
unzip -o "$HOME/Downloads/apostolic-arena-mobile-otimizado-v14.zip" -d .
rm -rf apps/web/.next
corepack pnpm --filter @apostolic-ia/web typecheck
corepack pnpm --filter @apostolic-ia/web build
corepack pnpm --filter @apostolic-ia/web dev
```

## Teste no computador

1. Confirme que campo, torres e pontes continuam visiveis sem sobreposicao.
2. Arraste cartas pelas duas rotas e use a habilidade do Campeao.
3. Troque de aba por dez segundos: o relogio e a batalha devem pausar.
4. Volte: a partida deve continuar do mesmo ponto.
5. Abra com `?arenaDebug=1` para exibir qualidade, FPS, tropas e projeteis.

## Teste no telemovel

1. Abra em orientacao vertical e horizontal.
2. Confirme que a torre inferior nao fica escondida pelo deck.
3. Confirme que o cronometro nao cobre o templo superior.
4. Arraste cada uma das quatro cartas usando toque.
5. Cancele um arrasto e confirme que a carta fantasma desaparece.
6. Confirme que o botao do Campeao nao cobre as rotas.
7. Observe a batalha com muitas tropas e verifique se permanece responsiva.

Nao faca commit antes da inspecao visual no computador e no telemovel.

Depois da aprovacao:

```bash
git add apps/web/components/apostolic-arena-battle-3d.tsx \
  apps/web/components/apostolic-arena-battle-3d.module.css \
  docs/sprints/SPRINT_APOSTOLIC_ARENA_MOBILE_OTIMIZADO_V14.md \
  INSTALAR_APOSTOLIC_ARENA_V14.md
git commit -m "feat(arena): otimizar batalha para mobile"
git push origin feature/apostolic-arena-v2
```

