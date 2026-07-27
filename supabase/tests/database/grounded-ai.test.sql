begin;create extension if not exists pgtap with schema extensions;select plan(8);
select has_table('public','ai_sources','fontes');select has_table('public','ai_source_chunks','fragmentos');select has_table('public','ai_conversations','conversas');select has_table('public','ai_messages','mensagens');
select ok((select count(*)>0 from public.ai_sources where approved),'fontes aprovadas');
insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values('66666666-6666-4666-8666-666666666666','00000000-0000-0000-0000-000000000000','authenticated','authenticated','ai24@example.test','',now(),'{"provider":"email"}','{"display_name":"Aluno IA"}',now(),now());
set local role authenticated;set local request.jwt.claim.sub='66666666-6666-4666-8666-666666666666';
select ok(public.ai_daily_quota_available(),'quota');select ok((select count(*)>=0 from public.search_approved_ai_sources('contexto',5)),'busca');
select throws_ok($$insert into public.ai_sources(title,reference_label,kind) values('Teste','Teste','lesson')$$,'42501',null,'não aprova fonte');
select * from finish();rollback;
