# Matriz inicial de Row Level Security

| Recurso | Visitante | Utilizador autenticado | Operação privilegiada |
| --- | --- | --- | --- |
| `profiles` | Sem acesso | Lê o próprio; altera campos permitidos | Servidor futuro |
| `preferences` | Sem acesso | Lê e altera apenas as próprias | Servidor futuro |
| `auth.users` | Sem acesso direto | Gerido pelo Supabase Auth | Supabase Auth |

## Regras obrigatórias

- Toda tabela exposta habilita e força RLS.
- Políticas usam `auth.uid()` como identidade.
- Papéis recebem apenas os privilégios mínimos.
- Estado da conta não é alterado diretamente pelo utilizador.
- `service_role` nunca aparece no navegador ou aplicação móvel.
- Cada política exige teste positivo e teste entre contas.

## Ameaças cobertas

- leitura ou alteração de dados de outra conta;
- elevação direta do estado da conta;
- acesso anónimo a dados pessoais;
- perfil sem vínculo com `auth.users`.

## Pendências

- funções administrativas auditadas;
- eliminação e anonimização;
- políticas de conteúdo e progresso;
- auditoria independente na Sprint 077.
