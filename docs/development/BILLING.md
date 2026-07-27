# Cobrança e assinaturas

## Componentes

- catálogo público de planos e preços regionais;
- assinatura privada protegida por RLS;
- checkout Stripe criado somente no servidor;
- webhook Stripe verificado por HMAC e tolerância de cinco minutos;
- eventos idempotentes;
- entitlement e quota calculados no banco;
- interface responsiva com fallback quando cobrança não está configurada.

## Configuração

```bash
STRIPE_SECRET_KEY=<segredo>
STRIPE_WEBHOOK_SECRET=<segredo>
SUPABASE_SERVICE_ROLE_KEY=<segredo>
```

Segredos nunca usam prefixo `NEXT_PUBLIC`. Em produção, o webhook deve apontar
para `/api/billing/webhook`.

## Segurança

O cliente envia apenas plano, região e período. O servidor recupera o preço no
banco, associa o checkout ao utilizador autenticado e cria os metadados da
assinatura. O webhook é a fonte de verdade; redirects não concedem acesso.

## Limites atuais

Apple e Google exigem integrações nativas e validação server-side próprias,
planejadas para a Sprint 028. Nesta sprint, schema e entitlements são
multiplataforma, enquanto o checkout executável cobre a web.
