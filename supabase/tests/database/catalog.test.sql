begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

delete from public.courses;

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
('66666666-6666-4666-8666-666666666666',
 '00000000-0000-0000-0000-000000000000',
 'authenticated','authenticated','editor@example.test','',now(),
 '{"provider":"email"}','{"display_name":"Editor"}',now(),now());

insert into public.editorial_members(user_id)
values ('66666666-6666-4666-8666-666666666666');

set local role authenticated;
set local request.jwt.claim.sub='66666666-6666-4666-8666-666666666666';

insert into public.courses(slug,title,summary,level,status,position,published_at)
values
('fundamentos-biblicos','Fundamentos Bíblicos',
 'Introdução autoral aos fundamentos para o estudo das Escrituras.',
 'beginner','published',1,now()),
('curso-em-revisao','Curso em revisão',
 'Conteúdo reservado à equipa editorial enquanto passa por revisão.',
 'intermediate','review',2,null);

select is((select count(*)::integer from public.courses),2,
  'editor visualiza cursos publicados e em revisão');
select ok(public.is_editor(),'membro editorial é reconhecido');

insert into public.course_modules(course_id,slug,title,summary,status,position,published_at)
select id,'como-estudar','Como estudar a Bíblia',
 'Princípios introdutórios para leitura responsável e contextual.',
 'published',1,now()
from public.courses where slug='fundamentos-biblicos';

select is((select count(*)::integer from public.course_modules),1,
  'editor cria módulo');
select is((select position from public.course_modules),1,
  'módulo preserva a ordem editorial');

reset role;
set local role anon;

select is((select count(*)::integer from public.courses),1,
  'público visualiza somente curso publicado');
select is((select slug from public.courses),'fundamentos-biblicos',
  'curso em revisão permanece oculto');
select is((select count(*)::integer from public.course_modules),1,
  'público visualiza módulo publicado de curso publicado');
select is((select title from public.course_modules),'Como estudar a Bíblia',
  'módulo público correto é retornado');

select * from finish();
rollback;
