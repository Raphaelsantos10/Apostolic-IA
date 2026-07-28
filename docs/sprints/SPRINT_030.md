# Sprint 030 - Produção, privacidade e segurança

## Estado

Em andamento. Nenhuma publicação em produção está autorizada.

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

## Critérios restantes

- [ ] Auditoria integral de RLS.
- [ ] Limites contra abuso em APIs autenticadas.
- [ ] Revisão de webhooks e idempotência.
- [ ] Inventário de segredos por ambiente.
- [ ] Logs e observabilidade sem dados privados.
- [ ] Auditoria de dependências sem falhas críticas.
- [ ] Plano de incidentes testado.
- [ ] Checks e inspeção final aprovados.

## Rollback

Reverter os commits antes da incorporação. Em caso de incompatibilidade do CSP,
reverter somente o cabeçalho problemático, registrar a dependência bloqueada e
restaurar a política depois de uma correção específica.
