# Sprint V20.7 — Ciclo de baús

## Ciclo

1. Vitória competitiva tenta ocupar o primeiro slot vazio.
2. Jogador inicia a abertura de um baú.
3. `readyAt` persiste o horário final.
4. Ao terminar, o jogador coleta uma única vez.
5. Ouro, desbloqueios e cópias são gravados na progressão.
6. A coleção carrega os novos valores ao ser aberta.

## Segurança local

- O ID do baú precisa corresponder ao slot persistido.
- IDs coletados ficam num registro idempotente limitado aos 100 mais recentes.
- Um segundo clique com estado React antigo não concede novamente a recompensa.
- Baús existentes da V18 são migrados sem apagar dados.

## Critérios de aceite

- Vitória com slot livre gera baú.
- Vitória com slots cheios informa o bloqueio.
- Apenas um temporizador fica ativo.
- Reabrir o navegador preserva o tempo.
- Revelação mostra ouro e todas as cartas em sequência.
- Carta nova aparece desbloqueada na coleção.
- Cópias aumentam o contador usado pela evolução.
- Clique duplo em Coletar não duplica recursos.
