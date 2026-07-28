# Sprint 030 - Produção, privacidade e segurança

## Estado

Concluída em 28 de julho de 2026. A conclusão desta sprint não autoriza
publicação em produção, que permanece reservada à Sprint 033.

## Objetivo

Reduzir riscos técnicos e operacionais antes do piloto por meio de controles
verificáveis, documentação honesta e defesa em profundidade.

## Entregas do primeiro incremento

- cabeçalhos de segurança centralizados e testados;
- CSP diferenciada entre desenvolvimento e produção;
- HSTS somente em produção;
- permissões mínimas, preservando voz na própria aplicação;
- canal privado para vulnerabilidades;
- CodeQL para JavaScript e TypeScript;
- Dependabot para pacotes e GitHub Actions;
- base de segurança operacional documentada.

## Entregas dos incrementos seguintes

- limite transacional por conta nas APIs de IA e cobrança;
- tamanho máximo e validação estrita do corpo dos pedidos;
- origem canónica para redirecionamentos de cobrança;
- assinatura do webhook validada antes do processamento;
- auditoria de catálogo para RLS, `FORCE RLS` e funções privilegiadas;
- correlação por `x-request-id` sem conteúdo privado nos eventos de erro;
- inventário de segredos, responsabilidades e regras de rotação;
- plano de resposta a incidentes com exercício de mesa;
- dependências de produção atualizadas sem vulnerabilidades altas ou críticas.

## Critérios finais

- [x] Testes locais do último incremento aprovados.
- [x] Exercício de mesa do plano de incidentes registado.
- [x] CSP e cabeçalhos inspecionados no navegador.
- [x] Checks finais do PR aprovados.

## Rollback

Reverter os commits antes da incorporação. Em caso de incompatibilidade do CSP,
reverter somente o cabeçalho problemático, registrar a dependência bloqueada e
restaurar a política depois de uma correção específica.
