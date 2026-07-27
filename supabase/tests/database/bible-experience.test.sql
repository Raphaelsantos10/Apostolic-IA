begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

select has_table('public','verse_highlights','possui destaques privados');
select has_table('public','bible_context_notes','possui contexto editorial');
select has_table('public','bible_timeline_events','possui linha do tempo');
select has_table('public','bible_map_locations','possui locais para mapas');
select is((select count(*)::integer from public.bible_context_notes),2,'seed publica contexto demonstrativo');
select is((select count(*)::integer from public.bible_timeline_events),2,'seed publica cronologia demonstrativa');
select is((select count(*)::integer from public.bible_map_locations),2,'seed publica locais demonstrativos');
select ok((select allows_audio and allows_offline from public.bible_licenses
  where code='demonstracao-autoral-interna'),'licença autoral permite áudio e offline');

insert into auth.users (
  id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,
  raw_app_meta_data,raw_user_meta_data,created_at,updated_at
) values
('cccccccc-cccc-4ccc-8ccc-cccccccccccc','00000000-0000-0000-0000-000000000000',
 'authenticated','authenticated','highlight-a@example.test','',now(),
 '{"provider":"email"}','{"display_name":"Leitor C"}',now(),now()),
('dddddddd-dddd-4ddd-8ddd-dddddddddddd','00000000-0000-0000-0000-000000000000',
 'authenticated','authenticated','highlight-b@example.test','',now(),
 '{"provider":"email"}','{"display_name":"Leitor D"}',now(),now());

set local role authenticated;
set local request.jwt.claim.sub='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
insert into public.verse_highlights(user_id,verse_id,color,note)
select auth.uid(),id,'yellow','Destaque privado.'
from public.bible_verses order by id limit 1;
select is((select count(*)::integer from public.verse_highlights),1,'titular cria destaque');
select is((select note from public.verse_highlights),'Destaque privado.','titular lê nota');

reset role;
set local role authenticated;
set local request.jwt.claim.sub='dddddddd-dddd-4ddd-8ddd-dddddddddddd';
select is((select count(*)::integer from public.verse_highlights),0,'outra conta não vê destaque');
delete from public.verse_highlights;
reset role;
select is(
  (select count(*)::integer from public.verse_highlights),
  1,
  'outra conta não remove destaque'
);

select * from finish();
rollback;
