# Sprint 018 — Núcleo de aprendizagem

## Estado

Concluída após validação e incorporação do PR nº 20.

## Objetivo

Entregar num único incremento o núcleo de aprendizagem individual:

- progresso por aula e curso;
- anotações e favoritos;
- sincronização por conta;
- plano diário e metas configuráveis;
- quizzes com correção;
- revisão espaçada e diagnóstico inicial.

## Critérios de aceite

- [x] O utilizador registra o estado e a conclusão da aula.
- [x] Progresso pertence somente ao titular por RLS.
- [x] Anotações são privadas e sincronizadas.
- [x] Aulas podem ser adicionadas ou removidas dos favoritos.
- [x] Meta diária permite duração configurável.
- [x] O núcleo de dados relaciona aula, quiz e revisão.
- [x] Quiz registra respostas, resultado e explicação.
- [x] Itens errados entram em revisão espaçada.
- [x] Interface utiliza a base responsiva existente.
- [x] Testes, typecheck, build e documentação estão aprovados.

## Privacidade

Progresso, notas, metas e diagnóstico são privados por padrão. Nenhum dado
espiritual será usado em ranking.

## Evidências

- Migração e seed aplicados com sucesso.
- Testes pgTAP aprovados após restauração do banco local.
- Typecheck e build web aprovados.
- Validação do repositório e `git diff --check` aprovados.
- Relatório: `docs/validation/SPRINT_018_VALIDATION.md`.

## Limitações encaminhadas

- A montagem automática do plano diário será ampliada com a gamificação.
- Dias de descanso e recuperação de sequência serão integrados na Sprint 021.

## Próximo passo

Incorporar o PR nº 20 e iniciar a Sprint 019 — Plataforma bíblica.
