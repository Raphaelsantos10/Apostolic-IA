begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

select has_table('public','learning_point_events','possui eventos de pontos');
select has_table('public','gamification_profiles','possui perfil de gamificação');
select has_table('public','achievement_definitions','possui conquistas');
select has_table('public','mission_definitions','possui missões');

insert into auth.users (
  id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,
  raw_app_meta_data,raw_user_meta_data,created_at,updated_at
) values
('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','00000000-0000-0000-0000-000000000000',
 'authenticated','authenticated','game-a@example.test','',now(),
 '{"provider":"email"}','{"display_name":"Estudante E"}',now(),now()),
('ffffffff-ffff-4fff-8fff-ffffffffffff','00000000-0000-0000-0000-000000000000',
 'authenticated','authenticated','game-b@example.test','',now(),
 '{"provider":"email"}','{"display_name":"Estudante F"}',now(),now());

insert into public.lesson_progress(user_id,lesson_id,status,percent,started_at,completed_at)
select 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',id,'completed',100,now(),now()
from public.lessons order by id limit 1;

set local role authenticated;
set local request.jwt.claim.sub='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
select is((select learning_points from public.sync_healthy_gamification()),20,'sincroniza pontos verificados');
select is((select level from public.gamification_profiles),1::smallint,'calcula nível pedagógico');
select is((select current_streak from public.gamification_profiles),1::smallint,'calcula sequência');
select is((select count(*)::integer from public.user_achievements),1,'desbloqueia primeira conquista');
select is((select learning_points from public.sync_healthy_gamification()),20,'sincronização é idempotente');

reset role;
set local role authenticated;
set local request.jwt.claim.sub='ffffffff-ffff-4fff-8fff-ffffffffffff';
select is((select count(*)::integer from public.learning_point_events),0,'outra conta não vê eventos');

select * from finish();
rollback;
