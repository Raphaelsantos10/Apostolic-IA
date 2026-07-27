# Validação da Sprint 027

## Estado

Validação parcial. Aprovação final depende dos testes locais de banco e da
inspeção humana do currículo.

## Evidências concluídas

- [x] Currículo de dois anos documentado.
- [x] Cursos ministeriais independentes previstos.
- [x] Fluxo com três pareceres humanos documentado.
- [x] Migração e teste pgTAP adicionados.
- [x] Validação estática do repositório aprovada.
- [x] Ausência de marcadores de conflito e erros de whitespace.

## Evidências pendentes

- [ ] `supabase db reset`.
- [ ] `supabase test db`.
- [ ] Confirmação manual de que conteúdo sem três pareceres não é publicado.
- [ ] Revisão doutrinária humana do currículo.
- [ ] Inspeção visual das áreas alteradas, quando a interface for integrada.
- [ ] Checks do GitHub aprovados.

## Comandos

```bash
pnpm dlx supabase@latest start
pnpm dlx supabase@latest db reset
pnpm dlx supabase@latest test db
bash scripts/validate-repository.sh
```

