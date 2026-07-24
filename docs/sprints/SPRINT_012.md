# Sprint 012 - Backend, base de dados, autenticação e RLS

## Estado

🚧 Em andamento.

## Objetivo

Criar uma fundação reproduzível e segura usando Supabase/PostgreSQL, migrações
SQL, autenticação e isolamento por utilizador.

## Entregas

- Configuração local do Supabase.
- Migração para `profiles` e `preferences`.
- Integração automática com `auth.users`.
- Tipos e restrições de integridade.
- RLS habilitada e forçada.
- Privilégios mínimos por coluna.
- Testes positivos e de isolamento.
- Documentação operacional e matriz de segurança.

## Critérios de aceite

- Migração recria o esquema em banco limpo.
- Nova conta recebe perfil e preferências.
- Utilizador vê somente os próprios dados.
- Utilizador não altera o estado da conta.
- Conta A não lê nem altera a conta B.
- Visitante não acessa dados pessoais.
- Nenhuma chave privilegiada está versionada.
- Validador e `git diff --check` aprovados.

## Fora do escopo

- Projeto Supabase de produção e dados reais.
- Telas de cadastro, login e recuperação.
- Papéis editoriais e administrativos.
- Conteúdo, progresso, pagamentos e IA.

## Validação local

```bash
pnpm dlx supabase@latest start
pnpm dlx supabase@latest db reset
pnpm dlx supabase@latest test db
bash scripts/validate-repository.sh
```

Os três primeiros comandos exigem Docker Desktop. O pacote inicial executa
validações estáticas; os testes do banco devem passar antes do PR.

## Próximo passo

Executar o Supabase local com Docker e comprovar os testes de isolamento RLS.
