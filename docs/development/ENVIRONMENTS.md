# Ambientes de desenvolvimento

## Requisitos

- Git.
- Node.js 24 recomendado.
- pnpm 11.17.0, definido em `packageManager`.

## Instalação

```bash
pnpm install --frozen-lockfile
```

## Desenvolvimento

```bash
pnpm dev:web
pnpm dev:mobile
```

Executar em terminais separados quando necessário. Android e iOS exigirão as
ferramentas oficiais de cada plataforma em sprints posteriores.

## Validação

```bash
pnpm typecheck
pnpm build
```

## Variáveis

Copiar `.env.example` apenas quando uma funcionalidade exigir. Variáveis com
prefixo `NEXT_PUBLIC_` e `EXPO_PUBLIC_` são públicas e nunca podem conter
segredos. Chaves administrativas e credenciais de servidor não pertencem às
aplicações cliente.

## Ambientes planejados

- Desenvolvimento local.
- Preview controlado por Pull Request.
- Homologação futura.
- Produção futura.

Cada ambiente terá recursos e credenciais separados quando os serviços forem
introduzidos.
