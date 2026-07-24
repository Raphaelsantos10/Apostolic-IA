# Sprint 010 - Monorepo, ambientes, CI e base web/mobile

## Estado

✅ Concluída - incorporada à `main` pelo Pull Request 11 em 24 de julho de 2026.

## Objetivo

Criar a primeira fundação tecnológica executável do Apostolic IA conforme as
decisões arquiteturais aprovadas.

## Entregas

- Monorepo pnpm com Turborepo.
- Aplicação web Next.js com App Router.
- Aplicação mobile Expo com Expo Router.
- Pacotes compartilhados de domínio, configuração e design tokens.
- TypeScript estrito.
- Ambientes documentados sem segredos.
- CI com instalação imutável, typecheck e build.
- Lockfile versionado.

## Versões fixadas

- Node.js 24 para CI e desenvolvimento recomendado.
- pnpm 11.17.0.
- Turborepo 2.10.6.
- TypeScript 6.0.3 por compatibilidade com o template Expo 57.
- Next.js 16.2.11 e React 19.2.8 na web.
- Expo 57.0.8, Expo Router 57.0.8, React 19.2.3 e React Native 0.86.0 no mobile.

## Critérios de aceite

- `pnpm install --frozen-lockfile` funciona em ambiente limpo.
- `pnpm typecheck` termina sem erros.
- `pnpm build` produz a web e a exportação web do mobile.
- Web e mobile consomem um pacote de domínio compartilhado.
- Tokens possuem pacote próprio.
- Nenhum segredo é incluído no cliente ou repositório.
- CI executa em Pull Request e `main`.
- Bases exibem claramente que funcionalidades finais ainda não existem.

## Fora do escopo

- PWA completa.
- Backend, banco, autenticação e RLS.
- Conta e sincronização.
- Conteúdo de curso real.
- Bíblia licenciada.
- Integração de IA.
- Publicação nas lojas ou em produção.

## Próximo passo

Abrir o Pull Request, confirmar os workflows verdes e incorporar a entrega à
`main`. A sprint somente será marcada como concluída depois do merge.
