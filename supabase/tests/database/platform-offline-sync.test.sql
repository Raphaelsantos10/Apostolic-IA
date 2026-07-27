begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

select has_table('public','sync_devices','tabela de dispositivos existe');
select has_table('public','offline_mutations','fila offline existe');
select has_column('public','sync_devices','locale','dispositivo guarda idioma');
select has_column('public','sync_devices','timezone','dispositivo guarda fuso');
select has_column('public','offline_mutations','client_mutation_id',
  'mutação possui chave idempotente');
select has_column('public','offline_mutations','status',
  'mutação possui estado de processamento');
select col_not_null('public','offline_mutations','payload',
  'mutação exige payload');
select col_not_null('public','offline_mutations','client_changed_at',
  'mutação preserva horário do cliente');
select fk_ok(
  'public','offline_mutations','user_id',
  'public','profiles','id',
  'fila pertence a um perfil'
);

select * from finish();
rollback;

