# Sprint 019 — Plataforma bíblica

## Estado

Concluída após validação e incorporação do PR nº 21.

## Objetivo

Entregar a primeira plataforma bíblica funcional, com governança de licenças,
leitor, pesquisa, versões, planos e metas de leitura, sem distribuir tradução
protegida sem autorização.

## Escopo

- registro estruturado de licenças e permissões;
- catálogo de versões autorizadas;
- leitor por versão, livro e capítulo;
- pesquisa textual condicionada pela licença;
- planos de leitura editoriais;
- adesão, meta diária e conclusão de dias privadas por RLS;
- conteúdo demonstrativo autoral e claramente identificado.

## Critérios de aceite

- [x] Versões públicas dependem de licença válida e permissão de leitura.
- [x] A pesquisa depende de permissão específica.
- [x] O leitor permite escolher versão, livro e capítulo.
- [x] A interface informa edição e limites de áudio e offline.
- [x] Planos publicados podem ser consultados.
- [x] Utilizador autenticado pode iniciar plano e concluir dias.
- [x] Plano, meta e progresso pertencem somente ao titular por RLS.
- [x] O seed não distribui tradução bíblica protegida.
- [x] Migração, seed e testes pgTAP aprovados localmente.
- [x] Typecheck, build e validação final aprovados.
- [x] Pull Request aprovado e incorporado à `main`.

## Entregas realizadas

- modelo de dados e RLS da plataforma bíblica;
- função `search_bible`;
- leitor e pesquisa responsivos;
- planos e progresso de leitura;
- Versão Demonstrativa Autoral;
- documentação de desenvolvimento e licenciamento.

## Validação

Typecheck, build, `git diff --check` e validação estática do repositório foram
aprovados. A restauração e os testes do banco aguardam ambiente com Docker.
Evidências: `docs/validation/SPRINT_019_VALIDATION.md`.

## Limitações conhecidas

- nenhuma tradução real está incluída enquanto não houver licença documentada;
- áudio, offline, destaques, mapas, linhas do tempo e contexto são da Sprint 020;
- gestão editorial visual de licenças ainda não integra o MVP.

## Decisões

- permissões de leitura, pesquisa, comparação, áudio e offline são independentes;
- o banco bloqueia conteúdo sem licença aplicável;
- progresso e metas de leitura são privados por padrão;
- a demonstração jamais é apresentada como texto das Escrituras.

## Próximo passo

Iniciar a Sprint 020 — Experiência bíblica: áudio, offline, destaques, mapas, linhas do tempo e contexto.
