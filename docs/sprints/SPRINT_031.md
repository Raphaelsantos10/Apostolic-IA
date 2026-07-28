# Sprint 031 - Resiliência, desempenho e acessibilidade

## Estado

Validação concluída. PR 43 pronto para merge.

## Objetivo

Preparar a plataforma para testes de piloto com recuperação verificável,
health checks privados por desenho, orçamentos de desempenho e auditoria
WCAG 2.2 AA, preservando o dashboard aprovado e a visão teológica.

## Primeiro incremento

- [x] Endpoint público mínimo de liveness.
- [x] Correlação por `x-request-id` sem sessão ou banco.
- [x] Manifesto de backup com SHA-256.
- [x] Verificação automática de integridade.
- [x] Runbook de restauração em ambiente isolado.
- [x] Objetivos internos de RPO e RTO.
- [x] Orçamentos de desempenho testáveis.

## Segundo incremento

- [x] Medição automatizada do tempo de resposta das páginas críticas.
- [x] Auditoria automática da semântica HTML e nomes acessíveis.
- [x] Roteiro WCAG 2.2 AA com limitações explícitas.

## Validação final

- [x] Auditoria automatizada executada contra build local.
- [x] Inspeção manual por teclado, zoom e leitor de tela.
- [x] Exercício real de backup e restauração isolada.
- [x] Evidências finais e checks registados.
- [x] Transição para a Sprint 032 preparada.

## Restrições

- não alterar a identidade visual ou o dashboard aprovado;
- não modificar conteúdo teológico nesta sprint;
- não copiar dados reais para ambientes inseguros;
- não publicar promessas de RPO, RTO ou conformidade sem medição.

## Rollback

Reverter os commits desta sprint antes do merge. O endpoint de health é
independente da sessão e pode ser removido sem migração de dados.
