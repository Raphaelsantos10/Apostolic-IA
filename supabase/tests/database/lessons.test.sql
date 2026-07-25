begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

insert into auth.users (
  id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,
  raw_app_meta_data,raw_user_meta_data,created_at,updated_at
) values (
  '77777777-7777-4777-8777-777777777777',
  '00000000-0000-0000-0000-000000000000',
  'authenticated','authenticated','lesson-editor@example.test','',now(),
  '{"provider":"email"}','{"display_name":"Editor de aulas"}',now(),now()
);

insert into public.editorial_members(user_id)
values ('77777777-7777-4777-8777-777777777777');

set local role authenticated;
set local request.jwt.claim.sub='77777777-7777-4777-8777-777777777777';

insert into public.lessons(
  module_id,slug,title,summary,kind,body_text,status,position,published_at
)
select id,'introducao-autoral','Introdução autoral',
  'Texto introdutório próprio para validar a publicação da aula.',
  'text','Conteúdo autoral de validação.','published',10,now()
from public.course_modules where slug='leitura-contextual';

insert into public.lessons(
  module_id,slug,title,summary,kind,body_text,status,position
)
select id,'rascunho-editorial','Rascunho editorial',
  'Material ainda reservado para revisão humana e editorial.',
  'text','Rascunho que não pode ser público.','review',11
from public.course_modules where slug='leitura-contextual';

select is((select count(*)::integer from public.lessons),2,
  'editor visualiza aula publicada e rascunho');
select is((select count(*)::integer from public.lessons where kind='text'),2,
  'aulas textuais são registradas');
select ok(public.is_editor(),'autor editorial é reconhecido');

reset role;
set local role anon;

select is((select count(*)::integer from public.lessons),1,
  'visitante visualiza somente aula publicada');
select is((select slug from public.lessons),'introducao-autoral',
  'rascunho permanece oculto');
select is((select kind::text from public.lessons),'text',
  'tipo de aula pública é preservado');
select ok((select body_text is not null from public.lessons),
  'texto publicado possui conteúdo');

select * from finish();
rollback;
