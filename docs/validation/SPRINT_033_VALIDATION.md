# Validação da Sprint 033

## Estado

Primeiro incremento implementado; inspeção manual e gates finais pendentes.

## Validação automática

- [x] testes unitários de ordenação, retomada, posição e limites;
- [ ] testes completos do banco;
- [ ] typecheck;
- [ ] build web e export mobile;
- [ ] `scripts/validate-sprint-033.sh`;
- [ ] `scripts/validate-repository.sh`;
- [ ] CodeQL e checks do Pull Request.

## Inspeção manual

- [ ] abrir `/dashboard?section=courses` com uma conta local;
- [ ] confirmar que o player aparece somente em “Fundamentos Bíblicos”;
- [ ] navegar pelas quatro etapas com teclado;
- [ ] alternar aulas e confirmar o foco no título da etapa;
- [ ] guardar anotação, favorito, resposta de quiz e conclusão;
- [ ] regressar ao dashboard e confirmar o progresso atualizado;
- [ ] testar tema claro, escuro e sépia;
- [ ] testar zoom a 200% e largura de 320 CSS px;
- [ ] testar movimento reduzido;
- [ ] confirmar que demonstrações técnicas não parecem cursos completos.

## Revisão humana

- [ ] aprovação doutrinária do conteúdo usado no piloto;
- [ ] aprovação pedagógica da sequência das quatro etapas;
- [ ] aprovação editorial e de originalidade;
- [ ] aprovação de acessibilidade;
- [ ] decisão humana de avançar, corrigir ou reduzir o próximo incremento.

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
