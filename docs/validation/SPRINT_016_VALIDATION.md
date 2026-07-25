# Validação da Sprint 016

## Escopo validado

- catálogo público de cursos;
- módulos ordenados por curso;
- estados editoriais;
- ocultação de rascunhos e conteúdo em revisão;
- autorização editorial por RLS;
- dados locais autorais;
- interface responsiva nos temas disponíveis.

## Evidências

```bash
pnpm dlx supabase@latest db reset
pnpm dlx supabase@latest test db
pnpm typecheck
pnpm build
bash scripts/validate-repository.sh
git diff --check
```

## Resultado esperado

- testes SQL aprovados;
- consulta pública retorna somente cursos e módulos publicados;
- typecheck e build aprovados;
- validação estrutural do repositório aprovada;
- catálogo apresentado em telemóvel e computador;
- nenhuma marca ou material curricular externo incorporado.

## Segurança

A leitura pública é limitada por RLS. Operações editoriais exigem utilizador
autenticado cadastrado em `editorial_members`. A função de verificação editorial
pode ser executada por visitantes, mas retorna somente um booleano e não expõe a
lista de editores.

## Aprovação humana

A interface e o carregamento dos cursos foram verificados manualmente em
ambiente local. O conteúdo definitivo continuará sujeito à revisão editorial e
doutrinária humana antes da publicação.
