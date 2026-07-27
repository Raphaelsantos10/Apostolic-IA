# Sprint 026 - Sustentabilidade, preços e assinaturas

## Estado

Em andamento no Draft PR nº 28.

## Objetivo

Entregar a base internacional de sustentabilidade com planos justos, quotas,
checkout web seguro e entitlements privados.

## Entregas

- planos Gratuito, Plus e Apoiador;
- preços candidatos para Portugal, Brasil, EUA/global, Reino Unido, Índia e Paquistão;
- cobrança mensal e anual;
- quotas de IA baseadas no plano;
- catálogo público e assinatura privada por RLS;
- checkout web Stripe server-side;
- webhook assinado e idempotente;
- interface responsiva de seleção;
- documentação de custos, lojas, impostos, cancelamento e rollback.

## Critérios de aceite

- [x] Bíblia e estudo essencial permanecem gratuitos.
- [x] Preços regionais não dependem de geolocalização invasiva.
- [x] Quotas protegem custo sem medir espiritualidade.
- [x] Assinaturas pertencem somente ao titular.
- [x] O cliente não concede entitlements.
- [x] Checkout sem segredo falha de forma segura.
- [x] Webhook valida assinatura e evita repetição.
- [x] Testes de preços, typecheck e build web aprovados.
- [ ] Banco e RLS aprovados em ambiente Supabase local.
- [ ] Inspeção visual aprovada.
- [ ] Checks e merge do PR nº 28 aprovados.

## Limites

Preços são candidatos até validação fiscal e medição de custo real. Apple e
Google serão integrados nativamente na Sprint 028; a Sprint 026 prepara schema,
entitlements e checkout web.

## Rollback

Reverter código e migração antes de produção. Em ambiente com cobranças reais,
cancelar produtos no provedor não deve apagar histórico ou acesso já pago.
