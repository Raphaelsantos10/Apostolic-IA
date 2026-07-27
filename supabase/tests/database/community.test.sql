begin;
create extension if not exists pgtap with schema extensions;
select plan(14);

select has_table('public','community_circles','possui círculos');
select has_table('public','community_circle_members','possui membros');
select has_table('public','community_posts','possui publicações');
select has_table('public','community_comments','possui comentários');
select has_table('public','community_reports','possui denúncias');
select has_table('public','community_moderation_actions','possui auditoria de moderação');
select has_table('public','community_league_opt_ins','possui adesão opcional às ligas');

insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,
 raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
('11111111-1111-4111-8111-111111111111','00000000-0000-0000-0000-000000000000',
 'authenticated','authenticated','community-owner@example.test','',now(),
 '{"provider":"email"}','{"display_name":"Proprietário"}',now(),now()),
('22222222-2222-4222-8222-222222222222','00000000-0000-0000-0000-000000000000',
 'authenticated','authenticated','community-member@example.test','',now(),
 '{"provider":"email"}','{"display_name":"Membro"}',now(),now()),
('33333333-3333-4333-8333-333333333333','00000000-0000-0000-0000-000000000000',
 'authenticated','authenticated','community-outsider@example.test','',now(),
 '{"provider":"email"}','{"display_name":"Visitante"}',now(),now());

set local role authenticated;
set local request.jwt.claim.sub='11111111-1111-4111-8111-111111111111';
insert into public.community_circles(owner_id,name,description,visibility)
values('11111111-1111-4111-8111-111111111111','Círculo privado','Estudo responsável','private');
insert into public.community_circle_members(circle_id,user_id,role)
select id,'11111111-1111-4111-8111-111111111111','owner' from public.community_circles;
insert into public.community_posts(circle_id,author_id,body)
select id,'11111111-1111-4111-8111-111111111111','Vamos estudar em comunhão.' from public.community_circles;
select is((select count(*)::integer from public.community_posts),1,'proprietário publica');

reset role;
insert into public.community_circle_members(circle_id,user_id)
select id,'22222222-2222-4222-8222-222222222222' from public.community_circles;
set local role authenticated;
set local request.jwt.claim.sub='22222222-2222-4222-8222-222222222222';
select is((select count(*)::integer from public.community_posts),1,'membro lê conteúdo privado');
insert into public.community_comments(post_id,author_id,body)
select id,'22222222-2222-4222-8222-222222222222','Comentário respeitoso.' from public.community_posts;
insert into public.community_reports(reporter_id,circle_id,post_id,reason)
select '22222222-2222-4222-8222-222222222222',p.circle_id,p.id,'spam'
from public.community_posts p;
select is((select count(*)::integer from public.community_reports),1,'denúncia entra na fila');

set local request.jwt.claim.sub='33333333-3333-4333-8333-333333333333';
select is((select count(*)::integer from public.community_circles),0,'não membro não vê círculo privado');
select is((select count(*)::integer from public.community_posts),0,'não membro não vê publicação privada');
select is((select count(*)::integer from public.community_reports),0,'não membro não vê denúncias');
insert into public.community_league_opt_ins(user_id,opted_in,display_name)
values('33333333-3333-4333-8333-333333333333',false,null);
select is((select count(*)::integer from public.get_community_leaderboard()),0,'liga exclui conta sem adesão');

select * from finish();
rollback;
