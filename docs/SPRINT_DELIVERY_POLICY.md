# Política de entrega das sprints

## Branches

- `main`: estado aprovado e fonte central de continuidade.
- `sprint/NNN-descricao`: implementação de uma sprint.
- `fix/descricao`: correção normal.
- `hotfix/descricao`: correção urgente.
- `chore/descricao`: manutenção de processo ou documentação.

## Início da sprint

1. Atualizar a branch a partir da `main`.
2. Atualizar o README na branch da sprint.
3. Criar um Draft Pull Request imediatamente.
4. Preencher número, objetivo, documento, riscos e rollback.

## Definição de Pronto

Uma sprint pode ser incorporada quando:

- escopo e critérios de aceite foram cumpridos;
- testes aplicáveis estão verdes;
- typecheck e build estão aprovados;
- migrações foram testadas;
- documentação e README foram atualizados;
- não existem segredos ou arquivos gerados versionados;
- limitações e rollback foram registrados;
- evidências reais foram incluídas no Pull Request;
- aprovação humana aplicável foi registrada.

## Transição obrigatória

O último commit da sprint deve preparar o estado que será verdadeiro após o
merge:

- sprint atual marcada como concluída;
- evidência e relatório vinculados;
- próxima sprint indicada como planejada;
- `main` não pode continuar apontando para PR ou trabalho já concluído.

A atualização torna-se efetiva quando o Pull Request é incorporado.

## Sprint e release

Uma sprint exige código, testes, documentação, evidências e Pull Request.

Uma release exige tag, pacote, checksums, notas, instalação e rollback, mas será
criada apenas para um marco coerente e utilizável. Nem toda sprint gera release.

## Gate

O Pull Request não pode ser incorporado com template vazio, validações vermelhas,
README desatualizado ou decisões estruturais pendentes.


## Fluxo acelerado

- Uma sprint representa um incremento completo, não uma única tela ou campo.
- Funcionalidades relacionadas são checklists internos da mesma sprint.
- Durante o desenvolvimento executam-se apenas testes direcionados.
- A validação completa ocorre uma vez, antes do merge.
- Um pacote, um bloco de Git Bash e um Pull Request por sprint.
- O GitHub CLI automatiza criação, atualização e abertura do Pull Request.
- O utilizador envia somente erros ou evidências finais solicitadas.
- Documentação acompanha o código e não cria sprint isolada sem necessidade.
- Releases são reservadas para marcos utilizáveis.
