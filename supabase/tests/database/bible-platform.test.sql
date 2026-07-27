begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

select has_table('public', 'bible_versions', 'possui versões bíblicas');
select has_table('public', 'bible_verses', 'possui versículos');
select has_table('public', 'reading_plans', 'possui planos de leitura');
select has_table('public', 'reading_progress', 'possui progresso de leitura');

select is(
  (select count(*)::integer from public.bible_versions where code = 'VDA'),
  1, 'seed inclui somente versão demonstrativa autoral'
);
select ok(
  (select is_demo from public.bible_versions where code = 'VDA'),
  'versão de protótipo é identificada como demonstração'
);
select is(
  (select count(*)::integer from public.search_bible(
    (select id from public.bible_versions where code = 'VDA'), 'esperança', 20
  )),
  1, 'pesquisa encontra texto autorizado'
);

insert into auth.users (
  id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,
  raw_app_meta_data,raw_user_meta_data,created_at,updated_at
) values
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','00000000-0000-0000-0000-000000000000',
 'authenticated','authenticated','reader-a@example.test','',now(),
 '{"provider":"email"}','{"display_name":"Leitor A"}',now(),now()),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','00000000-0000-0000-0000-000000000000',
 'authenticated','authenticated','reader-b@example.test','',now(),
 '{"provider":"email"}','{"display_name":"Leitor B"}',now(),now());

set local role authenticated;
set local request.jwt.claim.sub='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

insert into public.user_reading_plans(user_id, plan_id, target_minutes)
select auth.uid(), id, 15 from public.reading_plans where slug='jornada-demonstrativa';
insert into public.reading_progress(user_id, plan_day_id)
select auth.uid(), d.id from public.reading_plan_days d
join public.reading_plans p on p.id=d.plan_id
where p.slug='jornada-demonstrativa' and d.day_number=1;

select is((select count(*)::integer from public.user_reading_plans),1,'titular vê seu plano');
select is((select target_minutes from public.user_reading_plans),15::smallint,'meta de leitura é configurável');
select is((select count(*)::integer from public.reading_progress),1,'titular conclui dia');

reset role;
set local role authenticated;
set local request.jwt.claim.sub='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
select is((select count(*)::integer from public.user_reading_plans),0,'outra conta não vê plano');
select is((select count(*)::integer from public.reading_progress),0,'outra conta não vê progresso');

select * from finish();
rollback;
