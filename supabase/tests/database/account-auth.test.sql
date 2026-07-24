begin;

create extension if not exists pgtap with schema extensions;
select plan(6);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '33333333-3333-4333-8333-333333333333',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'delete@example.test', '', now(),
  '{"provider":"email","providers":["email"]}',
  '{"display_name":"Conta a excluir"}', now(), now()
);

select ok(
  exists(select 1 from public.profiles where id = '33333333-3333-4333-8333-333333333333'),
  'o cadastro cria perfil'
);
select ok(
  exists(select 1 from public.preferences where user_id = '33333333-3333-4333-8333-333333333333'),
  'o cadastro cria preferências'
);

set local role authenticated;
set local request.jwt.claim.sub = '33333333-3333-4333-8333-333333333333';

select throws_ok(
  $$select public.delete_own_account('errado')$$,
  '22023',
  'invalid confirmation',
  'a exclusão exige confirmação explícita'
);

select lives_ok(
  $$select public.delete_own_account('EXCLUIR')$$,
  'a conta autenticada pode excluir os próprios dados'
);

reset role;

select ok(
  not exists(select 1 from auth.users where id = '33333333-3333-4333-8333-333333333333'),
  'a identidade foi excluída'
);
select ok(
  not exists(select 1 from public.profiles where id = '33333333-3333-4333-8333-333333333333'),
  'os dados pessoais foram removidos por cascata'
);

select * from finish();
rollback;
