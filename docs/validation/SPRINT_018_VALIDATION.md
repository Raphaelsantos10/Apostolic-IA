# Validação da Sprint 018

## Resultado

Aprovada em 27 de julho de 2026.

## Escopo validado

- migração e seed do núcleo de aprendizagem;
- RLS de progresso, notas, favoritos, metas, tentativas e revisões;
- progresso e conclusão de aulas;
- anotações privadas e favoritos;
- meta diária configurável;
- quiz com correção, explicação e revisão espaçada;
- interface web integrada e responsiva.

## Comandos executados

```bash
pnpm dlx supabase@latest db reset
pnpm dlx supabase@latest test db
pnpm --filter @apostolic-ia/web run typecheck
pnpm --filter @apostolic-ia/web run build
bash scripts/validate-repository.sh
git diff --check
```

## Observação do ambiente local

Antes da validação final, o banco foi restaurado porque a criação manual de uma
conta de teste alterou a quantidade de utilizadores esperada pelo teste legado de
RLS. Após o `db reset`, a suíte foi executada sobre o seed determinístico.

## Limitações conhecidas

- montagem automática do plano diário ainda não aparece como agenda completa;
- dias de descanso da meta serão integrados com a gamificação saudável;
- contas e e-mails locais utilizam Supabase local e Mailpit.
