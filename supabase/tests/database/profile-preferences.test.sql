begin;
create extension if not exists pgtap with schema extensions;
select plan(5);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '44444444-4444-4444-8444-444444444444',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'profile@example.test', '', now(),
  '{"provider":"email","providers":["email"]}',
  '{"display_name":"Perfil inicial"}', now(), now()
);

set local role authenticated;
set local request.jwt.claim.sub = '44444444-4444-4444-8444-444444444444';

update public.profiles set display_name = 'Perfil atualizado', locale = 'pt-BR'
where id = '44444444-4444-4444-8444-444444444444';
select is((select display_name from public.profiles), 'Perfil atualizado', 'atualiza o nome');
select is((select locale from public.profiles), 'pt-BR', 'atualiza o idioma');

update public.preferences set theme = 'sepia', text_scale = 130,
  high_contrast = true, reduce_motion = true
where user_id = '44444444-4444-4444-8444-444444444444';
select is((select theme::text from public.preferences), 'sepia', 'atualiza o tema');
select is((select text_scale::integer from public.preferences), 130, 'atualiza a escala');
select ok((select high_contrast and reduce_motion from public.preferences), 'guarda acessibilidade');

select * from finish();
rollback;
