# Runbook de backup e restauração

## Segurança

- Nunca usar produção como destino de um teste.
- Nunca incluir `.env`, tokens ou chaves no conjunto de backup.
- Manter base de dados, Storage e configuração em conjuntos identificados.
- Criptografar e controlar acesso no armazenamento escolhido.
- Não considerar um backup válido sem verificação e restauração isolada.

## Criação

1. Criar uma pasta privada fora do repositório.
2. Exportar a base de dados e os objetos necessários.
3. Registar commit, ambiente, data e responsável.
4. Gerar o manifesto:

```bash
node scripts/backup-manifest.mjs create \
  /c/backups/apostolic-ia/manifest.json \
  /c/backups/apostolic-ia/database.sql
```

5. Verificar imediatamente:

```bash
node scripts/backup-manifest.mjs verify \
  /c/backups/apostolic-ia/manifest.json
```

## Restauração isolada

1. Preparar uma base vazia que não seja produção.
2. Verificar o manifesto antes de ler o dump.
3. Restaurar o banco no destino isolado.
4. Executar migrações, testes de banco e verificações de contagem.
5. Testar login, perfil, curso, progresso, Bíblia e permissões entre contas.
6. Registar início, fim, RPO observado, RTO observado e divergências.
7. Destruir com segurança o ambiente temporário após guardar a evidência.

### Papel administrativo no Supabase local

Um dump completo pode incluir funções de infraestrutura, como Realtime, que
configuram parâmetros reservados do PostgreSQL. No ambiente local, confirmar
`rolsuper` e `rolcanlogin` antes de usar `supabase_admin` exclusivamente na
base temporária. Não elevar o papel da aplicação, não reutilizar esse
procedimento em produção e não contornar os controlos do fornecedor.

Se a restauração parcial falhar, eliminar somente a base temporária, verificar
novamente o manifesto e repetir num destino vazio. Registar a mensagem original
e a correção aplicada; não ignorar erros de `pg_restore`.

## Aprovação

O exercício falha se qualquer checksum divergir, se dados essenciais estiverem
ausentes, se RLS falhar ou se o tempo exceder o objetivo sem plano corretivo.
