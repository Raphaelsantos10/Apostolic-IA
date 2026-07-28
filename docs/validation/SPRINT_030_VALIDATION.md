# Validação da Sprint 030

## Estado

Concluída em 28 de julho de 2026.

## Primeiro incremento

- [x] Testes de cabeçalhos executados.
- [x] Typecheck aprovado.
- [x] Build aprovado.
- [x] CSP inspecionada no navegador.
- [x] CodeQL executado pelo GitHub.
- [x] Checks do PR aprovados.

## Evidências registadas

- banco local: 18 ficheiros, 149 testes, resultado `PASS`;
- CodeQL, validação do repositório e build aprovados no PR 34;
- `pnpm audit --prod --audit-level high` sem vulnerabilidades altas ou críticas;
- limites de API isolados por conta e testados;
- webhook Stripe rejeita assinatura ausente ou inválida antes do processamento.

## Último incremento

- [x] `global-security-audit.test.sql` aprovado no banco local.
- [x] testes de observabilidade aprovados.
- [x] typecheck e build repetidos depois da aplicação.
- [x] exercício de mesa documentado com data, participantes e resultado.
- [x] checks finais do PR aprovados.

## Inspeção manual concluída

Resposta HTTP local em modo de produção inspecionada em 28 de julho de 2026:

- `Content-Security-Policy` presente e sem `unsafe-eval`;
- `Strict-Transport-Security` configurado;
- `Permissions-Policy` permite microfone somente à própria origem;
- resposta possui `x-request-id`;
- login, perfil e dashboard acessíveis depois da remoção de uma sessão local
  invalidada por `supabase db reset`;
- nenhum token ou conteúdo privado foi exposto nos logs observados.

## Exercício de mesa

- Data: 28 de julho de 2026.
- Participante: responsável pelo projeto.
- Cenário: exposição hipotética de `SUPABASE_SERVICE_ROLE_KEY`.
- Contenção: revogar a chave e impedir novas implantações.
- Recuperação: gerar credencial nova no gestor de segredos e validar login,
  RLS, cobrança e Professor IA.
- Resultado: procedimento aprovado; nenhuma credencial real foi manipulada.

## Limitação

A auditoria automatizada não substitui revisão externa independente antes da
produção. A publicação continua proibida até os critérios das Sprints 031 a
033 serem concluídos.
