# Validação da Sprint 030

## Estado

Em andamento.

## Primeiro incremento

- [x] Testes de cabeçalhos executados.
- [x] Typecheck aprovado.
- [x] Build aprovado.
- [ ] CSP inspecionada no navegador.
- [x] CodeQL executado pelo GitHub.
- [x] Checks do PR aprovados.

## Evidências registadas

- banco local: 17 ficheiros, 145 testes, resultado `PASS`;
- CodeQL, validação do repositório e build aprovados no PR 34;
- `pnpm audit --prod --audit-level high` sem vulnerabilidades altas ou críticas;
- limites de API isolados por conta e testados;
- webhook Stripe rejeita assinatura ausente ou inválida antes do processamento.

## Último incremento

- [ ] `global-security-audit.test.sql` aprovado no banco local.
- [ ] testes de observabilidade aprovados.
- [ ] typecheck e build repetidos depois da aplicação.
- [ ] exercício de mesa documentado com data, participantes e resultado.
- [ ] checks finais do PR aprovados.

## Inspeção manual restante

Executar a aplicação em modo de produção e confirmar em DevTools:

- `Content-Security-Policy` presente e sem `unsafe-eval`;
- `Strict-Transport-Security` presente em HTTPS;
- `Permissions-Policy` permite microfone somente à própria origem;
- cada resposta possui `x-request-id`;
- nenhuma pergunta, resposta, token, e-mail ou conteúdo bíblico aparece nos logs.

## Limitação

A auditoria automatizada não substitui revisão externa independente antes da
produção. A Sprint permanece em andamento até a inspeção manual e o exercício
de mesa serem aprovados.
