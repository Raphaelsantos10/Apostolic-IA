# Proteção de APIs e webhooks

## Limites autenticados

Os limites são consumidos por uma função PostgreSQL transacional vinculada a
`auth.uid()`. O cliente não possui acesso direto aos contadores.

- Professor bíblico: 10 pedidos por minuto, além da quota diária do plano.
- Checkout: 5 tentativas a cada 10 minutos.

O limite por conta não substitui proteção de borda por IP, dispositivo e risco.
Essa camada externa permanece necessária para endpoints anónimos e ataques
distribuídos.

## Checkout

Em produção, URLs de sucesso e cancelamento usam exclusivamente
`APP_BASE_URL`, que deve ser HTTPS. A origem não é derivada do cabeçalho
controlável da requisição. O corpo possui limite e a chamada ao provedor possui
timeout.

## Webhook

- corpo máximo de 1 MB;
- tolerância de assinatura de cinco minutos;
- suporte seguro a múltiplas assinaturas `v1`;
- comparação em tempo constante;
- validação mínima de identificador e tipo;
- idempotência pela chave `(provider, event_id)`.

Os eventos assinados são processados pelo cliente administrativo somente no
servidor. Chaves de serviço e segredos do provedor nunca usam prefixos públicos.

## Logs

Corpos de webhook, perguntas, respostas, tokens e assinaturas não devem ser
gravados em logs. Mensagens ao utilizador permanecem genéricas e detalhes de
provedores não são devolvidos ao navegador.
