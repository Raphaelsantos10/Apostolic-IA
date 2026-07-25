# Sprint 016 — Catálogo de cursos e módulos

## Estado

Em andamento.

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

- [ ] Cursos publicados aparecem no catálogo.
- [ ] Cursos não publicados permanecem ocultos ao público.
- [ ] Módulos respeitam a ordem editorial.
- [ ] RLS impede alterações por utilizadores não autorizados.
- [ ] Interface funciona em telemóvel, tablet e computador.
- [ ] Testes, typecheck e build estão aprovados.
- [ ] README e evidências estão atualizados.

## Decisões

Referências curriculares externas podem orientar temas gerais, mas nomes, textos,
marcas, apostilas, imagens e estruturas protegidas não serão copiados.

## Validação

Será registrada em `docs/validation/SPRINT_016_VALIDATION.md`.

## Próximo passo

Aplicar a migração, executar os testes de RLS e validar a interface do catálogo.
