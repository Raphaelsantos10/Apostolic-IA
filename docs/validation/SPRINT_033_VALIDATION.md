# Validação da Sprint 033

## Estado

Aprovada para incorporação pelo PR nº 45, sem lançamento público.

## Validação automática

- [x] testes unitários de ordenação, retomada, posição e limites;
- [x] testes completos do banco: 18 arquivos e 149 testes;
- [x] typecheck;
- [x] build web e export mobile;
- [x] `scripts/validate-sprint-033.sh`;
- [x] `scripts/validate-repository.sh`;
- [x] CodeQL e cinco checks do Pull Request.

## Inspeção manual

- [x] abrir `/dashboard?section=courses` com uma conta local;
- [x] confirmar o player guiado no percurso piloto;
- [x] navegar pelas quatro etapas com teclado;
- [x] alternar aulas e confirmar a retomada;
- [x] guardar anotação, favorito, resposta de quiz e conclusão;
- [x] regressar ao dashboard e confirmar o progresso atualizado;
- [x] testar zoom a 200% e largura de 320 CSS px;
- [x] confirmar que o dashboard aprovado foi preservado;

Temas e movimento reduzido não receberam comportamento novo nesta sprint. O
player utiliza os tokens existentes e a baseline aprovada na Sprint 032; isso
não constitui uma nova certificação integral de acessibilidade.

## Revisão humana

- [x] revisão doutrinária não aplicável a conteúdo novo: nenhum foi publicado;
- [x] sequência das quatro etapas aprovada na inspeção do player;
- [x] revisão editorial de conteúdo novo não aplicável;
- [x] teclado, zoom e largura móvel aprovados;
- [x] decisão humana: avançar para um módulo completo de 6 a 8 aulas.

## Limites honestos

O player organiza conteúdo que já estava publicado no ambiente de
desenvolvimento. Ele não publica o currículo documental em rascunho, não
conclui o seminário teológico, não cria microcredencial e não constitui
aprovação de Alpha integral, beta, piloto pedagógico ou Release Candidate.

## Evidências a anexar ao PR nº 45

- saída dos testes e validações;
- gravação curta da jornada no player;
- confirmação de teclado, zoom e largura móvel;
- resultado de notas, favorito, quiz, conclusão e retomada;
- limitações observadas e decisão humana.

## Resultado observado

- player guiado: aprovado;
- quatro etapas: aprovadas;
- retomada: aprovada;
- notas, favorito, quiz e conclusão: aprovados;
- progresso no dashboard: aprovado;
- teclado: aprovado;
- zoom a 200%: aprovado;
- largura móvel de 320 CSS px: aprovada;
- dashboard preservado: aprovado;
- testes do banco: `Result: PASS`, 18 arquivos e 149 testes;
- checks: cinco aprovados, incluindo CodeQL e build.

Não foram identificados bloqueadores P0 ou P1 neste incremento.
