# Instalação, atualização e rollback

## Instalação da Sprint 000

Esta sprint contém documentação e automação inicial, sem aplicação executável.

1. Confirme a branch `sprint/000-project-foundation`.
2. Extraia o pacote na raiz do repositório.
3. Execute `bash scripts/validate-repository.sh`.
4. Revise `git status` e `git diff`.
5. Faça commit e push.

## Atualização futura

1. Confirmar saúde da versão atual.
2. Guardar tag, commit e configurações atuais.
3. Criar e testar backup.
4. Aplicar a release primeiro em staging.
5. Executar migrações versionadas.
6. Executar validação e smoke test.
7. Promover gradualmente.
8. Monitorizar erros e custos.

## Rollback

1. Interromper a promoção.
2. Preservar logs e evidências.
3. Restaurar o código da tag anterior.
4. Reverter dados somente pelo procedimento aprovado.
5. Executar smoke test.
6. Registar causa, impacto e decisão.

Nunca usar `git reset --hard` como procedimento operacional de recuperação.
