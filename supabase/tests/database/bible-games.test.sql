begin;
create extension if not exists pgtap with schema extensions;
select plan(8);
select has_table('public','game_profiles','possui perfil adaptativo');
select has_table('public','game_sessions','possui sessões');
select has_table('public','game_answers','possui respostas');
insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values('44444444-4444-4444-8444-444444444444','00000000-0000-0000-0000-000000000000','authenticated','authenticated','game23@example.test','',now(),'{"provider":"email"}','{"display_name":"Jogador"}',now(),now()),
('55555555-5555-4555-8555-555555555555','00000000-0000-0000-0000-000000000000','authenticated','authenticated','other23@example.test','',now(),'{"provider":"email"}','{"display_name":"Outro"}',now(),now());
set local role authenticated;
set local request.jwt.claim.sub='44444444-4444-4444-8444-444444444444';
select lives_ok($$select public.start_bible_game(1)$$,'inicia jogo com conteúdo aprovado');
select is((select count(*)::integer from public.game_sessions),1,'sessão privada criada');
select lives_ok($$select public.answer_bible_game((select id from public.game_sessions limit 1),0)$$,'responde pelo servidor');
select is((select count(*)::integer from public.game_answers),1,'registra resposta');
set local request.jwt.claim.sub='55555555-5555-4555-8555-555555555555';
select is((select count(*)::integer from public.game_sessions),0,'outra conta não vê sessão');
select * from finish();
rollback;
