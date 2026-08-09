# Sprint Apostolic Arena - Menu Principal Cinematografico V6

## Objetivo

Evoluir o dashboard do Apostolic Arena para uma composicao cinematografica com hierarquia de jogo competitivo, identidade biblica original e leitura imediata em desktop e telemovel.

## Entregas

- um Campeao central por vez no Salao dos Campeoes;
- seletor lateral entre Moises, Davi, Sansao e Debora;
- perfil, recursos, liga, eventos e missoes com molduras originais;
- baralho ativo em destaque;
- quatro baus em pedestais com estados e temporizadores;
- botao BATALHAR como foco principal;
- navegacao inferior reforcada;
- iluminacao, profundidade e efeitos preservados no Babylon.js;
- batalha Phaser, catalogo, 125 cartas, Biblia e comunidade preservados.

## Escopo tecnico

Esta sprint continua hibrida: personagem e cenario em Babylon.js, interface em React e CSS Modules. A batalha 3D modular sera implementada em sprint posterior sem remover a batalha Phaser funcional.

## Validacao

```bash
corepack pnpm --filter @apostolic-ia/web typecheck
corepack pnpm --filter @apostolic-ia/web test
corepack pnpm --filter @apostolic-ia/web build
```

Validar visualmente em desktop, 768 px, 360 px e tela cheia. Confirmar selecao dos quatro Campeoes, abertura das abas, botao BATALHAR, baus e saida do jogo.
