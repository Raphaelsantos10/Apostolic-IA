# Sprint 033 - Player de estudo guiado

## Estado

Em andamento na branch `sprint/033-player-estudo-guiado`.

## Base

- `main` no commit `18a3b6a`;
- Sprint 032 incorporada pelo PR nº 44 como incremento técnico;
- dashboard aprovado promovido para `/dashboard`;
- “Fundamentos Bíblicos” é o pequeno percurso funcional publicado no ambiente
  de desenvolvimento;
- o currículo documental “Fundamentos da Fé Cristã” permanece em rascunho.

## Objetivo

Transformar somente o pequeno percurso funcional publicado num player guiado
que apresenta uma etapa em foco, permite retomar a primeira aula incompleta e
integra leitura, prática, anotação, quiz, conclusão e progresso dentro do
dashboard aprovado.

## Escopo

- [x] corrigir README e continuidade após o merge da Sprint 032;
- [x] separar incremento técnico incorporado de lançamento público;
- [x] criar utilitários testáveis de ordenação, retomada e navegação;
- [x] criar player guiado com visão geral, aprendizagem, prática e revisão;
- [x] reutilizar progresso, notas, favoritos e quiz protegidos por RLS;
- [x] identificar explicitamente o percurso piloto e suas limitações;
- [x] manter os demais cursos como demonstrações técnicas;
- [ ] reinspecionar o player com conta local em desktop e 320 CSS px;
- [ ] validar teclado, foco, zoom a 200% e movimento reduzido;
- [ ] recolher aprovação humana do conteúdo antes de qualquer expansão.

## Critérios de aceite

- uma aula por vez e localização atual anunciada;
- retomada na primeira aula ainda não concluída;
- navegação por etapa e aula utilizável com teclado;
- progresso atualizado sem sair do shell do dashboard;
- ausência de afirmação de seminário ou catálogo completo;
- nenhum conteúdo em rascunho publicado pelo player;
- fallback honesto quando não houver aula ou texto publicado;
- testes, typecheck, build, validações e CodeQL aprovados.

## Restrições permanentes

- não redesenhar o dashboard aprovado;
- a Bíblia permanece a autoridade final;
- a IA não cria doutrina;
- conteúdo exige aprovação humana;
- não copiar materiais proprietários de terceiros;
- não transformar conclusão de aula em medida espiritual;
- não publicar o curso documental em rascunho;
- não declarar WCAG integral, Release Candidate ou lançamento público.

## Riscos

- confundir o conteúdo demonstrativo publicado com formação completa;
- tentar transformar toda a aplicação num player nesta sprint;
- guardar estado somente na interface e divergir do progresso persistido;
- foco deslocar-se de forma inesperada durante a navegação;
- aumentar o conteúdo sem aprovação doutrinária, pedagógica e editorial.

## Rollback

Reverter os commits da Sprint 033 antes do merge. A alteração reutiliza tabelas
existentes e não cria migração de dados. Se o player impedir a jornada, o
catálogo anterior pode ser restaurado sem apagar progresso, notas ou favoritos.
