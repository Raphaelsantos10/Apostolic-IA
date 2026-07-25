# Catálogo de cursos e módulos

## Modelo

- `courses`: curso, nível, ordem e estado editorial.
- `course_modules`: módulos ordenados dentro de cada curso.
- `editorial_members`: autorização mínima para manutenção editorial.

## Publicação

O público acessa apenas cursos com estado `published`. Um módulo também precisa
estar publicado e pertencer a um curso publicado.

Os estados são `draft`, `review`, `approved`, `published` e `archived`.

## Propriedade intelectual

Os títulos e resumos distribuídos pelo projeto são autorais e genéricos.
Instituições, marcas, apostilas e estruturas curriculares de terceiros não são
copiadas. Referências externas servem somente para pesquisa temática.

## Segurança

Leitura pública é controlada por RLS. Alterações exigem conta autenticada
presente em `editorial_members`. A atribuição de editores deve ocorrer por
processo administrativo protegido, nunca pelo cliente público.

## Validação local

```bash
pnpm dlx supabase@latest db reset
pnpm dlx supabase@latest test db
pnpm typecheck
pnpm build
```
