# Sprint V20.6 — Tutorial Inicial

## Eventos acompanhados

1. `card-selected`: jogador selecionou uma das quatro cartas da mão.
2. `unit-deployed`: carta foi solta numa região válida.
3. `bridge-crossed`: tropa azul atravessou o limite do rio.
4. `tower-damaged`: uma estrutura adversária recebeu dano.
5. `match-finished`: encerramento alternativo caso a batalha termine durante o tutorial.

## Regras

- Tutorial usa o motor e o mapa da batalha, não uma simulação separada.
- O deck competitivo salvo pelo jogador não é modificado.
- A rotação das cartas do treinamento não é gravada.
- Resultados do treinamento não chamam a progressão competitiva.
- Recompensa é idempotente e entregue apenas uma vez.

## Critérios de aceite

- Primeira entrada abre o tutorial automaticamente.
- Cada etapa avança somente após a ação correspondente.
- Lumi e os textos não bloqueiam os controles necessários.
- Conclusão retorna ao menu e atualiza recursos.
- Jornada permite repetir sem nova recompensa.
- Interface funciona com mouse e toque.
