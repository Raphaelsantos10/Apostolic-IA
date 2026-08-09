# Instalar Apostolic Arena V11

Aplicar depois da V10.

```bash
cd "$HOME/Documents/Nova pasta/Apostolic-IA-biblia"
unzip -o "$HOME/Downloads/apostolic-arena-decks-e-partida-v11.zip" -d .
rm -rf apps/web/.next
corepack pnpm --filter @apostolic-ia/web typecheck
corepack pnpm --filter @apostolic-ia/web build
corepack pnpm --filter @apostolic-ia/web dev
```

Abra o endereço exibido pelo Next.js, entre no Apostolic Arena e pressione **BATALHAR**.

## Inspecao obrigatoria

1. Escolha Moises, Davi, Sansao e Debora no menu, um por vez, e confirme que as quatro cartas da mao mudam com o deck.
2. Invoque uma carta na rota esquerda e outra na direita.
3. Confirme que tropas azuis atravessam completamente o rio.
4. Aguarde tropas vermelhas e confirme a travessia contraria.
5. Confirme que o cronometro parte de `3:00` e diminui a cada segundo.
6. Confirme o encerramento ao destruir um templo ou quando o tempo chega a `0:00`.
7. Pressione **BATALHAR NOVAMENTE** e confirme que torres, unidades, Fe e tempo reiniciam.

Se tudo estiver aprovado, adicione somente os arquivos da V11:

```bash
git add apps/web/components/apostolic-arena-battle-3d.tsx \
  apps/web/components/apostolic-arena-battle-3d.module.css \
  docs/sprints/SPRINT_APOSTOLIC_ARENA_DECKS_E_PARTIDA_V11.md \
  INSTALAR_APOSTOLIC_ARENA_V11.md
git commit -m "feat(arena): ligar decks e concluir ciclo de partida"
git push origin feature/apostolic-arena-v2
```

