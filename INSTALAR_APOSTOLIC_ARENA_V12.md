# Instalar Apostolic Arena V12

Aplicar depois da V11.

```bash
cd "$HOME/Documents/Nova pasta/Apostolic-IA-biblia"
unzip -o "$HOME/Downloads/apostolic-arena-defesa-das-torres-v12.zip" -d .
rm -rf apps/web/.next
corepack pnpm --filter @apostolic-ia/web typecheck
corepack pnpm --filter @apostolic-ia/web build
corepack pnpm --filter @apostolic-ia/web dev
```

## Teste visual

1. Entre em **BATALHAR** e invoque uma tropa perto de uma torre inimiga.
2. Confirme o disparo vermelho saindo da torre, a trilha luminosa e o impacto.
3. Confirme que a barra de HP diminui apenas no impacto.
4. Deixe uma tropa inimiga aproximar-se das torres azuis e repita a verificacao.
5. Teste uma torre lateral e o templo principal de cada equipa.
6. Confirme que o projétil do templo e maior e mais luminoso.
7. Confirme que cronometro, pontes, Fe, resultado e revanche da V11 continuam funcionando.

Nao faca commit antes da inspecao visual.

Depois da aprovacao:

```bash
git add apps/web/components/apostolic-arena-battle-3d.tsx \
  apps/web/components/apostolic-arena-battle-3d.module.css \
  docs/sprints/SPRINT_APOSTOLIC_ARENA_DEFESA_DAS_TORRES_V12.md \
  INSTALAR_APOSTOLIC_ARENA_V12.md
git commit -m "feat(arena): adicionar disparos visuais das torres"
git push origin feature/apostolic-arena-v2
```

