# Validação da Sprint 019

## Estado

Validação parcial. A validação de banco aguarda execução em ambiente local com
Docker e Supabase.

## Evidências aprovadas em 27 de julho de 2026

- `pnpm install --frozen-lockfile`: aprovado;
- `pnpm --filter @apostolic-ia/web run typecheck`: aprovado;
- `pnpm --filter @apostolic-ia/web run build`: aprovado;
- `git diff --check`: aprovado;
- `bash scripts/validate-repository.sh`: aprovado.

## Validações pendentes

- `pnpm dlx supabase@latest db reset`;
- `pnpm dlx supabase@latest test db`;
- inspeção funcional do leitor, pesquisa, planos e RLS no navegador.

## Ambiente

O ambiente de preparação não possui o comando `docker`. Nenhuma aprovação de
banco foi inferida sem execução real.

## Resultado esperado

Após restaurar o banco, os testes existentes e
`supabase/tests/database/bible-platform.test.sql` devem ser aprovados. O
relatório da sprint e o README só serão transitados para concluídos após essa
evidência, aprovação do Pull Request e merge.
