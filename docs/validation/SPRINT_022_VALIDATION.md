# Validação da Sprint 022

Data: 27 de julho de 2026.

| Validação | Resultado | Evidência |
| --- | --- | --- |
| Instalação com lockfile | Aprovada | 586 pacotes; política de cadeia de fornecimento aprovada |
| Typecheck do monorepo | Aprovada | 4 tarefas concluídas |
| Build web | Aprovada | Next.js 16.2.11; 15 páginas geradas |
| Export mobile web | Aprovada | Expo; 3 rotas estáticas |
| `git diff --check` | Aprovada | sem erros de whitespace |
| Migração e pgTAP | Aprovada | banco restaurado; 11 arquivos e 95 testes aprovados |
| Inspeção visual autenticada | Aprovada | círculos, publicação e persistência validados em 27 de julho de 2026 |

## Cobertura

Círculos, membros, publicações, comentários, denúncias, moderação auditada,
antiabuso, ligas opcionais, RLS e interface responsiva foram implementados.

## Comandos finais no Git Bash

```bash
cd "/c/Users/Utilizador/Documents/Nova pasta/Apostolic-IA"
git switch sprint/022-comunidade
git pull --ff-only origin sprint/022-comunidade
pnpm install --frozen-lockfile
pnpm dlx supabase@latest start
pnpm dlx supabase@latest db reset
pnpm dlx supabase@latest test db
pnpm typecheck
EXPO_NO_TELEMETRY=1 pnpm build
pnpm --filter @apostolic-ia/web dev
```

Validar `http://localhost:3000` em 390 px, 768 px e 1440 px com duas contas. A
Sprint permanece em andamento até banco, inspeção visual e merge do PR nº 24.
