# Backend local e Supabase

## Objetivo

A Sprint 012 estabelece a base do backend com PostgreSQL gerido pelo Supabase,
autenticação integrada, migrações SQL versionadas e Row Level Security (RLS).

## Pré-requisitos

- Docker Desktop em execução.
- Node.js e pnpm conforme `package.json`.
- Supabase CLI executada por `pnpm dlx`.

## Iniciar localmente

```bash
pnpm dlx supabase@latest start
pnpm dlx supabase@latest db reset
pnpm dlx supabase@latest test db
```

O comando `start` mostra URL e chave pública locais. Somente os valores públicos
devem ser copiados para `.env.local`.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<chave pública local>
```

Nunca versionar `service_role`, chave secreta, senha do banco ou token pessoal.

## Migrações

- Toda alteração de esquema entra em `supabase/migrations`.
- Migrações aplicadas não são editadas; uma nova migração corrige a anterior.
- `db reset` comprova que o histórico recria o banco.
- Alterações remotas exigirão projeto próprio e revisão separada.

## Limites

Esta entrega não cria projeto remoto, não usa dados reais, não envia e-mail e
não implementa telas de cadastro. Esses fluxos pertencem à Sprint 013.
