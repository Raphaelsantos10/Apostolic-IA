# Sprint — Carregamento cinematográfico do Apostolic Arena (V2)

## Resultado

- Cinco artes horizontais inéditas, sem moldura de carta e sem texto embutido.
- Cada entrada escolhe uma cena aleatória diferente da cena exibida imediatamente antes.
- As cenas representam heróis, profetas, guardiãs, tropas, cristais, pontes e o Salão dos Campeões.
- O carregamento continua ligado à inicialização real do Babylon.js.
- O texto contextual acompanha a cena sorteada.
- Oito dicas de batalha alternam durante a preparação do jogo.
- As imagens foram otimizadas para WebP em 1600 × 900 e totalizam menos de 1 MB.
- A V2 não altera catálogo, regras, baralho, IA nem a arena Phaser existente.

## Validação

```bash
corepack pnpm --filter @apostolic-ia/web typecheck
corepack pnpm --filter @apostolic-ia/web test
corepack pnpm --filter @apostolic-ia/web build
```
