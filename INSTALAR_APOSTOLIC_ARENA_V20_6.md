# Apostolic Arena V20.6 — Tutorial e Campo de Treinamento

## Entrega

- Tutorial obrigatório na primeira entrada.
- Lumi conduz quatro objetivos dentro da batalha real.
- Seleção de carta, invocação, travessia e ataque são detectados pelo sistema.
- Cronómetro e IA pausam durante abertura e conclusão.
- Deck inicial fixo de oito cartas; quatro aparecem na mão.
- Treinamento não altera troféus nem resultado competitivo.
- Primeira conclusão concede 250 Ouro, 50 XP e um Baú de Madeira.
- Repetir treinamento não duplica a recompensa.
- Botão para repetir disponível na Jornada.

## Instalação

```bash
cd "$HOME/Documents/Nova pasta/Apostolic-IA-biblia"
unzip -o "$HOME/Downloads/apostolic-arena-tutorial-treinamento-v20-6.zip" -d .
rm -rf apps/web/.next
corepack pnpm --filter @apostolic-ia/web typecheck
corepack pnpm --filter @apostolic-ia/web build
corepack pnpm --filter @apostolic-ia/web dev
```

Para simular um jogador novo durante o teste, execute no console do navegador:

```js
localStorage.removeItem("apostolic-arena-tutorial-complete-v20-6");
location.reload();
```
