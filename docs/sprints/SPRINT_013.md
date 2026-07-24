# Sprint 013 - Cadastro, login, recuperação e exclusão da conta

## Estado

🚧 Em andamento.

## Objetivo

Disponibilizar o ciclo essencial de identidade do utilizador sobre a base
Supabase Auth e RLS criada na Sprint 012.

## Entregas

- Clientes Supabase para navegador, servidor e proxy.
- Cadastro com confirmação de e-mail.
- Login, sessão renovável e logout.
- Recuperação e atualização de senha.
- Área protegida da conta.
- Exclusão autenticada com confirmação explícita.
- Migração e testes da exclusão em cascata.
- Interface responsiva e acessível.
- Documentação de operação e segurança.

## Critérios de aceite

- Typecheck e build Next.js aprovados.
- Cadastro cria identidade, perfil e preferências.
- Confirmação permite sessão autenticada.
- Credenciais inválidas não autenticam.
- Recuperação não revela existência da conta.
- Visitante não abre `/conta`.
- Logout encerra a sessão.
- Exclusão exige a palavra `EXCLUIR`.
- Exclusão remove identidade e dados ligados.
- Testes SQL e validador do repositório aprovados.

## Fora do escopo

- Login social.
- Autenticação multifator.
- Projeto e e-mails de produção.
- Perfil e preferências editáveis, previstos na Sprint 014.
- Painel administrativo.

## Evidências de validação

- Migrações e testes SQL aprovados.
- Typecheck e build aprovados.
- Cadastro, confirmação, login, logout e recuperação verificados.
- Exclusão autenticada e dados em cascata verificados.

## Próximo passo

Abrir, revisar e incorporar o Pull Request da Sprint 013.
