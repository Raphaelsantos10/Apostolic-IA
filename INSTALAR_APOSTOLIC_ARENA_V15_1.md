# Instalar Apostolic Arena V15.1

Aplicar depois da V14.

```bash
cd "$HOME/Documents/Nova pasta/Apostolic-IA-biblia"
unzip -o "$HOME/Downloads/apostolic-arena-fundacao-personagens-3d-v15-1.zip" -d .
rm -rf apps/web/.next
corepack pnpm --filter @apostolic-ia/web typecheck
corepack pnpm --filter @apostolic-ia/web build
corepack pnpm --filter @apostolic-ia/web dev
```

## Resultado esperado agora

Os retratos continuam visiveis. Os registros dos quatro Campeoes ficam com `enabled: false` ate que os GLBs sejam colocados e aprovados. Isso evita carregamentos quebrados e deformacoes.

## Teste de regressao

1. Abra o menu e selecione os quatro Campeoes, um por vez.
2. Entre em batalha e confirme que os retratos continuam funcionando.
3. Confirme pontes, cronometro, habilidades, IA, projeteis e resultado.
4. Teste computador e telemovel.
5. Confirme que o console nao apresenta erros de arquivos GLB ausentes.

Nao altere `enabled` para `true` antes de adicionar e validar o modelo correspondente.

Depois da aprovacao:

```bash
git add apps/web/components/apostolic-arena-battle-3d.tsx \
  apps/web/components/apostolic-arena-battle-3d.module.css \
  apps/web/lib/apostolic-arena-3d-unit-layer.ts \
  apps/web/lib/apostolic-arena-3d-unit-registry.ts \
  apps/web/public/games/apostolic-arena/characters/models/v15/README.md \
  docs/sprints/SPRINT_APOSTOLIC_ARENA_FUNDACAO_3D_V15_1.md \
  INSTALAR_APOSTOLIC_ARENA_V15_1.md
git commit -m "feat(arena): preparar infraestrutura de personagens 3d"
git push origin feature/apostolic-arena-v2
```

