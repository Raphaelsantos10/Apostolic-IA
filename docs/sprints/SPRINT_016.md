# Sprint 016 — Catálogo de cursos e módulos

## Estado

Concluída; aguardando incorporação do Pull Request.

## Branch

`sprint/016-catalogo-cursos-modulos`

## Objetivo

Implementar a estrutura inicial do catálogo de cursos e módulos do Apostolic IA.

## Escopo

- modelo de dados para cursos e módulos;
- estados editoriais: rascunho, revisão, aprovado e publicado;
- catálogo público somente para conteúdo publicado;
- ordenação de cursos e módulos;
- páginas responsivas do catálogo;
- RLS para leitura pública e administração editorial;
- testes de banco, typecheck, build e documentação;
- conteúdo próprio, sem copiar nomes, marcas ou materiais de seminários existentes.

## Critérios de aceite

- [x] Cursos publicados aparecem no catálogo.
- [x] Cursos não publicados permanecem ocultos ao público.
- [x] Módulos respeitam a ordem editorial.
- [x] RLS impede alterações por utilizadores não autorizados.
- [x] Interface funciona em telemóvel, tablet e computador.
- [x] Testes, typecheck e build estão aprovados.
- [x] README e evidências estão atualizados.

## Decisões

Referências curriculares externas podem orientar temas gerais, mas nomes, textos,
marcas, apostilas, imagens e estruturas protegidas não serão copiados.

## Validação

Registrada em `docs/validation/SPRINT_016_VALIDATION.md`.

## Próximo passo

Incorporar o Pull Request na `main` e iniciar a Sprint 017.
