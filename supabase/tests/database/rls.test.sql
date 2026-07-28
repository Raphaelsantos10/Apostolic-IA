begin;

create extension if not exists pgtap with schema extensions;
select plan(7);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  (
    '11111111-1111-4111-8111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'user-a@example.test', '', now(),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"Utilizador A"}', now(), now()
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'user-b@example.test', '', now(),
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"Utilizador B"}', now(), now()
  );

select is((
  select count(*)::integer
  from public.profiles
  where id in (
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222222'
  )
), 2,
  'o gatilho cria os perfis');
select is((
  select count(*)::integer
  from public.preferences
  where user_id in (
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222222'
  )
), 2,
  'o gatilho cria as preferências');

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';

select is((select count(*)::integer from public.profiles), 1,
  'o utilizador vê apenas o próprio perfil');
select is((select id from public.profiles),
  '11111111-1111-4111-8111-111111111111'::uuid,
  'o perfil visível pertence ao utilizador autenticado');
select is((select count(*)::integer from public.preferences), 1,
  'o utilizador vê apenas as próprias preferências');

update public.profiles set display_name = 'Nome atualizado'
where id = '11111111-1111-4111-8111-111111111111';
select is((select display_name from public.profiles), 'Nome atualizado',
  'o utilizador atualiza o próprio nome');

update public.profiles set display_name = 'Tentativa indevida'
where id = '22222222-2222-4222-8222-222222222222';
reset role;

select is((
  select display_name from public.profiles
  where id = '22222222-2222-4222-8222-222222222222'
), 'Utilizador B', 'a política bloqueia alteração de outra conta');

select * from finish();
rollback;
