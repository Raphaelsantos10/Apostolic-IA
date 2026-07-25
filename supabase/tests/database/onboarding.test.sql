begin;
create extension if not exists pgtap with schema extensions;
select plan(4);
insert into auth.users (id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values ('55555555-5555-4555-8555-555555555555','00000000-0000-0000-0000-000000000000','authenticated','authenticated','onboarding@example.test','',now(),'{"provider":"email"}','{}',now(),now());
set local role authenticated;
set local request.jwt.claim.sub='55555555-5555-4555-8555-555555555555';
insert into public.onboarding_profiles(user_id,goals,experience,weekly_minutes,assessment_score,recommended_path,status,completed_at)
values('55555555-5555-4555-8555-555555555555',array['biblia'],'beginner',90,3,'panorama-biblico','completed',now());
select is((select count(*)::integer from public.onboarding_profiles),1,'titular vê o onboarding');
select is((select assessment_score::integer from public.onboarding_profiles),3,'guarda pontuação');
select is((select weekly_minutes from public.onboarding_profiles),90,'guarda disponibilidade');
select is((select status::text from public.onboarding_profiles),'completed','conclui onboarding');
select * from finish();
rollback;
