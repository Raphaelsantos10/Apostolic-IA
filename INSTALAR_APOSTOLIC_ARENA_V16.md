# Instalar Apostolic Arena V16

Aplicar depois da V15.2.

```bash
cd "$HOME/Documents/Nova pasta/Apostolic-IA-biblia"
unzip -o "$HOME/Downloads/apostolic-arena-editor-decks-v16.zip" -d .
rm -rf apps/web/.next
corepack pnpm --filter @apostolic-ia/web typecheck
corepack pnpm --filter @apostolic-ia/web build
corepack pnpm --filter @apostolic-ia/web dev
```

## Teste obrigatorio

1. Abra **CARTAS**.
2. Selecione Moises e monte oito cartas.
3. Use busca e filtros de raridade e funcao.
4. Reordene cartas usando as setas nos oito espacos.
5. Remova uma carta e confirme que o teste fica bloqueado com sete.
6. Complete oito, escreva um nome e salve.
7. Pressione **TESTAR NA ARENA** e confirme as mesmas oito cartas.
8. Volte e monte decks diferentes para Davi, Sansao e Debora.
9. Confirme que cada deck recupera seu nome e suas cartas.
10. Volte ao menu e confirme que o Campeao principal acompanha o deck salvo.
11. Confirme que cartas de outro Campeao ficam bloqueadas.
12. Teste o editor no telemovel.

Nao faca commit antes de validar os quatro decks.

Depois da aprovacao:

```bash
git add apps/web/components/arena-deck-builder-v16.tsx \
  apps/web/components/arena-deck-builder-v16.module.css \
  apps/web/components/apostolic-arena-3d-experience.tsx \
  docs/sprints/SPRINT_APOSTOLIC_ARENA_EDITOR_DECKS_V16.md \
  INSTALAR_APOSTOLIC_ARENA_V16.md
git commit -m "feat(arena): adicionar editor completo de decks"
git push origin feature/apostolic-arena-v2
```

