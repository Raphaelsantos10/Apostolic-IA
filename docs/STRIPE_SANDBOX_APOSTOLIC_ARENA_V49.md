# Apostolic Arena V49 — Checklist Stripe Sandbox

As vendas reais permanecem bloqueadas enquanto `ARENA_PAYMENTS_ENABLED` não for `true`.

## Dados ainda obrigatórios

- [ ] Definir morada profissional a apresentar ao consumidor.
- [ ] Confirmar idade mínima e política de autorização parental.
- [ ] Abrir atividade e confirmar CAE/CIRS, IVA e faturação com contabilista.
- [ ] Registar o operador no Livro de Reclamações Eletrónico, quando aplicável.
- [ ] Identificar a entidade de resolução alternativa de litígios competente.
- [ ] Submeter Termos, Privacidade e Reembolsos a revisão jurídica.

## Sandbox

1. Criar ou selecionar um Sandbox no Stripe.
2. Configurar `STRIPE_SECRET_KEY` com uma chave de teste.
3. Executar `stripe listen --forward-to http://localhost:3000/api/billing/webhook`.
4. Copiar o segredo `whsec_...` para `STRIPE_WEBHOOK_SECRET`.
5. Usar `APP_BASE_URL=http://localhost:3000` somente em desenvolvimento.
6. Ativar temporariamente `ARENA_PAYMENTS_ENABLED=true` apenas no ambiente local de teste.

## Casos obrigatórios

- [ ] Pagamento aprovado entrega gemas uma vez.
- [ ] Repetição do mesmo webhook não duplica gemas.
- [ ] Valor ou moeda divergente bloqueia a entrega.
- [ ] Pagamento cancelado não altera a carteira.
- [ ] Pagamento assíncrono entrega somente após confirmação.
- [ ] Reembolso integral reverte o benefício.
- [ ] Disputa reverte e marca o recibo.
- [ ] Passe premium fica ativo somente após pagamento.
- [ ] Conta não administradora não abre analytics.
- [ ] Nenhum saldo fica negativo.

## Produção

Não reutilizar chaves, webhooks ou dados do Sandbox. Cadastrar o endpoint HTTPS de produção, selecionar somente os eventos utilizados e repetir toda a validação antes de ativar vendas.
